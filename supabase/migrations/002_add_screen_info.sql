-- Add display metadata columns to tvs table
ALTER TABLE tvs
ADD COLUMN IF NOT EXISTS screen_width INT,
ADD COLUMN IF NOT EXISTS screen_height INT,
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT,
ADD COLUMN IF NOT EXISTS orientation TEXT;
