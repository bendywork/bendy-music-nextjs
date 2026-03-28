/**
 * TuneHub API配置
 */
export const tunehubConfig = {
  /**
   * API基础URL
   */
  BASE_URL: 'https://music-dl.sayqz.com',
  
  /**
   * API密钥
   * 从环境变量中读取，或使用默认值
   */
  API_KEY: process.env.TUNEHUB_API_KEY || '',
  
  /**
   * API超时时间（毫秒）
   */
  TIMEOUT: 30000,
  
  /**
   * 是否启用调试模式
   */
  DEBUG: process.env.NODE_ENV === 'development',
};
