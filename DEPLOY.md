# Deployment Guide

## Recommended: AWS EC2 / VM Deployment

Since you have an AWS VM, this is the **most robust** option. It gives you full control over the resources needed for video rendering.

### 1. Prerequisites (On AWS Console)
*   **Security Groups**: Ensure Inbound Rules open the following ports:
    *   `22` (SSH)
    *   `5678` (n8n)
    *   `8501` (Dashboard)
*   **OS**: Ubuntu 22.04 LTS (Recommended)

### 2. Setup Server
SSH into your VM and install Docker & Docker Compose:

```bash
# Update and install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3. Deploy Application
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/prathamdevkraft/content-video.git
    cd content-video
    ```

2.  **Configure Environment**:
    Create the `.env` file manually (since it was gitignored):
    ```bash
    nano .env
    ```
    *Paste your Supabase URL, Key, service_role secret, and OpenAI Key here.*

3.  **Start the Factory**:
    ```bash
    sudo docker compose up -d --build
    ```

### 4. Access
*   **n8n**: `http://<YOUR_VM_IP>:5678`
*   **Dashboard**: `http://<YOUR_VM_IP>:8501`

---

## Alternative: Railway (Managed)
See `railway.json` for configuration if you prefer a managed PaaS.

