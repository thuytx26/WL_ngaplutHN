import { initCalcWQI } from './calc_wqi.js';
// import { initPredictWQI } from './predict_wq.js';
import { initforcastWQI } from './forcast_wqi.js';
document.addEventListener("DOMContentLoaded", function () {
  const tabCalc = document.getElementById("tab-calc");
  const tabPredict = document.getElementById("tab-predict");
  const mainContent = document.getElementById("main-content");

  let map = null; // Biến toàn cục để lưu trữ bản đồ
  let geojsonData = null; // Biến để lưu trữ dữ liệu GeoJSON
  let geojsonLayer = null; // Biến để lưu trữ layer GeoJSON trên bản đồ

  // Hàm khởi tạo bản đồ
  function initializeMap(containerId, initialLat = 21.02, initialLon = 105.83, zoom = 10) {
      if (map) {
          map.remove(); // Xóa bản đồ cũ nếu đã tồn tại
      }
      const mapContainer = document.getElementById(containerId);
      if (!mapContainer) {
          console.error(`Container ${containerId} not found`);
          return null;
      }

      map = L.map(containerId, {
          zoomControl: true,
          zoomControlOptions: {
              position: 'topleft'
          }
      }).setView([initialLat, initialLon], zoom);

        var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
        }).addTo(map);

      setTimeout(() => {
          map.invalidateSize();
      }, 100);

      window.addEventListener('resize', () => {
          map.invalidateSize();
      });

      return map;
  }

  // Hàm kiểm tra và ẩn/hiện nút zoom dựa trên vị trí cuộn
  function toggleZoomControl() {
      const mapElement = document.getElementById('map');
      const zoomControl = document.querySelector('.leaflet-control-zoom');
      if (mapElement && zoomControl) {
          const rect = mapElement.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          zoomControl.style.display = isVisible ? 'block' : 'none';
      }
  }

  function loadCalcUI() {
    mainContent.innerHTML = `
      <section class="wqi-section centered-container">
        <h2>Calculate Water Quality Index (WQI)</h2>
        <hr class="section-header-divider" />

        <div class="step-box card">
          <div class="card-header">Step 1: Download Template</div>
          <div class="card-body">
            <p>Download the required CSV template file, fill it with your data, then upload the completed file in Step 2.</p>
            <a class="btn-download" href="assets/wqi_template.csv" download>
              📥 Download Template
            </a>
            <p class="template-note">Template includes columns: pH, Aldrin, BHC, ...</p>
          </div>
        </div>
  
        <div class="step-box card">
          <div class="card-header">Step 2: Upload Your Data</div>
            <div class="card-body">
              <input type="file" id="csv-file" accept=".csv" />
            </div>
          </div>
        <div style="text-align: center; margin-top: 20px;">
          <button id="submit-file" class="btn-calc">Calculate</button>
        </div>

        <div id="calc-result"></div>
        <div id="wqi-map"></div>
      </section>
    `;
    initCalcWQI();
  }  

  function fetchWithRetry(url, options, retries = 3, delay = 2000) {
      return fetch(url, options)
          .then((response) => {
              if (!response.ok) throw new Error('Lỗi kết nối');
              return response.json();
          })
          .catch((error) => {
              if (retries > 0) {
                  return new Promise((resolve) => setTimeout(resolve, delay))
                      .then(() => fetchWithRetry(url, options, retries - 1, delay));
              }
              throw error;
          });
  }

  function loadPredictUI() {
      mainContent.innerHTML = `
          <div class="main-container" style="min-height: calc(100vh - 100px); display: flex; flex-direction: column;">
              <section class="wqi-form-container centered-container">
                  <h2>Water level prediction</h2>
                  <hr class="section-header-divider" />
                  <input id="search-input" type="text" placeholder="Enter address" style="width: 100%; padding: 8px; margin-bottom: 10px;" />
                  <div id="map" style="height: 600px; width: 1260px; margin: 10px auto; position: relative; z-index: 1; border: 2px solid #2B689C;"></div>
                  <form id="wqi-location-form">
                      <div class="form-group">
                          <label for="longitude">Longitude (E):</label>
                          <div class="input-with-buttons">
                              <input name="longitude" id="longitude" type="number" step="any" value="" required />
                          </div>
                      </div>
                      <div class="form-group">
                          <label for="latitude">Latitude (N):</label>
                          <div class="input-with-buttons">
                              <input name="latitude" id="latitude" type="number" step="any" value="" required />
                          </div>
                      </div>
                    <div class="form-group">
                        <label for="rainfall" style="font-weight: 600;">Precipitation (mm):</label>
                        <div class="input-with-buttons">
                            <input 
                                name="rainfall" 
                                id="rainfall" 
                                type="number" 
                                step="5" 
                                value="0" 
                                min="0" 
                                oninput="this.value = Math.abs(this.value)"
                                placeholder="Nhập cường độ mưa..." 
                                style="width: 400px; padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px;" 
                                required 
                            />
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; margin-bottom: 0;">
                            <label class="wl-switch" for="WQICheckbox" style="margin-bottom: 0;">
                                <input type="checkbox" id="WQICheckbox" />
                                <span class="wl-switch-track"><span class="wl-switch-thumb"></span></span>
                                <span class="wl-switch-text" style="font-weight: bold;">Water Quality</span>
                            </label>
                        </label>
                        <div class="input-with-buttons">
                            <select id="wq_param" name="wq_param" default="wqi">
                            <option value="wqi">WQI</option>

                            <!-- Group I -->
                            <optgroup label="Group I">
                                <option value="ph">pH</option>
                            </optgroup>

                            <!-- Group II: Pesticides -->
                            <optgroup label="Group II: Pesticides">
                                <option value="aldrin">Aldrin</option>
                                <option value="bhc">BHC</option>
                                <option value="dieldrin">Dieldrin</option>
                                <option value="ddts">DDTs (p,p′‑DDT &amp; p,p′‑DDE)</option>
                                <option value="heptachlor">Heptachlor & Heptachlorepoxide</option>
                            </optgroup>

                            <!-- Group III: Heavy metals -->
                            <optgroup label="Group III: Heavy metals">
                                <option value="as">As</option>
                                <option value="cd">Cd</option>
                                <option value="pb">Pb</option>
                                <option value="cr6">Cr⁶⁺</option>
                                <option value="cu">Cu</option>
                                <option value="zn">Zn</option>
                                <option value="hg">Hg</option>
                            </optgroup>

                            <!-- Group IV: Organic & Nutrients -->
                            <optgroup label="Group IV: Organic &amp; Nutrients">
                                <option value="do">DO</option>
                                <option value="bod5">BOD₅</option>
                                <option value="cod">COD</option>
                                <option value="toc">TOC</option>
                                <option value="n_nh4">N–NH₄</option>
                                <option value="n_no3">N–NO₃</option>
                                <option value="n_no2">N–NO₂</option>
                                <option value="p_po4">P–PO₄</option>
                            </optgroup>

                            <!-- Group V: Microbiological -->
                            <optgroup label="Group V: Microbiological">
                                <option value="coliform">Coliform</option>
                                <option value="ecoli">E. coli</option>
                            </optgroup>
                            </select>
                          </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="submit">🚀 Predict with AI</button>
                        </div>
                  </form>
                  <div id="wl-forecast" class="result-card" style="margin-top: 20px; position: relative; z-index: 500; flex-grow: 1; width: 100%;">
                  </div>
                  <div id="predict-result" style="margin-top: 20px; position: relative; z-index: 500; flex-grow: 1; width: 100%;">
                  </div>
              </section>
          </div>
      `;

      // Khởi tạo bản đồ với tọa độ DBSCL
      map = initializeMap('map', 10.26, 105.98, 9);

      // --- THÊM LỚP TỪ GEOSERVER ---
      const geoserverWmsUrl = 'https://geoportal.watertech.vn/geoserver/wms';
      const diemXtLayer = L.tileLayer.wms(geoserverWmsUrl, {
          layers: 'geonode:DIEM_XT',
          format: 'image/png',
          transparent: true,
          version: '1.1.1',
          attribution: "GeoServer"
      });

      const ranhGioiXaLayer = L.tileLayer.wms(geoserverWmsUrl, {
          layers: 'geonode:RanhgioiXa',
          format: 'image/png',
          transparent: true,
          version: '1.1.1',
          attribution: "GeoServer"
      });

      //add mặc định điểm xả thải vào map
      diemXtLayer.addTo(map)

      // Thêm bảng điều khiển lớp (Layer Control) để bật/tắt
      const overlays = {
          "Ranh giới xã": ranhGioiXaLayer,
          "Điểm xả thải": diemXtLayer
      };
      L.control.layers(null, overlays).addTo(map);
      // --- THÊM BẢNG CHÚ GIẢI (LEGEND) ---
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function (map) {
          const div = L.DomUtil.create('div', 'info legend');
          div.style.backgroundColor = 'white';
          div.style.padding = '10px';
          div.style.border = '2px solid #ccc';
          div.style.borderRadius = '5px';
          div.style.lineHeight = '24px';

          div.innerHTML += '<h4 style="margin: 0 0 5px 0; font-size: 14px;">Chú giải</h4>';
          // Trạm quan trắc WQI (Dùng màu xanh lá làm đại diện)
          div.innerHTML += '<i style="background: #FF7E00; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; border: 1px solid #efefef;"></i> Trạm quan trắc WQI<br>';
          // Điểm xả thải GeoServer (Dùng màu xanh dương hoặc biểu tượng WMS)
          div.innerHTML += '<i style="background: #333; width: 6px; height: 6px; display: inline-block; margin-right: 8px;"></i> Điểm xả thải';
          // Ranh giới xã
          div.innerHTML += '<br><i style="width: 14px; height: 10px; background: transparent; border: 2px solid #6b7280; display: inline-block; margin-right: 8px;"></i> Ranh giới xã';
          return div;
      };
      legend.addTo(map);
      // -----------------------------

      let marker;

      const searchInput = document.getElementById("search-input");
      const longitudeInput = document.getElementById("longitude");
      const latitudeInput = document.getElementById("latitude");
      const predictResult = document.getElementById("predict-result");

      // Tải và hiển thị GeoJSON
        fetch('/assets/data/vietnam.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(geojson_data => {
                L.geoJSON(geojson_data, {
                    style: function(feature) {
                        return {
                            color: "gray", 
                            weight: 2, 
                            opacity: 1, 
                            fillColor: "lightblue", 
                            fillOpacity: 0.3 
                        };
                    }
                }).addTo(map);
            })
            .catch(error => console.error('Lỗi khi tải hoặc xử lý GeoJSON:', error));

      fetch('assets/Ranhgioi_5721_wqi.geojson')
          .then(response => {
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
          })
          .then(data => {
              geojsonData = data;
              if (geojsonLayer) {
                  map.removeLayer(geojsonLayer);
              }
              geojsonLayer = L.geoJSON(geojsonData, {
                  style: function (feature) {
                      return {
                          color: "gray",
                          weight: 3,
                          opacity: 1,
                          fillColor: "transparent",
                          fillOpacity: 0
                      };
                  }
              }).addTo(map);
          })
          .catch(error => {
              console.error("Error loading GeoJSON:", error);
              predictResult.innerHTML = `<p style='color: red;'>❌ Lỗi khi tải dữ liệu khu vực hợp lệ: ${error.message}</p>`;
          });
      // ========================================================
      // ĐỌC FILE CSV VÀ VẼ CÁC TRẠM LÊN BẢN ĐỒ
      // ========================================================
      // Thay đường dẫn này bằng đường dẫn tới file CSV thực tế của bạn
      const CSV_URL = 'assets/data/cong_trinh_muc_nuoc_co_du_lieu.csv'; 

      fetch(CSV_URL)
          .then(response => {
              if (!response.ok) throw new Error("Không thể tải file CSV trạm");
              return response.text(); // Đọc dữ liệu dưới dạng text thay vì json
          })
          .then(csvText => {
              // Tách các dòng dựa vào ký tự xuống dòng
              const lines = csvText.trim().split('\n');
              
              // Bỏ qua dòng đầu tiên (dòng tiêu đề), bắt đầu chạy từ dòng 1
              for (let i = 1; i < lines.length; i++) {
                  const cols = lines[i].split(',');

                  // Đảm bảo dòng có đủ dữ liệu (ít nhất 6 cột để lấy e và n)
                  if (cols.length >= 6) {
                      const stName = cols[1].trim();              // Cột Tên
                      const stLon = parseFloat(cols[4].trim());   // Cột 'e' (Kinh độ)
                      const stLat = parseFloat(cols[5].trim());   // Cột 'n' (Vĩ độ)

                      // Nếu tọa độ hợp lệ thì tiến hành vẽ
                      if (!isNaN(stLat) && !isNaN(stLon)) {
                          L.circleMarker([stLat, stLon], {
                              radius: 5,           // Kích thước chấm tròn
                              fillColor: "#ff0000",// Màu nền đỏ
                              color: "#ffffff",    // Viền trắng
                              weight: 1,           
                              opacity: 1,
                              fillOpacity: 0.8
                          })
                          .addTo(map)
                          .bindTooltip(`<b>${stName}</b>`); // Hiện tên trạm khi di chuột vào
                      }
                  }
              }
          })
          .catch(error => console.warn("Lỗi xử lý trạm CSV:", error));

      // ========================================================
      // ĐỌC FILE CSV VÀ VẼ CÁC NGUỒN XẢ THẢI LÊN BẢN ĐỒ
      // ========================================================
      const WASTEWATER_CSV_URL = 'assets/data/nguon_xa_thai.csv'; 
      const COLOR_TABLE_URL = 'assets/data/wqi_color_table.csv';

      // Hàm tải bảng màu và sau đó tải dữ liệu trạm
      Promise.all([
          fetch(COLOR_TABLE_URL).then(res => res.text()),
          fetch(WASTEWATER_CSV_URL).then(res => res.text())
      ]).then(([colorText, csvText]) => {
          // 1. Xử lý bảng màu
          const colorLines = colorText.trim().split('\n');
          const colorTable = [];
          const colorHeaders = colorLines[0].split(',').map(h => h.trim().toLowerCase());
          
          for (let i = 1; i < colorLines.length; i++) {
              const cols = colorLines[i].split(',');
              if (cols.length < 3) continue;
              
              const range = cols[0].trim();
              let min = 0, max = 0;
              if (range.includes('-')) {
                  [min, max] = range.split('-').map(v => parseInt(v.trim()));
              } else if (range.includes('<')) {
                  max = parseInt(range.replace('<', '').trim()) - 1;
                  min = 0;
              }

              colorTable.push({
                  min, max,
                  status: cols[1].trim(),
                  color: cols[3] ? `rgb(${cols[3].replace(/;/g, ',')})` : '#ccc',
                  usage: cols[4] ? cols[4].trim() : ""
              });
          }

          const getStatusByWQI = (wqi) => {
              const val = parseFloat(wqi);
              if (isNaN(val)) return { status: "N/A", color: "#808080", usage: "Không có dữ liệu" };
              
              // Tìm dòng phù hợp trong bảng màu
              const row = colorTable.find(row => val >= row.min && val <= row.max);
              if (row) return row;

              // Xử lý trường hợp < 10 nếu không nằm trong khoảng min-max
              if (val < 10) return colorTable.find(row => row.max === 9) || colorTable[colorTable.length - 1];
              
              return colorTable[colorTable.length - 1];
          };

          // 2. Xử lý dữ liệu trạm
          const lines = csvText.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const eIdx = headers.indexOf('e'), nIdx = headers.indexOf('n'), codeIdx = headers.indexOf('code'), wqiIdx = headers.indexOf('wqi'), dateIdx = headers.indexOf('date');

          for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',');
              if (cols.length <= Math.max(eIdx, nIdx)) continue;

              const lon = parseFloat(cols[eIdx]), lat = parseFloat(cols[nIdx]);
              if (isNaN(lat) || isNaN(lon)) continue;

              const code = codeIdx !== -1 ? cols[codeIdx].trim() : "N/A";
              const wqi = wqiIdx !== -1 ? cols[wqiIdx].trim() : "0";
              const date = dateIdx !== -1 ? cols[dateIdx].trim() : "";

              const info = getStatusByWQI(wqi);

              const wwMarker = L.circleMarker([lat, lon], {
                  radius: 10,
                  fillColor: info.color,
                  color: "#fff",
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.9,
                  interactive: true,
                  pane: 'markerPane' 
              }).addTo(map);

              const popupContent = `
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.4; width: 100%; box-sizing: border-box; display: block; overflow: hidden; padding: 0; margin: 0;">
                      <!-- Header -->
                      <div style="border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; width: 100%;">
                          <b style="font-size: 13px; color: #2c3e50;">Trạm: ${code}</b>
                          <span style="font-size: 10px; color: #95a5a6;">${date}</span>
                      </div>

                      <!-- WQI Info Box -->
                      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; background: #fafafa; padding: 8px; border-radius: 8px; border: 1px solid #eee; box-sizing: border-box; width: 100%;">
                          <div style="width: 48px; height: 48px; border: 3px solid ${info.color}; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white; flex-shrink: 0; box-sizing: border-box;">
                              <span style="font-size: 7px; color: #7f8c8d; font-weight: bold; text-transform: uppercase; line-height: 1;">WQI</span>
                              <b style="font-size: 16px; color: #2c3e50; line-height: 1;">${wqi}</b>
                          </div>
                          <div style="min-width: 0; flex: 1; box-sizing: border-box;">
                              <div style="font-size: 9px; color: #7f8c8d; margin-bottom: 1px;">Phân loại:</div>
                              <div style="font-weight: 800; font-size: 13px; color: ${info.color === 'rgb(255, 255, 0)' ? '#b8860b' : info.color}; line-height: 1.2; word-break: break-word;">
                                  ${info.status.toUpperCase()}
                              </div>
                          </div>
                      </div>

                      <!-- Recommendation Box -->
                      <div style="background: #f8f9fa; border-radius: 6px; padding: 10px; border: 1px solid #edf0f2; box-sizing: border-box; width: 100%; display: block;">
                          <div style="display: inline-block; background: #34495e; color: #fff; font-size: 8px; font-weight: bold; padding: 2px 5px; border-radius: 3px; margin-bottom: 6px; text-transform: uppercase;">
                              Mục đích sử dụng
                          </div>
                          <div style="font-size: 10.5px; font-style: italic; color: #2c3e50; line-height: 1.4; box-sizing: border-box; word-break: break-word; width: 100%; display: block;">
                              Dựa trên chất lượng nước đạt loại <b>${info.status}</b>: ${info.usage}.
                          </div>
                      </div>
                  </div>
              `;

              wwMarker.bindPopup(popupContent, { 
                  minWidth: 450,
                  maxWidth: 700,
                  autoPan: true,
                  autoPanPadding: [50, 50]
              });


              wwMarker.on('click', function(e) {
                  L.DomEvent.stopPropagation(e);
                  longitudeInput.value = lon.toFixed(6);
                  latitudeInput.value = lat.toFixed(6);
                  if (marker) marker.setLatLng([lat, lon]);
                  else marker = L.marker([lat, lon]).addTo(map);
                  
                  // Mở popup thủ công để chắc chắn
                  wwMarker.openPopup();
              });
          }
      }).catch(err => console.error("Lỗi tải dữ liệu nguồn xả thải:", err));




      // ========================================================
      // Thêm sự kiện click vào bản đồ
      map.on('click', function (e) {
          const lat = e.latlng.lat;
          const lon = e.latlng.lng;

          // --- LUÔN CẬP NHẬT INPUT VÀ ĐẶT MARKER TRƯỚC ---
          longitudeInput.value = lon.toFixed(6);
          latitudeInput.value = lat.toFixed(6);

          if (marker) {
              marker.setLatLng([lat, lon]);
          } else {
              marker = L.marker([lat, lon]).addTo(map);
          }
          map.setView([lat, lon], 15);
          // --- KẾT THÚC CẬP NHẬT INPUT VÀ ĐẶT MARKER ---
      });

      searchInput.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
              event.preventDefault();

              const query = searchInput.value.trim();
              if (!query) {
                  predictResult.innerHTML = "<p style='color: red;'>Vui lòng nhập địa chỉ!</p>";
                  return;
              }

              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

              fetchWithRetry(url, {
                  headers: {
                      'User-Agent': 'WQI-App/1.0 (your-email@example.com)'
                  }
              })
                  .then((data) => {
                      if (data && data.length > 0) {
                          const place = data[0];
                          const lat = parseFloat(place.lat);
                          const lon = parseFloat(place.lon);

                          // Luôn cập nhật input và đặt marker khi tìm thấy địa chỉ
                          map.setView([lat, lon], 15);
                          if (marker) {
                              marker.setLatLng([lat, lon]);
                          } else {
                              marker = L.marker([lat, lon]).addTo(map);
                          }
                          longitudeInput.value = lon.toFixed(6);
                          latitudeInput.value = lat.toFixed(6);

                          let isInPolygon = false;
                          if (geojsonData && geojsonData.features) {
                              const searchedPoint = turf.point([lon, lat]);
                              for (const feature of geojsonData.features) {
                                  if (turf.booleanPointInPolygon(searchedPoint, feature)) {
                                      isInPolygon = true;
                                      break;
                                  }
                              }
                          }

                          if (isInPolygon) {
                              predictResult.innerHTML = "";
                          } else {
                              predictResult.innerHTML = "<p style='color: red;'>⚠️ Địa chỉ tìm kiếm không nằm trong khu vực dự đoán. Vui lòng thử địa chỉ khác!</p>";
                          }

                      } else {
                          predictResult.innerHTML = "<p style='color: red;'>Không tìm thấy địa chỉ!</p>";
                          longitudeInput.value = "";
                          latitudeInput.value = "";
                          if (marker) {
                              map.removeLayer(marker);
                              marker = null;
                          }
                      }
                  })
                  .catch((error) => {
                      console.error("Lỗi geocoding:", error);
                      predictResult.innerHTML = "<p style='color: blue;'>Nhấp chuột vào vị trí cần dự đoán.</p>";
                      longitudeInput.value = "";
                      latitudeInput.value = "";
                  });
          }
      });

      if (window.Plotly) {
          initforcastWQI();
      } else {
          const script = document.createElement("script");
          script.src = "https://cdn.plot.ly/plotly-latest.min.js";
          script.onload = () => {
              console.log("✅ Plotly loaded");
              initforcastWQI();
          };
          document.head.appendChild(script);
      }

      window.addEventListener('scroll', toggleZoomControl);
  }
  
  // Tab switching
  tabCalc.addEventListener("click", function () {
    tabCalc.classList.add("active");
    tabPredict.classList.remove("active");
    loadCalcUI();
  });

  tabPredict.addEventListener("click", function () {
    tabPredict.classList.add("active");
    tabCalc.classList.remove("active");
    loadPredictUI();
  });

  // default to load the calculation UI
  loadCalcUI();
});
