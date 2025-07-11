import os
import joblib

_model = None

def load_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(__file__), "models", "model_wqi.pkl")
        _model = joblib.load(model_path)
    return _model
