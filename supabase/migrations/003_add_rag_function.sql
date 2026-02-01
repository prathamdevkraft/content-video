-- ============================================================================
-- TAXFIX RAG ENABLEMENT - MIGRATION 003 (Function Only)
-- Purpose: Add the missing vector search function `match_tax_laws`
-- ============================================================================

-- 1. Create the Similarity Search Function (RPC)
-- This allows n8n to call "match_tax_laws" via the API
CREATE OR REPLACE FUNCTION match_tax_laws (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tax_laws.id,
    tax_laws.content,
    tax_laws.metadata,
    1 - (tax_laws.embedding <=> query_embedding) AS similarity
  FROM tax_laws
  WHERE 1 - (tax_laws.embedding <=> query_embedding) > match_threshold
  ORDER BY tax_laws.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 2. Insert Sample Data (Only if empty)
-- We insert text-only for now so you can see it in the table. 
-- Note: Search won't hit these unless you generate embeddings for them later, 
-- but this confirms the table is writable.
INSERT INTO tax_laws (content, metadata)
SELECT 'EstG § 4 Abs. 5 Nr. 6b: Expenses for a home office...', '{"source": "EStG", "topic": "Home Office"}'
WHERE NOT EXISTS (SELECT 1 FROM tax_laws LIMIT 1);
