import pandas as pd
from scipy.spatial import cKDTree

def find_k_nearest(lon_input, lat_input, df4forcast, k=3):
    df_unique = df4forcast[['code', 'e', 'n']].drop_duplicates()
    tree = cKDTree(df_unique[['e', 'n']].values)
    distances, indices = tree.query([lon_input, lat_input], k=k)
    
    nearest_points = df_unique.iloc[indices].copy()
    nearest_points['distance_deg'] = distances  # đơn vị: độ (not meters)
    return nearest_points.reset_index(drop=True)