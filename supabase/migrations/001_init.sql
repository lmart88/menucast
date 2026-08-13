-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TVs table
CREATE TABLE tvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My TV',
  pairing_code TEXT UNIQUE NOT NULL,
  paired_at TIMESTAMPTZ,
  current_menu_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Menus (push history)
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_id UUID NOT NULL REFERENCES tvs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  pushed_at TIMESTAMPTZ DEFAULT now(),
  pushed_by UUID REFERENCES auth.users(id)
);

-- API tokens for Figma plugin auth
CREATE TABLE api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  name TEXT NOT NULL DEFAULT 'Figma Plugin',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE tvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their TVs"
  ON tvs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see their TV menus"
  ON menus FOR ALL
  USING (tv_id IN (SELECT id FROM tvs WHERE user_id = auth.uid()));

CREATE POLICY "Users own their tokens"
  ON api_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TV client can read its own pairing code (unauthenticated lookup by code)
-- Used for: TV client polls to know when it's been paired
CREATE POLICY "Pairing code public read"
  ON tvs FOR SELECT
  USING (true);

-- Storage bucket for menu images (create via Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('menus', 'menus', true);
