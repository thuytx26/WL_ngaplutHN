import pandas as pd
from prophet import Prophet
from scipy.special import logit, expit

def forecast_wqi_monthly(series: pd.Series, steps: list = [1, 3, 6, 12], interval_width: float = 0.80) -> dict:
    """
    Dự báo WQI theo tháng với logit transform để giữ giá trị trong khoảng (0, 100),
    bao gồm khoảng tin cậy và đảm bảo kết quả cuối cùng nằm trong [0, 100].

    Input:
        series: pd.Series (index = datetime, value = WQI 0–100)
        steps: list of forecast horizons (in months)
        interval_width: Độ rộng của khoảng tin cậy (ví dụ: 0.80 cho khoảng tin cậy 80%)
    Output:
        dict: các bước dự báo, giá trị WQI (float, clipped trong [0,100]),
              và các giới hạn dưới/trên của khoảng tin cậy.
    """
    # Chuẩn hóa về [0.01, 0.99] và logit transform
    # Việc clip ở đây giúp tránh logit(0) hoặc logit(1) gây ra lỗi vô cùng
    scaled = (series / 100).clip(0.01, 0.99)
    df = pd.DataFrame({'ds': scaled.index, 'y': logit(scaled)})

    # Khởi tạo mô hình Prophet với khoảng tin cậy mong muốn
    model = Prophet(interval_width=interval_width)
    model.fit(df)

    max_step = max(steps)
    future = model.make_future_dataframe(periods=max_step, freq='MS')
    forecast = model.predict(future)

    result = {}
    for step in steps:
        target_date = df['ds'].max() + pd.DateOffset(months=step)
        row = forecast[forecast['ds'] == target_date]
        if not row.empty:
            yhat_logit = row['yhat'].values[0]
            yhat_prob = expit(yhat_logit)  # chuyển về [0,1]
            wqi = round((yhat_prob * 100).clip(0, 100), 2) # Áp dụng clip

            # Lấy và biến đổi khoảng tin cậy
            yhat_lower_logit = row['yhat_lower'].values[0]
            yhat_upper_logit = row['yhat_upper'].values[0]

            yhat_lower_prob = expit(yhat_lower_logit)
            yhat_upper_prob = expit(yhat_upper_logit)

            wqi_lower = round((yhat_lower_prob * 100).clip(0, 100), 2) # Áp dụng clip
            wqi_upper = round((yhat_upper_prob * 100).clip(0, 100), 2) # Áp dụng clip

            result[f'{step}_month'] = {
                'wqi': wqi,
                'lower_bound': wqi_lower,
                'upper_bound': wqi_upper
            }
        else:
            result[f'{step}_month'] = None

    return result