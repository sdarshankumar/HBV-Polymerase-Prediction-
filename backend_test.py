import requests
import sys
import json
import io
import os
import pandas as pd
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

class HBVAPITester:
    def __init__(self, base_url="https://hbv-polypredict.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.job_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {}
        
        if data and not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        if success and isinstance(response, dict):
            expected_message = "HBV Polymerase Bioactivity Prediction API"
            if response.get('message') == expected_message:
                print(f"   ✅ Correct message: {response.get('message')}")
                return True
            else:
                print(f"   ❌ Wrong message. Expected: {expected_message}, Got: {response.get('message')}")
                return False
        return False

    def test_sample_data_endpoint(self):
        """Test sample data endpoint"""
        success, response = self.run_test(
            "Sample Data Endpoint",
            "GET",
            "sample-data",
            200
        )
        if success and isinstance(response, list):
            if len(response) == 10:
                print(f"   ✅ Correct number of samples: {len(response)}")
                # Check if each sample has required fields
                sample = response[0]
                required_fields = ['id', 'smiles', 'name']
                if all(field in sample for field in required_fields):
                    print(f"   ✅ Sample structure correct: {list(sample.keys())}")
                    return True
                else:
                    print(f"   ❌ Missing required fields in sample: {sample}")
                    return False
            else:
                print(f"   ❌ Wrong number of samples. Expected: 10, Got: {len(response)}")
                return False
        return False

    def test_prediction_endpoint(self):
        """Test prediction endpoint with CSV file upload"""
        # Create sample CSV data
        sample_data = {
            'id': ['MOL_001', 'MOL_002', 'MOL_003'],
            'SMILES': [
                'CC(=O)Nc1ccc(O)cc1',  # Acetaminophen
                'CC(C)Cc1ccc(C(C)C(=O)O)cc1',  # Ibuprofen
                'INVALID_SMILES'  # Invalid SMILES to test validation
            ],
            'name': ['Acetaminophen', 'Ibuprofen', 'Invalid']
        }
        
        df = pd.DataFrame(sample_data)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        # Create file-like object for upload
        files = {
            'file': ('test_molecules.csv', csv_content, 'text/csv')
        }
        
        success, response = self.run_test(
            "Prediction Endpoint (CSV Upload)",
            "POST",
            "predict",
            200,
            files=files
        )
        
        if success and isinstance(response, dict):
            # Check response structure
            required_fields = ['job_id', 'total_molecules', 'valid_molecules', 'invalid_molecules', 'results', 'statistics']
            if all(field in response for field in required_fields):
                print(f"   ✅ Response structure correct")
                
                # Check counts
                if (response['total_molecules'] == 3 and 
                    response['valid_molecules'] == 2 and 
                    response['invalid_molecules'] == 1):
                    print(f"   ✅ Molecule counts correct: Total={response['total_molecules']}, Valid={response['valid_molecules']}, Invalid={response['invalid_molecules']}")
                    
                    # Store job_id for export test
                    self.job_id = response['job_id']
                    print(f"   ✅ Job ID stored: {self.job_id}")
                    
                    # Check results structure
                    if len(response['results']) == 3:
                        result = response['results'][0]
                        result_fields = ['molecule_id', 'smiles', 'is_valid', 'pic50', 'activity_class', 'confidence', 'descriptors']
                        if all(field in result for field in result_fields):
                            print(f"   ✅ Result structure correct")
                            return True
                        else:
                            print(f"   ❌ Missing fields in result: {result}")
                            return False
                    else:
                        print(f"   ❌ Wrong number of results: {len(response['results'])}")
                        return False
                else:
                    print(f"   ❌ Wrong molecule counts")
                    return False
            else:
                print(f"   ❌ Missing required fields in response: {list(response.keys())}")
                return False
        return False

    def test_export_endpoint(self):
        """Test export endpoint"""
        if not self.job_id:
            print("❌ No job_id available for export test")
            return False
            
        success, response = self.run_test(
            "Export Endpoint (CSV)",
            "GET",
            f"export/{self.job_id}?format=csv",
            200
        )
        
        if success:
            # Check if response is CSV content
            if isinstance(response, str) and 'Molecule_ID,SMILES' in response:
                print(f"   ✅ CSV export working - contains headers")
                return True
            else:
                print(f"   ❌ Export response not in expected CSV format")
                return False
        return False

    def test_jobs_endpoint(self):
        """Test jobs listing endpoint"""
        success, response = self.run_test(
            "Jobs Listing Endpoint",
            "GET",
            "jobs",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Jobs endpoint returns list with {len(response)} jobs")
            if len(response) > 0:
                job = response[0]
                job_fields = ['job_id', 'filename', 'total_molecules', 'valid_molecules', 'created_at']
                if all(field in job for field in job_fields):
                    print(f"   ✅ Job structure correct")
                    return True
                else:
                    print(f"   ❌ Missing fields in job: {job}")
                    return False
            return True
        return False

def main():
    print("🧪 Starting HBV Polymerase Bioactivity Prediction API Tests")
    print("=" * 60)
    
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/api"
    tester = HBVAPITester(base_url=base_url)
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_sample_data_endpoint,
        tester.test_prediction_endpoint,
        tester.test_export_endpoint,
        tester.test_jobs_endpoint
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())