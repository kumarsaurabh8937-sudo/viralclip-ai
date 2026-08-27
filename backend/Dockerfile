FROM python:3.11-slim

# System deps including FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /tmp/viralclip

# Pre-download Whisper model at build time (optional — speeds up cold start)
ARG WHISPER_MODEL=medium
RUN python -c "import whisper; whisper.load_model('${WHISPER_MODEL}')" || true

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
