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
    THRESHOLD_KM = 2.0  # Ngưỡng 2km như bạn đã thiết lập
    
    if distance_km > THRESHOLD_KM and dem_value is not None:
        
        # Lấy mốc thời gian hiện tại (giờ 0) từ historical_data trước khi xóa
        current_time_str = list(historical_data.keys())[-1] if len(historical_data) > 0 else None
        
        # Xóa dữ liệu lịch sử
        historical_data = {}
        
        # Khắc phục lỗi không tìm thấy chữ 'cuong_do_mua'
        if 'cuong_do_mua' in df_rainfall.columns:
            diff = (df_rainfall['cuong_do_mua'] - rainfall).abs()
            best_idx = diff.idxmin()
            rain_row = df_rainfall.loc[best_idx]
        elif df_rainfall.index.name == 'cuong_do_mua' or str(df_rainfall.index.name).strip() == 'cuong_do_mua':
            diff = abs(pd.Series(df_rainfall.index) - rainfall)
            best_idx = df_rainfall.index[diff.argmin()]
            rain_row = df_rainfall.loc[best_idx]
        else:
            first_col = df_rainfall.columns[0]
            diff = (df_rainfall[first_col] - rainfall).abs()
            best_idx = diff.idxmin()
            rain_row = df_rainfall.loc[best_idx]
            
        # ---------------------------------------------------------
        # XỬ LÝ GIỜ HIỆN TẠI (Tương ứng với cột 0)
        # ---------------------------------------------------------
        rain_val_0 = 0
        if '0' in rain_row:
            rain_val_0 = rain_row['0']
        elif 0 in rain_row:
            rain_val_0 = rain_row[0]
            
        # Gán giá trị cho giờ hiện tại = DEM + Cột 0
        if current_time_str is not None:
            historical_data[current_time_str] = dem_value + float(rain_val_0)
        
        # ---------------------------------------------------------
        # XỬ LÝ 24 GIỜ TIẾP THEO (Tương ứng với cột 1 đến 24)
        # ---------------------------------------------------------
        timestamps = list(forecast_result.keys())[:24]
        new_forecast = {}
        
        for i, ts in enumerate(timestamps):
            # i bắt đầu từ 0 -> cột tương ứng sẽ là i + 1 (tức là cột 1, 2, 3...)
            hour_key_str = str(i + 1)
            hour_key_int = i + 1
            
            if hour_key_str in rain_row:
                rain_val = rain_row[hour_key_str]
            elif hour_key_int in rain_row:
                rain_val = rain_row[hour_key_int]
            else:
                rain_val = 0
                
            # Tính toán: DEM + Giá trị cột tương ứng
            new_forecast[ts] = dem_value + float(rain_val)
            
        # Ghi đè kết quả trả về
        forecast_result = new_forecast
        nearest_codes = ["INLAND_DEM"] # Đổi tên mã trạm để phân biệt

    return nearest_codes, historical_data, forecast_result, dem_value