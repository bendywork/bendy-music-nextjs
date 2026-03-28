import { MusicServiceFactory } from '../MusicService';
import { Platform, Provider } from '../../types';
import { createNeteaseMusicService } from './netease';
import { createKuwoMusicService } from './kuwo';
import { createQQMusicService } from './qq';

/**
 * 注册所有音乐服务商
 * 在应用启动时调用此函数，将所有音乐服务商注册到工厂中
 */
export function registerMusicProviders(): void {
  // 为每个服务商注册所有平台的服务
  Object.values(Provider).forEach((provider) => {
    // 注册网易云音乐服务
    MusicServiceFactory.registerService(
      provider,
      Platform.NETEASE,
      createNeteaseMusicService(provider)
    );
    
    // 注册酷我音乐服务
    MusicServiceFactory.registerService(
      provider,
      Platform.KUWO,
      createKuwoMusicService(provider)
    );
    
    // 注册QQ音乐服务
    MusicServiceFactory.registerService(
      provider,
      Platform.QQ,
      createQQMusicService(provider)
    );
  });
}

/**
 * 获取音乐服务商实例
 * @param provider 服务商类型
 * @param platform 平台类型
 * @returns 音乐服务商实例
 */
export { MusicServiceFactory } from '../MusicService';
