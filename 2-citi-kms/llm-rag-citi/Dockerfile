# Use an official Python runtime as a parent image
FROM python:3.12

# Install system dependencies for curl, OpenCV, and computer vision libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgeos-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app
COPY . .

ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=prod

EXPOSE 5000

# Use Uvicorn (ASGI server) with the app wrapped in runner.py
# runner:asgi_app references the ASGI-wrapped Flask app from runner.py
CMD ["uvicorn", "runner:asgi_app", "--host", "0.0.0.0", "--port", "5000", "--workers", "2", "--log-level", "info"]