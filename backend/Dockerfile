# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Set timezone to Asia/Shanghai (Critical for correct timestamps in logs and DB)
ENV TZ=Asia/Shanghai \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies and fonts
# fonts-wqy-microhei is for Chinese PDF export
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-wqy-microhei \
    tzdata \
    && ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo ${TZ} > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first (for cache efficiency)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 80 (Standard for WeChat Cloud Run)
EXPOSE 80

# Command to run the application on port 80
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
