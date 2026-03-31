import { NextRequest, NextResponse } from 'next/server';
import { Platform, Quality, Provider } from '@/modules/music/types';
import type { MusicService } from '@/modules/music/services/MusicService';
import { MusicServiceFactory, registerMusicProviders } from '@/modules/music/services/providers';
import { getNeteaseToplist, getNeteaseToplistSongs, createNeteaseMusicService } from '@/modules/music/services/providers/netease';
import { getQQToplist, getQQToplistSongs, createQQMusicService } from '@/modules/music/services/providers/qq';
import { createKuwoMusicService } from '@/modules/music/services/providers/kuwo';
import { KuwoPublicService } from '@/modules/music/services/providers/kuwo/KuwoPublicService';
import { dashboardService } from '@/lib/dashboard';
import { checkManagedApiAccess } from '@/lib/server/admin-config-store';

// 注册所有音乐服务商
registerMusicProviders();

// 初始化Dashboard服务
dashboardService.initialize();
console.log('Dashboard服务已初始化');

function recordRequest(provider: string, path: string, statusCode: number, duration: number) {
  dashboardService.incrementRequestCount(provider, path, statusCode, duration);
}

function recordError(provider: string) {
  dashboardService.incrementErrorCount(provider);
}

function createManagedApiBlockedResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      code: status,
      message,
      data: null,
    },
    { status },
  );
}

function createSearchService(source: string | null): MusicService | null {
  switch (source) {
    case Platform.NETEASE:
      return createNeteaseMusicService(Provider.TUNEHUB);
    case Platform.QQ:
      return createQQMusicService(Provider.TUNEHUB);
    case Platform.KUWO:
      return createKuwoMusicService(Provider.TUNEHUB);
    default:
      return null;
  }
}

/**
 * 处理所有API请求
 * @param request Next.js请求对象
 * @returns Next.js响应对象
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;

  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider') || Provider.TUNEHUB;
    const source = searchParams.get('source') || '-';
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const keyword = searchParams.get('keyword');
    const rawLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isNaN(rawLimit) || rawLimit <= 0 ? 20 : rawLimit;
    const br = searchParams.get('br') || Quality.HIGH;

    const accessResult = await checkManagedApiAccess({
      method: request.method,
      path,
      requestType: type,
      source,
    });
    if (accessResult && !accessResult.allowed) {
      const response = createManagedApiBlockedResponse(accessResult.message, accessResult.httpStatus);
      const duration = Date.now() - startTime;
      recordRequest(source, path, response.status, duration);
      return response;
    }

    let response: NextResponse;

    // 根据请求类型处理不同的业务逻辑
    switch (type) {
      case 'info':
        response = await handleGetSongInfo(provider, source, id);
        break;
      case 'url':
        response = NextResponse.json({ code: 404, message: 'Music url endpoint not implemented' }, { status: 404 });
        break;
      case 'pic':
        response = NextResponse.json({ code: 404, message: 'Album cover endpoint not implemented' }, { status: 404 });
        break;
      case 'lrc':
        response = NextResponse.json({ code: 404, message: 'Lyrics endpoint not implemented' }, { status: 404 });
        break;
      case 'search':
        response = await handleSearchSongs(source, keyword, limit);
        break;
      case 'aggregateSearch':
        response = NextResponse.json({ code: 404, message: 'Aggregate search endpoint not implemented' }, { status: 404 });
        break;
      case 'playlist':
        response = await handleGetPlaylistDetail(provider, source, id);
        break;
      case 'toplists':
        response = await handleGetToplists(source);
        break;
      case 'toplist':
        response = await handleGetToplistSongs(source, id);
        break;
      case 'status':
        response = await handleGetSystemStatus();
        break;
      case 'stats':
        response = await handleGetStats();
        break;
      default:
        response = NextResponse.json({ code: 400, message: 'Invalid request type' }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    recordRequest(source, path, response.status, duration);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordRequest('-', path, 500, duration);
    console.error('API Error:', error);
    return NextResponse.json({
      code: 500,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * 处理获取歌曲基本信息请求
 * @param provider 服务商类型
 * @param source 平台类型
 * @param id 歌曲ID
 * @returns 歌曲信息
 */
async function handleGetSongInfo(provider: string, source: string | null, id: string | null): Promise<NextResponse> {
  if (!source || !id) {
    return NextResponse.json({ code: 400, message: 'Missing source or id parameter' }, { status: 400 });
  }

  try {
    const musicService = MusicServiceFactory.getService(provider as Provider, source as Platform);
    const songInfo = await musicService.getSongInfo(id);

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: songInfo,
    });
  } catch (error) {
    recordError(source);
    throw error;
  }
}



/**
 * 处理获取歌单详情请求
 * @param provider 服务商类型
 * @param source 平台类型
 * @param id 歌单ID
 * @returns 歌单详情
 */
async function handleSearchSongs(source: string | null, keyword: string | null, limit: number): Promise<NextResponse> {
  const normalizedKeyword = keyword?.trim();

  if (!source || !normalizedKeyword) {
    return NextResponse.json({ code: 400, message: 'Missing source or keyword parameter' }, { status: 400 });
  }

  const musicService = createSearchService(source);
  if (!musicService) {
    return NextResponse.json({ code: 400, message: 'Unsupported platform' }, { status: 400 });
  }

  try {
    const searchResult = await musicService.searchSong(normalizedKeyword, limit);

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: searchResult,
    });
  } catch (error) {
    console.error('Error in handleSearchSongs:', error);
    recordError(source);
    return NextResponse.json({
      code: 500,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

async function handleGetPlaylistDetail(provider: string, source: string | null, id: string | null): Promise<NextResponse> {
  if (!source || !id) {
    return NextResponse.json({ code: 400, message: 'Missing source or id parameter' }, { status: 400 });
  }

  try {
    // 对于酷我音乐，直接使用公开接口
    if (source === 'kuwo') {
      const kuwoPublicService = new KuwoPublicService();
      const playlistDetail = await kuwoPublicService.getPlaylistDetail(id);
      
      return NextResponse.json({
        code: 200,
        message: 'success',
        data: playlistDetail,
      });
    }

    // 其他平台使用正常的服务工厂
    const musicService = MusicServiceFactory.getService(provider as Provider, source as Platform);
    const playlistDetail = await musicService.getPlaylistDetail(id);

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: playlistDetail,
    });
  } catch (error) {
    console.error('Error in handleGetPlaylistDetail:', error);
    recordError(source);
    return NextResponse.json({
      code: 500,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 处理获取排行榜列表请求（公共接口）
 * @param source 平台类型
 * @returns 排行榜列表
 */
async function handleGetToplists(source: string | null): Promise<NextResponse> {
  if (!source) {
    return NextResponse.json({ code: 400, message: 'Missing source parameter' }, { status: 400 });
  }

  console.log('Handling getToplists request (public API):', { source });
  
  try {
    let toplist;
    
    switch (source) {
      case 'netease':
        toplist = await getNeteaseToplist();
        break;
      case 'qq':
        toplist = await getQQToplist();
        break;
      case 'kuwo':
        const kuwoPublicService = new KuwoPublicService();
        toplist = await kuwoPublicService.getToplist();
        break;
      default:
        return NextResponse.json({ code: 400, message: 'Unsupported platform' }, { status: 400 });
    }

    console.log('Got toplist data:', toplist);

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: toplist,
    });
  } catch (error) {
    console.error('Error in handleGetToplists:', error);
    recordError(source || '-');
    return NextResponse.json({
      code: 500,
      message: 'Internal server error',
      data: [],
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 处理获取排行榜歌曲请求（公共接口）
 * @param source 平台类型
 * @param id 排行榜ID
 * @returns 排行榜歌曲
 */
async function handleGetToplistSongs(source: string | null, id: string | null): Promise<NextResponse> {
  if (!source || !id) {
    return NextResponse.json({ code: 400, message: 'Missing source or id parameter' }, { status: 400 });
  }

  console.log('Handling getToplistSongs request (public API):', { source, id });
  
  try {
    let toplistSongs;
    
    switch (source) {
      case 'netease':
        toplistSongs = await getNeteaseToplistSongs(id);
        break;
      case 'qq':
        toplistSongs = await getQQToplistSongs(id);
        break;
      case 'kuwo':
        const kuwoPublicService = new KuwoPublicService();
        toplistSongs = await kuwoPublicService.getToplistSongs(id);
        break;
      default:
        return NextResponse.json({ code: 400, message: 'Unsupported platform' }, { status: 400 });
    }

    console.log('Got toplist songs data:', toplistSongs);

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: toplistSongs,
    });
  } catch (error) {
    console.error('Error in handleGetToplistSongs:', error);
    recordError(source || '-');
    return NextResponse.json({
      code: 500,
      message: 'Internal server error',
      data: {},
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 处理获取系统状态请求
 * @returns 系统状态
 */
async function handleGetSystemStatus(): Promise<NextResponse> {
  return NextResponse.json({
    code: 501,
    message: 'Not implemented',
    data: null,
  });
}

/**
 * 处理获取统计数据请求
 * @returns 统计数据
 */
async function handleGetStats(): Promise<NextResponse> {
  return NextResponse.json({
    code: 501,
    message: 'Not implemented',
    data: null,
  });
}
