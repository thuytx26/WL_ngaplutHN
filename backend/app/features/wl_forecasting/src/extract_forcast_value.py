def extract_forcast_value(wq_series, n=24):
    # lấy thời gian hiện tại (now)
    import pandas as pd

    def series_to_dict(series: pd.Series) -> dict:
        """Chuyển đổi một pandas Series thành dictionary với key là timestamp dạng chuỗi."""
        # Đảm bảo index là kiểu datetime
        series.index = pd.to_datetime(series.index)
        # Định dạng index thành chuỗi và tạo dictionary
        return {ts.strftime('%Y-%m-%d %H:%M:%S'): value for ts, value in series.items()}

    # Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7), sau đó loại bỏ thông tin tz để so sánh
    now = pd.Timestamp.now(tz='Asia/Ho_Chi_Minh').tz_localize(None).replace(minute=0, second=0, microsecond=0)
    # trích xuất n giá trị trước thời điểm hiện tại nhằm mục đích hiển thị dữ liệu lịch sử
    historical_data = wq_series[wq_series.index <= now].tail(n).round(2)
    historical_dict = series_to_dict(historical_data)
    # trích xuất n giá trị tiếp theo sau thời điểm hiện tại và trả về cả index và value
    forecast_data = wq_series[wq_series.index > now].head(n).round(2)
    forecast_dict = series_to_dict(forecast_data)
    return historical_dict, forecast_dict