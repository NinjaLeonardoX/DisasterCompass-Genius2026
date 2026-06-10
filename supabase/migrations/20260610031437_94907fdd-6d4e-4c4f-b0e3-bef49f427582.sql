
CREATE TABLE public.saved_addresses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  display_name TEXT,
  city TEXT,
  county TEXT,
  state TEXT,
  state_code TEXT,
  country TEXT,
  country_code TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_addresses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_addresses TO authenticated;
GRANT ALL ON public.saved_addresses TO service_role;

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.saved_addresses FOR SELECT USING (true);
CREATE POLICY "Public insert" ON public.saved_addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON public.saved_addresses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.saved_addresses FOR DELETE USING (true);
