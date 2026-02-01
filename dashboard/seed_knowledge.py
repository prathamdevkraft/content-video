import os
import json
from openai import OpenAI
from supabase import create_client, Client

# Initialize Clients
# Uses local environment variables (assumes .env is loaded or vars are set)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY]):
    print("❌ Error: Missing Environment Variables (SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY)")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# ---------------------------------------------------------
# german_tax_laws_seed.json
# A small, high-quality set of "Ground Truth" laws for RAG
# ---------------------------------------------------------
TAX_LAWS = [
    {
        "content": "Home Office Pauschale 2024: Taxpayers can deduct €6 per day for up to 210 days working from home. Maximum deduction is €1,260 per year. (Source: EStG § 4 Abs. 5 Nr. 6b)",
        "metadata": {"section": "EStG § 4", "topic": "Home Office", "year": 2024}
    },
    {
        "content": "Werbungskostenpauschale 2024 (Employee Standard Deduction): The standard deduction for employee-related expenses is €1,230 per year. No proof of receipts needed up to this amount. (Source: EStG § 9a)",
        "metadata": {"section": "EStG § 9a", "topic": "Werbungskosten", "year": 2024}
    },
    {
        "content": "Commuter Allowance (Entfernungspauschale): €0.30 per km for first 20km, €0.38 per km from 21st km onwards (one way only). Apply to days actually traveled to work. (Source: EStG § 9)",
        "metadata": {"section": "EStG § 9", "topic": "Commuting", "year": 2024}
    },
    {
        "content": "Capital Gains Tax (Kapitalertragssteuer): Standard rate is 25% plus Solidaritätszuschlag and Church Tax. Saver's Allowance (Sparerpauschbetrag) is €1,000 for singles, €2,000 for couples. (Source: EStG § EStG § 32d)",
        "metadata": {"section": "EStG § 32d", "topic": "Capital Gains", "year": 2024}
    },
    {
        "content": "Internet Pauschale: If internet is used for work usage (mixed use), flat 20% of bill is often accepted without detailed logging, up to €20/month. (Guidance: LStR 2023)",
        "metadata": {"section": "LStR", "topic": "Internet", "year": 2023}
    }
]

def generate_embedding(text):
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def seed_db():
    print(f"📚 Seeding Knowledge Base with {len(TAX_LAWS)} laws...")
    
    # 1. Clear existing (Optional - for clean state)
    # supabase.table("tax_laws").delete().neq("id", 0).execute() 
    
    for law in TAX_LAWS:
        print(f"   🔹 Processing: {law['metadata']['topic']}...")
        embedding = generate_embedding(law['content'])
        
        data = {
            "content": law['content'],
            "metadata": law['metadata'],
            "embedding": embedding
        }
        
        # Insert into Supabase
        supabase.table("tax_laws").insert(data).execute()
        
    print("✅ Seed Complete! Knowledge Base is now active.")

if __name__ == "__main__":
    seed_db()
