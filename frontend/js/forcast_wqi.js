import { BASE_API_URL } from "./config.js";

export function initforcastWQI() {
  const form = document.getElementById("wqi-location-form");
  const resultBox = document.getElementById("predict-result"); // Output cho WQI
  const wlBox = document.getElementById("wl-forecast") || resultBox; // Output cho Water Level

  const wqiSwitch = document.getElementById("WQICheckbox");
  const wqParamSelect = document.getElementById("wq_param");
  wqParamSelect.disabled = true;
  wqParamSelect.style.backgroundColor = "#e9ecef";
  // Logic bật/tắt của chức năng WQI
  wqiSwitch?.addEventListener("change", () => {
    wqParamSelect.disabled = !wqiSwitch.checked;
    wqParamSelect.style.backgroundColor = wqiSwitch.checked ? "#fff" : "#e9ecef"; 
    if (!wqiSwitch.checked) {
      resultBox.innerHTML = ""; // Xóa chart WQI nếu tắt
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset giao diện trước khi nạp dữ liệu mới
    if (!wqiSwitch.checked) resultBox.innerHTML = "";
    wlBox.innerHTML = `<p>⏳ Đang xử lý dự báo mực nước...</p>`;

    // Gom dữ liệu từ form
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      if (key !== 'wq_param' && value !== "") {
        payload[key] = parseFloat(value);
      } else {
        payload[key] = value;
      }
    });

    // ==========================================
    // 1. LUÔN DỰ BÁO WATER LEVEL (MẶC ĐỊNH)
    // ==========================================
    try {
      const payloadWL = { 
        latitude: payload.latitude, 
        longitude: payload.longitude,
        rainfall: payload.rainfall // Truyền lượng mưa vào API
      };

      const responseWL = await fetch(`${BASE_API_URL}/forcast_wl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWL)
      });

      if (!responseWL.ok) throw new Error(await responseWL.text());
      const resultWL = await responseWL.json();
      displayWLForecast(resultWL, wlBox);
    } catch (error) {
      wlBox.innerHTML = `<p style="color:red">❌ Lỗi dự báo mực nước: ${error.message}</p>`;
    }

    // ==========================================
    // 2. CHỈ DỰ BÁO WATER QUALITY NẾU CẦN GẠT BẬT
    // ==========================================
    if (wqiSwitch.checked) {
      resultBox.innerHTML = `<p>⏳ Đang xử lý dự báo Water Quality...</p>`;
      try {
        const response = await fetch(`${BASE_API_URL}/forcast_wqi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        displayforcast(result, resultBox);
      } catch (error) {
        resultBox.innerHTML = `<p style="color:red">❌ Lỗi dự báo WQI: ${error.message}</p>`;
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
// frontend/js/forcast_wqi.js

function displayWLForecast(result, container) {
  if (!result || !result.data) {
    container.innerHTML = `<p style="color:red">Không có dữ liệu để vẽ.</p>`;
    return;
  }

  const { data } = result;
  
  // 1. Lấy biến dem_value từ backend trả về (đảm bảo tên biến khớp với backend)
  const { historical_data = {}, forecasted_wl = {}, dem_value } = data;

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

  // ========================================================
  // 2. TÍNH TOÁN VÀ HIỂN THỊ THÔNG BÁO NGẬP LỤT
  // ========================================================
  let alertHTML = "";
  
  // Kiểm tra xem backend có trả về dem_value hợp lệ không
  if (fc.vals.length > 0 && dem_value !== undefined && dem_value !== null) {
    
    // Tìm giá trị mực nước dự báo cao nhất
    const maxWL = Math.max(...fc.vals.filter(v => v !== null));
    
    // Tính toán độ ngập (Lưu ý: Đảm bảo maxWL và dem_value cùng đơn vị, ví dụ cùng là cm)
    const floodDepth = maxWL - dem_value;

    if (floodDepth > 0) {
      // Cảnh báo ngập (màu đỏ)
      alertHTML = `
        <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; border: 1px solid #f5c6cb; margin-bottom: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 10px;">Vị trí dự báo</h4>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li>Cao độ nền (DEM) ~ <strong>${dem_value.toFixed(2)} m</strong></li>
            <li>Mực nước cảnh báo cao nhất ứng với cường độ mưa: <strong>${maxWL.toFixed(2)} m</strong></li>
            <li style="font-size: 1.1em; margin-top: 5px;">
              👉 Độ sâu ngập cảnh báo khoảng: <strong style="color: #dc3545; font-size: 1.3em;">${floodDepth.toFixed(2)} m</strong>
            </li>
          </ul>
        </div>
      `;
    } else {
      // Thông báo an toàn (màu xanh)
      alertHTML = `
        <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb; margin-bottom: 20px;">
          <h4 style="margin-top: 0; margin-bottom: 10px;">Vị trí dự báo</h4>
          <p style="margin-bottom: 0;">
            Cao độ nền (<strong>${dem_value.toFixed(2)} m</strong>) cao hơn mực nước dự báo lớn nhất (<strong>${maxWL.toFixed(2)} m</strong>).<br>
            Điểm này dự báo không ngập ứng với cường độ mưa.
          </p>
        </div>
      `;
    }
  } else if (dem_value === undefined || dem_value === null) {
      alertHTML = `
        <div style="background-color: #fff3cd; color: #856404; padding: 10px; border-radius: 8px; border: 1px solid #ffeeba; margin-bottom: 20px;">
          ℹ️ Không lấy được dữ liệu địa hình (DEM) tại vị trí này để tính toán ngập lụt.
        </div>
      `;
  }
  // ========================================================

  // 3. Hiển thị thông báo + Biểu đồ
  const chartId = `wl-history-chart-${Date.now()}`;
  container.innerHTML = alertHTML + `<div id="${chartId}" style="height:520px;"></div>`;

  // --- PHẦN CODE VẼ BIỂU ĐỒ BẰNG PLOTLY ---
  const allVals = [...hist.vals, ...fc.vals].filter(v => Number.isFinite(v));
  const yMin = allVals.length ? Math.min(...allVals) : 0;
  const yMax = allVals.length ? Math.max(...allVals) : 0;
  
  // Mở rộng trục Y để hiển thị được cả đường DEM nếu cần
  let plotMin = yMin;
  let plotMax = yMax;
  if (dem_value !== undefined && dem_value !== null) {
      plotMin = Math.min(yMin, dem_value);
      plotMax = Math.max(yMax, dem_value);
  }
  const pad = (plotMax - plotMin) * 0.1 || 10;

  const traceHistory = {
    x: hist.times,
    y: hist.vals,
    mode: 'lines+markers',
    name: 'WL history',
    line: { color: 'navy', width: 2 },
    marker: { size: 5 },
    hovertemplate: '%{x}<br>WL: %{y:.2f} m<extra>History</extra>',
  };

  const traceForecast = {
    x: fc.times,
    y: fc.vals,
    mode: 'lines+markers',
    name: 'WL prediction',
    line: { color: 'crimson', width: 2, dash: 'dash' },
    marker: { size: 6 },
    hovertemplate: '%{x}<br>WL: %{y:.2f} m<extra>Predict</extra>',
  };

  // Vẽ thêm 1 đường nét đứt màu xanh lá cây thể hiện mặt đất (DEM)
  const traceDEM = (dem_value !== undefined && dem_value !== null && fc.times.length > 0) ? {
    x: [hist.times[0] || fc.times[0], fc.times.at(-1)],
    y: [dem_value, dem_value],
    mode: 'lines',
    name: 'Đường mặt đất (DEM)',
    line: { color: 'green', width: 2, dash: 'dot' },
    hovertemplate: 'Mặt đất: %{y:.2f} m<extra></extra>'
  } : null;

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

  const now = new Date();
  // Tính số mili-giây cho 3 giờ và 25 giờ
  const msPast = 3 * 60 * 60 * 1000;  // 3 giờ trước
  const msFuture = 25 * 60 * 60 * 1000; // 25 giờ sau

  const xStart = new Date(now.getTime() - msPast);
  const xEnd   = new Date(now.getTime() + msFuture);

  const layout = {
    title: 'Water Level Prediction Chart',
    xaxis: {
      title: 'Datetime',
      type: 'date',
      tickangle: -45,
      range: [xStart, xEnd],
      autorange: false,
    },
    yaxis: {
      title: 'Water Level / Elevation (m)',
      range: [plotMin - pad, plotMax + pad],
      zeroline: true
    },
    margin: { t: 60, l: 60, r: 20, b: 90 },
    legend: { orientation: 'h', x: 0, y: 1.08 },
  };

  const config = { responsive: true, displayModeBar: true };

  // Đưa tất cả các nét vẽ vào mảng
  const plotData = [...connectTrace, traceHistory, traceForecast];
  if (traceDEM) plotData.push(traceDEM);

  Plotly.newPlot(chartId, plotData, layout, config);
}
