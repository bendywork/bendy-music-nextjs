import { MusicServiceFactory } from '../MusicService';
import { Platform } from '../../types';
import { createNeteaseMusicService } from './netease';
import { createKuwoMusicService } from './kuwo';
import { createQQMusicService } from './qq';
import { createBilibiliMusicService } from './bilibili';

/**
 * 注册所有音乐服务商
 * 在应用启动时调用此函数，将所有平台服务注册到工厂中
 */
export function registerMusicProviders(): void {
  MusicServiceFactory.registerService(Platform.NETEASE, createNeteaseMusicService());
  MusicServiceFactory.registerService(Platform.KUWO, createKuwoMusicService());
  MusicServiceFactory.registerService(Platform.QQ, createQQMusicService());
  MusicServiceFactory.registerService(Platform.BILIBILI, createBilibiliMusicService());
}

export { MusicServiceFactory } from '../MusicService';
