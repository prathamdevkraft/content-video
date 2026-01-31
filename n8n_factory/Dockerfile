FROM n8nio/n8n:latest

USER root

# 1. Install System Dependencies (FFmpeg, Graphics Libraries)
# Cairo/Pango are strictly required for Editly (node-canvas) to render text
RUN apk add --update --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    build-base \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    udev \
    ttf-freefont \
    git

# 2. Install "Editly" globally (The Open-Source Video Editor)
# We set unsafe-perm because we are running as root initially
RUN npm install -g editly --unsafe-perm=true

# 3. Install Python libraries for TTS and Social Uploads
# edge-tts: Free high-quality neural voice
# tiktok-uploader: Selenium-based uploader
# Note: tiktok-uploader determines browser requirements at runtime, may need chrome/firefox installed if not headless
RUN pip install edge-tts tiktok-uploader --break-system-packages

# 4. (Optional) Install Chrome if tiktok-uploader needs a browser
# RUN apk add chromium chromium-chromedriver

WORKDIR /data

USER node
