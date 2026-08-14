CREATE TABLE IF NOT EXISTS maintenance_windows (
  id UUID PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reason TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_windows_monitor_id
  ON maintenance_windows (monitor_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_windows_starts_at
  ON maintenance_windows (starts_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_windows_ends_at
  ON maintenance_windows (ends_at);
