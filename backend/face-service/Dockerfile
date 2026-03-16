FROM python:3.10-slim

# Install essential system dependencies
# Note: we skip libgl1-mesa-glx as we use opencv-python-headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    gcc \
    g++ \
    python3-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install build-time dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir numpy cython

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    onnxruntime \
    opencv-python-headless \
    insightface

COPY main.py .

# Expose the API port
EXPOSE 8000

# Start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
