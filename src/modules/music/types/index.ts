// 服务商类型
export enum Provider {
  TUNEHUB = 'tunehub',
}

// 平台类型
export enum Platform {
  NETEASE = 'netease',
  KUWO = 'kuwo',
  QQ = 'qq',
}

// 音质参数
export enum Quality {
  STANDARD = '128k',
  HIGH = '320k',
  LOSSLESS = 'flac',
  HI_RES = 'flac24bit',
}

// 歌曲信息
export interface SongInfo {
  name: string;
  artist: string;
  album: string;
  id: string;
  platform: Platform;
  url: string;
  pic: string;
  lrc: string;
}

// 搜索结果项
export interface SearchResultItem {
  id: string;
  name: string;
  artist: string;
  album: string;
  platform: Platform;
  url: string;
}

// 搜索结果
export interface SearchResult {
  keyword: string;
  total: number;
  results: SearchResultItem[];
}

// 歌单详情
export interface PlaylistDetail {
  id: string;
  name: string;
  description: string;
  cover: string;
  songs: SongInfo[];
}

// 排行榜项
export interface ToplistItem {
  id: string;
  name: string;
  cover: string;
  description: string;
  platform: Platform;
}

// 排行榜歌曲
export interface ToplistSongs {
  id: string;
  name: string;
  titleDetail: string;
  intro: string;
  songs: SongInfo[];
}

// 系统状态
export interface SystemStatus {
  code: number;
  message: string;
  data: {
    status: string;
    timestamp: string;
    version: string;
  };
}

// 统计数据
export interface Stats {
  code: number;
  message: string;
  data: {
    totalRequests: number;
    todayRequests: number;
    successRate: number;
    averageResponseTime: number;
  };
}