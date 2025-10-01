import { BASE_API_URL } from "./config.js";

export function initforcastWQI() {
  const form = document.getElementById("wqi-location-form");
  const resultBox = document.getElementById("predict-result");

  const wlSwitch = document.getElementById("WLCheckbox");
  const wlBox = document.getElementById("wl-forecast") || resultBox;

  wlSwitch?.addEventListener("change", () => {
    if (!wlSwitch.checked) wlBox.innerHTML = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // (2) Mỗi lần submit, nếu switch đang OFF thì xoá nội dung cũ của WL
    if (!wlSwitch.checked) wlBox.innerHTML = "";

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      if (key !== 'wq_param') {
        payload[key] = parseFloat(value);
      } else {
        payload[key] = value;
      }
    });

    const payloadWL = { latitude: payload.latitude, longitude: payload.longitude };


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

    // Xử lý tương tự cho dự báo mực nước
    if (wlSwitch.checked) {
      wlBox.innerHTML = `<p>⏳ Đang xử lý dự báo mực nước...</p>`;
      try {
        const responseWL = await fetch(`${BASE_API_URL}/forcast_wl`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadWL)
        });

        if (!responseWL.ok) {
          const err = await responseWL.text();
          throw new Error(err);
        }

        // dùng hàm displayWLForecast để vẽ biểu đồ
        const resultWL = await responseWL.json();
        displayWLForecast(resultWL, wlBox);
      } catch (error) {
        wlBox.innerHTML = `<p style="color:red">❌ Lỗi dự báo mực nước: ${error.message}</p>`;
      }
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
      // range: [0, 105],
      tickfont: { size: 14 }
    },
    margin: { t: 60, l: 60, r: 30, b: 100 },
    responsive: true,
    legend: { orientation: 'h', x: 0, y: 1.08 },
  };

  Plotly.newPlot('wqi-history-chart', [
    traceTransitionArea,
    traceCI,
    traceConnect,
    traceHistory,
    traceForecast
  ], layout);
}

// Vẽ Water Level forecast bằng Plotly
// result: object trả về từ /forcast_wl (như bạn gửi)
// container: phần tử DOM để render (vd: document.getElementById('wl-forecast'))
function displayWLForecast(result, container) {
  if (!result || !result.data) {
    container.innerHTML = `<p style="color:red">Không có dữ liệu để vẽ.</p>`;
    return;
  }

  const { data } = result;
  const { historical_data = {}, forecasted_wl = {} } = data;

  // Chuyển dict -> mảng đã sắp xếp theo thời gian
  const parseSeries = (obj) => {
    const entries = Object.entries(obj || {});
    entries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    const times = entries.map(([t]) => t);
    const vals  = entries.map(([,v]) => (Number.isFinite(+v) ? +v : null));
    return { times, vals };
  };

  const hist = parseSeries(historical_data);
  const fc   = parseSeries(forecasted_wl);

  if (!hist.times.length && !fc.times.length) {
    container.innerHTML = `<p style="color:red">Không có dữ liệu lịch sử hoặc dự báo.</p>`;
    return;
  }

  // Tạo div chart riêng, tránh đụng id
  const chartId = `wl-history-chart-${Date.now()}`;
  container.innerHTML = `<div id="${chartId}" style="height:520px;"></div>`;

  // Tìm min/max cho y, có đệm 10%
  const allVals = [...hist.vals, ...fc.vals].filter(v => Number.isFinite(v));
  const yMin = allVals.length ? Math.min(...allVals) : 0;
  const yMax = allVals.length ? Math.max(...allVals) : 0;
  const pad  = (yMax - yMin) * 0.1 || 10;

  // Trace lịch sử
  const traceHistory = {
    x: hist.times,
    y: hist.vals,
    mode: 'lines+markers',
    name: 'WL history',
    line: { color: 'navy', width: 2 },
    marker: { size: 5 },
    hovertemplate: '%{x}<br>WL: %{y:.2f}<extra>History</extra>',
  };

  // Trace dự báo
  const traceForecast = {
    x: fc.times,
    y: fc.vals,
    mode: 'lines+markers',
    name: 'WL prediction',
    line: { color: 'crimson', width: 2, dash: 'dash' },
    marker: { size: 6 },
    hovertemplate: '%{x}<br>WL: %{y:.2f}<extra>Predict</extra>',
  };

  // Đường nối (nếu có cả 2 bên)
  const connectTrace = (hist.times.length && fc.times.length)
    ? [{
        x: [hist.times.at(-1), fc.times[0]],
        y: [hist.vals.at(-1),  fc.vals[0]],
        mode: 'lines',
        name: 'Transition',
        line: { color: 'crimson', width: 2, dash: 'dash' },
        hoverinfo: 'skip',
        showlegend: false
      }]
    : [];

  // Nền mờ khu vực forecast (x-shape)
  // const shapes = [];
  // if (fc.times.length) {
  //   shapes.push({
  //     type: 'rect',
  //     xref: 'x',
  //     yref: 'paper',
  //     x0: fc.times[0],
  //     x1: fc.times.at(-1),
  //     y0: 0,
  //     y1: 1,
  //     fillcolor: 'rgba(0, 150, 255, 0.08)',
  //     line: { width: 0 }
  //   });
  // }

  // Tạo khoảng hiển thị: từ now - 5 ngày đến now + 5 ngày
  const now = new Date();
  const spanDays = 5;
  const ms = spanDays * 24 * 60 * 60 * 1000;
  const xStart = new Date(now.getTime() - ms);
  const xEnd   = new Date(now.getTime() + ms);

  const layout = {
    title: 'Water Level prediction chart',
    xaxis: {
      title: 'Datetime',
      type: 'date',
      tickangle: -45,
      range: [xStart, xEnd],
      autorange: false,
    },
    yaxis: {
      title: 'Water Level (cm)',
      range: [yMin - pad, yMax + pad],
      zeroline: true
    },
    margin: { t: 60, l: 60, r: 20, b: 90 },
    // shapes,
    legend: { orientation: 'h', x: 0, y: 1.08 },
  };

  const config = { responsive: true, displayModeBar: true };

  Plotly.newPlot(chartId, [
    ...connectTrace,
    traceHistory,
    traceForecast
  ], layout, config);
}
