
CREATE TABLE IF NOT EXISTS public.app_state (
  id text PRIMARY KEY DEFAULT 'singleton',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_state"
  ON public.app_state FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert app_state"
  ON public.app_state FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update app_state"
  ON public.app_state FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
