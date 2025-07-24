def forecast(longitude: float, latitude: float, parameter: str, df4forcast) -> dict: # Đổi tên 'lagitude' thành 'latitude' cho đúng chính tả
    from app.features.vnwqi_forcasting.utils.knn import find_k_nearest
    from app.features.vnwqi_forcasting.utils.cal import weighted_time_average
    from app.features.vnwqi_forcasting.utils.forecast import forecast_wq_monthly

    # find k nearest points
    nearest_points = find_k_nearest(longitude, latitude, df4forcast, k=3)
    nearest_codes = nearest_points['code'].tolist()
    nearest_distances = nearest_points['distance_deg'].tolist()

    # calculate weighted average WQI for the nearest points
    wq_series = weighted_time_average(parameter, df4forcast, nearest_codes, nearest_distances, n=24)

    forecast_result = forecast_wq_monthly(
        wq_series, 
        steps=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        )

    return {
        "nearest_codes": nearest_codes,
        "history_dates": wq_series.index.strftime('%Y-%m-%d').tolist(),
        "wq_series_avg": wq_series.round(2).tolist(),
        "forecast_next": forecast_result
    }