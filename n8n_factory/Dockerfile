FROM n8nio/n8n:latest-debian

USER root

# 1. Install System Dependencies (FFmpeg, Graphics Libraries)
# n8n:latest is Debian-based, so we use apt-get instead of apk.
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    udev \
    git \
    && rm -rf /var/lib/apt/lists/*

# 2. Install "Editly" globally (The Open-Source Video Editor)
RUN npm install -g editly --unsafe-perm=true

# 3. Install Python libraries for TTS and Social Uploads
# Note: Using --break-system-packages because Debian Bookworm manages python externally
RUN pip install edge-tts tiktok-uploader --break-system-packages

WORKDIR /data

USER node
