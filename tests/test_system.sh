#!/bin/bash

echo "================================"
echo "TAXFIX SYSTEM VERIFICATION TESTS"
echo "================================"

# Test 1: Database Migration
echo ""
echo "[TEST 1] Database Schema Validation"
docker exec taxfix-compliance-dashboard python3 -c "
from supabase import create_client
import os

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

# Check for new columns
try:
    result = supabase.table('content_queue').select('source_url, script_structure, compliance_score').limit(1).execute()
    if result.data is not None:
        print('✅ New columns exist')
    else:
        print('❌ Migration failed (Data None)')
except Exception as e:
    print(f'❌ Database test failed: {e}')
" || echo "❌ Database test failed (Exec Error)"

# Test 2: Volume Mount
echo ""
echo "[TEST 2] Volume Mount Validation"
# Create file in n8n (using taxfix-n8n-factory container name from docker-compose)
docker exec taxfix-n8n-factory touch /data/files/test_file.txt
# Check file in Dashboard (using taxfix-compliance-dashboard container name)
docker exec taxfix-compliance-dashboard ls /data/files/test_file.txt && echo "✅ Volume mount working" || echo "❌ Volume mount failed"
# Cleanup
docker exec taxfix-n8n-factory rm /data/files/test_file.txt

# Test 3: Dashboard Health
echo ""
echo "[TEST 3] Dashboard Health Check"
curl -f http://localhost:8501/_stcore/health && echo "✅ Dashboard healthy" || echo "❌ Dashboard not responding"

# Test 4: n8n Health
echo ""
echo "[TEST 4] n8n Health Check"
curl -f http://localhost:5678/healthz && echo "✅ n8n healthy" || echo "❌ n8n not responding"

echo ""
echo "================================"
echo "Tests Complete"
echo "================================"
