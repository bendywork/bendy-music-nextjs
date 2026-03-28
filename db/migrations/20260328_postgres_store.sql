CREATE TABLE IF NOT EXISTS app_data_store (
  store_key TEXT PRIMARY KEY,
  store_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_data_store_updated_at
  ON app_data_store (updated_at DESC);
