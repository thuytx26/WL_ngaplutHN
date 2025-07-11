import { initMap, plotWqiPoints } from './map_wqi.js';
import { BASE_API_URL } from "./config.js";

let mapObj = null;

export function initCalcWQI() {
  const fileInput = document.getElementById("csv-file");
  const submitBtn = document.getElementById("submit-file");
  const resultBox = document.getElementById("calc-result");

  submitBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      resultBox.innerHTML = `<p style="color:red">Please select a CSV file.</p>`;
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const csvText = e.target.result;
      const jsonData = parseCSV(csvText);  // Chuyển CSV thành JSON array

      resultBox.innerHTML = `<p>Processing...</p>`;

      try {
        const response = await fetch(`${BASE_API_URL}/calculate_wqi_batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: jsonData }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(err);
        }

        const result = await response.json();
        displayResult(result, resultBox);

        // Delete old map if exists
        if (mapObj) {
          mapObj.map.remove();
          mapObj = null;
        }
        // Initialize map and plot points
        mapObj = initMap();
        const mapContainer = document.getElementById('wqi-map');
        mapContainer.classList.add('wqi-map--has-border');
        plotWqiPoints(mapObj, result);
      } catch (error) {
        resultBox.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
      }
    };

    reader.readAsText(file);
  });
}

// Hàm đơn giản để chuyển CSV thành Array<Object>
function parseCSV(csv) {
  const lines = csv.split("\n").filter(line => line.trim().length > 0);
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = isNaN(values[i]) ? values[i] : parseFloat(values[i]);
    });
    return obj;
  });
}

function displayResult(data, container) {
  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<div class="status-message">No data available.</div>`;
    return;
  }

  // Create CSV string
  const BOM = '\uFEFF';
  const csvContent = [
    Object.keys(data[0]).join(","),                   // header
    ...data.map(row => Object.values(row).join(",")) // rows
  ].join("\n");

  // Create blob and downloadable URL
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Build UI
  container.innerHTML = `
    <h4>✅ Processing complete!</h4>
    <a id="download-csv" class="btn-download" href="${url}" download="wqi_results.csv">
      📥 Download Results
    </a>
  `;
}

