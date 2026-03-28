import { MusicService } from '../../MusicService';
import { Provider } from '../../../types';
import { KuwoPublicService } from './KuwoPublicService';

/**
 * 酷我音乐服务工厂
 * 现在只返回公共接口实现，因为tunehub已删除
 */
export function createKuwoMusicService(provider: Provider): MusicService {
  return new KuwoPublicService();
}
