import { MusicService } from '../../MusicService';
import { Platform, SongInfo, SearchResult, PlaylistDetail, ToplistItem, ToplistSongs } from '../../../types';

const BILIBILI_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://www.bilibili.com',
};

const BILIBILI_SEARCH_HEADERS: Record<string, string> = {
  ...BILIBILI_HEADERS,
  'Cookie': 'buvid3=0',
};

function htmlDecode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function isVideoId(id: string): boolean {
  return id.startsWith('BV');
}

async function bilibiliGet(url: string, extraHeaders?: Record<string, string>): Promise<any> {
  const headers = { ...BILIBILI_HEADERS, ...extraHeaders };
  const response = await fetch(url, { headers });
  const buffer = Buffer.from(await response.arrayBuffer());
  const encoding = response.headers.get('content-encoding') || '';
  if (encoding.includes('gzip')) {
    const zlib = await import('zlib');
    const decoded = await new Promise<Buffer>((resolve, reject) => {
      zlib.gunzip(buffer, (err, data) => err ? reject(err) : resolve(data));
    });
    return JSON.parse(decoded.toString());
  }
  return JSON.parse(buffer.toString());
}

export class BilibiliMusicService implements MusicService {
  private readonly platform = Platform.BILIBILI;

  async getSongInfo(id: string): Promise<SongInfo> {
    if (isVideoId(id)) {
      return this.getVideoSongInfo(id);
    }
    return this.getAudioZoneSongInfo(id);
  }

  private async getVideoSongInfo(bvid: string): Promise<SongInfo> {
    const data = await bilibiliGet(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
    if (data.code !== 0 || !data.data) {
      throw new Error('Song not found');
    }
    const v = data.data;
    return {
      id: bvid,
      name: htmlDecode(v.title),
      artist: htmlDecode(v.owner?.name || ''),
      album: '',
      platform: this.platform,
      url: '',
      pic: v.pic || '',
      lrc: '',
    };
  }

  private async getAudioZoneSongInfo(sid: string): Promise<SongInfo> {
    const data = await bilibiliGet(`https://www.bilibili.com/audio/music-service-c/web/song/info?sid=${sid}`);
    if (data.code !== 0 || !data.data) {
      throw new Error('Song not found');
    }
    const s = data.data;
    return {
      id: sid,
      name: htmlDecode(s.title || ''),
      artist: htmlDecode(s.uname || ''),
      album: '',
      platform: this.platform,
      url: '',
      pic: s.cover || '',
      lrc: s.lyric || '',
    };
  }

  async searchSong(keyword: string, limit: number): Promise<SearchResult> {
    try {
      const data = await bilibiliGet(
        `https://api.bilibili.com/x/web-interface/search/type?__refresh__=true&_extra=&context=&page=1&page_size=${limit}&platform=pc&highlight=1&single_column=0&keyword=${encodeURIComponent(keyword)}&category_id=&search_type=video&dynamic_offset=0&preload=true&com2co=true`,
        { Cookie: 'buvid3=0' }
      );
      if (data.code !== 0 || !data.data?.result) {
        return { keyword, total: 0, results: [] };
      }
      const results = data.data.result.map((item: any) => ({
        id: item.bvid,
        name: htmlDecode(item.title?.replace(/<[^>]*>/g, '') || ''),
        artist: htmlDecode(item.author || ''),
        album: '',
        platform: this.platform,
        url: '',
      }));
      return { keyword, total: data.data.numResults || results.length, results };
    } catch (error) {
      console.error('Error searching bilibili songs:', error);
      return { keyword, total: 0, results: [] };
    }
  }

  async getPlaylistDetail(id: string): Promise<PlaylistDetail> {
    const data = await bilibiliGet(`https://www.bilibili.com/audio/music-service-c/web/menu/info?sid=${id}`);
    if (data.code !== 0 || !data.data) {
      throw new Error('Playlist not found');
    }
    const info = data.data;
    const songsData = await bilibiliGet(`https://www.bilibili.com/audio/music-service-c/web/song/of-menu?pn=1&ps=100&sid=${id}`);
    const songs = (songsData.data?.data || []).map((item: any) => ({
      id: String(item.id),
      name: htmlDecode(item.title || ''),
      artist: htmlDecode(item.uname || ''),
      album: '',
      platform: this.platform,
      url: '',
      pic: item.cover || '',
      lrc: item.lyric || '',
    }));
    return {
      id,
      name: htmlDecode(info.title || ''),
      cover: info.cover || '',
      description: info.intro || '',
      songs,
    };
  }

  async getToplist(): Promise<ToplistItem[]> {
    try {
      const data = await bilibiliGet('https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=1');
      if (data.code !== 0 || !data.data?.data) {
        return [];
      }
      return data.data.data.map((item: any) => ({
        id: String(item.menuId),
        name: item.title,
        cover: item.cover || '',
        description: 'B站音频区热门歌单',
        platform: this.platform,
      }));
    } catch (error) {
      console.error('Error fetching bilibili toplists:', error);
      return [];
    }
  }

  async getToplistSongs(id: string): Promise<ToplistSongs> {
    try {
      const detail = await this.getPlaylistDetail(id);
      return {
        id,
        name: detail.name,
        titleDetail: detail.name,
        intro: detail.description,
        songs: detail.songs,
      };
    } catch (error) {
      console.error('Error fetching bilibili toplist songs:', error);
      return { id, name: 'Unknown', titleDetail: '', intro: '', songs: [] };
    }
  }

  async getAudioUrl(id: string): Promise<string> {
    if (isVideoId(id)) {
      return this.getVideoAudioUrl(id);
    }
    return this.getAudioZoneUrl(id);
  }

  private async getVideoAudioUrl(bvid: string): Promise<string> {
    const videoData = await bilibiliGet(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
    if (videoData.code !== 0 || !videoData.data) {
      throw new Error('Video not found');
    }
    const cid = videoData.data.pages?.[0]?.cid;
    if (!cid) throw new Error('No cid found');
    const playData = await bilibiliGet(
      `https://api.bilibili.com/x/player/playurl?fnval=16&bvid=${bvid}&cid=${cid}`
    );
    if (playData.code !== 0 || !playData.data?.dash?.audio?.length) {
      throw new Error('No audio stream found');
    }
    return playData.data.dash.audio[0].baseUrl;
  }

  private async getAudioZoneUrl(sid: string): Promise<string> {
    const data = await bilibiliGet(`https://www.bilibili.com/audio/music-service-c/web/url?sid=${sid}`);
    if (data.code !== 0 || !data.data?.cdns?.length) {
      throw new Error('Audio URL not found');
    }
    return data.data.cdns[0];
  }
}
