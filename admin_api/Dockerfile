# Python 3.9 Slim
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Common Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install specific API deps
RUN pip install fastapi uvicorn supabase openai

# Copy shared scripts (dashboard logic)
COPY dashboard /app/dashboard

# Copy API code
COPY admin_api /app/admin_api

# Expose Port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "admin_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
