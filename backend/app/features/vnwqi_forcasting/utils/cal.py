def weighted_time_average(df, nearest_codes, nearest_distances, n=6, epsilon=1e-6):
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
    df_sub['wqi_weighted'] = df_sub['wqi'] * df_sub['weight']

    result = (
        df_sub.groupby('date')
        .agg(wqi_sum=('wqi_weighted', 'sum'), weight_sum=('weight', 'sum'))
    )
    result['wqi_avg'] = result['wqi_sum'] / result['weight_sum']
    result = result.sort_index()

    return result['wqi_avg']
