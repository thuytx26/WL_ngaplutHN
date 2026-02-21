import pandas as pd
import math

from .src.cal import get_elevation

def haversine(lat1, lon1, lat2, lon2):
    """Tính khoảng cách đường chim bay giữa 2 tọa độ (đơn vị: km)"""
    R = 6371.0 # Bán kính Trái Đất
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def forecast(longitude: float, latitude: float, rainfall: int, df4forcast: pd.DataFrame, df_rainfall: pd.DataFrame):
    
    # 1. Lấy cao độ DEM
    dem_value = get_elevation(latitude, longitude)
    
    # 2. Tìm trạm gần nhất
    from app.features.wl_forecasting.src.knn import find_k_nearest
    nearest_points = find_k_nearest(longitude, latitude, df4forcast, k=3)
    nearest_codes = nearest_points['code'].tolist()
    
    # Tính khoảng cách tới trạm gần nhất
    closest_lat = nearest_points.iloc[0]['n']
    closest_lon = nearest_points.iloc[0]['e']
    distance_km = haversine(latitude, longitude, closest_lat, closest_lon)
    
    # 3. Chạy AI để mượn cấu trúc ngày giờ
    from app.features.wl_forecasting.src.cal import avg_by_codes
    wq_series = avg_by_codes(nearest_codes, df4forcast)
    from app.features.wl_forecasting.src.extract_forcast_value import extract_forcast_value
    historical_data, forecast_result = extract_forcast_value(wq_series, rainfall, df_rainfall, n=24*7)
    
    # ==========================================================
    # 4. NẾU Ở XA TRẠM -> ÁP DỤNG CÔNG THỨC MỚI CỦA BẠN
    # ==========================================================
    THRESHOLD_KM = 2.0  # Bạn có thể đổi số này (ví dụ: cách trạm quá 3km thì tính là xa)
    
    if distance_km > THRESHOLD_KM and dem_value is not None:
        
        # [YÊU CẦU 1] KHÔNG trả về lịch sử
        historical_data = {}
        
        # [YÊU CẦU 2] Khắc phục lỗi không tìm thấy chữ 'cuong_do_mua'
        # Trường hợp A: Nó là một cột bình thường
        if 'cuong_do_mua' in df_rainfall.columns:
            diff = (df_rainfall['cuong_do_mua'] - rainfall).abs()
            best_idx = diff.idxmin()
            rain_row = df_rainfall.loc[best_idx]
            
        # Trường hợp B: Nó đang bị đẩy làm Index (do index_col=0)
        elif df_rainfall.index.name == 'cuong_do_mua' or str(df_rainfall.index.name).strip() == 'cuong_do_mua':
            # Chuyển index thành Series để trừ
            diff = abs(pd.Series(df_rainfall.index) - rainfall)
            # Tìm vị trí (index) có giá trị mưa sát nhất
            best_idx = df_rainfall.index[diff.argmin()]
            rain_row = df_rainfall.loc[best_idx]
            
        # Trường hợp C: Bị dính ký tự ẩn (BOM) hoặc sai chính tả -> Cứ lấy thẳng cột đầu tiên
        else:
            first_col = df_rainfall.columns[0]
            diff = (df_rainfall[first_col] - rainfall).abs()
            best_idx = diff.idxmin()
            rain_row = df_rainfall.loc[best_idx]
        
        # [YÊU CẦU 3] CHỈ cắt lấy 24 mốc thời gian (24 giờ tới)
        timestamps = list(forecast_result.keys())[:24]
        new_forecast = {}
        
        for i, ts in enumerate(timestamps):
            # Cột giờ trong file cuongdomua.csv (từ 1 đến 24)
            hour_key_str = str(i + 1)
            hour_key_int = i + 1
            
            if hour_key_str in rain_row:
                rain_val = rain_row[hour_key_str]
            elif hour_key_int in rain_row:
                rain_val = rain_row[hour_key_int]
            else:
                rain_val = 0
                
            # Đảm bảo rain_val là số thực trước khi tính toán
            new_forecast[ts] = dem_value + float(rain_val)
            
        # Ghi đè kết quả trả về bằng dữ liệu 24h mới tạo
        forecast_result = new_forecast
        nearest_codes = ["INLAND_DEM"] # Đổi tên mã trạm để phân biệt

    return nearest_codes, historical_data, forecast_result, dem_value