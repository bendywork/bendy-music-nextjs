import type { PoolClient } from 'pg';
import {
  BUILTIN_API_ITEMS,
  BUILTIN_PROVIDER_ITEMS,
  DEFAULT_SYSTEM_CONFIG_PAYLOAD,
  normalizeApiItem,
  normalizeManagedStatus,
  normalizeProviderItem,
  normalizeSystemConfigPayload,
  type ApiItem,
  type ProviderItem,
  type SystemConfigPayload,
} from '@/lib/admin-config';
import { getPostgresPool } from '@/lib/db';
import { STORE_KEYS, getStoredValue, readJsonFile } from '@/lib/server/data-store';

const SYSTEM_TABLE_NAME = 'system_configurations';
const PROVIDER_TABLE_NAME = 'provider_configurations';
const API_TABLE_NAME = 'api_configurations';

type LegacyProviderShape = {
  providers?: Array<Partial<ProviderItem> & { url?: string }>;
};

type LegacyApiShape = {
  apis?: Array<Partial<ApiItem>>;
};

let bootstrapPromise: Promise<void> | null = null;

const MANAGED_PUBLIC_REQUEST_TYPES = new Set(BUILTIN_API_ITEMS.map((item) => item.requestType));

const tryReadLegacyStoredValue = async <T>(key: string, filePath: string, fallback: T): Promise<T> => {
  try {
    return await getStoredValue<T>(key, () => readJsonFile(filePath, fallback));
  } catch (error) {
    console.warn(`Failed to read legacy store key "${key}", fallback to ${filePath}:`, error);
    return readJsonFile(filePath, fallback);
  }
};

const parseRoutePath = (
  rawPath?: string,
): {
  pathname: string;
  requestType: string;
  source: string;
} => {
  const trimmedPath = rawPath?.trim();
  if (!trimmedPath) {
    return {
      pathname: '/api',
      requestType: '',
      source: '',
    };
  }

  try {
    const parsed = new URL(trimmedPath, 'https://ddmusic.local');
    return {
      pathname: parsed.pathname || trimmedPath,
      requestType: parsed.searchParams.get('type')?.trim() || '',
      source: parsed.searchParams.get('source')?.trim() || '',
    };
  } catch {
    return {
      pathname: trimmedPath,
      requestType: '',
      source: '',
    };
  }
};

const getProviderByLookupValue = (providers: ProviderItem[], value?: string): ProviderItem | undefined => {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) {
    return undefined;
  }

  return providers.find((provider) => {
    const normalizedId = provider.id.trim().toLowerCase();
    const normalizedCode = provider.code.trim().toLowerCase();
    const normalizedName = provider.name.trim().toLowerCase();
    return normalizedId === normalizedValue || normalizedCode === normalizedValue || normalizedName === normalizedValue;
  });
};

const mergeProviders = (legacyProviders: ProviderItem[]): ProviderItem[] => {
  const merged = new Map<string, ProviderItem>();
  const providerIdByCode = new Map<string, string>();

  for (const provider of BUILTIN_PROVIDER_ITEMS) {
    merged.set(provider.id, provider);
    providerIdByCode.set(provider.code.trim().toLowerCase(), provider.id);
  }

  for (const legacyProvider of legacyProviders) {
    const normalizedProvider = normalizeProviderItem(legacyProvider);
    const codeKey = normalizedProvider.code.trim().toLowerCase();
    const existingId = providerIdByCode.get(codeKey) ?? normalizedProvider.id;
    const existingProvider = merged.get(existingId);

    if (existingProvider) {
      merged.set(existingId, {
        ...existingProvider,
        ...normalizedProvider,
        id: existingProvider.id,
        code: existingProvider.code || normalizedProvider.code,
        name: normalizedProvider.name || existingProvider.name,
        baseUrl: normalizedProvider.baseUrl || existingProvider.baseUrl,
        remark: normalizedProvider.remark || existingProvider.remark,
      });
      continue;
    }

    merged.set(normalizedProvider.id, normalizedProvider);
    if (codeKey) {
      providerIdByCode.set(codeKey, normalizedProvider.id);
    }
  }

  return Array.from(merged.values());
};

const mergeApis = (legacyApis: Array<Partial<ApiItem>>, providers: ProviderItem[]): ApiItem[] => {
  const providerIdByCode = new Map(
    providers
      .filter((provider) => provider.code.trim().length > 0)
      .map((provider) => [provider.code.trim().toLowerCase(), provider.id]),
  );

  const merged = new Map<string, ApiItem>();
  const toKey = (api: ApiItem): string => [
    api.method.trim().toUpperCase(),
    api.path.trim(),
    api.requestType.trim().toLowerCase(),
    api.provider.trim(),
  ].join('|');

  for (const builtinApi of BUILTIN_API_ITEMS) {
    merged.set(toKey(builtinApi), builtinApi);
  }

  for (const legacyApi of legacyApis) {
    const routeInfo = parseRoutePath(legacyApi.path);
    const normalizedProvider = getProviderByLookupValue(providers, legacyApi.provider)
      ?? getProviderByLookupValue(providers, routeInfo.source)
      ?? (routeInfo.source ? { id: providerIdByCode.get(routeInfo.source.trim().toLowerCase()) || '' } : undefined);

    const normalizedApi = normalizeApiItem({
      ...legacyApi,
      path: routeInfo.pathname || legacyApi.path,
      requestType: legacyApi.requestType?.trim() || routeInfo.requestType || 'custom',
      provider: normalizedProvider?.id || legacyApi.provider || '',
    });

    merged.set(toKey(normalizedApi), normalizedApi);
  }

  return Array.from(merged.values());
};

const ensureStructuredTables = async (): Promise<void> => {
  await getPostgresPool().query(`
    CREATE TABLE IF NOT EXISTS ${SYSTEM_TABLE_NAME} (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      github_project_path TEXT NOT NULL,
      api_timeout_ms INTEGER NOT NULL DEFAULT 300000,
      max_concurrent_requests INTEGER NOT NULL DEFAULT 100,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${PROVIDER_TABLE_NAME} (
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
      ON ${PROVIDER_TABLE_NAME} (LOWER(code));

    CREATE TABLE IF NOT EXISTS ${API_TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      path_type TEXT NOT NULL DEFAULT 'relative',
      method TEXT NOT NULL,
      request_type TEXT NOT NULL,
      provider_id TEXT REFERENCES ${PROVIDER_TABLE_NAME}(id) ON DELETE SET NULL,
      params TEXT NOT NULL DEFAULT '',
      headers TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled', 'maintenance')),
      remark TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_api_configurations_identity
      ON ${API_TABLE_NAME} (UPPER(method), path, request_type, COALESCE(provider_id, ''));
  `);
};

const hasRows = async (tableName: string): Promise<boolean> => {
  const result = await getPostgresPool().query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${tableName}`);
  return Number(result.rows[0]?.count ?? 0) > 0;
};

const readLegacySystemConfig = async (): Promise<SystemConfigPayload> => {
  const legacyConfig = await tryReadLegacyStoredValue<SystemConfigPayload>(
    STORE_KEYS.SYS_CONFIG,
    'sys.json',
    DEFAULT_SYSTEM_CONFIG_PAYLOAD,
  );
  return normalizeSystemConfigPayload(legacyConfig);
};

const readLegacyProviders = async (): Promise<ProviderItem[]> => {
  const legacyConfig = await tryReadLegacyStoredValue<LegacyProviderShape>(
    STORE_KEYS.PROVIDER_CONFIG,
    'data/provider.json',
    { providers: [] },
  );

  return (legacyConfig.providers ?? []).map((provider) => normalizeProviderItem(provider));
};

const readLegacyApis = async (): Promise<Array<Partial<ApiItem>>> => {
  const legacyConfig = await tryReadLegacyStoredValue<LegacyApiShape>(
    STORE_KEYS.API_CONFIG,
    'data/api.json',
    { apis: [] },
  );

  return legacyConfig.apis ?? [];
};

const seedSystemConfigIfNeeded = async (): Promise<void> => {
  if (await hasRows(SYSTEM_TABLE_NAME)) {
    return;
  }

  const legacyConfig = await readLegacySystemConfig();
  const configuration = legacyConfig.configuration;

  await getPostgresPool().query(
    `
      INSERT INTO ${SYSTEM_TABLE_NAME} (id, github_project_path, api_timeout_ms, max_concurrent_requests, updated_at)
      VALUES (1, $1, $2, $3, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        github_project_path = EXCLUDED.github_project_path,
        api_timeout_ms = EXCLUDED.api_timeout_ms,
        max_concurrent_requests = EXCLUDED.max_concurrent_requests,
        updated_at = NOW()
    `,
    [
      configuration.githubProjectPath,
      configuration.apiTimeout,
      configuration.maxConcurrentRequests,
    ],
  );
};

const upsertProviderRecord = async (client: PoolClient, provider: ProviderItem): Promise<void> => {
  await client.query(
    `
      INSERT INTO ${PROVIDER_TABLE_NAME} (
        id,
        name,
        code,
        category,
        nature,
        base_url,
        status,
        remark,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        category = EXCLUDED.category,
        nature = EXCLUDED.nature,
        base_url = EXCLUDED.base_url,
        status = EXCLUDED.status,
        remark = EXCLUDED.remark,
        updated_at = NOW()
    `,
    [
      provider.id,
      provider.name,
      provider.code,
      provider.category || 'official',
      provider.nature || 'openSource',
      provider.baseUrl || '',
      provider.status,
      provider.remark || '',
    ],
  );
};

const upsertApiRecord = async (client: PoolClient, api: ApiItem): Promise<void> => {
  await client.query(
    `
      INSERT INTO ${API_TABLE_NAME} (
        id,
        name,
        path,
        path_type,
        method,
        request_type,
        provider_id,
        params,
        headers,
        status,
        remark,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        path = EXCLUDED.path,
        path_type = EXCLUDED.path_type,
        method = EXCLUDED.method,
        request_type = EXCLUDED.request_type,
        provider_id = EXCLUDED.provider_id,
        params = EXCLUDED.params,
        headers = EXCLUDED.headers,
        status = EXCLUDED.status,
        remark = EXCLUDED.remark,
        updated_at = NOW()
    `,
    [
      api.id,
      api.name,
      api.path,
      api.pathType,
      api.method,
      api.requestType,
      api.provider || null,
      api.params || '',
      api.headers || '',
      api.status,
      api.remark || '',
    ],
  );
};

const saveProvidersInternal = async (providers: ProviderItem[]): Promise<void> => {
  const client = await getPostgresPool().connect();

  try {
    await client.query('BEGIN');

    for (const provider of providers) {
      await upsertProviderRecord(client, provider);
    }

    const providerIds = providers.map((provider) => provider.id);

    if (providerIds.length > 0) {
      await client.query(
        `UPDATE ${API_TABLE_NAME} SET provider_id = NULL WHERE provider_id IS NOT NULL AND NOT (provider_id = ANY($1::text[]))`,
        [providerIds],
      );
      await client.query(`DELETE FROM ${PROVIDER_TABLE_NAME} WHERE NOT (id = ANY($1::text[]))`, [providerIds]);
    } else {
      await client.query(`UPDATE ${API_TABLE_NAME} SET provider_id = NULL WHERE provider_id IS NOT NULL`);
      await client.query(`DELETE FROM ${PROVIDER_TABLE_NAME}`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const saveApisInternal = async (apis: ApiItem[]): Promise<void> => {
  const providers = await readProviderItems();
  const providerIds = new Set(providers.map((provider) => provider.id));
  const normalizedApis = apis.map((api) =>
    normalizeApiItem({
      ...api,
      provider: api.provider && providerIds.has(api.provider) ? api.provider : '',
    }),
  );
  const client = await getPostgresPool().connect();

  try {
    await client.query('BEGIN');

    for (const api of normalizedApis) {
      await upsertApiRecord(client, api);
    }

    const apiIds = normalizedApis.map((api) => api.id);
    if (apiIds.length > 0) {
      await client.query(`DELETE FROM ${API_TABLE_NAME} WHERE NOT (id = ANY($1::text[]))`, [apiIds]);
    } else {
      await client.query(`DELETE FROM ${API_TABLE_NAME}`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const seedProviderConfigIfNeeded = async (): Promise<void> => {
  if (await hasRows(PROVIDER_TABLE_NAME)) {
    return;
  }

  const providers = mergeProviders(await readLegacyProviders());
  await saveProvidersInternal(providers);
};

const seedApiConfigIfNeeded = async (): Promise<void> => {
  if (await hasRows(API_TABLE_NAME)) {
    return;
  }

  const providers = await readProviderItems();
  const apis = mergeApis(await readLegacyApis(), providers);
  await saveApisInternal(apis);
};

const ensureStructuredConfigStore = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await ensureStructuredTables();
      await seedSystemConfigIfNeeded();
      await seedProviderConfigIfNeeded();
      await seedApiConfigIfNeeded();
    })();
  }

  await bootstrapPromise;
};

const loadSystemConfigurationRow = async (): Promise<SystemConfigPayload['configuration']> => {
  await ensureStructuredConfigStore();

  const result = await getPostgresPool().query<{
    github_project_path: string;
    api_timeout_ms: number;
    max_concurrent_requests: number;
  }>(
    `
      SELECT github_project_path, api_timeout_ms, max_concurrent_requests
      FROM ${SYSTEM_TABLE_NAME}
      WHERE id = 1
      LIMIT 1
    `,
  );

  const row = result.rows[0];
  if (!row) {
    return DEFAULT_SYSTEM_CONFIG_PAYLOAD.configuration;
  }

  return {
    githubProjectPath: row.github_project_path,
    apiTimeout: row.api_timeout_ms,
    maxConcurrentRequests: row.max_concurrent_requests,
  };
};

const readProviderItems = async (): Promise<ProviderItem[]> => {
  const result = await getPostgresPool().query<{
    id: string;
    name: string;
    code: string;
    category: string;
    nature: string;
    base_url: string;
    status: string;
    remark: string;
  }>(
    `
      SELECT id, name, code, category, nature, base_url, status, remark
      FROM ${PROVIDER_TABLE_NAME}
      ORDER BY CASE WHEN LOWER(code) IN ('netease', 'kuwo', 'qq') THEN 0 ELSE 1 END, name ASC
    `,
  );

  return result.rows.map((row) =>
    normalizeProviderItem({
      id: row.id,
      name: row.name,
      code: row.code,
      category: row.category as ProviderItem['category'],
      nature: row.nature as ProviderItem['nature'],
      baseUrl: row.base_url,
      status: normalizeManagedStatus(row.status),
      remark: row.remark,
    }),
  );
};

const loadProviderItems = async (): Promise<ProviderItem[]> => {
  await ensureStructuredConfigStore();
  return readProviderItems();
};

const readApiItems = async (): Promise<ApiItem[]> => {
  const result = await getPostgresPool().query<{
    id: string;
    name: string;
    path: string;
    path_type: string;
    method: string;
    request_type: string;
    provider_id: string | null;
    params: string;
    headers: string;
    status: string;
    remark: string;
  }>(
    `
      SELECT id, name, path, path_type, method, request_type, provider_id, params, headers, status, remark
      FROM ${API_TABLE_NAME}
      ORDER BY path ASC, request_type ASC, name ASC
    `,
  );

  return result.rows.map((row) =>
    normalizeApiItem({
      id: row.id,
      name: row.name,
      path: row.path,
      pathType: row.path_type as ApiItem['pathType'],
      method: row.method,
      requestType: row.request_type,
      provider: row.provider_id || '',
      params: row.params,
      headers: row.headers,
      status: normalizeManagedStatus(row.status),
      remark: row.remark,
    }),
  );
};

const loadApiItems = async (): Promise<ApiItem[]> => {
  await ensureStructuredConfigStore();
  return readApiItems();
};

export const loadSystemConfig = async (): Promise<SystemConfigPayload> => {
  const configuration = await loadSystemConfigurationRow();

  return {
    ...DEFAULT_SYSTEM_CONFIG_PAYLOAD,
    configuration,
  };
};

export const saveSystemConfig = async (value: Partial<SystemConfigPayload>): Promise<SystemConfigPayload> => {
  const normalizedConfig = normalizeSystemConfigPayload(value);

  await ensureStructuredConfigStore();
  await getPostgresPool().query(
    `
      INSERT INTO ${SYSTEM_TABLE_NAME} (id, github_project_path, api_timeout_ms, max_concurrent_requests, updated_at)
      VALUES (1, $1, $2, $3, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        github_project_path = EXCLUDED.github_project_path,
        api_timeout_ms = EXCLUDED.api_timeout_ms,
        max_concurrent_requests = EXCLUDED.max_concurrent_requests,
        updated_at = NOW()
    `,
    [
      normalizedConfig.configuration.githubProjectPath,
      normalizedConfig.configuration.apiTimeout,
      normalizedConfig.configuration.maxConcurrentRequests,
    ],
  );

  return loadSystemConfig();
};

export const loadProviderConfig = async (): Promise<{ providers: ProviderItem[] }> => {
  return {
    providers: await loadProviderItems(),
  };
};

export const saveProviderConfig = async (providers: ProviderItem[]): Promise<{ providers: ProviderItem[] }> => {
  const dedupedProviders = Array.from(
    new Map(providers.map((provider) => {
      const normalizedProvider = normalizeProviderItem(provider);
      return [normalizedProvider.id, normalizedProvider] as const;
    })).values(),
  );

  await ensureStructuredConfigStore();
  await saveProvidersInternal(dedupedProviders);

  return loadProviderConfig();
};

export const loadApiConfig = async (): Promise<{ apis: ApiItem[] }> => {
  return {
    apis: await loadApiItems(),
  };
};

export const saveApiConfig = async (apis: ApiItem[]): Promise<{ apis: ApiItem[] }> => {
  const dedupedApis = Array.from(
    new Map(apis.map((api) => {
      const normalizedApi = normalizeApiItem(api);
      return [normalizedApi.id, normalizedApi] as const;
    })).values(),
  );

  await ensureStructuredConfigStore();
  await saveApisInternal(dedupedApis);

  return loadApiConfig();
};

export const checkManagedApiAccess = async ({
  method,
  path,
  requestType,
  source,
}: {
  method: string;
  path: string;
  requestType?: string | null;
  source?: string | null;
}): Promise<
  | {
      allowed: true;
    }
  | {
      allowed: false;
      message: string;
      httpStatus: number;
    }
  | null
> => {
  const normalizedRequestType = requestType?.trim().toLowerCase();
  const normalizedSource = source?.trim().toLowerCase();

  if (!normalizedRequestType || !normalizedSource || path !== '/api') {
    return null;
  }

  const [providerConfig, apiConfig] = await Promise.all([loadProviderConfig(), loadApiConfig()]);
  const provider = getProviderByLookupValue(providerConfig.providers, normalizedSource);
  if (!provider) {
    return null;
  }

  const matchedApis = apiConfig.apis.filter(
    (api) =>
      api.method.trim().toUpperCase() === method.trim().toUpperCase()
      && api.path.trim() === path
      && api.requestType.trim().toLowerCase() === normalizedRequestType,
  );

  const matchedApi = matchedApis.find((api) => api.provider === provider.id)
    ?? matchedApis.find((api) => !api.provider);

  if (!matchedApi) {
    if (!MANAGED_PUBLIC_REQUEST_TYPES.has(normalizedRequestType)) {
      return null;
    }

    return {
      allowed: false,
      message: '璇ユ帴鍙ｅ凡涓嬫灦',
      httpStatus: 410,
    };
  }

  const effectiveStatus = provider.status !== 'enabled' ? provider.status : matchedApi.status;

  if (effectiveStatus === 'disabled') {
    return {
      allowed: false,
      message: '璇ユ帴鍙ｅ凡涓嬫灦',
      httpStatus: 410,
    };
  }

  if (effectiveStatus === 'maintenance') {
    return {
      allowed: false,
      message: '璇ユ帴鍙ｇ淮鎶や腑鏆備笉鍙敤',
      httpStatus: 503,
    };
  }

  return {
    allowed: true,
  };
};

