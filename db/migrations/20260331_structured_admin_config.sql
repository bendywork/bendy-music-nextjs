CREATE TABLE IF NOT EXISTS system_configurations (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  github_project_path TEXT NOT NULL,
  api_timeout_ms INTEGER NOT NULL DEFAULT 300000,
  max_concurrent_requests INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_configurations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'official',
  nature TEXT NOT NULL DEFAULT 'openSource',
  base_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled', 'maintenance')),
  remark TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_configurations_code
  ON provider_configurations (LOWER(code));

CREATE TABLE IF NOT EXISTS api_configurations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  path_type TEXT NOT NULL DEFAULT 'relative',
  method TEXT NOT NULL,
  request_type TEXT NOT NULL,
  provider_id TEXT REFERENCES provider_configurations(id) ON DELETE SET NULL,
  params TEXT NOT NULL DEFAULT '',
  headers TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled', 'maintenance')),
  remark TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_configurations_identity
  ON api_configurations (UPPER(method), path, request_type, COALESCE(provider_id, ''));
