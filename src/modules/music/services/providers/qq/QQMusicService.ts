import { MusicService } from '@/modules/music/services/MusicService';
import { Platform, Quality, SongInfo, SearchResult, PlaylistDetail, ToplistSongs } from '@/modules/music/types';
import { httpClient } from '@/lib/http';

/**
 * QQ音乐服务实现
 * 对接QQ音乐官方公开API
 */
export class QQMusicService implements MusicService {
  private readonly platform = Platform.QQ;

  /**
   * 获取歌曲基本信息
   * @param id 歌曲ID
   * @returns 歌曲信息
   */
  public async getSongInfo(id: string): Promise<SongInfo> {
    try {
      // 使用QQ音乐官方API获取歌曲信息
      const response = await httpClient.get('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        comm: {
          cv: 4747474,
          ct: 24,
          format: 'json',
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          uin: 0
        },
        songinfo: {
          module: 'music.pf_song_detail_svr',
          method: 'get_song_detail',
          param: {
            song_mid: id
          }
        }
      }, {
        headers: {
          'Origin': 'https://y.qq.com',
          'Referer': 'https://y.qq.com/'
        }
      });
      
      const song = response.songinfo?.data?.songinfo || {};
      
      return {
        id: song.mid || id,
        name: song.title || '',
        artist: song.singer?.map((s: any) => s.name).join(', ') || '',
        album: song.album?.name || '',
        platform: this.platform,
        url: '',
        pic: '',
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
    try {
      // 使用QQ音乐官方API搜索歌曲
      const response = await httpClient.post('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        comm: {
          cv: 4747474,
          ct: 24,
          format: 'json',
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          uin: 0
        },
        req: {
          method: 'DoSearchForQQMusicDesktop',
          module: 'music.search.SearchCgiService',
          param: {
            query: keyword,
            page_num: 1,
            num_per_page: limit
          }
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://y.qq.com/'
        }
      });
      
      console.log('QQ music search response:', JSON.stringify(response, null, 2));
      
      // 提取歌曲列表
      const songs = response.req && response.req.data && response.req.data.body && response.req.data.body.song && response.req.data.body.song.list || [];
      
      return {
        keyword,
        total: songs.length,
        results: songs.map((item: any) => ({
          id: item.mid || '',
          name: item.name || '',
          artist: item.singer?.map((s: any) => s.name).join(', ') || '',
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
    try {
      // 使用QQ音乐官方API获取歌单详情
      const response = await httpClient.get('https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg', {
        type: '1',
        json: '1',
        utf8: '1',
        onlysong: '0',
        new_format: '1',
        disstid: id,
        loginUin: '0',
        hostUin: '0',
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf-8',
        notice: '0',
        platform: 'yqq.json',
        needNewCode: '0'
      }, {
        headers: {
          'Origin': 'https://y.qq.com',
          'Referer': 'https://y.qq.com/'
        }
      });
      
      const cdlist = response.cdlist && response.cdlist[0];
      if (!cdlist) {
        throw new Error('Playlist not found');
      }
      
      return {
        id: id,
        name: cdlist.dissname || '',
        cover: cdlist.logo || '',
        description: (cdlist.desc || '').replace(/<br>/g, '\n'),
        songs: (cdlist.songlist || []).map((item: any) => ({
          id: item.mid || '',
          name: item.title || '',
          artist: item.singer?.map((s: any) => s.name).join(', ') || '',
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
   * 直接使用QQ音乐官方API获取排行榜列表
   * @returns 排行榜列表
   */
  public async getToplist(): Promise<Array<{id: string; name: string; cover: string; description: string; platform: any}>> {
    try {
      console.log('Fetching QQ music toplists...');
      
      // 直接使用QQ音乐官方API获取排行榜列表
      const data = await httpClient.post('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        comm: {
          cv: 4747474,
          ct: 24,
          format: 'json',
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          uin: 0
        },
        toplist: {
          module: 'musicToplist.ToplistInfoServer',
          method: 'GetAll',
          param: {}
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://y.qq.com',
          'Referer': 'https://y.qq.com/'
        }
      });
      
      console.log('QQ Music API response:', JSON.stringify(data, null, 2));
      
      // 处理响应数据
      const responseData = data?.toplist?.data;
      if (!responseData) {
        console.error('Invalid response data structure:', data);
        return [];
      }
      
      const groups = responseData.group;
      if (!Array.isArray(groups)) {
        console.error('group is not an array:', groups);
        return [];
      }
      
      const result: Array<{id: string; name: string; cover: string; description: string; platform: any}> = [];
      groups.forEach((group: any, groupIndex: number) => {
        if (!group || !Array.isArray(group.toplist)) {
          console.error(`Invalid group at index ${groupIndex}:`, group);
          return;
        }
        
        group.toplist.forEach((item: any, itemIndex: number) => {
          if (!item) {
            console.error(`Invalid item at group ${groupIndex}, item ${itemIndex}`);
            return;
          }
          
          result.push({
            id: String(item.topId || item.id || `item_${groupIndex}_${itemIndex}`),
            name: item.title || item.name || 'Unknown Title',
            cover: item.headPicUrl || item.frontPicUrl || item.picUrl || '',
            description: item.description || `QQ音乐排行榜 ${item.title || item.name}`,
            platform: this.platform
          });
        });
      });
      
      console.log('Processed QQ music toplists:', result);
      return result;
      
    } catch (error) {
      console.error('Error processing QQ music toplists:', error);
      return [];
    }
  }

  /**
   * 获取排行榜歌曲
   * 直接使用QQ音乐官方API获取排行榜歌曲
   * @param id 排行榜ID
   * @returns 排行榜歌曲
   */
  public async getToplistSongs(id: string): Promise<ToplistSongs> {
    try {
      console.log('Fetching QQ music toplist songs from official API:', id);
      
      // 直接使用QQ音乐官方API获取排行榜歌曲
      const data = await httpClient.post('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        comm: {
          cv: 4747474,
          ct: 24,
          format: 'json',
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          uin: 0
        },
        toplist: {
          module: 'musicToplist.ToplistInfoServer',
          method: 'GetDetail',
          param: {
            topid: parseInt(id),
            num: 300,
            period: ''
          }
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://y.qq.com',
          'Referer': 'https://y.qq.com/'
        }
      });
      
      console.log('QQ Music toplist detail API response:', JSON.stringify(data, null, 2));
      
      // 处理响应数据
      const responseData = data?.toplist?.data;
      if (!responseData || !responseData.songInfoList) {
        console.error('Invalid response data structure:', data);
        return {
          id,
          name: 'Unknown Toplist',
          titleDetail: '',
          intro: '',
          songs: []
        };
      }
      
      // 转换歌曲数据
      const songs = responseData.songInfoList.map((item: any) => ({
        id: item.mid || '',
        name: item.title || '',
        artist: item.singerList ? item.singerList.map((s: any) => s.name).join(', ') : (item.singer ? item.singer.map((s: any) => s.name).join(', ') : ''),
        album: item.albumName || (item.album ? item.album.name : ''),
        platform: this.platform,
        url: '',
        pic: '',
        lrc: '',
      }));
      
      return {
        id,
        name: responseData.data?.title || responseData.title || 'Unknown Toplist',
        titleDetail: responseData.data?.titleShare || '',
        intro: responseData.data?.intro || '',
        songs
      };
    } catch (error) {
      console.error('Error fetching QQ music toplist songs:', error);
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