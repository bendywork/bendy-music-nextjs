import { MusicService } from '../../MusicService';
import { Platform, Quality, SongInfo, SearchResult, PlaylistDetail, ToplistSongs } from '../../../types';
import { httpClient } from '@/lib/http';

/**
 * 网易云音乐服务实现
 * 对接网易云官方公开API
 */
export class NetEaseMusicService implements MusicService {
  private readonly platform = Platform.NETEASE;

  /**
   * 获取歌曲基本信息
   * @param id 歌曲ID
   * @returns 歌曲信息
   */
  public async getSongInfo(id: string): Promise<SongInfo> {
    // 使用网易云官方API获取歌曲信息
    try {
      const response = await httpClient.get('https://music.163.com/api/song/detail', {
        ids: `[${id}]`
      }, {
        headers: {
          'Referer': 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const song = response.songs?.[0];
      if (!song) {
        throw new Error('Song not found');
      }
      
      return {
        id: song.id.toString(),
        name: song.name,
        artist: song.ar.map((a: any) => a.name).join(', '),
        album: song.al.name,
        platform: this.platform,
        url: '',
        pic: song.al.picUrl || '',
        lrc: '',
      };
    } catch (error) {
      console.error('Error fetching song info:', error);
      throw error;
    }
  }



  /**
   * 搜索歌曲
   * @param keyword 搜索关键词
   * @param limit 结果数量限制
   * @returns 搜索结果
   */
  public async searchSong(keyword: string, limit: number): Promise<SearchResult> {
    // 使用网易云官方API搜索歌曲
    try {
      const response = await httpClient.get('https://music.163.com/api/search/get/web', {
        s: keyword,
        type: '1',
        offset: 0,
        limit: limit
      }, {
        headers: {
          'Referer': 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('NetEase music search response:', JSON.stringify(response, null, 2));
      
      // 提取歌曲列表
      const songs = response.result && response.result.songs || [];
      
      return {
        keyword,
        total: response.result?.songCount || 0,
        results: songs.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          artist: item.artists.map((a: any) => a.name).join(', '),
          album: item.album && item.album.name || '',
          platform: this.platform,
          url: '',
        })),
      };
    } catch (error) {
      console.error('Error searching songs:', error);
      return {
        keyword,
        total: 0,
        results: []
      };
    }
  }

  /**
   * 获取歌单详情
   * @param id 歌单ID
   * @returns 歌单详情
   */
  public async getPlaylistDetail(id: string): Promise<PlaylistDetail> {
    // 直接使用网易云官方API获取歌单详情（公开接口）
    try {
      const response = await httpClient.get('https://music.163.com/api/playlist/detail', {
        id,
        n: '100000',
        s: '8'
      }, {
        headers: {
          'Referer': 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const playlist = response.result;
      
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      return {
        id: playlist.id.toString(),
        name: playlist.name,
        cover: playlist.coverImgUrl || '',
        description: playlist.description || '',
        songs: (playlist.tracks || []).map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          artist: item.artists.map((a: any) => a.name).join(', '),
          album: item.album && item.album.name || '',
          platform: this.platform,
          url: '',
          pic: '',
          lrc: '',
        }))
      };
    } catch (error) {
      console.error('Error fetching playlist detail:', error);
      throw error;
    }
  }

  /**
   * 获取排行榜列表
   * @returns 排行榜列表
   */
  public async getToplist(): Promise<any> {
    // 直接使用网易云官方API获取排行榜列表（公开接口）
    try {
      const response = await httpClient.get('https://music.163.com/api/toplist', {}, {
        headers: {
          'Referer': 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const list = response.list || [];
      
      return list.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        cover: item.coverImgUrl || '',
        description: item.description || 'Regular update',
        platform: this.platform
      }));
    } catch (error) {
      console.error('Error fetching toplist:', error);
      return [];
    }
  }

  /**
   * 获取排行榜歌曲
   * 直接使用网易云官方API获取排行榜歌曲
   * @param id 排行榜ID
   * @returns 排行榜歌曲
   */
  public async getToplistSongs(id: string): Promise<ToplistSongs> {
    try {
      console.log('Fetching netease toplist songs from official API:', id);
      
      // 直接使用网易云官方API获取排行榜歌曲
      const response = await httpClient.get('https://music.163.com/api/playlist/detail', {
        id,
        n: '100000',
        s: '8'
      }, {
        headers: {
          'Referer': 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const playlist = response.playlist || response.result;
      
      if (!playlist) {
        console.error('Invalid response data structure:', response);
        return {
          id,
          name: 'Unknown Toplist',
          titleDetail: '',
          intro: '',
          songs: []
        };
      }
      
      // 转换歌曲数据
      const tracks = playlist.tracks || playlist.songs || [];
      const songs = tracks.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        artist: item.ar ? item.ar.map((a: any) => a.name).join(', ') : (item.artists ? item.artists.map((a: any) => a.name).join(', ') : ''),
        album: item.al ? item.al.name : (item.album ? item.album.name : ''),
        platform: this.platform,
        url: '',
        pic: '',
        lrc: '',
      }));
      
      return {
        id,
        name: playlist.name,
        titleDetail: playlist.name,
        intro: playlist.description || '',
        songs
      };
    } catch (error) {
      console.error('Error fetching netease toplist songs:', error);
      return {
        id,
        name: 'Unknown Toplist',
        titleDetail: '',
        intro: '',
        songs: []
      };
    }
  }
}
