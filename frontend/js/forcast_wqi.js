import { BASE_API_URL } from "./config.js";

export function initforcastWQI() {
  const form = document.getElementById("wqi-location-form");
  const resultBox = document.getElementById("predict-result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      if (key !== 'wq_param') {
        payload[key] = parseFloat(value);
      } else {
        payload[key] = value;
      }
    });

    resultBox.innerHTML = `<p>⏳ Đang xử lý...</p>`;

    try {
      const response = await fetch(`${BASE_API_URL}/forcast_wqi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const result = await response.json();
      // truyền nguyên như cũ, nhưng bên trong displayforcast sẽ tự đọc param
      displayforcast(result, resultBox);
    } catch (error) {
      resultBox.innerHTML = `<p style="color:red">❌ Lỗi: ${error.message}</p>`;
    }
  });
}

function displayforcast(data, container) {
  // Lấy label để hiển thị (có sub/superscript Unicode)
  const select = document.getElementById("wq_param");
  const displayName = select.options[select.selectedIndex].text; 

  // Lấy dữ liệu trả về như cũ
  const { forecast_next: forecast, history_dates: dates, wq_series_avg: values } = data.forecasted_wqi;

  // Tìm ngày cuối của lịch sử
  const lastDate = new Date(dates[dates.length - 1]);
  lastDate.setDate(1);
  lastDate.setHours(0, 0, 0, 0);

  // Hàm tính ngày 1 của n tháng tiếp theo
  const nextMonthOn1st = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    d.setDate(1);
    return d;
  };

  // Hàm format YYYY‑MM‑DD
  const formatDateLocal = (date) => {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day   = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Chuẩn bị 12 nhãn tháng
  const labels = Array.from({ length: 12 }, (_, i) => `${i + 1}_month`);
  // Tính mảng ngày dự báo
  const forecastDates = labels.map((_, i) => nextMonthOn1st(lastDate, i + 1));

  // Lấy mảng giá trị, lower/upper bound
  const forecastValues = labels.map(key => forecast[key].wqi);
  const forecastLower  = labels.map(key => forecast[key].lower_bound);
  const forecastUpper  = labels.map(key => forecast[key].upper_bound);

  // Reset container và chèn div chart
  container.innerHTML = `<div id="wqi-history-chart" style="height:600px; margin-top:20px;"></div>`;

  // Trace vùng CI
  const traceCI = {
    x: [
      ...forecastDates.map(formatDateLocal),
      ...forecastDates.map(formatDateLocal).reverse()
    ],
    y: [
      ...forecastUpper,
      ...forecastLower.slice().reverse()
    ],
    fill: 'toself',
    fillcolor: 'rgba(0,255,255,0.4)',
    line: { color: 'rgba(255,255,255,0)' },
    name: 'Confidence Interval',
    type: 'scatter',
    hoverinfo: 'skip'
  };

  // Trace lịch sử
  const traceHistory = {
    x: dates,
    y: values,
    mode: 'lines+markers',
    name: `${displayName} history`,      // <-- động
    line: { color: 'navy', width: 2 },
    marker: { size: 6 }
  };

  // Trace dự báo
  const traceForecast = {
    x: forecastDates.map(formatDateLocal),
    y: forecastValues,
    mode: 'lines+markers',
    name: `${displayName} prediction`,   // <-- động
    line: { color: 'crimson', width: 2, dash: 'dash' },
    marker: { size: 8 }
  };

  // Trace nối
  const traceConnect = {
    x: [ dates.at(-1), formatDateLocal(forecastDates[0]) ],
    y: [ values.at(-1), forecastValues[0] ],
    mode: 'lines',
    name: 'Nối lịch sử và dự báo',
    line: { color: 'crimson', width: 2, dash: 'dash' },
    showlegend: false,
    hoverinfo: 'skip'
  };

  // Trace vùng chuyển tiếp (tô màu nối 2 phần)
  const traceTransitionArea = {
    x: [
      dates.at(-1),
      formatDateLocal(forecastDates[0]),
      formatDateLocal(forecastDates[0]),
      dates.at(-1)
    ],
    y: [
      values.at(-1),
      forecastUpper[0],
      forecastLower[0],
      values.at(-1)
    ],
    fill: 'toself',
    fillcolor: 'rgba(0,255,255,0.4)',
    line: { color: 'transparent' },
    name: 'Khu vực nối',
    type: 'scatter',
    hoverinfo: 'skip',
    showlegend: false
  };

  // Layout với tiêu đề và trục Y động
  const layout = {
    title: `${displayName} prediction chart`,  // <-- động
    xaxis: {
      title: 'Date',
      type: 'date',
      tickformat: '%d/%m/%Y',
      tickangle: -45,
      tickfont: { size: 14 }
    },
    yaxis: {
      title: `${displayName} Value`,            // <-- động
      range: [0, 105],
      tickfont: { size: 14 }
    },
    margin: { t: 60, l: 60, r: 30, b: 100 },
    responsive: true
  };

  Plotly.newPlot('wqi-history-chart', [
    traceTransitionArea,
    traceCI,
    traceConnect,
    traceHistory,
    traceForecast
  ], layout);
}
