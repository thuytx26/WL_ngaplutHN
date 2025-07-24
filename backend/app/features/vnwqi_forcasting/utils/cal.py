def weighted_time_average(parameter, df, nearest_codes, nearest_distances, n=6, epsilon=1e-6):
    if parameter not in df.columns:
        raise ValueError(f"Parameter '{parameter}' not found in DataFrame columns.")
    import pandas as pd
    weight_map = {
        code: 1 / (dist + epsilon)
        for code, dist in zip(nearest_codes, nearest_distances)
    }

    df_sub = df[df['code'].isin(nearest_codes)].copy()
    df_sub['date'] = pd.to_datetime(df_sub['date'])

    recent_dates = df_sub['date'].drop_duplicates().sort_values(ascending=False).head(n)
    df_sub = df_sub[df_sub['date'].isin(recent_dates)]

    df_sub['weight'] = df_sub['code'].map(weight_map)
    df_sub['wq_weighted'] = df_sub[parameter] * df_sub['weight']

    result = (
        df_sub.groupby('date')
        .agg(wq_sum=('wq_weighted', 'sum'), weight_sum=('weight', 'sum'))
    )
    result['wq_avg'] = result['wq_sum'] / result['weight_sum']
    result = result.sort_index()

    return result['wq_avg']
