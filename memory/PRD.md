# HBV Polymerase Bioactivity Prediction App - PRD

## Original Problem Statement
Create a premium design for an HBV Polymerase Bioactivity Prediction App (React Frontend + Python Backend). The system works as an end-to-end virtual screening pipeline for predicting inhibitors of HBV polymerase.

## User Personas
- **Primary**: Researchers, bioinformaticians, pharmaceutical scientists
- **Use Case**: Virtual screening of compound libraries for drug discovery against Hepatitis B

## Core Requirements (Static)
1. File upload (CSV/Excel with SMILES column)
2. SMILES validation and molecular descriptor generation
3. pIC50 prediction and activity classification (Active/Moderate/Inactive)
4. Interactive data tables with sorting, filtering, search
5. Visual analytics (charts, distributions, scatter plots)
6. Export results to CSV/Excel
7. Light/Dark theme support

## What's Been Implemented (Jan 30, 2026)

### Backend (FastAPI + RDKit)
- `/api/` - Root endpoint
- `/api/predict` - File upload and bioactivity prediction
- `/api/sample-data` - Sample molecules for testing
- `/api/jobs` - List prediction jobs
- `/api/jobs/{job_id}` - Get specific job results
- `/api/export/{job_id}` - Export results as CSV/Excel
- Mock ML model simulating pIC50 predictions based on molecular descriptors
- RDKit integration for descriptor calculation (MW, LogP, HBD, HBA, TPSA, etc.)

### Frontend (React + Tailwind + shadcn/UI)
- Premium scientific UI with Clinical Premium theme
- Hero section with molecular imagery
- About HBV Polymerase section
- Workflow visualization (5-step process)
- File upload with drag-drop support
- Sample data quick-start button
- Results dashboard with:
  - Summary stats cards (Total, Valid, Invalid, Active)
  - pIC50 statistics (Mean, StdDev, Min, Max)
  - Sortable/filterable data table
  - Activity distribution chart (pie)
  - Active vs Inactive bar chart
  - pIC50 distribution histogram
  - Confidence distribution chart
  - MW vs LogP scatter plot
- Export dropdown (CSV/Excel)
- Theme toggle (light/dark)
- Responsive mobile design

## Prioritized Backlog

### P0 (Critical) - Done
- [x] File upload and validation
- [x] SMILES validation with RDKit
- [x] Bioactivity prediction
- [x] Results display and charts
- [x] Export functionality

### P1 (High Priority) - Future
- [ ] Real trained ML model integration
- [ ] Batch processing for large files
- [ ] Historical job comparison

### P2 (Nice to Have)
- [ ] 2D molecular structure rendering
- [ ] User authentication
- [ ] Saved prediction history
- [ ] API rate limiting

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, shadcn/UI, Recharts
- **Backend**: FastAPI, RDKit, pandas, scikit-learn
- **Database**: MongoDB
- **Fonts**: Outfit, DM Sans, JetBrains Mono

## Notes
- ML model is MOCKED for demonstration - uses rule-based algorithm based on molecular descriptors
- RDKit provides real molecular descriptor calculations
