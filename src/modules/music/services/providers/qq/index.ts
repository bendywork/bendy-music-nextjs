import { MusicService } from '../../MusicService';
import { Provider, PlaylistDetail, ToplistSongs, ToplistItem } from '../../../types';
import { QQMusicService } from './QQMusicService';

/**
 * QQ音乐公共接口工厂
 * 公共接口直接使用官方API，不识别provider参数
 */
export function createQQPublicService(): MusicService {
  return new QQMusicService();
}

/**
 * QQ音乐服务工厂
 * 现在只返回公共接口实现，因为tunehub已删除
 */
export function createQQMusicService(provider: Provider): MusicService {
  return new QQMusicService();
}

/**
 * 获取QQ音乐排行榜列表（公共接口）
 */
export async function getQQToplist(): Promise<Array<{id: string; name: string; cover: string; description: string; platform: any}>> {
  const service = new QQMusicService();
  return service.getToplist();
}

/**
 * 获取QQ音乐歌单详情（公共接口）
 */
export async function getQQPlaylistDetail(id: string): Promise<PlaylistDetail> {
  const service = new QQMusicService();
  return service.getPlaylistDetail(id);
}

/**
 * 获取QQ音乐排行榜歌曲（公共接口）
 */
export async function getQQToplistSongs(id: string): Promise<ToplistSongs> {
  const service = new QQMusicService();
  return service.getToplistSongs(id);
}
