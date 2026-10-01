from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import pandas as pd
import numpy as np
from io import BytesIO
import json
import requests

# RDKit imports

from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors
import joblib

ROOT_DIR = Path(__file__).parent
MODEL_PATH = ROOT_DIR / 'model.pkl'
model = None
model_loaded = False
jobs_db = {}

def load_model():
    global model, model_loaded
    if not model_loaded and MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        model_loaded = True
        print(f"Loaded ML model from {MODEL_PATH}")
    elif not MODEL_PATH.exists():
        print(f"ML model file not found at {MODEL_PATH}. Using mock predictions.")

load_dotenv(ROOT_DIR / '.env')
load_model()

# MongoDB connection (disabled for stateless mode)
# mongo_url = os.environ['MONGO_URL']
# client = AsyncIOMotorClient(mongo_url)
# db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================== Models ==================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class MoleculeResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    molecule_id: str
    smiles: str
    is_valid: bool
    pic50: Optional[float] = None
    activity_class: Optional[str] = None
    confidence: Optional[float] = None
    descriptors: Optional[dict] = None

class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    job_id: str
    total_molecules: int
    valid_molecules: int
    invalid_molecules: int
    results: List[MoleculeResult]
    statistics: dict
    created_at: str

class AnalyticsData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    activity_distribution: dict
    descriptor_stats: dict
    prediction_summary: dict

class SinglePredictionRequest(BaseModel):
    compound_name: str

class SinglePredictionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    smiles: Optional[str] = None
    is_valid: bool = False
    pic50: Optional[float] = None
    activity_class: Optional[str] = None
    confidence: Optional[str] = None
    mw: Optional[float] = None
    logp: Optional[float] = None

# ================== Helper Functions ==================

def validate_smiles(smiles: str) -> bool:
    """Validate if a SMILES string is chemically valid."""
    try:
        mol = Chem.MolFromSmiles(smiles)
        return mol is not None
    except:
        return False

def calculate_descriptors(smiles: str) -> dict:
    """Calculate molecular descriptors from SMILES."""
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return {}
        
        descriptors = {
            'molecular_weight': round(Descriptors.MolWt(mol), 2),
            'logp': round(Descriptors.MolLogP(mol), 2),
            'hbd': rdMolDescriptors.CalcNumHBD(mol),
            'hba': rdMolDescriptors.CalcNumHBA(mol),
            'tpsa': round(Descriptors.TPSA(mol), 2),
            'rotatable_bonds': rdMolDescriptors.CalcNumRotatableBonds(mol),
            'aromatic_rings': rdMolDescriptors.CalcNumAromaticRings(mol),
            'heavy_atoms': rdMolDescriptors.CalcNumHeavyAtoms(mol),
            'fraction_csp3': round(rdMolDescriptors.CalcFractionCSP3(mol), 3),
            'num_rings': rdMolDescriptors.CalcNumRings(mol)
        }
        return descriptors
    except Exception as e:
        logger.error(f"Error calculating descriptors: {e}")
        return {}


def fetch_pubchem_data(compound_name: str) -> dict:
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{compound_name}/property/CanonicalSMILES,IsomericSMILES,MolecularWeight,XLogP/JSON"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if "PropertyTable" in data and "Properties" in data["PropertyTable"]:
                props = data["PropertyTable"]["Properties"][0]
                smiles = props.get("CanonicalSMILES") or props.get("IsomericSMILES") or props.get("ConnectivitySMILES")
                return {
                    "smiles": smiles,
                    "mw": props.get("MolecularWeight"),
                    "logp": props.get("XLogP")
                }
    except Exception as e:
        logger.error(f"PubChem API error: {e}")
    return None

def fetch_chembl_data(smiles: str) -> dict:
    """Check ChEMBL for existing HBV activity."""
    try:
        mol_url = f"https://www.ebi.ac.uk/chembl/api/data/molecule?molecule_structures__canonical_smiles={requests.utils.quote(smiles)}&format=json"
        res = requests.get(mol_url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get("molecules"):
                chembl_id = data["molecules"][0]["molecule_chembl_id"]
                act_url = f"https://www.ebi.ac.uk/chembl/api/data/activity?molecule_chembl_id={chembl_id}&target_chembl_id=CHEMBL613497&standard_type=IC50&format=json"
                act_res = requests.get(act_url, timeout=5)
                if act_res.status_code == 200:
                    act_data = act_res.json()
                    if act_data.get("activities"):
                        for act in act_data["activities"]:
                            val = act.get("standard_value")
                            units = act.get("standard_units")
                            if val is not None:
                                try:
                                    val = float(val)
                                    if units in ["nM"]:
                                        molar = val * 1e-9
                                    elif units in ["uM", "µM"]:
                                        molar = val * 1e-6
                                    else:
                                        molar = val * 1e-9
                                    if molar > 0:
                                        pic50 = -np.log10(molar)
                                        if pic50 >= 7.0:
                                            activity_class = "Active"
                                        elif pic50 >= 5.5:
                                            activity_class = "Moderate"
                                        else:
                                            activity_class = "Inactive"
                                        return {
                                            "pic50": round(pic50, 2),
                                            "activity_class": activity_class,
                                            "confidence": "Experimental"
                                        }
                                except:
                                    pass
    except Exception as e:
        logger.error(f"ChEMBL API error: {e}")
    return None


def predict_bioactivity(descriptors: dict) -> tuple:
    """
    Predict pIC50 using the trained ML model if available, otherwise use the mock logic.
    Returns (pIC50, activity_class, confidence).
    """
    if not descriptors:
        return None, None, None
    # Set a fixed random seed for deterministic mock predictions
    np.random.seed(42)
    # Try to use the trained model if loaded
    if model_loaded and model is not None:
        # Order of features must match training
        feature_order = [
            'molecular_weight', 'logp', 'hbd', 'hba', 'tpsa',
            'rotatable_bonds', 'aromatic_rings', 'heavy_atoms', 'fraction_csp3', 'num_rings'
        ]
        X = np.array([[descriptors.get(f, 0) for f in feature_order]])
        pic50 = float(model.predict(X)[0])
        # Activity class logic (customize as needed)
        if pic50 >= 7.0:
            activity_class = "Active"
            confidence = min(0.95, 0.7 + (pic50 - 7) * 0.08)
        elif pic50 >= 5.5:
            activity_class = "Moderate"
            confidence = 0.6
        else:
            activity_class = "Inactive"
            confidence = min(0.95, 0.7 + (5.5 - pic50) * 0.08)
        confidence = round(confidence, 2)
        return round(pic50, 2), activity_class, confidence
    # Fallback to mock logic if model not loaded
    # ...existing code for mock logic...
    mw = descriptors.get('molecular_weight', 400)
    logp = descriptors.get('logp', 2.5)
    hbd = descriptors.get('hbd', 2)
    hba = descriptors.get('hba', 5)
    tpsa = descriptors.get('tpsa', 80)
    base_score = 6.0
    if 300 <= mw <= 500:
        base_score += 0.5
    elif mw > 600:
        base_score -= 0.5
    if 1 <= logp <= 4:
        base_score += 0.3
    elif logp > 5:
        base_score -= 0.4
    if hbd <= 5:
        base_score += 0.2
    if hba <= 10:
        base_score += 0.2
    if 60 <= tpsa <= 120:
        base_score += 0.3
    noise = np.random.normal(0, 0.3)
    pic50 = round(max(4.0, min(10.0, base_score + noise)), 2)
    if pic50 >= 7.0:
        activity_class = "Active"
        confidence = min(0.95, 0.7 + (pic50 - 7) * 0.08)
    elif pic50 >= 5.5:
        activity_class = "Moderate"
        confidence = 0.6 + np.random.uniform(-0.1, 0.1)
    else:
        activity_class = "Inactive"
        confidence = min(0.95, 0.7 + (5.5 - pic50) * 0.08)
    confidence = round(confidence, 2)
    return pic50, activity_class, confidence

def calculate_statistics(results: List[dict]) -> dict:
    """Calculate statistical summary of predictions."""
    valid_results = [r for r in results if r.get('is_valid') and r.get('pic50') is not None]
    
    if not valid_results:
        return {
            'activity_distribution': {'Active': 0, 'Moderate': 0, 'Inactive': 0},
            'pic50_stats': {'mean': 0, 'std': 0, 'min': 0, 'max': 0},
            'descriptor_correlations': {}
        }
    
    pic50_values = [r['pic50'] for r in valid_results]
    
    activity_counts = {'Active': 0, 'Moderate': 0, 'Inactive': 0}
    for r in valid_results:
        activity_class = r.get('activity_class', 'Unknown')
        if activity_class in activity_counts:
            activity_counts[activity_class] += 1
    
    # Calculate descriptor statistics
    descriptor_stats = {}
    desc_keys = ['molecular_weight', 'logp', 'hbd', 'hba', 'tpsa', 'rotatable_bonds']
    
    for key in desc_keys:
        values = [r['descriptors'].get(key, 0) for r in valid_results if r.get('descriptors')]
        if values:
            descriptor_stats[key] = {
                'mean': round(np.mean(values), 2),
                'std': round(np.std(values), 2),
                'min': round(min(values), 2),
                'max': round(max(values), 2)
            }
    
    return {
        'activity_distribution': activity_counts,
        'pic50_stats': {
            'mean': round(np.mean(pic50_values), 2),
            'std': round(np.std(pic50_values), 2),
            'min': round(min(pic50_values), 2),
            'max': round(max(pic50_values), 2)
        },
        'descriptor_stats': descriptor_stats
    }

# ================== Routes ==================

@api_router.get("/")
async def root():
    return {"message": "HBV Polymerase Bioactivity Prediction API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    # doc = status_obj.model_dump()
    # doc['timestamp'] = doc['timestamp'].isoformat()
    # _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    # for check in status_checks:
    #     if isinstance(check['timestamp'], str):
    #         check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    # return status_checks
    return []

@api_router.post("/predict_single", response_model=SinglePredictionResponse)
async def predict_single(req: SinglePredictionRequest):
    compound_name = req.compound_name.strip()
    if not compound_name:
        raise HTTPException(status_code=400, detail="Compound name is required.")
        
    pubchem_data = fetch_pubchem_data(compound_name)
    if not pubchem_data or not pubchem_data.get("smiles"):
        raise HTTPException(status_code=404, detail="Compound not found. Please enter a valid compound name.")
        
    smiles = pubchem_data["smiles"]
    is_valid = validate_smiles(smiles)
    
    if not is_valid:
        return SinglePredictionResponse(id=compound_name, smiles=smiles, is_valid=False)
        
    descriptors = calculate_descriptors(smiles)
    mw = pubchem_data.get("mw") or descriptors.get("molecular_weight")
    logp = pubchem_data.get("logp") or descriptors.get("logp")
    
    chembl_data = fetch_chembl_data(smiles)
    
    if chembl_data:
        pic50 = chembl_data["pic50"]
        activity = chembl_data["activity_class"]
        confidence = chembl_data["confidence"]
    else:
        pic50, activity, conf_val = predict_bioactivity(descriptors)
        confidence = f"{int(conf_val * 100)}%" if conf_val else None
        
    return SinglePredictionResponse(
        id=compound_name,
        smiles=smiles,
        is_valid=True,
        pic50=pic50,
        activity_class=activity,
        confidence=confidence,
        mw=mw,
        logp=logp
    )

@api_router.post("/predict", response_model=PredictionResponse)
async def predict_bioactivity_endpoint(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file containing SMILES and get bioactivity predictions.
    """
    # Validate file type
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload a CSV or Excel file."
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size (max 10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400, 
            detail="File too large. Maximum size is 10MB."
        )
    
    try:
        # Parse file based on type
        if filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(content))
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        logger.error(f"Error parsing file: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Error parsing file: {str(e)}"
        )
    
    # Auto-detect SMILES column
    smiles_col = None
    for col in df.columns:
        # Check by name first
        if str(col).lower().strip() in ['smiles', 'smile', 'canonical_smiles', 'mol_smiles', 'structure']:
            smiles_col = col
            break
            
    if smiles_col is None:
        # Check by content if name doesn't match
        for col in df.columns:
            sample = df[col].dropna().head(3)
            if len(sample) > 0:
                valid_count = sum(1 for val in sample if validate_smiles(str(val).strip()))
                if valid_count > 0:
                    smiles_col = col
                    break
    
    if smiles_col is None:
        raise HTTPException(
            status_code=400, 
            detail="Could not detect a SMILES column in the file. Please ensure it contains valid chemical structures."
        )
    
    # Auto-detect Drug Name / ID column
    drug_col = None
    for col in df.columns:
        if col == smiles_col:
            continue
        col_lower = str(col).lower().strip()
        if col_lower in ['drug name', 'drug names', 'name', 'compound name', 'compound', 'id', 'title', 'molecule', 'molecule_id', 'drug']:
            drug_col = col
            break
            
    if drug_col is None:
        # If no obvious name column, pick the first column that isn't the SMILES column
        # and has string-like or categorical data (often the first column is an ID)
        for col in df.columns:
            if col != smiles_col:
                drug_col = col
                break

    # Build SMILES to drug name mapping
    smiles_to_drug = {}
    if drug_col:
        for _, row in df.iterrows():
            s = str(row[smiles_col]).strip()
            d = str(row[drug_col]).strip()
            if s and d:
                smiles_to_drug[s] = d

    # Process molecules
    results = []
    seen_smiles = set()

    for idx, row in df.iterrows():
        smiles = str(row[smiles_col]).strip()

        # Skip duplicates
        if smiles in seen_smiles:
            continue
        seen_smiles.add(smiles)

        # Get drug name if available, else fallback to molecule ID
        if smiles in smiles_to_drug:
            mol_id = smiles_to_drug[smiles]
        else:
            mol_id = f"MOL_{idx + 1:04d}"

        # Validate SMILES
        is_valid = validate_smiles(smiles)

        if is_valid:
            descriptors = calculate_descriptors(smiles)
            pic50, activity_class, confidence = predict_bioactivity(descriptors)
        else:
            descriptors = None
            pic50 = None
            activity_class = None
            confidence = None

        results.append({
            'molecule_id': mol_id,
            'smiles': smiles,
            'is_valid': is_valid,
            'pic50': pic50,
            'activity_class': activity_class,
            'confidence': confidence,
            'descriptors': descriptors
        })
    
    # Calculate statistics
    statistics = calculate_statistics(results)
    
    # Create job record
    job_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    valid_count = sum(1 for r in results if r['is_valid'])
    invalid_count = len(results) - valid_count
    
    # Store job record in memory
    job_data = {
        'job_id': job_id,
        'filename': file.filename,
        'total_molecules': len(results),
        'valid_molecules': valid_count,
        'invalid_molecules': invalid_count,
        'created_at': created_at,
        'results': results,
        'statistics': statistics
    }
    jobs_db[job_id] = job_data

    return PredictionResponse(
        job_id=job_id,
        total_molecules=len(results),
        valid_molecules=valid_count,
        invalid_molecules=invalid_count,
        results=[MoleculeResult(**r) for r in results],
        statistics=statistics,
        created_at=created_at
    )

@api_router.get("/jobs")
async def get_prediction_jobs():
    """Get list of all prediction jobs."""
    summary_list = []
    for j_id, job in reversed(list(jobs_db.items())):
        summary_list.append({
            "job_id": job["job_id"],
            "filename": job.get("filename", "uploaded_file.csv"),
            "total_molecules": job["total_molecules"],
            "valid_molecules": job["valid_molecules"],
            "created_at": job["created_at"]
        })
    return summary_list

@api_router.get("/jobs/{job_id}")
async def get_prediction_job(job_id: str):
    """Get a specific prediction job by ID."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_db[job_id]

@api_router.get("/export/{job_id}")
async def export_results(job_id: str, format: str = "csv"):
    """Export prediction results as CSV or Excel."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_db[job_id]
    results = job.get('results', [])
    
    export_data = []
    for r in results:
        desc = r.get('descriptors') or {}
        row = {
            'Molecule_ID': r.get('molecule_id'),
            'SMILES': r.get('smiles'),
            'Is_Valid': r.get('is_valid'),
            'pIC50': r.get('pic50'),
            'Activity_Class': r.get('activity_class'),
            'Confidence': r.get('confidence'),
            'MW': desc.get('molecular_weight'),
            'LogP': desc.get('logp'),
            'HBD': desc.get('hbd'),
            'HBA': desc.get('hba'),
            'TPSA': desc.get('tpsa'),
            'Rotatable_Bonds': desc.get('rotatable_bonds')
        }
        export_data.append(row)
        
    df = pd.DataFrame(export_data)
    
    if format.lower() in ['excel', 'xlsx']:
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Predictions')
        output.seek(0)
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename=predictions_{job_id}.xlsx'}
        )
    else:
        output = BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename=predictions_{job_id}.csv'}
        )

@api_router.get("/sample-data")
async def get_sample_data():
    """Provide sample SMILES data for testing."""
    sample_molecules = [
        {"id": "DEMO_001", "smiles": "CC(=O)Nc1ccc(O)cc1", "name": "Acetaminophen"},
        {"id": "DEMO_002", "smiles": "CC(C)Cc1ccc(C(C)C(=O)O)cc1", "name": "Ibuprofen"},
        {"id": "DEMO_003", "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", "name": "Caffeine"},
        {"id": "DEMO_004", "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O", "name": "Aspirin"},
        {"id": "DEMO_005", "smiles": "Nc1ccc(S(=O)(=O)Nc2ccccn2)cc1", "name": "Sulfapyridine"},
        {"id": "DEMO_006", "smiles": "COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1", "name": "Omeprazole"},
        {"id": "DEMO_007", "smiles": "CC1=C(C(=O)NC2=CC=CC=C2C(=O)O)C=CC=C1Cl", "name": "Tolfenamic acid"},
        {"id": "DEMO_008", "smiles": "O=C(O)Cc1ccccc1Nc2c(Cl)cccc2Cl", "name": "Diclofenac"},
        {"id": "DEMO_009", "smiles": "Cc1ccc(C(C)C(=O)O)cc1", "name": "Carprofen analog"},
        {"id": "DEMO_010", "smiles": "CC(C)(C)NCC(O)c1ccc(O)c(CO)c1", "name": "Salbutamol"}
    ]
    return sample_molecules


# Include the router in the main app
app.include_router(api_router)

@app.get("/")
async def root_direct():
    return {"message": "HBV Polymerase Bioactivity Prediction API", "status": "running"}

@app.get("/favicon.ico")
async def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:8000", "http://127.0.0.1:8000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    load_model()

# @app.on_event("shutdown")
# async def shutdown_db_client():
#     client.close()
