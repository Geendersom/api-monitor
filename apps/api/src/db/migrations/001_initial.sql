CREATE TABLE IF NOT EXISTS monitors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_results (
  id UUID PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('up', 'down')),
  status_code INTEGER,
  response_time_ms INTEGER NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_check_results_monitor_id
  ON check_results (monitor_id);

CREATE INDEX IF NOT EXISTS idx_check_results_checked_at
  ON check_results (checked_at);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  duration_ms INTEGER,
  reason TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incidents_monitor_id ON incidents (monitor_id);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);

CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('incident_opened', 'incident_resolved')),
  created_at TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_events_monitor_id
  ON alert_events (monitor_id);

CREATE INDEX IF NOT EXISTS idx_alert_events_created_at
  ON alert_events (created_at);
