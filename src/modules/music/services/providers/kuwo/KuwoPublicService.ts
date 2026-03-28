import { MusicService } from '../../MusicService';
import { Platform, Quality, SongInfo, SearchResult, PlaylistDetail, ToplistItem, ToplistSongs } from '../../../types';

/**
 * 酷我音乐公开接口服务
 * 使用酷我公开的HTTP接口获取音乐数据
 */
export class KuwoPublicService implements MusicService {
  private readonly BASE_URL = 'http://qukudata.kuwo.cn';
  private readonly KBANG_URL = 'http://kbangserver.kuwo.cn';
  private readonly HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  /**
   * 获取歌曲基本信息
   * @param id 歌曲ID
   * @returns 歌曲信息
   */
  async getSongInfo(id: string): Promise<SongInfo> {
    try {
      const params = new URLSearchParams({
        op: 'getdata',
        rid: id,
        fmt: 'json',
        encoding: 'utf8'
      });

      const url = `${this.BASE_URL}/q.k?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.HEADERS
      });

      console.log('Kuwo song info response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Kuwo song info response text:', text);
        throw new Error(`HTTP error! status: ${response.status}, text: ${text}`);
      }

      const data = await response.json();
      console.log('Kuwo song info response data:', JSON.stringify(data, null, 2));

      if (!data.musiclist || data.musiclist.length === 0) {
        throw new Error('Song not found');
      }

      const song = data.musiclist[0] as { id?: string; rid?: string; name: string; artist: string; album?: string; pic?: string };

      return {
        id: song.id || song.rid || id,
        name: song.name,
        artist: song.artist.replace(/&/g, ', '),
        album: song.album || '',
        platform: Platform.KUWO,
        url: '',
        pic: song.pic || '',
        lrc: ''
      };
    } catch (error) {
      console.error('Error fetching kuwo song info:', error);
      throw error;
    }
  }



  /**
   * 搜索歌曲
   * @param keyword 搜索关键词
   * @param limit 结果数量限制
   * @returns 搜索结果
   */
  async searchSong(keyword: string, limit: number): Promise<SearchResult> {
    try {
      const params = new URLSearchParams({
        client: 'kt',
        all: keyword,
        pn: '0',
        rn: limit.toString(),
        uid: '794762570',
        ver: 'kwplayer_ar_9.2.2.1',
        vipver: '1',
        show_copyright_off: '1',
        newver: '1',
        ft: 'music',
        cluster: '0',
        strategy: '2012',
        encoding: 'utf8',
        rformat: 'json',
        vermerge: '1',
        mobi: '1',
        issubtitle: '1'
      });

      const url = `http://search.kuwo.cn/r.s?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.HEADERS
      });

      console.log('Kuwo search response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Kuwo search response text:', text);
        throw new Error(`HTTP error! status: ${response.status}, text: ${text}`);
      }

      const data = await response.json();
      console.log('Kuwo search response data:', JSON.stringify(data, null, 2));

      // 提取歌曲列表
      if (!data.abslist) return { keyword, total: 0, results: [] };
      
      const results = data.abslist.map((item: any) => {
        return {
          id: item.MUSICRID.replace('MUSIC_', ''),
          name: item.SONGNAME,
          artist: item.ARTIST.replace(/&/g, ', '),
          album: item.ALBUM || '',
          platform: Platform.KUWO,
          url: ''
        };
      });

      return {
        keyword,
        total: results.length,
        results
      };
    } catch (error) {
      console.error('Error searching kuwo songs:', error);
      return { keyword, total: 0, results: [] };
    }
  }

  /**
   * 获取歌单详情
   * @param id 歌单ID
   * @returns 歌单详情
   */
  async getPlaylistDetail(id: string): Promise<PlaylistDetail> {
    try {
      const params = new URLSearchParams({
        op: 'getlistinfo',
        pid: id,
        pn: '0',
        rn: '1000',
        encode: 'utf8',
        keyset: 'pl2012',
        identity: 'kuwo',
        pcmp4: '1',
        vipver: 'MUSIC_9.0.5.0_W1',
        newver: '1'
      });

      const url = `http://nplserver.kuwo.cn/pl.svc?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.HEADERS
      });

      console.log('Kuwo playlist detail response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Kuwo playlist detail response text:', text);
        throw new Error(`HTTP error! status: ${response.status}, text: ${text}`);
      }

      const data = await response.json();
      console.log('Kuwo playlist detail response data:', JSON.stringify(data, null, 2));

      if (data.result !== 'ok') {
        throw new Error(`API error! result: ${data.result}`);
      }

      const songs = (data.musiclist || []).map((item: { id: string; name: string; artist: string; album?: string }) => {
        return {
          id: item.id,
          name: item.name,
          artist: item.artist.replace(/&/g, ', '),
          album: item.album || '',
          platform: Platform.KUWO,
          url: '',
          pic: '',
          lrc: ''
        };
      });

      return {
        id: id,
        name: data.title,
        cover: data.pic || '',
        description: data.info || '',
        songs
      };
    } catch (error) {
      console.error('Error fetching kuwo playlist detail:', error);
      throw error;
    }
  }

  /**
   * 获取排行榜列表
   * @returns 排行榜列表
   */
  async getToplist(): Promise<ToplistItem[]> {
    try {
      const params = new URLSearchParams({
        op: 'query',
        cont: 'tree',
        node: '2',
        pn: '0',
        rn: '1000',
        fmt: 'json',
        level: '2'
      });

      const url = `${this.BASE_URL}/q.k?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.HEADERS
      });

      console.log('Kuwo toplist response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Kuwo toplist response text:', text);
        throw new Error(`HTTP error! status: ${response.status}, text: ${text}`);
      }

      const data = await response.json();
      console.log('Kuwo toplist response data:', JSON.stringify(data, null, 2));
      console.log('Kuwo toplist response data.child:', data.child);
      console.log('Kuwo toplist response data.child length:', data.child ? data.child.length : 0);

      // 应用转换函数，与用户提供的保持一致
      if (!data.child) return [];
      
      return data.child
        .filter((item: { source: string }) => item.source === '1')
        .map((item: { sourceid: string; name: string; pic?: string; info?: string }) => {
          return {
            id: item.sourceid,
            name: item.name,
            cover: item.pic || '',
            description: item.info || 'Regular update',
            platform: Platform.KUWO
          };
        });
    } catch (error) {
      console.error('Error fetching kuwo toplist:', error);
      return [];
    }
  }

  /**
   * 获取排行榜歌曲
   * @param id 排行榜ID
   * @returns 排行榜歌曲
   */
  async getToplistSongs(id: string): Promise<ToplistSongs> {
    try {
      const params = new URLSearchParams({
        from: 'pc',
        fmt: 'json',
        id: id,
        type: 'bang',
        data: 'content',
        pn: '0',
        rn: '100'
      });

      const response = await fetch(`${this.KBANG_URL}/ksong.s?${params}`, {
        method: 'GET',
        headers: this.HEADERS
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 应用转换函数
      if (!data.musiclist) {
        return {
          id: id,
          name: 'Unknown',
          titleDetail: 'Unknown',
          intro: '',
          songs: []
        };
      }

      const songs = data.musiclist.map((item: { id?: string; rid?: string; name: string; artist: string; album?: string }) => {
        return {
          id: item.id || item.rid || '',
          name: item.name,
          artist: item.artist.replace(/&/g, ', '),
          album: item.album || '',
          platform: Platform.KUWO,
          url: '',
          pic: '',
          lrc: ''
        };
      });

      return {
        id: id,
        name: data.name || 'Unknown',
        titleDetail: data.name || 'Unknown',
        intro: data.info || '',
        songs
      };
    } catch (error) {
      console.error('Error fetching kuwo toplist songs:', error);
      throw error;
    }
  }
}
