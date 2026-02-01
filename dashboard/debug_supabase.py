
import os
from supabase import create_client
import sys

print(f"Python version: {sys.version}")
try:
    import supabase
    print(f"Supabase version: {supabase.__version__ if hasattr(supabase, '__version__') else 'unknown'}")
except:
    pass

url = os.environ.get("SUPABASE_URL", "https://example.supabase.co")
key = os.environ.get("SUPABASE_KEY", "some-key")

print("Attempting to create client...")
try:
    client = create_client(url, key)
    print("Success!")
except TypeError as e:
    print(f"Caught expected error: {e}")
except Exception as e:
    print(f"Caught unexpected error: {e}")
