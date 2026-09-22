## 🌐 Live Demo

[![Live Demo](https://img.shields.io/badge/🚀%20LIVE%20DEMO-Smart%20AI%20Farming%20Assistant-success?style=for-the-badge)](https://smart-ai-farming-frontend.onrender.com)

# Smart AI Farming Assistant

Full-stack implementation based on the uploaded synopsis. It includes farmer registration/login/profile, dashboard, crop management/history, leaf-image upload, OpenCV preprocessing, PyTorch disease inference/training pipeline, fertilizer and irrigation recommendations, OpenWeatherMap forecasting, AI farming assistant, REST APIs, PostgreSQL, Alembic migrations, validation and responsive React UI.

## Run with Docker

1. Copy `.env.example` to `.env` and set `OPENWEATHER_API_KEY`.
2. Run `docker compose up --build`.
3. Frontend: http://localhost:5173
4. Swagger: http://localhost:8000/docs
5. ReDoc: http://localhost:8000/redoc

## Train disease model

Put an ImageFolder dataset under `backend/data/plantvillage/`, e.g. `Tomato___Early_blight/`, `Tomato___Healthy/`, etc. Then from `backend` with dependencies installed:

`python scripts_train.py --data-dir data/plantvillage --epochs 10`

This produces `weights/disease_model.pt` and `weights/classes.json`.

Without trained weights the API deliberately reports `model_unavailable` instead of making fake disease predictions.

## Local backend

`cd backend && python -m venv .venv && pip install -r requirements.txt && alembic upgrade head && uvicorn app.main:app --reload`

## API

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET/PUT /api/profile`, crop CRUD under `/api/crops`, `POST/GET /api/diagnosis`, fertilizer and irrigation under `/api/recommendations`, `GET /api/weather`, and `POST/GET /api/chat`.

## 🚀 Live Project

🌐 **Published Website:**  
https://smart-ai-farming-frontend.onrender.com
