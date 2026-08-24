-- Screen Groups table
CREATE TABLE screen_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TV to Group Memberships (join table)
CREATE TABLE tv_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES screen_groups(id) ON DELETE CASCADE,
  tv_id UUID NOT NULL REFERENCES tvs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, tv_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_screen_groups_user_id ON screen_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_group_memberships_group_id ON tv_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_tv_group_memberships_tv_id ON tv_group_memberships(tv_id);

-- Enable RLS
ALTER TABLE screen_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_group_memberships ENABLE ROW LEVEL SECURITY;

-- Screen Groups RLS Policies
CREATE POLICY "Users own their screen groups"
  ON screen_groups FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TV Group Memberships RLS Policies
CREATE POLICY "Users manage memberships of owned groups"
  ON tv_group_memberships FOR ALL
  USING (
    group_id IN (SELECT id FROM screen_groups WHERE user_id = auth.uid())
  )
  WITH CHECK (
    group_id IN (SELECT id FROM screen_groups WHERE user_id = auth.uid())
  );
