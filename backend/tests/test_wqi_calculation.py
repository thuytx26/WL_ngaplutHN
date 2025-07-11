import requests
import json
import pytest

def test_calculate_wqi_batch(api_base_url):
    url = f"{api_base_url}/calculate_wqi_batch"
    headers = {"Content-Type": "application/json"}

    # Chỉ chọn các trường WQI cần, khớp với backend
    payload = {
        "data": [
        {
            "station_id": "QLPH012016",
            "longitude": 105.68,
            "latitude": 9.3,
            "Z.Elev": 0.66,
            "date": "29/2/2016",
            "pH": 8.88,
            "Aldrin": 0.021,
            "BHC": 0.048,
            "Dieldrin": 0.047,
            "DDTs": 0.052,
            "Heptachlor": 0.04,
            "Heptachlorepoxide": 0.013,
            "As": 0.021,
            "Cd": 0.004,
            "Pb": 0.009,
            "Cr6": 0.007,
            "Cu": 0.001,
            "Zn": 0.074,
            "Hg": 0.002,
            "DO": 7.095,
            "T": 25,
            "BOD5": 8.28,
            "COD": 23.253,
            "TOC": 17.855,
            "N_NH4": 0.163,
            "N_NO3": 0.93,
            "N_NO2": 0.18,
            "P_PO4": 0,
            "Coliform": 1300,
            "Ecoli": 92
        },
        {
            "station_id": "QLPH012016",
            "longitude": 105.68,
            "latitude": 9.3,
            "Z.Elev": 0.66,
            "date": "15/3/2016",
            "pH": 8.3,
            "Aldrin": 0.022,
            "BHC": 0.021,
            "Dieldrin": 0.019,
            "DDTs": 0.019,
            "Heptachlor": 0.041,
            "Heptachlorepoxide": 0.013,
            "As": 0.021,
            "Cd": 0.006,
            "Pb": 0.009,
            "Cr6": 0.008,
            "Cu": 0.001,
            "Zn": 0.019,
            "Hg": 0.002,
            "DO": 6.913,
            "T": 25,
            "BOD5": 8.3,
            "COD": 20.133,
            "TOC": 16.598,
            "N_NH4": 0.53,
            "N_NO3": 0.88,
            "N_NO2": 0.2,
            "P_PO4": 0,
            "Coliform": 1100,
            "Ecoli": 24
        }
        ]
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    assert response.status_code == 200

    results = response.json()
    assert isinstance(results, list)
    assert len(results) == 2

    expected = [
        {"WQI": 20, "WQI_Level": "Kém", "WQI_Color": "RGB(255,0,0)"},
        {"WQI": 34, "WQI_Level": "Xấu", "WQI_Color": "RGB(255,126,0)"}
    ]

    for i, (res, exp) in enumerate(zip(results, expected)):
        assert "WQI" in res and round(res["WQI"]) == exp["WQI"], f"WQI sai tại dòng {i}"
        assert "WQI_Level" in res and res["WQI_Level"] == exp["WQI_Level"], f"WQI_Level sai tại dòng {i}"
        assert "WQI_Color" in res and res["WQI_Color"] == exp["WQI_Color"], f"WQI_Color sai tại dòng {i}"
