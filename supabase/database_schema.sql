-- 1. Enable Vector Extension for RAG
create extension if not exists vector;

-- 2. Create the "Content Queue" table
-- This stores the metadata for every video being generated.
create table content_queue (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  platform text default 'TikTok', -- TikTok, Instagram, YouTube
  status text default 'PENDING_REVIEW', -- DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED
  script_text text,
  script_audio_url text,
  video_url text, -- Path to the rendered .mp4 in Supabase Storage
  citations text, -- The specific laws/facts used (Chain of Verification)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Create the "Audit Logs" table
-- Immutable log of who approved what. Critical for BaFin/FCA compliance.
create table audit_logs (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references content_queue(id),
  old_status text,
  new_status text,
  changed_by text, -- Could be 'AI_System' or a User ID
  note text, -- Rejection reasons or approval notes
  timestamp timestamptz default now()
);

-- 4. Create the "Prompt Library" table (Optional)
-- Stores versioned prompts to track performance over time.
create table prompt_library (
  id uuid default gen_random_uuid() primary key,
  prompt_name text, -- e.g., 'TikTok_MythBuster_DE'
  version int,
  prompt_text text,
  performance_score float, -- Updated by the Feedback Loop
  created_at timestamptz default now()
);

-- 5. Create a Storage Bucket for Videos
-- Note: You usually do this in the Supabase UI, but here is the logical step.
insert into storage.buckets (id, name, public) 
values ('rendered_videos', 'rendered_videos', true);

-- 6. Setup RAG Vector Store (Example Structure)
create table tax_laws (
  id bigserial primary key,
  content text, -- The raw text of the law (e.g., EStG § 3)
  metadata jsonb, -- { "source": "BMF", "url": "..." }
  embedding vector(1536) -- OpenAI embedding dimension
);
