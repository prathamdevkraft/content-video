-- ============================================================================
-- TAXFIX CONTENT FACTORY v3.1 - BLOG SUPPORT
-- Purpose: Add storage for Blog Post content alongside Video Scripts
-- ============================================================================

ALTER TABLE content_queue
  -- ===== Blog Content =====
  ADD COLUMN IF NOT EXISTS blog_content JSONB,
  -- Format: { "title": "...", "body": "...", "tags": ["..."], "type": "article" }
  
  -- ===== Content Types Tracker =====
  ADD COLUMN IF NOT EXISTS generated_content_types JSONB DEFAULT '[]'::jsonb;
  -- Example: ["video", "linkedin_article"]

-- Comments for Documentation
COMMENT ON COLUMN content_queue.blog_content IS 
  'Structured content for text-based posts (LinkedIn/Blog)';

COMMENT ON COLUMN content_queue.generated_content_types IS 
  'List of content types that have been generated for this topic';
