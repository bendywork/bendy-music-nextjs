import { MusicService } from '../../MusicService';
import { Provider, PlaylistDetail, ToplistItem, ToplistSongs } from '../../../types';
import { BilibiliMusicService } from './BilibiliMusicService';

export function createBilibiliMusicService(_provider?: Provider): MusicService {
  return new BilibiliMusicService();
}

export async function getBilibiliToplist(): Promise<ToplistItem[]> {
  const service = new BilibiliMusicService();
  return service.getToplist();
}

export async function getBilibiliToplistSongs(id: string): Promise<ToplistSongs> {
  const service = new BilibiliMusicService();
  return service.getToplistSongs(id);
}

export async function getBilibiliPlaylistDetail(id: string): Promise<PlaylistDetail> {
  const service = new BilibiliMusicService();
  return service.getPlaylistDetail(id);
}

export { BilibiliMusicService } from './BilibiliMusicService';
