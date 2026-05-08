import { MusicService } from '../../MusicService';
import { KuwoPublicService } from './KuwoPublicService';

/**
 * 酷我音乐服务工厂
 */
export function createKuwoMusicService(): MusicService {
  return new KuwoPublicService();
}
