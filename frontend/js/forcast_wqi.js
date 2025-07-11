import { BASE_API_URL } from "./config.js";

export function initforcastWQI() {
  const form = document.getElementById("wqi-location-form");
  const resultBox = document.getElementById("predict-result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      payload[key] = parseFloat(value);
    });

    resultBox.innerHTML = `<p>⏳ Đang xử lý...</p>`;

    try {
      const response = await fetch(`${BASE_API_URL}/forcast_wqi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const result = await response.json();
      displayforcast(result, resultBox);
    } catch (error) {
      resultBox.innerHTML = `<p style="color:red">❌ Lỗi: ${error.message}</p>`;
    }
  });
}

function displayforcast(data, container) {
  const { forecast_next: forecast, history_dates: dates, wqi_series_avg: values } = data.forecasted_wqi;

  const lastDate = new Date(dates[dates.length - 1]);
  lastDate.setDate(1);
  lastDate.setHours(0, 0, 0, 0);

  const nextMonthOn1st = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    d.setDate(1);
    return d;
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const forecastDates = [1, 3, 6, 12].map(m => nextMonthOn1st(lastDate, m));
  const labels = ["1_month", "3_month", "6_month", "12_month"];

  const forecastValues = labels.map(key => forecast[key].wqi);
  const forecastLower = labels.map(key => forecast[key].lower_bound);
  const forecastUpper = labels.map(key => forecast[key].upper_bound);

  container.innerHTML = `<div id="wqi-history-chart" style="height: 600px; margin-top: 20px;"></div>`;

  const traceCI = {
    x: [...forecastDates.map(formatDateLocal), ...forecastDates.map(formatDateLocal).reverse()],
    y: [...forecastUpper, ...forecastLower.slice().reverse()],
    fill: 'toself',
    fillcolor: 'rgba(0, 255, 255, 0.4)',
    line: { color: 'rgba(255, 255, 255, 0)' },
    name: 'Khoảng tin cậy',
    type: 'scatter',
    hoverinfo: 'skip'
  };
  
  const traceHistory = {
    x: dates,
    y: values,
    mode: 'lines+markers',
    name: 'History WQI',
    line: { color: 'navy', width: 2 },
    marker: { size: 6 }
  };

  const traceForecast = {
    x: forecastDates.map(formatDateLocal),
    y: forecastValues,
    mode: 'lines+markers',
    name: 'Forecast WQI',
    line: { color: 'crimson', width: 2, dash: 'dash' },
    marker: { size: 8 }
  };

  const traceConnect = {
    x: [dates[dates.length - 1], formatDateLocal(forecastDates[0])],
    y: [values[values.length - 1], forecastValues[0]],
    mode: 'lines',
    name: 'Nối lịch sử và dự báo',
    line: { color: 'crimson', width: 2, dash: 'dash' },
    showlegend: false,
    hoverinfo: 'skip'
  };
  
  // Thêm trace để tô màu khu vực nối giữa lịch sử và dự báo
  const traceTransitionArea = {
    x: [
      dates[dates.length - 1], // Điểm cuối của lịch sử
      formatDateLocal(forecastDates[0]), // Điểm đầu của dự báo
      formatDateLocal(forecastDates[0]), // Quay lại điểm đầu để đóng vùng
      dates[dates.length - 1] // Quay lại điểm cuối của lịch sử
    ],
    y: [
      values[values.length - 1], // Giá trị cuối của lịch sử
      forecastUpper[0], // Giới hạn trên của dự báo
      forecastLower[0], // Giới hạn dưới của dự báo
      values[values.length - 1] // Quay lại giá trị cuối của lịch sử
    ],
    fill: 'toself',
    fillcolor: 'rgba(0, 255, 255, 0.4)',
    line: { color: 'transparent' },
    name: 'Khu vực nối',
    type: 'scatter',
    hoverinfo: 'skip',
    showlegend: false
  };

  // const traceHoverUpper = {
  //   x: forecastDates.map(formatDateLocal),
  //   y: forecastUpper,
  //   mode: 'markers',
  //   name: 'Giới hạn trên',
  //   marker: { size: 1, color: 'rgba(255,127,14,0.01)' },
  //   hovertemplate: 'Giới hạn trên: %{y:.2f}<extra></extra>',
  //   showlegend: false
  // };

  // const traceHoverLower = {
  //   x: forecastDates.map(formatDateLocal),
  //   y: forecastLower,
  //   mode: 'markers',
  //   name: 'Giới hạn dưới',
  //   marker: { size: 1, color: 'rgba(255,127,14,0.01)' },
  //   hovertemplate: 'Giới hạn dưới: %{y:.2f}<extra></extra>',
  //   showlegend: false
  // };

  const layout = {
    title: 'WQI forcasting chart',
    xaxis: {
      title: 'Date',
      type: 'date',
      tickformat: '%d/%m/%Y',
      tickangle: -45,
      tickfont: { size: 15 }
    },
    yaxis: {
      title: 'WQI Value',
      rangemode: 'auto',
      // autorange: true,
      range: [0, 105],
      tickfont: { size: 15 }
    },
    margin: { t: 60, l: 60, r: 30, b: 100 },
    responsive: true
  };

  Plotly.newPlot('wqi-history-chart', [
    traceTransitionArea,
    traceCI,
    traceConnect,
    traceHistory,
    traceForecast,
    // traceHoverUpper,
    // traceHoverLower,
     // Giữ trace khu vực nối
  ], layout);
}