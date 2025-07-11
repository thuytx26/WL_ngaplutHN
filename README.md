# WQI calculation, prediction

**Overview**  
This repository contains the Water Quality Index (WQI) application:  
- **Backend**: FastAPI server exposing endpoints for WQI calculation and prediction. 
- **Frontend**: Static HTML/CSS/JavaScript served via Nginx, calling the backend API.
- **Docker Compose**: Orchestrates both services for local development.

---

## Prerequisites
- Docker & Docker Compose installed on your machine.

---

## Project Structure
```
├── backend/
│   ├── Dockerfile             # Dockerfile for FastAPI backend
│   ├── requirements.txt       # Python dependencies
│   └── app/                   # FastAPI application code
├── frontend/
│   ├── Dockerfile             # Dockerfile for Nginx frontend
│   └── (HTML, CSS, JS files)  # Static assets
└── docker-compose.yml         # Compose file to run both services
```

---

## Running Locally

1. **Clone the repository**
   ```bash
   git clone git@github.com:tranxuanthuy/vnwqi.git
   cd vnwqi

2. **Start services**
   ```bash
   docker compose up --build

3. **Access the application**
   - Frontend UI: http://localhost:8001  
   - Backend Swagger: http://localhost:8000/docs

4. **Stopping**
   ```bash
   docker compose down

---