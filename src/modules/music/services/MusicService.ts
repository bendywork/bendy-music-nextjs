import { Platform, SongInfo, SearchResult, PlaylistDetail, ToplistItem, ToplistSongs } from '../types';

/**
 * 音乐服务接口
 * 定义了所有音乐服务商需要实现的方法
 */
export interface MusicService {
  /**
   * 获取歌曲基本信息
   * @param id 歌曲ID
   * @returns 歌曲信息
   */
  getSongInfo(id: string): Promise<SongInfo>;

  /**
   * 搜索歌曲
   * @param keyword 搜索关键词
   * @param limit 结果数量限制
   * @returns 搜索结果
   */
  searchSong(keyword: string, limit: number): Promise<SearchResult>;

  /**
   * 获取歌单详情
   * @param id 歌单ID
   * @returns 歌单详情
   */
  getPlaylistDetail(id: string): Promise<PlaylistDetail>;

  /**
   * 获取排行榜列表
   * @returns 排行榜列表
   */
  getToplist(): Promise<ToplistItem[]>;

  /**
   * 获取排行榜歌曲
   * @param id 排行榜ID
   * @returns 排行榜歌曲
   */
  getToplistSongs(id: string): Promise<ToplistSongs>;
}

/**
 * 音乐服务工厂
 * 根据平台类型创建对应的音乐服务实例
 */
export class MusicServiceFactory {
  private static services: Map<Platform, MusicService> = new Map();

  /**
   * 注册音乐服务
   * @param platform 平台类型
   * @param service 音乐服务实例
   */
  public static registerService(platform: Platform, service: MusicService): void {
    this.services.set(platform, service);
  }

  /**
   * 获取音乐服务
   * @param platform 平台类型
   * @returns 音乐服务实例
   * @throws Error 当平台未注册时抛出错误
   */
  public static getService(platform: Platform): MusicService {
    const service = this.services.get(platform);

    if (!service) {
      throw new Error(`Music service for platform ${platform} is not registered`);
    }

    return service;
  }
}
