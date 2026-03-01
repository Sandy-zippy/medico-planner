-- Add status tracking to generations for async AI pipeline
ALTER TABLE public.generations
  ADD COLUMN status text NOT NULL DEFAULT 'completed',
  ADD COLUMN error_message text;

-- Index for polling by project + status
CREATE INDEX idx_generations_status ON public.generations(project_id, status);

-- Allow service role to insert/update generations (for background pipeline)
CREATE POLICY "Service role can manage generations"
  ON public.generations FOR ALL
  USING (true)
  WITH CHECK (true);
