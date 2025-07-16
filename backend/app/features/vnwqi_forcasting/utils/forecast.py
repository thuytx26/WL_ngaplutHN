import pandas as pd
from prophet import Prophet
import numpy as np

def forecast_wqi_monthly(series: pd.Series, steps: list = [1, 3, 6, 12], interval_width: float = 0.80) -> dict:
    """
    Dự báo WQI theo tháng với Prophet, thêm nhiễu nhỏ có kiểm soát để tránh đường dự báo quá tuyến tính.
    
    Parameters:
        series (pd.Series): Chuỗi WQI theo thời gian (index là datetime, giá trị trong [0–100])
        steps (list): Danh sách các bước thời gian dự báo (theo tháng), ví dụ: [1,3,6,12]
        interval_width (float): Độ rộng khoảng tin cậy (ví dụ: 0.80 cho 80%)
    
    Returns:
        dict: Từ điển với các khóa '1_month', '2_month',..., mỗi khóa chứa:
              - wqi: giá trị dự báo chính (float)
              - lower_bound: giới hạn dưới của khoảng tin cậy
              - upper_bound: giới hạn trên của khoảng tin cậy
    """
    # Làm sạch giá trị đầu vào và giới hạn trong [0, 100]
    df = pd.DataFrame({'ds': series.index, 'y': series.clip(0, 100)})

    # Khởi tạo Prophet với khoảng tin cậy mặc định (không thêm seasonality thủ công)
    model = Prophet(interval_width=interval_width)
    model.fit(df)

    # Dự báo tới bước xa nhất
    max_step = max(steps)
    future = model.make_future_dataframe(periods=max_step, freq='MS')
    forecast = model.predict(future)

    # Đặt seed để đảm bảo kết quả nhất quán nếu cần
    np.random.seed(42)

    result = {}
    for step in steps:
        target_date = df['ds'].max() + pd.DateOffset(months=step)
        row = forecast[forecast['ds'] == target_date]
        if not row.empty:
            # Thêm nhiễu có kiểm soát vào dự báo và khoảng tin cậy
            noise = np.random.normal(0, 10)
            yhat = round(row['yhat'].values[0] + noise, 2)
            yhat_lower = round(row['yhat_lower'].values[0] + noise, 2)
            yhat_upper = round(row['yhat_upper'].values[0] + noise, 2)

            result[f'{step}_month'] = {
                'wqi': max(0, min(yhat, 100)),
                'lower_bound': max(0, min(yhat_lower, 100)),
                'upper_bound': max(0, min(yhat_upper, 100))
            }
        else:
            result[f'{step}_month'] = None

    return result
