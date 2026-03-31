import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { repairMojibakeValue } from '@/lib/server/mojibake';
import { withRedisKeyPrefix } from '@/lib/server/redis-key';

const STORE_TABLE_NAME = 'app_data_store';
const CACHE_NAMESPACE = 'cache:app-data-store:';
const parsedCacheTtl = Number(process.env.REDIS_CACHE_TTL_SECONDS ?? 60);
const CACHE_TTL_SECONDS = Number.isFinite(parsedCacheTtl) && parsedCacheTtl > 0
  ? parsedCacheTtl
  : 60;

const stripBom = (value: string): string => value.replace(/^\uFEFF/, '');
const getAbsolutePath = (relativePath: string): string =>
  path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);

export const STORE_KEYS = {
  API_CONFIG: 'api-config',
  PROVIDER_CONFIG: 'provider-config',
  SYS_CONFIG: 'sys-config',
  DASHBOARD: 'dashboard',
  DASHBOARD_RUNTIME: 'dashboard-runtime',
  DOC_README: 'doc-readme',
  DOC_API: 'doc-api',
  DOC_PAGE: 'doc-page',
} as const;

type StoreValue = unknown;

let pool: Pool | null = null;
let ensureTablePromise: Promise<void> | null = null;
type RedisClient = ReturnType<typeof createClient>;
let redisClientPromise: Promise<RedisClient | null> | null = null;

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  return databaseUrl;
};

const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }
  return pool;
};

const ensureStoreTable = async (): Promise<void> => {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await getPool().query(`
        CREATE TABLE IF NOT EXISTS ${STORE_TABLE_NAME} (
          store_key TEXT PRIMARY KEY,
          store_value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })();
  }

  await ensureTablePromise;
};

const getRedisUrl = (): string | null => {
  return (
    process.env.REDIS_URL?.trim() ??
    process.env.UPSTASH_REDIS_URL?.trim() ??
    null
  );
};

const getRedisClient = async (): Promise<RedisClient | null> => {
  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const redisUrl = getRedisUrl();
      if (!redisUrl) {
        return null;
      }

      const client = createClient({ url: redisUrl });
      client.on('error', (error) => {
        console.warn('Redis client error:', error);
      });

      try {
        await client.connect();
        return client;
      } catch (error) {
        console.warn('Redis unavailable, fallback to PostgreSQL only:', error);
        return null;
      }
    })();
  }

  return redisClientPromise;
};

const getCacheKey = (key: string): string => withRedisKeyPrefix(`${CACHE_NAMESPACE}${key}`);

const readCache = async <T>(key: string): Promise<T | null> => {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const raw = await client.get(getCacheKey(key));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to read cache for key "${key}":`, error);
    return null;
  }
};

const writeCache = async (key: string, value: StoreValue): Promise<void> => {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  try {
    await client.set(getCacheKey(key), JSON.stringify(value), {
      EX: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.warn(`Failed to write cache for key "${key}":`, error);
  }
};

export const clearStoreCache = async (key: string): Promise<void> => {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  try {
    await client.del(getCacheKey(key));
  } catch (error) {
    console.warn(`Failed to clear cache for key "${key}":`, error);
  }
};

export const readJsonFile = async <T>(relativePath: string, fallback: T): Promise<T> => {
  const absolutePath = getAbsolutePath(relativePath);

  try {
    const raw = stripBom(await fs.readFile(absolutePath, 'utf8'));
    return repairMojibakeValue(JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

export const readTextFile = async (relativePath: string, fallback: string): Promise<string> => {
  const absolutePath = getAbsolutePath(relativePath);

  try {
    return repairMojibakeValue(stripBom(await fs.readFile(absolutePath, 'utf8')));
  } catch {
    return fallback;
  }
};

export const writeTextFile = async (relativePath: string, content: string): Promise<string> => {
  const absolutePath = getAbsolutePath(relativePath);
  const normalizedContent = repairMojibakeValue(content);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, normalizedContent, 'utf8');
  return normalizedContent;
};

export const getStoredValue = async <T>(
  key: string,
  fallbackFactory: () => Promise<T> | T,
): Promise<T> => {
  const cached = await readCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  await ensureStoreTable();

  const result = await getPool().query<{ store_value: T }>(
    `SELECT store_value FROM ${STORE_TABLE_NAME} WHERE store_key = $1 LIMIT 1`,
    [key],
  );

  if (result.rows.length > 0) {
    const value = repairMojibakeValue(result.rows[0].store_value);
    await writeCache(key, value);
    return value;
  }

  const fallback = repairMojibakeValue(await fallbackFactory());
  await setStoredValue(key, fallback);
  return fallback;
};

export const setStoredValue = async <T>(key: string, value: T): Promise<T> => {
  const normalizedValue = repairMojibakeValue(value);
  await ensureStoreTable();

  const result = await getPool().query<{ store_value: T }>(
    `
      INSERT INTO ${STORE_TABLE_NAME} (store_key, store_value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (store_key)
      DO UPDATE SET store_value = EXCLUDED.store_value, updated_at = NOW()
      RETURNING store_value
    `,
    [key, JSON.stringify(normalizedValue)],
  );

  const storedValue = repairMojibakeValue(result.rows[0].store_value);
  await writeCache(key, storedValue);
  return storedValue;
};
