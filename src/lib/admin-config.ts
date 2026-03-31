export type ManagedStatus = 'enabled' | 'disabled' | 'maintenance';
export type ProviderCategory = 'official' | 'personal';
export type ProviderNature = 'openSource' | 'nonProfit' | 'paid';

export interface ProviderItem {
  id: string;
  name: string;
  code: string;
  category?: ProviderCategory;
  nature?: ProviderNature;
  baseUrl?: string;
  status: ManagedStatus;
  remark?: string;
}

export interface ApiItem {
  id: string;
  name: string;
  path: string;
  pathType: 'relative' | 'absolute';
  method: string;
  requestType: string;
  provider: string;
  params: string;
  headers: string;
  status: ManagedStatus;
  remark: string;
}

export interface SystemConfigState {
  project: {
    github: string;
  };
  api: {
    timeout: number;
    maxConcurrentRequests: number;
  };
}

export interface SystemConfigPayload {
  apiManagement: {
    apis: ApiItem[];
  };
  providerManagement: {
    providers: ProviderItem[];
  };
  configuration: {
    githubProjectPath: string;
    apiTimeout: number;
    maxConcurrentRequests: number;
  };
}

export const MANAGED_STATUS_FLOW: ManagedStatus[] = ['enabled', 'maintenance', 'disabled'];

export const DEFAULT_SYSTEM_CONFIG_STATE: SystemConfigState = {
  project: {
    github: 'https://github.com/bendywork/bendy-music-nextjs',
  },
  api: {
    timeout: 300,
    maxConcurrentRequests: 100,
  },
};

export const DEFAULT_SYSTEM_CONFIG_PAYLOAD: SystemConfigPayload = {
  apiManagement: {
    apis: [],
  },
  providerManagement: {
    providers: [],
  },
  configuration: {
    githubProjectPath: 'https://github.com/bendywork/bendy-music-nextjs',
    apiTimeout: 300000,
    maxConcurrentRequests: 100,
  },
};

export const createEmptyProvider = (): ProviderItem => ({
  id: `provider-${Date.now()}`,
  name: '',
  code: '',
  category: 'official',
  nature: 'openSource',
  baseUrl: '',
  status: 'enabled',
  remark: '',
});

export const createEmptyApi = (): ApiItem => ({
  id: `api-${Date.now()}`,
  name: '',
  path: '/api',
  pathType: 'relative',
  method: 'GET',
  requestType: 'info',
  provider: '',
  params: '',
  headers: '',
  status: 'enabled',
  remark: '',
});

const createBuiltinApi = (
  providerId: string,
  providerName: string,
  requestType: string,
  name: string,
  params: string,
): ApiItem => ({
  id: `api-${providerId.replace(/^provider-/, '')}-${requestType}`,
  name: `${providerName} - ${name}`,
  path: '/api',
  pathType: 'relative',
  method: 'GET',
  requestType,
  provider: providerId,
  params,
  headers: '',
  status: 'enabled',
  remark: '系统内置接口',
});

export const BUILTIN_PROVIDER_ITEMS: ProviderItem[] = [
  {
    id: 'provider-netease',
    name: '网易云音乐',
    code: 'netease',
    category: 'official',
    nature: 'openSource',
    baseUrl: 'https://music.163.com',
    status: 'enabled',
    remark: '系统内置平台服务商',
  },
  {
    id: 'provider-kuwo',
    name: '酷我音乐',
    code: 'kuwo',
    category: 'official',
    nature: 'openSource',
    baseUrl: 'http://qukudata.kuwo.cn',
    status: 'enabled',
    remark: '系统内置平台服务商，排行榜会补充访问 http://kbangserver.kuwo.cn',
  },
  {
    id: 'provider-qq',
    name: 'QQ 音乐',
    code: 'qq',
    category: 'official',
    nature: 'openSource',
    baseUrl: 'https://u.y.qq.com',
    status: 'enabled',
    remark: '系统内置平台服务商，歌单详情会补充访问 https://c.y.qq.com',
  },
];

export const BUILTIN_API_ITEMS: ApiItem[] = [
  createBuiltinApi('provider-netease', '网易云音乐', 'info', '获取歌曲信息', 'source=netease&id=<songId>&provider=tunehub'),
  createBuiltinApi('provider-netease', '网易云音乐', 'search', '搜索歌曲', 'source=netease&keyword=<keyword>&limit=20'),
  createBuiltinApi('provider-netease', '网易云音乐', 'playlist', '获取歌单详情', 'source=netease&id=<playlistId>&provider=tunehub'),
  createBuiltinApi('provider-netease', '网易云音乐', 'toplists', '获取排行榜列表', 'source=netease'),
  createBuiltinApi('provider-netease', '网易云音乐', 'toplist', '获取排行榜歌曲', 'source=netease&id=<toplistId>'),
  createBuiltinApi('provider-kuwo', '酷我音乐', 'info', '获取歌曲信息', 'source=kuwo&id=<songId>&provider=tunehub'),
  createBuiltinApi('provider-kuwo', '酷我音乐', 'search', '搜索歌曲', 'source=kuwo&keyword=<keyword>&limit=20'),
  createBuiltinApi('provider-kuwo', '酷我音乐', 'playlist', '获取歌单详情', 'source=kuwo&id=<playlistId>&provider=tunehub'),
  createBuiltinApi('provider-kuwo', '酷我音乐', 'toplists', '获取排行榜列表', 'source=kuwo'),
  createBuiltinApi('provider-kuwo', '酷我音乐', 'toplist', '获取排行榜歌曲', 'source=kuwo&id=<toplistId>'),
  createBuiltinApi('provider-qq', 'QQ 音乐', 'info', '获取歌曲信息', 'source=qq&id=<songMid>&provider=tunehub'),
  createBuiltinApi('provider-qq', 'QQ 音乐', 'search', '搜索歌曲', 'source=qq&keyword=<keyword>&limit=20'),
  createBuiltinApi('provider-qq', 'QQ 音乐', 'playlist', '获取歌单详情', 'source=qq&id=<playlistId>&provider=tunehub'),
  createBuiltinApi('provider-qq', 'QQ 音乐', 'toplists', '获取排行榜列表', 'source=qq'),
  createBuiltinApi('provider-qq', 'QQ 音乐', 'toplist', '获取排行榜歌曲', 'source=qq&id=<toplistId>'),
];

export const normalizeManagedStatus = (value?: string | null): ManagedStatus => {
  if (value === 'disabled' || value === 'maintenance') {
    return value;
  }

  return 'enabled';
};

export const normalizeProviderItem = (
  value: Partial<ProviderItem> & {
    url?: string;
  },
): ProviderItem => {
  return {
    id: value.id?.trim() || `provider-${Date.now()}`,
    name: value.name?.trim() || '',
    code: value.code?.trim() || '',
    category: value.category === 'personal' ? 'personal' : 'official',
    nature: value.nature === 'nonProfit' || value.nature === 'paid' ? value.nature : 'openSource',
    baseUrl: value.baseUrl?.trim() || value.url?.trim() || '',
    status: normalizeManagedStatus(value.status),
    remark: value.remark?.trim() || '',
  };
};

export const normalizeApiItem = (value: Partial<ApiItem>): ApiItem => {
  return {
    id: value.id?.trim() || `api-${Date.now()}`,
    name: value.name?.trim() || '',
    path: value.path?.trim() || '/api',
    pathType: value.pathType === 'absolute' ? 'absolute' : 'relative',
    method: value.method?.trim().toUpperCase() || 'GET',
    requestType: value.requestType?.trim() || 'custom',
    provider: value.provider?.trim() || '',
    params: value.params?.trim() || '',
    headers: value.headers?.trim() || '',
    status: normalizeManagedStatus(value.status),
    remark: value.remark?.trim() || '',
  };
};

export const normalizeSystemConfigPayload = (value: Partial<SystemConfigPayload>): SystemConfigPayload => {
  return {
    apiManagement: {
      apis: Array.isArray(value.apiManagement?.apis) ? value.apiManagement.apis.map(normalizeApiItem) : [],
    },
    providerManagement: {
      providers: Array.isArray(value.providerManagement?.providers)
        ? value.providerManagement.providers.map((provider) => normalizeProviderItem(provider))
        : [],
    },
    configuration: {
      githubProjectPath:
        value.configuration?.githubProjectPath?.trim() || DEFAULT_SYSTEM_CONFIG_PAYLOAD.configuration.githubProjectPath,
      apiTimeout: Math.max(1, Number(value.configuration?.apiTimeout) || DEFAULT_SYSTEM_CONFIG_PAYLOAD.configuration.apiTimeout),
      maxConcurrentRequests: Math.max(
        1,
        Number(value.configuration?.maxConcurrentRequests) || DEFAULT_SYSTEM_CONFIG_PAYLOAD.configuration.maxConcurrentRequests,
      ),
    },
  };
};

export const getNextManagedStatus = (status: ManagedStatus): ManagedStatus => {
  const currentIndex = MANAGED_STATUS_FLOW.indexOf(status);
  if (currentIndex < 0) {
    return MANAGED_STATUS_FLOW[0];
  }

  return MANAGED_STATUS_FLOW[(currentIndex + 1) % MANAGED_STATUS_FLOW.length];
};
