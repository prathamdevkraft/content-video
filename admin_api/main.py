from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import subprocess

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
