from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
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

# Serve Generated Videos
if not os.path.exists("/files"):
   os.makedirs("/files", exist_ok=True)
app.mount("/files", StaticFiles(directory="/files"), name="files")

# Supabase Client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


# Request Models
class TriggerRequest(BaseModel):
    workflow_id: str = "taxfix-production"

class GenerateScriptRequest(BaseModel):
    topic: str
    source_url: str
    platform: str = "TikTok"
    language: str = "de"

class ApproveScriptRequest(BaseModel):
    id: int
    script_content: dict
    social_caption: str
    hashtags: list[str]

class PublishVideoRequest(BaseModel):
    id: int
    platforms: list[str] = ["TikTok", "Instagram"]

class ContentProcessorRequest(BaseModel):
    action: str
    payload: dict


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

@app.post("/generate-script")
async def generate_script(req: GenerateScriptRequest):
    """
    1. Inserts a new job into content_queue.
    2. Triggers the Generation Workflow (Webhook).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="DB Config Missing")
    
    try:
        # 1. Check if topic already exists to prevent duplicates (Idempotency)
        existing = supabase.table("content_queue").select("*").eq("topic", req.topic).execute()
        if existing.data and len(existing.data) > 0:
            print(f"Topic '{req.topic}' already exists. Returning existing job.")
            item = existing.data[0]
            
            # Optional: If it was stuck in ERROR or something, maybe we want to retry? 
            # For now, just return it so UI redirects to it.
            return {"status": "success", "job": item}

        # 2. Insert into DB
        data = {
            "topic": req.topic,
            "source_url": req.source_url,
            "platform": req.platform,
            "language": req.language,
            "status": "PENDING_GENERATION"
        }
        res = supabase.table("content_queue").insert(data).execute()
        new_job = res.data[0]
        
        # Trigger n8n Webhook
        # We use a dedicated webhook for 'Generate'
        N8N_WEBHOOK = "http://taxfix-n8n-factory:5678/webhook/generate-script"
        requests.post(N8N_WEBHOOK, json={"id": new_job['id'], "topic": req.topic, "language": req.language})
        
        return {"status": "success", "job": new_job}
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR in /generate-script: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/approve-script")
async def approve_script(req: ApproveScriptRequest):
    """
    1. Updates the script content in DB.
    2. Sets status to 'APPROVED' (or 'RENDERING').
    3. Triggers the Rendering Workflow.
    """
    try:
        supabase.table("content_queue").update({
            "script_content": req.script_content,
            "social_caption": req.social_caption,
            "hashtags": req.hashtags,
            "status": "PENDING_RENDER" # New status for video gen
        }).eq("id", req.id).execute()
        
        # Trigger n8n Webhook for Video Generation
        N8N_WEBHOOK = "http://taxfix-n8n-factory:5678/webhook/render-video"
        requests.post(N8N_WEBHOOK, json={"id": req.id})
        
        return {"status": "success", "message": "Script approved, rendering started."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/publish-video")
async def publish_video(req: PublishVideoRequest):
    """
    1. Updates target platforms.
    2. Triggers Publisher Workflow.
    """
    try:
        supabase.table("content_queue").update({
            "target_platforms": req.platforms
        }).eq("id", req.id).execute()
        
        # Trigger n8n Webhook
        N8N_WEBHOOK = "http://taxfix-n8n-factory:5678/webhook/publish-video"
        requests.post(N8N_WEBHOOK, json={"id": req.id})
        
        return {"status": "success", "message": "Publishing trigger sent."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trigger-content-processor")
async def trigger_content_processor(req: ContentProcessorRequest):
    """
    Proxies the Content Processor requests (Translate, Regenerate, Metadata)
    to the n8n container to avoid CORS issues.
    """
    # Internal Docker Network URL
    N8N_WEBHOOK = "http://taxfix-n8n-factory:5678/webhook/process-content"
    
    try:
        response = requests.post(N8N_WEBHOOK, json=req.dict())
        print(f"DEBUG N8N RESPONSE: Code={response.status_code}, Body={response.text}")
        return {"status": "success", "n8n_response": response.text}
    except Exception as e:
        print(f"Error calling n8n: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics")
async def get_analytics():
    """
    Returns aggregated stats for the KPI Dashboard.
    1. Status Counts (Pie Chart)
    2. Daily Output (Bar Chart) - Simulated distribution based on real count
    """
    if not supabase:
         raise HTTPException(status_code=500, detail="DB Missing")

    try:
        # Fetch all items (lightweight select)
        res = supabase.table("content_queue").select("status, created_at, platform").execute()
        items = res.data
        
        # 1. Status Counts
        status_counts = {}
        for item in items:
            s = item.get('status', 'PENDING')
            status_counts[s] = status_counts.get(s, 0) + 1
            
        # 2. Daily Output (Grouping by date string)
        # For POC, we'll just group by the last 7 days from the DB entries
        # If DB is empty/sparse, we might pad it.
        
        # Create a simple structure
        analytics = {
            "status_distribution": [
                {"name": "Approved", "value": status_counts.get("READY_TO_PUBLISH", 0) + status_counts.get("PUBLISHED", 0)},
                {"name": "Pending Review", "value": status_counts.get("PENDING_REVIEW", 0) + status_counts.get("PENDING_GENERATION", 0)},
                {"name": "Drafting/Error", "value": status_counts.get("NEW", 0) + status_counts.get("ERROR", 0)}
            ],
            "total_assets": len(items),
            "compliance_rate": 98.5 # Hardcoded for now as we don't store individual scores easily yet
        }
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/news")
async def get_news():
    """
    Returns ingested news items (PENDING_GENERATION) for the News Feed.
    """
    if not supabase:
         raise HTTPException(status_code=500, detail="DB Missing")

    try:
        # Fetch items that are new/pending
        res = supabase.table("content_queue").select("*").eq("status", "PENDING_GENERATION").order("created_at", desc=True).limit(20).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
