def forecast(longitude: float, latitude: float, df4forcast) -> dict: # Đổi tên 'lagitude' thành 'latitude' cho đúng chính tả
    from app.features.vnwqi_forcasting.utils.knn import find_k_nearest
    from app.features.vnwqi_forcasting.utils.cal import weighted_time_average
    from app.features.vnwqi_forcasting.utils.forecast import forecast_wqi_monthly

    # find k nearest points
    nearest_points = find_k_nearest(longitude, latitude, df4forcast, k=3)
    nearest_codes = nearest_points['code'].tolist()
    nearest_distances = nearest_points['distance_deg'].tolist()

    # calculate weighted average WQI for the nearest points
    wqi_series = weighted_time_average(df4forcast, nearest_codes, nearest_distances, n=6)

    # Gọi hàm forecast_wqi_monthly đã được cập nhật để trả về khoảng tin cậy
    forecast_result = forecast_wqi_monthly(wqi_series, steps=[1, 3, 6, 12])

    return {
        "nearest_codes": nearest_codes,
        "history_dates": wqi_series.index.strftime('%Y-%m-%d').tolist(),
        "wqi_series_avg": wqi_series.round(2).tolist(),
        "forecast_next": forecast_result
    }