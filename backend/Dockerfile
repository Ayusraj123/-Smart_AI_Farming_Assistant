FROM python:3.11-slim
WORKDIR /app
ENV PYTHONPATH=/app
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app app
COPY alembic alembic
COPY alembic.ini .
COPY scripts_train.py .
COPY weights weights
RUN mkdir -p uploads
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
