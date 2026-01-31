# Deployment Guide (Free/Demo Stacks)

For a demo, **Railway** is the best option because it handles the Custom Docker Image (n8n + Editly) better than Vercel or Render's strict free tiers.

## Option 1: Railway (Recommended for Backend)

1.  **Push to GitHub**:
    *   Create a new repo on GitHub.
    *   Push this entire `taxfix` folder to it.

2.  **Deploy on Railway**:
    *   Go to [Railway.app](https://railway.app/).
    *   Click "New Project" -> "Deploy from GitHub repo".
    *   Select your `taxfix` repo.

3.  **Configure Variables**:
    *   Railway will detect the Dockerfile.
    *   Go to "Variables" and paste the contents of your `.env` file (Supabase Keys, OpenAI Key).

4.  **Resource Warning**:
    *   Video rendering (Editly) is memory intensive.
    *   Railway's Trial Plan gives $5 credit. This is enough for the demo, but if the container crashes during render, you may need to upgrade to the Developer plan ($5/mo) to get more RAM.

## Option 2: Frontend (Dashboard) on Streamlit Cloud

1.  Go to [share.streamlit.io](https://share.streamlit.io/).
2.  Connect your GitHub Account.
3.  Select the `taxfix` repo.
4.  Main file path: `dashboard/dashboard.py`.
5.  **Advanced Settings** -> **Secrets**:
    *   Paste your `.toml` format secrets:
    ```toml
    SUPABASE_URL = "your_url"
    SUPABASE_KEY = "your_key"
    ```
6.  Click **Deploy**. This is 100% Free forever.

## Why not Vercel?
Vercel is for "Serverless" functions. Our `n8n` factory is a long-running server process (it needs to stay alive to listen for webhooks and render large video files). Vercel would time out after 10 seconds.
