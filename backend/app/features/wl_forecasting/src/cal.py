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

DEM_FILES = [
    "app/features/wl_forecasting/data/Dem_TpHN_48N.tif",
    "app/features/wl_forecasting/data/HCM_HT_DC_84.tif",
    "app/features/wl_forecasting/data/CT_HT_DC_84.tif",
    "app/features/wl_forecasting/data/CM_HT_DC_84.tif",
]

def _read_dem(dem_path: str, lat: float, lon: float):
    try:
        with rasterio.open(dem_path) as dataset:
            transformer = Transformer.from_crs("EPSG:4326", dataset.crs, always_xy=True)
            x, y = transformer.transform(lon, lat)
            for val in dataset.sample([(x, y)]):
                elevation = val[0]
                if elevation == dataset.nodata:
                    return None
                return float(elevation)
    except Exception as e:
        print(f"Lỗi đọc DEM {dem_path}: {e}")
        return None

def get_elevation(lat: float, lon: float) -> float:
    for dem_path in DEM_FILES:
        result = _read_dem(dem_path, lat, lon)
        if result is not None:
            return result
    return None
