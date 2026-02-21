def avg_by_codes(nearest_codes, df4forcast):
    import pandas as pd
    # Lọc dữ liệu cho các mã gần nhất
    filtered_df = df4forcast[df4forcast['code'].isin(nearest_codes)]
    # Tính trung bình giá trị theo thời gian,
    # chuyển đổi 'datetime' sang kiểu datetime để sắp xếp đúng
    filtered_df['datetime'] = pd.to_datetime(filtered_df['datetime'])
    avg_series = filtered_df.groupby('datetime')['value'].mean().sort_index()
    return avg_series


import rasterio
from pyproj import Transformer

# Đường dẫn tới file DEM
DEM_FILE_PATH = "app/features/wl_forecasting/data/Dem_TpHN_48N.tif"

def get_elevation(lat: float, lon: float) -> float:
    try:
        with rasterio.open(DEM_FILE_PATH) as dataset:
            # 1. Tự động lấy thông tin hệ tọa độ (CRS) của file DEM
            dem_crs = dataset.crs
            
            # 2. Tạo bộ chuyển đổi từ WGS84 (lat, lon) sang CRS của file DEM
            # always_xy=True để đảm bảo thứ tự truyền vào là (long, lat) -> (x, y)
            transformer = Transformer.from_crs("EPSG:4326", dem_crs, always_xy=True)
            
            # 3. Chuyển đổi tọa độ lat, lon sang tọa độ tương ứng của file
            x, y = transformer.transform(lon, lat)
            
            # 4. Lấy giá trị tại tọa độ đã chuyển đổi
            coords = [(x, y)]
            for val in dataset.sample(coords):
                elevation = val[0]
                
                if elevation == dataset.nodata:
                    return None
                
                return float(elevation)
                
    except Exception as e:
        print(f"Lỗi: {e}")
        return None
