# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for OpenCV and InsightFace
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the model downloader and run it to bake models into the image
COPY download_models.py .
RUN python download_models.py

# Copy the rest of the application
COPY . .

# Expose port 8000 for the FastAPI app
EXPOSE 8000

# Run uvicorn when the container launches
CMD ["uvicorn", "main.py:app", "--host", "0.0.0.0", "--port", "8000"]
