def avg_by_codes(nearest_codes, df4forcast):
    import pandas as pd
    # Lọc dữ liệu cho các mã gần nhất
    filtered_df = df4forcast[df4forcast['code'].isin(nearest_codes)]
    # Tính trung bình giá trị theo thời gian,
    # chuyển đổi 'datetime' sang kiểu datetime để sắp xếp đúng
    filtered_df['datetime'] = pd.to_datetime(filtered_df['datetime'])
    avg_series = filtered_df.groupby('datetime')['value'].mean().sort_index()
    return avg_series