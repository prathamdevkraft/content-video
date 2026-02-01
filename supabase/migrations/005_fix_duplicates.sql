-- ============================================================================
-- FIX DUPLICATES & APPLY CONSTRAINT
-- Purpose: Remove existing duplicate topics so we can enforce UNIQUE(topic)
-- ============================================================================

-- 1. DELETE DUPLICATES
-- Keep the LATEST record (ordered by created_at DESC) and delete older duplicates
DELETE FROM content_queue
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY topic 
                   ORDER BY created_at DESC
               ) as row_num
        FROM content_queue
    ) t
    WHERE t.row_num > 1
);

-- 2. APPLY CONSTRAINT
-- Now that duplicates are gone, this should succeed.
ALTER TABLE content_queue
ADD CONSTRAINT unique_topic UNIQUE (topic);

-- Verify
SELECT count(*) as remaining_rows FROM content_queue;
