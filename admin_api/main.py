from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import subprocess
from supabase import create_client, Client
import requests

# Add parent directory to path to import dashboard script if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI()

# Enable CORS for the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class TriggerRequest(BaseModel):
    workflow_id: str = "taxfix-production"

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Taxfix Admin API"}

@app.post("/seed-knowledge")
async def trigger_seed():
    """
    Triggers the python script to seed tax laws.
    """
    try:
        # We run the script as a subprocess to ensure clean environment execution
        # Assumes the script is at ../dashboard/seed_knowledge.py
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dashboard", "seed_knowledge.py")
        
        if not os.path.exists(script_path):
            raise HTTPException(status_code=404, detail=f"Script not found at {script_path}")

        result = subprocess.run(
            ["python3", script_path], 
            capture_output=True, 
            text=True,
            env={**os.environ} # Pass current env vars (API keys)
        )
        
        if result.returncode != 0:
            return {"status": "error", "output": result.stderr}
            
        return {"status": "success", "output": result.stdout}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/active-queue")
async def get_active_queue():
    """
    Fetches the latest 50 items from the content_queue.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")
        
    try:
        response = supabase.table("content_queue") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trigger-n8n")
async def trigger_n8n(request: TriggerRequest):
    """
    Triggers the n8n Workflow via Webhook.
    """
    # URL of the n8n container in the docker network
    # We call the 'production' webhook (without /test/)
    N8N_WEBHOOK_URL = "http://taxfix-n8n-factory:5678/webhook/trigger"
    
    try:
        # Fire and forget (or wait for ack)
        # We send an empty JSON payload just to trigger it
        response = requests.post(N8N_WEBHOOK_URL, json={"trigger": "admin-ui"})
        
        if response.status_code >= 400:
             return {"status": "error", "detail": f"N8N responded with {response.status_code}: {response.text}"}
             
        return {"status": "success", "n8n_response": response.json() if response.content else "Triggered"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to call n8n: {str(e)}")
