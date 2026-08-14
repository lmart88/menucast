-- Add menu_mode and menu_data columns to tvs and menus tables
ALTER TABLE tvs
ADD COLUMN IF NOT EXISTS menu_mode TEXT DEFAULT 'static',
ADD COLUMN IF NOT EXISTS menu_data JSONB DEFAULT NULL;

ALTER TABLE menus
ADD COLUMN IF NOT EXISTS menu_mode TEXT DEFAULT 'static',
ADD COLUMN IF NOT EXISTS menu_data JSONB DEFAULT NULL;
