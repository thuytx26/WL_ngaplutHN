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
  function initializeMap(containerId, initialLat = 10.5, initialLon = 105.5, zoom = 8) {
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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors'
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
                  <h2>Water quality forecasting</h2>
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
                      <button type="submit" class="submit">🚀 Predict</button>
                  </form>
                  <div id="predict-result" style="margin-top: 20px; position: relative; z-index: 500; flex-grow: 1; width: 100%;">
                  </div>
              </section>
          </div>
      `;

      // Khởi tạo bản đồ với tọa độ DBSCL
      map = initializeMap('map', 10.444598, 106.100464, 8);

      let marker;

      const searchInput = document.getElementById("search-input");
      const longitudeInput = document.getElementById("longitude");
      const latitudeInput = document.getElementById("latitude");
      const predictResult = document.getElementById("predict-result");

      // Tải và hiển thị GeoJSON
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
                          color: "#007bff",
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
                      predictResult.innerHTML = "<p style='color: red;'>Lỗi kết nối dịch vụ định vị! Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.</p>";
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
