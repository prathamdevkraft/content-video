FROM n8nio/n8n:latest-debian

USER root


# 0. Fix for Debian Buster EOL (Archive Repos)
# n8n:latest-debian uses Buster which is EOL, so we must point to archive.debian.org
RUN echo "deb http://archive.debian.org/debian buster main" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian buster-updates main" >> /etc/apt/sources.list && \
    apt-get -o Acquire::Check-Valid-Until=false update

# 1. Install System Dependencies (FFmpeg, Graphics Libraries)
RUN apt-get install -y --allow-unauthenticated \
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
# Note: Debian Buster uses older pip, so no need for break-system-packages
RUN pip3 install edge-tts tiktok-uploader

WORKDIR /data

# Switch back to node user? No, let the entrypoint handle it.
# The standard n8n entrypoint expects to run as root initially to fix permissions.
# USER node
