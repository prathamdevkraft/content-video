import os
import sys
from supabase import create_client

# Mock Env Vars (User provided via earlier context or I can rely on system env if set, but I'll paste the Anon key found earlier)
url = os.environ.get("SUPABASE_URL", "http://13.200.99.186:8000")
key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxY3NkZ2hzYmdpdndwdWxmemZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDg1MTMsImV4cCI6MjA4NTQyNDUxM30.ii2lhONt2WBKZ592fMnmoRri8EJJ2JdY8ao_XseB00Q")

supabase = create_client(url, key)

# The failing payload (mimicking n8n Input)
# "Add to Queue" maps "compliance_score" <- confidence
# "review_notes" <- reasoning
# Missing source_url
data = {
    "topic": "DEBUG: Test Insert 123", # Unique topic
    "platform": "LinkedIn",
    "compliance_score": 0.7, 
    "review_notes": "The article discusses...",
    "status": "PENDING_REVIEW",
    "source_url": None  # n8n sends null if missing?
}

print(f"Attempting insert to {url} with key ...")
print(f"Payload: {data}")

try:
    res = supabase.table("content_queue").insert(data).execute()
    print("SUCCESS!")
    print(res.data)
except Exception as e:
    print("FAILED!")
    # Print rich details
    print(type(e))
    print(e)
    # Check if attributes exist
    if hasattr(e, 'code'): print(f"Code: {e.code}")
    if hasattr(e, 'details'): print(f"Details: {e.details}")
    if hasattr(e, 'message'): print(f"Message: {e.message}")
