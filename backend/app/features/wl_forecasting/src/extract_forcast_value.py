import pandas as pd

# Bổ sung tham số rainfall và df_rainfall
def extract_forcast_value(wq_series, rainfall=0.0, df_rainfall=None, n=24):
    def series_to_dict(series: pd.Series) -> dict:
        """Chuyển đổi một pandas Series thành dictionary với key là timestamp dạng chuỗi."""
        series.index = pd.to_datetime(series.index)
        return {ts.strftime('%Y-%m-%d %H:%M:%S'): value for ts, value in series.items()}

    # Lấy thời gian hiện tại
    now = pd.Timestamp.now(tz='Asia/Ho_Chi_Minh').tz_localize(None).replace(minute=0, second=0, microsecond=0)
    
    # Trích xuất dữ liệu lịch sử
    historical_data = wq_series[wq_series.index <= now].tail(n).round(2)
    historical_dict = series_to_dict(historical_data)
    
    # Trích xuất dữ liệu dự báo gốc
    forecast_data = wq_series[wq_series.index > now].head(n).astype(float) # Để astype(float) để dễ cộng số học
    
    # ==========================================
    # THUẬT TOÁN CỘNG LƯỢNG MƯA
    # ==========================================
    if rainfall > 0 and df_rainfall is not None:
        # Làm tròn lượng mưa về bội số của 5 để khớp với file CSV
        rainfall_key = round(float(rainfall) / 5) * 5
        
        # Đảm bảo key không vượt quá giới hạn bảng tra cứu
        max_key = df_rainfall.index.max()
        if rainfall_key > max_key:
            rainfall_key = max_key
        elif rainfall_key < 0:
            rainfall_key = 0
            
        # Lấy dòng tra cứu (bỏ qua nếu không tìm thấy key)
        if rainfall_key in df_rainfall.index:
            # modifiers sẽ là 1 array chứa các số tương ứng các giờ 0 -> 24
            modifiers = df_rainfall.loc[rainfall_key].values
            
            # Cộng dồn vào forecast_data
            for i in range(len(forecast_data)):
                # Đảm bảo không vượt quá số cột của file csv
                if i < len(modifiers):
                    forecast_data.iloc[i] += modifiers[i]
    
    # Làm tròn lại sau khi cộng
    forecast_data = forecast_data.round(2)
    forecast_dict = series_to_dict(forecast_data)
    
    return historical_dict, forecast_dict