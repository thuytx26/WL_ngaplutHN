import pandas as pd
from .model_loader import load_model

model = load_model()
selected_features = ["BOD5", "COD", "TOC", "BHC", "Cd", "Cr6"]

def predict(sample: dict) -> float:
    df = pd.DataFrame([sample])[selected_features]
    return model.predict(df)[0]
