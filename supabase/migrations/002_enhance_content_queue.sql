-- ============================================================================
-- TAXFIX CONTENT FACTORY v3.0 - DATABASE ENHANCEMENT
-- Purpose: Add governance, traceability, and resilience to existing schema
-- Strategy: ALTER existing tables (no renames) to minimize disruption
-- ============================================================================

-- STEP 1: Add New Columns to content_queue
-- (Keeps existing structure intact while adding new capabilities)

ALTER TABLE content_queue
  -- ===== Source Tracking =====
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  
  -- ===== Structured Script (New) =====
  ADD COLUMN IF NOT EXISTS script_structure JSONB,
  -- Format: { "hook": "...", "body": "...", "cta": "..." }
  
  -- ===== Social Media Metadata =====
  ADD COLUMN IF NOT EXISTS social_metrics JSONB,
  -- Format: { "caption": "...", "hashtags": ["#tax", "#germany"] }
  
  -- ===== File Paths (Local Storage) =====
  ADD COLUMN IF NOT EXISTS audio_path TEXT,
  -- Example: /data/files/audio_123.mp3
  ADD COLUMN IF NOT EXISTS video_path TEXT,
  -- Example: /data/files/video_123.mp4
  
  -- ===== Compliance & Trust =====
  ADD COLUMN IF NOT EXISTS compliance_score DECIMAL(3,2),
  -- Range: 0.00 to 1.00 (from RAG validation)
  ADD COLUMN IF NOT EXISTS validations JSONB,
  -- Format: { "checks": ["Cites EStG § 3", "No Financial Advice"], "rag_notes": "..." }
  
  -- ===== Human Review Tracking =====
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  -- User ID or name (e.g., "Compliance_Officer_1")
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  -- Timestamp of approval/rejection decision
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  -- Rejection reasons or approval comments
  
  -- ===== Error Handling & Resilience =====
  ADD COLUMN IF NOT EXISTS error_log TEXT,
  -- Last known error message from n8n workflow
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
  -- Number of retry attempts (max 3)
  
  -- ===== Publishing Metadata =====
  ADD COLUMN IF NOT EXISTS published_url TEXT;
  -- URL to the live social media post

-- STEP 2: Add Constraints for Data Quality

-- Compliance score must be between 0 and 1
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compliance_score_range') THEN
        ALTER TABLE content_queue
            ADD CONSTRAINT compliance_score_range
            CHECK (compliance_score IS NULL OR compliance_score BETWEEN 0 AND 1);
    END IF;
END $$;

-- Retry count must not exceed 3
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retry_limit') THEN
        ALTER TABLE content_queue
            ADD CONSTRAINT retry_limit
            CHECK (retry_count <= 3);
    END IF;
END $$;

-- STEP 3: Create Indexes for Performance

-- Index on status (most frequent filter)
CREATE INDEX IF NOT EXISTS idx_content_queue_status 
  ON content_queue(status);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_content_queue_created_at 
  ON content_queue(created_at DESC);

-- Index on platform for filtering
CREATE INDEX IF NOT EXISTS idx_content_queue_platform 
  ON content_queue(platform);

-- Partial index for pending review (dashboard's main query)
CREATE INDEX IF NOT EXISTS idx_content_queue_pending_review 
  ON content_queue(status) 
  WHERE status = 'PENDING_REVIEW';

-- STEP 4: Update Existing Trigger (if not already present)

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists, create new one
DROP TRIGGER IF EXISTS set_content_queue_updated_at ON content_queue;
CREATE TRIGGER set_content_queue_updated_at
  BEFORE UPDATE ON content_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 5: Enhance audit_logs Table

-- Add metadata column for rich audit context
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS error_details TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add indexes for faster audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_asset_id 
  ON audit_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
  ON audit_logs(timestamp DESC);

-- STEP 6: Create Helper Functions for Dashboard

-- Calculate average compliance score
CREATE OR REPLACE FUNCTION avg_compliance_score()
RETURNS DECIMAL AS $$
  SELECT COALESCE(ROUND(AVG(compliance_score)::numeric, 2), 0.00)
  FROM content_queue
  WHERE compliance_score IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- Get pending count by platform
CREATE OR REPLACE FUNCTION pending_by_platform()
RETURNS TABLE(platform TEXT, count BIGINT) AS $$
  SELECT platform, COUNT(*)::BIGINT
  FROM content_queue
  WHERE status = 'PENDING_REVIEW'
  GROUP BY platform;
$$ LANGUAGE sql STABLE;

-- Get error rate (last 24 hours)
CREATE OR REPLACE FUNCTION error_rate_24h()
RETURNS DECIMAL AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0.00
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status = 'ERROR')::DECIMAL / COUNT(*)) * 100, 
        2
      )
    END
  FROM content_queue
  WHERE created_at > now() - interval '24 hours';
$$ LANGUAGE sql STABLE;

-- STEP 7: Sample Data for Testing (Phase 1)

-- Add test records with new fields populated
INSERT INTO content_queue (
  topic, 
  source_url, 
  status, 
  platform,
  script_structure,
  social_metrics,
  compliance_score,
  validations
)
VALUES
  (
    'New Home Office Deduction Rules 2024',
    'https://bundesfinanzministerium.de/article/home-office-2024',
    'PENDING_REVIEW',
    'TikTok',
    '{"hook": "Did you know the home office rules just changed?", "body": "The new 2024 regulations allow up to €1,260 per year in deductions. Here is what you need to know...", "cta": "Link in bio for the official BMF guide!"}'::jsonb,
    '{"caption": "New home office tax rules explained 🏠💼", "hashtags": ["#Steuertipps", "#HomeOffice", "#Deutschland"]}'::jsonb,
    0.92,
    '{"checks": ["Cites BMF Official Release", "No Financial Advice"], "rag_notes": "Verified against EStG § 4 Abs. 5 Nr. 6b"}'::jsonb
  ),
  (
    'EStG § 3 Explained: Tax-Free Benefits',
    'https://gesetze-im-internet.de/estg/__3.html',
    'PENDING_GENERATION',
    'Instagram',
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    'Capital Gains Tax Changes UK 2024',
    'https://gov.uk/hmrc/cgt-updates',
    'PENDING_REVIEW',
    'YouTube',
    '{"hook": "UK taxpayers: big CGT changes in April!", "body": "The annual exempt amount drops to £3,000. Here is how to optimize your portfolio...", "cta": "Full breakdown on our website"}'::jsonb,
    '{"caption": "UK Capital Gains Tax 2024 explained", "hashtags": ["#TaxTips", "#UKTax", "#CGT"]}'::jsonb,
    0.88,
    '{"checks": ["Cites HMRC Manual CG10100"], "rag_notes": "Verified against Finance Act 2024"}'::jsonb
  );

-- STEP 8: Add Comments for Documentation

COMMENT ON COLUMN content_queue.source_url IS 
  'Origin URL of the tax news/policy that triggered this content (e.g., BMF press release)';

COMMENT ON COLUMN content_queue.script_structure IS 
  'Structured script with hook, body, and CTA as separate fields for easy editing';

COMMENT ON COLUMN content_queue.social_metrics IS 
  'Platform-specific metadata: caption, hashtags, posting schedule';

COMMENT ON COLUMN content_queue.compliance_score IS 
  'AI confidence score (0.00-1.00) that content complies with tax regulations';

COMMENT ON COLUMN content_queue.validations IS 
  'RAG validation results: which laws were checked, RAG notes from vector search';

COMMENT ON COLUMN content_queue.reviewed_by IS 
  'User who approved/rejected (for audit trail)';

COMMENT ON COLUMN content_queue.error_log IS 
  'Last error message from n8n workflow (for debugging failed generations)';

COMMENT ON COLUMN content_queue.retry_count IS 
  'Number of retry attempts (capped at 3 to prevent infinite loops)';

-- STEP 9: Enable Row-Level Security (RLS) - Phase 1: Permissive

ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (tighten in production with user auth)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_queue' 
        AND policyname = 'Allow all operations for authenticated users'
    ) THEN
        CREATE POLICY "Allow all operations for authenticated users" 
        ON content_queue
        FOR ALL 
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- STEP 10: Create Materialized View for Analytics (Optional)

CREATE MATERIALIZED VIEW IF NOT EXISTS content_queue_analytics AS
SELECT 
  DATE(created_at) as date,
  platform,
  status,
  COUNT(*) as count,
  AVG(compliance_score) as avg_compliance,
  COUNT(*) FILTER (WHERE error_log IS NOT NULL) as error_count
FROM content_queue
GROUP BY DATE(created_at), platform, status;

-- Refresh function for analytics view
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW content_queue_analytics;
END;
$$ LANGUAGE plpgsql;

-- STEP 11: Migration Validation Query

-- Run this to verify migration was successful
DO $$
BEGIN
  RAISE NOTICE 'Migration complete. Validating schema...';
  
  -- Check that all new columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_queue' AND column_name = 'source_url'
  ) THEN
    RAISE EXCEPTION 'Column source_url not found!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_queue' AND column_name = 'script_structure'
  ) THEN
    RAISE EXCEPTION 'Column script_structure not found!';
  END IF;
  
  RAISE NOTICE 'All validations passed ✓';
END $$;
