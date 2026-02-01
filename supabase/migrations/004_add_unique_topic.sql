-- ============================================================================
-- TAXFIX MIGRATION 004
-- Purpose: Add UNIQUE constraint to content_queue(topic) for automatic deduplication
-- Strategy: Database-level enforcement allows simpler n8n workflows
-- ============================================================================

-- Add UNIQUE constraint to 'topic'
-- This will fail if duplicates already exist, but for a fresh ingestion flow, it's ideal.
ALTER TABLE content_queue
ADD CONSTRAINT unique_topic UNIQUE (topic);
