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
        
        // Hiển thị biểu đồ dự báo
        displayforcast(result, resultBox);
        
        // --- KIỂM TRA ĐIỂM XẢ THẢI GẦN NHẤT ---
        await checkNearbyWastewater(payload.latitude, payload.longitude, resultBox);

        // --- KIỂM TRA THÔNG TIN XÃ VÀ DÂN SỐ ---
        await checkCommunePopulation(payload.latitude, payload.longitude, resultBox);

        // --- KIỂM TRA LOẠI HÌNH SỬ DỤNG ĐẤT ---
        await checkLandUseAffect(payload.latitude, payload.longitude, resultBox);
        
      } catch (error) {
        resultBox.innerHTML = `<p style="color:red">❌ Lỗi dự báo WQI: ${error.message}</p>`;
      }
    }
  });
}

/**
 * Lấy danh sách loại hình sử dụng đất trong bán kính 5km
 */
async function checkLandUseAffect(lat, lng, container) {
  try {
    const url = `${BASE_API_URL}/landuse_info?lat=${lat}&lon=${lng}`;
    const response = await fetch(url);
    if (!response.ok) return;
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      // 1. Tạo hình tròn bán kính 5km làm vùng đệm (buffer)
      const center = [lng, lat]; // [lon, lat] cho turf
      const radius = 5;
      const options = { steps: 64, units: 'kilometers' };
      const circle = turf.circle(center, radius, options);

      const areaMap = {}; // Lưu diện tích theo loaiSDD

      data.features.forEach(feature => {
        try {
          const loai = feature.properties.loaiSDD || 'Khác';
          
          // 2. Tính phần giao nhau giữa thửa đất và hình tròn 5km
          const intersection = turf.intersect(circle, feature);
          
          if (intersection) {
            // 3. Tính diện tích phần giao nhau (đơn vị m2)
            const area = turf.area(intersection);
            
            if (!areaMap[loai]) areaMap[loai] = 0;
            areaMap[loai] += area;
          }
        } catch (e) {
          // Bỏ qua nếu có lỗi hình học (như thửa đất không hợp lệ)
        }
      });

      // 4. Chuyển Map thành mảng để hiển thị
      const landUseStats = Object.entries(areaMap)
        .map(([type, area]) => ({ type, area }))
        .sort((a, b) => b.area - a.area);
      
      if (landUseStats.length > 0) {
        const totalArea = landUseStats.reduce((sum, item) => sum + item.area, 0);
        
        const infoHTML = `
          <div style="background-color: #f8f9fa; color: #212529; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h4 style="margin-top: 0; margin-bottom: 10px;">🌾 Hiện trạng sử dụng đất bị ảnh hưởng (Bán kính 5km)</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
              <thead>
                <tr style="border-bottom: 2px solid #dee2e6; text-align: left;">
                  <th style="padding: 8px 0;">Loại hình sử dụng</th>
                  <th style="padding: 8px 0; text-align: right;">Diện tích (m²)</th>
                  <th style="padding: 8px 0; text-align: right;">Tỷ lệ (%)</th>
                </tr>
              </thead>
              <tbody>
                ${landUseStats.map(item => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0;"><strong>${item.type}</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${Math.round(item.area).toLocaleString()}</td>
                    <td style="padding: 8px 0; text-align: right;">${((item.area / totalArea) * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="margin-top: 10px; font-size: 0.85em; color: #6c757d; border-top: 1px solid #eee; padding-top: 8px;">
              * Diện tích được tính toán dựa trên phần chồng lấn thực tế với bán kính 5km.
            </p>
          </div>
        `;
        container.insertAdjacentHTML('beforeend', infoHTML);
      }
    }
  } catch (error) {
    console.warn("Lỗi khi kiểm tra loại hình sử dụng đất:", error);
  }
}

/**
 * Lấy thông tin xã và dân số từ Backend Proxy
 */
async function checkCommunePopulation(lat, lng, container) {
  try {
    const url = `${BASE_API_URL}/commune_info?lat=${lat}&lon=${lng}`;
    const response = await fetch(url);
    if (!response.ok) return;
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const communes = data.features.map(f => {
        const props = f.properties;
        return {
          name: props.Xa || 'N/A',
          district: props.Huyen || 'N/A',
          province: props.Tinh || 'N/A',
          population: Number(props.DanSo) || 0
        };
      });

      // Tính tổng dân số
      const totalPopulation = communes.reduce((sum, c) => sum + c.population, 0);
      
      // Tạo danh sách hiển thị
      const communeListHTML = communes.slice(0, 5).map(c => 
        `<li><strong>${c.name}</strong> (${c.district}, ${c.province})</li>`
      ).join('');

      const infoHTML = `
        <div style="background-color: #e2e3e5; color: #383d41; padding: 15px; border-radius: 8px; border: 1px solid #d6d8db; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h4 style="margin-top: 0; margin-bottom: 10px;">🏘️ Các khu vực ảnh hưởng (Bán kính 5km)</h4>
          <p style="margin-bottom: 5px;"><strong>${communes.length}</strong> xã/phường nằm trong khu vực ảnh hưởng:</p>
          <ul style="margin-bottom: 10px; padding-left: 20px; font-size: 0.95em;">
            ${communeListHTML}
            ${communes.length > 5 ? `<li>... và ${communes.length - 5} xã khác.</li>` : ''}
          </ul>
          <p style="margin-bottom: 0; border-top: 1px solid #ccc; padding-top: 10px;">
            👥 Tổng số dân ước tính trong khu vực: <strong style="color: #0056b3; font-size: 1.2em;">${totalPopulation.toLocaleString()} người</strong>
          </p>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', infoHTML);
    }
  } catch (error) {
    console.warn("Lỗi khi kiểm tra thông tin dân số:", error);
  }
}

/**
 * Tính khoảng cách Haversine giữa 2 điểm (km)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Lấy dữ liệu WFS và tìm điểm xả thải gần nhất
 */
async function checkNearbyWastewater(lat, lng, container) {
  try {
    const proxyUrl = `${BASE_API_URL}/wastewater_proxy`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) return;
    
    const data = await response.json();
    if (!data.features || data.features.length === 0) return;
    
    const points = data.features;
    
    let nearestPoints = points.map(feature => {
      // GeoJSON: coordinates là [longitude, latitude]
      const coords = feature.geometry.coordinates;
      const pLng = coords[0];
      const pLat = coords[1];
      
      const dist = calculateDistance(lat, lng, pLat, pLng);
      
      const props = feature.properties;
      
      // --- TÌM TÊN ĐIỂM DỰA TRÊN DỮ LIỆU THỰC TẾ ---
      const name = props.TENCSXT || props.ten_diem || props.name || 'Điểm không tên';
      const code = props.SHDKS || props.ma_diem || 'N/A';
      const type = props.NGUONXT || ''; // Loại nguồn xả (ví dụ: Thủy sản)
      
      return { name, distance: dist, code, type };
    });
    
    // Sắp xếp theo khoảng cách tăng dần
    nearestPoints.sort((a, b) => a.distance - b.distance);
    
    const nearest = nearestPoints[0];
    const within5km = nearestPoints.filter(p => p.distance <= 5);
    
    let alertHTML = '';
    if (within5km.length > 0) {
      alertHTML = `
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h4 style="margin-top: 0; margin-bottom: 10px;">⚠️ Cảnh báo nguồn gây ô nhiễm</h4>
          <p><strong>${within5km.length}</strong> điểm xả thải trong bán kính 5km có khả năng ảnh hưởng đến chất lượng nước:</p>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            ${within5km.slice(0, 3).map(p => `<li><strong>${p.name}</strong> ${p.type ? `[${p.type}]` : ''} (Mã: ${p.code})</li>`).join('')}
          </ul>
          ${within5km.length > 3 ? `<p style="font-size: 0.9em; margin-top: 5px;">... và ${within5km.length - 3} điểm khác.</p>` : ''}
        </div>
      `;
    } else if (nearest) {
      alertHTML = `
        <div style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 8px; border: 1px solid #bee5eb; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h4 style="margin-top: 0; margin-bottom: 10px;">ℹ️ Thông tin môi trường</h4>
          <p>Không phát hiện điểm xả thải lớn trong bán kính 5km. Điểm xả thải gần nhất là:</p>
          <p style="margin-bottom: 0;">📍 <strong>${nearest.name}</strong> ${nearest.type ? `[${nearest.type}]` : ''}</p>
        </div>
      `;
    }
    
    if (alertHTML) {
      container.insertAdjacentHTML('beforeend', alertHTML);
    }
    
  } catch (error) {
    console.error("Lỗi khi kiểm tra điểm xả thải gần nhất:", error);
  }
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
