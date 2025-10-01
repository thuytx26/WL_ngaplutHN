import pandas as pd
def forecast(longitude: float, latitude: float, df4forcast: pd.DataFrame) -> float:
    # find k nearest points
    from app.features.wl_forecasting.src.knn import find_k_nearest
    nearest_points = find_k_nearest(longitude, latitude, df4forcast, k=3)
    nearest_codes = nearest_points['code'].tolist()
    # tính trung bình giá trị của các điểm gần nhất
    from app.features.wl_forecasting.src.cal import avg_by_codes
    wq_series = avg_by_codes(nearest_codes, df4forcast)
    # dự báo giá trị trong tương lai -> trích xuất n giá trị tiếp theo vì dữ liệu đã được dự báo sẵn
    from app.features.wl_forecasting.src.extract_forcast_value import extract_forcast_value
    historical_data, forecast_result = extract_forcast_value(wq_series, n=24*7)
    return nearest_codes, historical_data, forecast_result