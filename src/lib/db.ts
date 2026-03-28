import { Pool, QueryResultRow } from 'pg';
import { createClient } from 'redis';

let pool: Pool | null = null;
type RedisClient = ReturnType<typeof createClient>;
let redisClient: RedisClient | null = null;

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  return databaseUrl;
};

const getRedisUrl = (): string | null => {
  return process.env.REDIS_URL?.trim() ?? process.env.UPSTASH_REDIS_URL?.trim() ?? null;
};

export const getPostgresPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return pool;
};

export const query = async <T extends QueryResultRow>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> => {
  const result = await getPostgresPool().query<T>(sql, values);
  return result.rows;
};

export const initRedis = async (): Promise<RedisClient | null> => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    return null;
  }

  const client = createClient({ url: redisUrl });
  client.on('error', (error) => {
    console.error('Redis Client Error:', error);
  });

  await client.connect();
  redisClient = client;
  return redisClient;
};

export const getRedisClient = (): RedisClient | null => {
  return redisClient;
};
