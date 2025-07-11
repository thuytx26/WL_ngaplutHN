// js/map_wqi.js
export function initMap(center = [10.6, 106.7], zoom = 7) {
    const map = L.map('wqi-map').setView(center, zoom);

    var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
    }).addTo(map);
  
    const satellite = L.tileLayer(
      'https://{s}.sat.earthdata.nasa.gov/wmts/{layer}/{tileMatrixSet}/{z}/{y}/{x}.png',
      { attribution: 'NASA' }
    );
  
    const baseLayers = { 'Google Streets': googleStreets, 'Satellite': satellite };
    const overlays = {};  // sẽ thêm layer cluster sau
// add Vietnam boundary layer
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
  
    // Control layer
    L.control.layers(baseLayers, overlays).addTo(map);
  
    // Custom Legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      const grades = [0, 10, 26, 51, 76, 91];
      const labels = [
        '< 10 (Ô nhiễm rất nặng)',
        '10–25 (Kém)',
        '26–50 (Xấu)',
        '51–75 (Trung bình)',
        '76–90 (Tốt)',
        '91–100 (Rất tốt)'
      ];
  
      // Loop through intervals and generate label with colored square
      for (let i = grades.length - 1; i >= 0; i--) {
        const color = getColor(grades[i] + 1);
        div.innerHTML +=
          `<i style="background:${color}"></i> ${labels[i]}<br>`;
      }
      return div;
    };
    legend.addTo(map);
  
    return { map, overlays };
  }
  
  // Returns RGB color based on WQI thresholds
  function getColor(wqi) {
    if (wqi >= 91) return 'rgb(51,51,255)';       // Rất tốt
    if (wqi >= 76) return 'rgb(0,228,0)';         // Tốt
    if (wqi >= 51) return 'rgb(255,255,0)';       // Trung bình
    if (wqi >= 26) return 'rgb(255,126,0)';       // Xấu
    if (wqi >= 10) return 'rgb(255,0,0)';         // Kém
    return 'rgb(126,0,35)';                      // Ô nhiễm rất nặng
  }
  
  // Plots points on map with clustering
  export function plotWqiPoints({ map, overlays }, data) {
    const clusterGroup = L.markerClusterGroup();
  
    data.forEach(item => {
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);
      const wqi = parseFloat(item.WQI ?? item.wqi);
  
      if (isNaN(lat) || isNaN(lng) || isNaN(wqi)) return;
  
      // Create custom DivIcon colored by WQI
      const color = getColor(wqi);
      const wqiIcon = L.divIcon({
        className: 'wqi-div-icon',
        html: `<div style="
            background:${color};
            width:15px;
            height:15px;
            border:1px solid #333;
            border-radius:50%;
          "></div>`,
        iconSize: [15,15],
        iconAnchor: [7,7]
      });
  
      // Marker with popup
      const marker = L.marker([lat, lng], { icon: wqiIcon })
        .bindPopup(`
          <strong>WQI:</strong> ${wqi.toFixed(2)}<br/>
          <strong>Station:</strong> ${item.station_id || item.Station || '–'}<br/>
          <strong>Date:</strong> ${item.date || item.Date || '–'}
        `);
  
      clusterGroup.addLayer(marker);
    });
  
    // Add to map and overlays
    map.addLayer(clusterGroup);
    overlays['WQI Clusters'] = clusterGroup;
  }
  