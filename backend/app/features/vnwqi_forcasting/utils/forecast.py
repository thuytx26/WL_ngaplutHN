import pandas as pd
from prophet import Prophet
import numpy as np

def forecast_wq_monthly(
    series: pd.Series,
    steps: list = [1, 3, 6, 12],
    interval_width: float = 0.80,
    noise_scale: float = 1.0
) -> dict:
    """
    Dự báo WQ theo tháng với Prophet, thêm nhiễu tỷ lệ với độ biến thiên lịch sử.
    """
    # Chuẩn bị dữ liệu
    df = pd.DataFrame({
        'ds': series.index,
        'y': series.clip(0, 100)
    })

    # Fit model
    model = Prophet(interval_width=interval_width)
    model.fit(df)

    # Tính noise_value bằng population std (ddof=0)
    train_pred = model.predict(df[['ds']])
    resid = df['y'] - train_pred['yhat']
    noise_value = resid.to_numpy().std()  # ddof=0, tránh NaN với 1 phần tử

    # Fallback nếu noise_value không hợp lệ
    if not np.isfinite(noise_value) or noise_value == 0:
        # thử độ lệch chuẩn của diff
        diff_std = series.diff().dropna().to_numpy().std()
        if np.isfinite(diff_std) and diff_std > 0:
            noise_value = diff_std
        else:
            noise_value = 1.0  # giá trị mặc định an toàn

    # Forecast
    max_step = max(steps)
    future = model.make_future_dataframe(periods=max_step, freq='MS')
    forecast = model.predict(future)

    np.random.seed(42)
    result = {}
    for step in steps:
        target = df['ds'].max() + pd.DateOffset(months=step)
        row = forecast[forecast['ds'] == target]
        if row.empty:
            result[f'{step}_month'] = None
            continue

        # Lấy giá trị gốc
        yhat = row['yhat'].values[0]
        lo0 = row['yhat_lower'].values[0]
        hi0 = row['yhat_upper'].values[0]

        # Sinh noise
        noise = np.random.normal(0, noise_value * noise_scale)

        # Áp noise
        y = yhat + noise
        lo = lo0 + noise
        hi = hi0 + noise

        # Clamp vào [0,100]
        y = np.clip(y, 0, 100)
        lo = np.clip(lo, 0, 100)
        hi = np.clip(hi, 0, 100)

        # Chuyển NaN thành None, convert float
        def _clean(v):
            return None if not np.isfinite(v) else float(v)

        result[f'{step}_month'] = {
            'wqi': round(_clean(y), 2) if _clean(y) is not None else None,
            'lower_bound': round(_clean(lo), 2) if _clean(lo) is not None else None,
            'upper_bound': round(_clean(hi), 2) if _clean(hi) is not None else None,
        }

    return result
