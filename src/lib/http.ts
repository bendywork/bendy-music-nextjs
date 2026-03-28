import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { tunehubConfig } from '@/config/tunehub';

/**
 * HTTP客户端配置
 */
interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP客户端类
 * 封装Axios，提供统一的网络请求接口
 */
export class HttpClient {
  private axiosInstance: AxiosInstance;

  /**
   * 构造函数
   * @param config HTTP客户端配置
   */
  constructor(config: HttpClientConfig = {}) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL || '',
      timeout: config.timeout || tunehubConfig.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        // 添加TuneHub V3 API认证头
        'X-API-KEY': tunehubConfig.API_KEY,
      },
    });

    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证信息、日志等
        console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // 可以在这里统一处理响应
        console.log(`[HTTP] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[HTTP ERROR] ${error.config?.url}: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 发送GET请求
   * @param url 请求URL
   * @param params 请求参数
   * @param config 请求配置
   * @returns 响应数据
   */
  public async get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, {
      params,
      ...config,
    });
    return response.data;
  }

  /**
   * 发送POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  /**
   * 发送PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  /**
   * 发送DELETE请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  /**
   * 发送请求（通用方法）
   * @param config 请求配置
   * @returns 响应数据
   */
  public async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.request(config);
    return response.data;
  }

  /**
   * 获取原始Axios实例
   * @returns Axios实例
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

/**
 * 创建HTTP客户端实例
 * @param config HTTP客户端配置
 * @returns HTTP客户端实例
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

/**
 * 默认HTTP客户端实例
 */
export const httpClient = createHttpClient();