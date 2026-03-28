export const DEFAULT_REDIS_KEY_PREFIX = 'bendywork_ddmusic_nextjs_';

export const getRedisKeyPrefix = (): string => {
  const envPrefix = process.env.REDIS_KEY_PREFIX?.trim();
  if (!envPrefix) {
    return DEFAULT_REDIS_KEY_PREFIX;
  }

  return envPrefix;
};

export const withRedisKeyPrefix = (key: string): string => {
  return `${getRedisKeyPrefix()}${key}`;
};
