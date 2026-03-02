-- Add status tracking to generations for async AI pipeline
ALTER TABLE public.generations
  ADD COLUMN status text NOT NULL DEFAULT 'completed',
  ADD COLUMN error_message text;

-- Index for polling by project + status
CREATE INDEX idx_generations_status ON public.generations(project_id, status);

-- Service role bypasses RLS by default — no permissive policy needed.
-- Row-level access is enforced by the authenticated user's policies on the generations table.
