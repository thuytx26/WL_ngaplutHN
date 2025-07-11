# app/main.py
from fastapi import FastAPI, HTTPException, Body
from typing import List, Dict
import pandas as pd
from app.features.vnwqi_calculation.dss1_main import calculate_wqi_for_df
from app.features.vnwqi_prediction.main import predict
from app.features.vnwqi_prediction.levels import wqi_level, wqi_color
from app.features.vnwqi_forcasting.main import forecast
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
import numpy as np

app = FastAPI(root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8001"], # Adjust this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

df4forcast = pd.read_csv("app/features/vnwqi_forcasting/data/wqi_prepared.csv")

@app.post("/forcast_wqi")
async def forecast_wqi(input_data: ForcastWQIInput):
    try:
        forecasted_wqi = forecast(input_data.longitude, input_data.latitude, df4forcast=df4forcast)
        return {
            "forecasted_wqi": forecasted_wqi
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error while processing data: {str(e)}")