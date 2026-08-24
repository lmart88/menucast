-- Add last_seen_at timestamp to tvs table for live heartbeat telemetry
ALTER TABLE tvs 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Index for fast status checking
CREATE INDEX IF NOT EXISTS idx_tvs_last_seen_at ON tvs(last_seen_at);
