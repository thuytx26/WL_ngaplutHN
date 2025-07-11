import { BASE_API_URL } from "./config.js";
export function initPredictWQI() {
    const form = document.getElementById("predict-form");
    const resultBox = document.getElementById("predict-result");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const formData = new FormData(form);
      const payload = {};
      formData.forEach((value, key) => {
        payload[key] = parseFloat(value);
      });
  
      resultBox.innerHTML = `<p>Predicting...</p>`;
  
      try {
        const response = await fetch(`${BASE_API_URL}/predict_wq`, {
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
        displayPredictResult(result, resultBox);
  
      } catch (error) {
        resultBox.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
      }
    });
  }
  
  function displayPredictResult(data, container) {
    container.innerHTML = `
      <div class="result-card">
        <h4 class="result-title">Prediction Result</h4>
        <div class="result-item">
          <span class="result-label">Predicted WQI:</span>
          <span class="result-value">${data.predicted_WQ.toFixed(2)}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Level:</span>
          <span class="result-badge">${data.level}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Color:</span>
          <span class="color-tag" style="background:${data.color}"></span>
          <span class="color-code">${data.color}</span>
        </div>
      </div>
    `;
  }
  
  