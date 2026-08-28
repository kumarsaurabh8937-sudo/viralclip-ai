FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    git \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Pre-install pip build tools to prevent 'getting requirements to build wheel' errors
RUN pip install --no-cache-dir --upgrade pip setuptools wheel setuptools-rust

# Install PyTorch CPU first (keeps image small, prevents Render OOM)
RUN pip install --no-cache-dir torch==2.3.1 torchaudio==2.3.1 --index-url https://download.pytorch.org/whl/cpu

# Install the rest of the dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /tmp/viralclip

# Pre-download Whisper model at build time (optional - speeds up cold start)
RUN python -c "import whisper; whisper.load_model('base')" || true

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
