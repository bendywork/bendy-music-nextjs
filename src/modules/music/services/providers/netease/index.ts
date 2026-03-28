import { MusicService } from '../../MusicService';
import { Provider, Platform, SongInfo, SearchResult, PlaylistDetail, ToplistSongs, ToplistItem } from '../../../types';
import { NetEaseMusicService } from './NetEaseMusicService';

/**
 * 网易云音乐公共接口工厂
 * 公共接口直接使用官方API，不识别provider参数
 */
export function createNeteasePublicService(): MusicService {
  return new NetEaseMusicService();
}

/**
 * 网易云音乐服务工厂
 * 现在只返回公共接口实现，因为tunehub已删除
 */
export function createNeteaseMusicService(provider: Provider): MusicService {
  return new NetEaseMusicService();
}

/**
 * 获取网易云排行榜列表（公共接口）
 */
export async function getNeteaseToplist(): Promise<ToplistItem[]> {
  const service = new NetEaseMusicService();
  return service.getToplist();
}

/**
 * 获取网易云歌单详情（公共接口）
 */
export async function getNeteasePlaylistDetail(id: string): Promise<PlaylistDetail> {
  const service = new NetEaseMusicService();
  return service.getPlaylistDetail(id);
}

/**
 * 获取网易云排行榜歌曲（公共接口）
 */
export async function getNeteaseToplistSongs(id: string): Promise<ToplistSongs> {
  const service = new NetEaseMusicService();
  return service.getToplistSongs(id);
}
