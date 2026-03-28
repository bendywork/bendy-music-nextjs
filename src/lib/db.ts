import mysql from 'mysql2/promise';
import { RedisClientType, createClient } from 'redis';

// MySQL连接配置
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ddmusic_proxy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 创建MySQL连接池
const pool = mysql.createPool(mysqlConfig);

// Redis客户端
let redisClient: RedisClientType | null = null;

// 初始化Redis连接
export const initRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}/${process.env.REDIS_DB || 0}`,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redisClient.connect();
  return redisClient;
};

// 获取Redis客户端
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// 获取MySQL连接
export const getMysqlConnection = async () => {
  return await pool.getConnection();
};

// 执行SQL查询
export const query = async (sql: string, values?: any[]) => {
  const connection = await getMysqlConnection();
  try {
    const [rows] = await connection.execute(sql, values);
    return rows;
  } finally {
    connection.release();
  }
};

export default pool;