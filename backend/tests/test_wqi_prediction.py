import requests
import json
import pytest

def test_predict_wq(api_base_url):
    url = f"{api_base_url}/predict_wq"
    headers = {"Content-Type": "application/json"}

    payload = {
        "BOD5": 8.28,
        "COD": 23.253,
        "TOC": 17.855,
        "BHC": 0.048,
        "Cd": 0.004,
        "Cr6": 0.007
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    assert response.status_code == 200
    assert "predicted_WQ" in response.json()

def test_predict_wq_single_missing_field(api_base_url):
    url = f"{api_base_url}/predict_wq"
    headers = {"Content-Type": "application/json"}

    payload = {
        "BOD5": 3.5,
        "COD": 15.2,
        "TOC": 4.8,
        # Missing BHC, Cd, Cr6
    }

    response = requests.post(url, json=payload)
    assert response.status_code == 422