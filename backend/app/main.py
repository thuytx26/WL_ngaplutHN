# app/main.py
from fastapi import FastAPI, HTTPException, Body
from typing import List, Dict, Annotated
import pandas as pd
from app.features.vnwqi_calculation.dss1_main import calculate_wqi_for_df
from app.features.vnwqi_prediction.main import predict
from app.features.vnwqi_prediction.levels import wqi_level, wqi_color
from app.features.vnwqi_forcasting.main import forecast
from app.features.wl_forecasting.main import forecast as forecast_water_level
from app.features.wl_forecasting.src.cal import get_elevation
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
import numpy as np
import requests

app = FastAPI(root_path="/api")

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:8001"], # Adjust this to frontend URL
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/wastewater_proxy")
async def wastewater_proxy():
    try:
        wfs_url = 'https://geoportal.watertech.vn/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=geonode:DIEM_XT&outputFormat=application/json'
        # Thêm headers để giả lập trình duyệt, tránh bị chặn
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # verify=False để bỏ qua lỗi SSL nếu có, timeout tăng lên 30s
        response = requests.get(wfs_url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Proxy Error: {str(e)}") # Log ra console của backend
        raise HTTPException(status_code=500, detail=f"Error fetching GeoServer data: {str(e)}")

@app.get("/commune_info")
async def get_commune_info(lat: float, lon: float):
    # Danh sách các tên lớp có thể có
    type_names = ['geonode:RanhgioiXa', 'geonode_data:RanhgioiXa']
    
    for t_name in type_names:
        try:
            # Sử dụng DWITHIN để lấy các xã trong bán kính 5km
            wfs_url = f"https://geoportal.watertech.vn/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName={t_name}&outputFormat=application/json&cql_filter=DWITHIN(the_geom,POINT({lon} {lat}),5,kilometers)"
            
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(wfs_url, headers=headers, timeout=15, verify=False)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("features") and len(data["features"]) > 0:
                    return data
        except Exception as e:
            print(f"Lỗi khi thử lớp {t_name}: {str(e)}")
            continue
            
    return {"type": "FeatureCollection", "features": []}

@app.get("/landuse_info")
async def get_landuse_info(lat: float, lon: float):
    try:
        # Lấy đầy đủ thuộc tính và hình học để tính diện tích ở frontend
        wfs_url = f"https://geoportal.watertech.vn/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=geonode:HT_Sdd_DBSCL&outputFormat=application/json&cql_filter=DWITHIN(the_geom,POINT({lon} {lat}),5,kilometers)"
        
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(wfs_url, headers=headers, timeout=25, verify=False)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Landuse Query Error: {str(e)}")
        return {"type": "FeatureCollection", "features": []}

class BatchWQIInput(BaseModel):
    data: List[Dict]

@app.post("/calculate_wqi_batch")
async def calculate_wqi_batch_endpoint(input_data: BatchWQIInput):
    try:
        df = pd.DataFrame(input_data.data)
        if df.empty:
            return []

        df_with_wqi = calculate_wqi_for_df(df.copy())
        df_with_wqi = df_with_wqi.where(pd.notnull(df_with_wqi), None)
        
        df_with_wqi = df_with_wqi.replace({np.nan: None})

        return jsonable_encoder(df_with_wqi.to_dict(orient="records"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error while processing data: {str(e)}")

class PredictWQInput(BaseModel):
    BOD5: float
    COD: float
    TOC: float
    BHC: float
    Cd: float
    Cr6: float

@app.post("/predict_wq")
async def predict_wq(input_data: PredictWQInput):
    try:
        prediction = predict(input_data.dict())
        level = wqi_level(prediction)
        color = wqi_color(prediction)
        result = {
            "predicted_WQ": round(prediction, 2),
            "level": level,
            "color": color
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error while processing data : {str(e)}")


class ForcastWQIInput(BaseModel):
    longitude: float
    latitude: float
    wq_param: str

df4forcast = pd.read_csv("app/features/vnwqi_forcasting/data/wqi_prepared_new.csv")

@app.post("/forcast_wqi")
async def forecast_wqi(input_data: ForcastWQIInput):
    try:
        forecasted_wqi = forecast(input_data.longitude,
                                  input_data.latitude,
                                  input_data.wq_param,
                                  df4forcast=df4forcast)
        return {
            "forecasted_wqi": forecasted_wqi
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error while processing data: {str(e)}")
    

df4forcast_wl = pd.read_csv("app/features/wl_forecasting/data/mucnuoc_merged_2025Q4_hourly.csv")
df_rainfall = pd.read_csv("app/features/wl_forecasting/data/cuongdomua.csv", index_col=0)


class ForcastWLInput(BaseModel):
    longitude: float
    latitude: float
    rainfall: int = 0

@app.post("/forcast_wl")
async def forecast_wl(input_data: ForcastWLInput):
    try:
        nearest_codes, historical_data, forecasted_wl, dem_value = forecast_water_level(
            input_data.longitude,
            input_data.latitude,
            input_data.rainfall,
            df4forcast=df4forcast_wl,
            df_rainfall=df_rainfall,
            )
        return {
            "nearest_codes": nearest_codes,
            'data':{
            "historical_data": historical_data,
            "forecasted_wl": forecasted_wl,
            "dem_value": dem_value
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error while processing data: {str(e)}")