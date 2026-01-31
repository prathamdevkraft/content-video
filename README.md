# Taxfix Generative Content System (MVP)

This repository contains the infrastructure code for the Taxfix Generative Content System MVP.

## Directory Structure
*   `n8n_factory/`: Custom Docker build for n8n + Editly + Edge-TTS.
*   `dashboard/`: Streamlit Compliance Dashboard (Python).
*   `docker-compose.yml`: Orchestration file.
*   `docs/`: Research, Planning, and RFP Response documents.

## Prerequisites
1.  **Docker & Docker Compose** installed.
2.  **Supabase Account** (Free Tier):
    *   Create a project.
    *   Get `SUPABASE_URL` and `SUPABASE_KEY`.
    *   Run the SQL scripts provided in `docs/research_and_plan.md` (Audit Logs & Content Queue).

## Setup & Run
1.  **Environment Variables:**
    Create a `.env` file in this directory:
    ```bash
    SUPABASE_URL=your_url
    SUPABASE_KEY=your_key
    ```

2.  **Build & Start:**
    ```bash
    docker-compose up -d --build
    ```

3.  **Access Services:**
    *   **n8n:** `http://localhost:5678`
    *   **Dashboard:** `http://localhost:8501`

## Next Steps (Inside n8n)
1.  Import the workflow templates from the `workflows` directory (if downloaded) or n8n library.
2.  Configure your OpenAI credentials in n8n.
3.  Test the "Generate Video" flow and watch it appear in the Dashboard!
