import type { DashboardData } from '@/lib/dashboard';
import {
  DEFAULT_SYSTEM_CONFIG_STATE,
  createEmptyApi,
  createEmptyProvider,
  type ApiItem,
  type ManagedStatus,
  type ProviderItem,
  type SystemConfigState,
} from '@/lib/admin-config';
import { getIntlLocale, type Locale } from '@/lib/i18n/locale';

export type { ApiItem, ProviderItem, SystemConfigState };
export { createEmptyApi, createEmptyProvider };

export type DashboardMenuKey =
  | 'dashboard'
  | 'provider-management'
  | 'api-management'
  | 'doc-management'
  | 'config-management';

export type DocTabKey = 'readme' | 'docs';
export type ToggleStatus = ManagedStatus;

export interface UserInfo {
  login: string;
  avatar_url: string;
  name?: string;
}

export interface SessionResponse {
  data?: {
    authenticated?: boolean;
    token?: string;
    user?: {
      login?: string;
      name?: string;
      avatar_url?: string;
    };
  };
}

export const DEFAULT_README = '# bendy-music-nextjs\n';
export const DEFAULT_DOCS_PAGE = '';

export const DEFAULT_SYSTEM_CONFIG: SystemConfigState = DEFAULT_SYSTEM_CONFIG_STATE;

export const DEFAULT_USER: UserInfo = {
  login: 'admin',
  avatar_url: 'https://github.com/favicon.ico',
};

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  proxyRequestCount: 0,
  systemUptime: 0,
  systemStartedAt: 0,
  uptimeSnapshotAt: 0,
  recentRequests: [],
  serviceStatus: [
    { name: 'kuwo', displayName: '酷我音乐', errorCount: 0, status: 'Normal' },
    { name: 'qq', displayName: 'QQ 音乐', errorCount: 0, status: 'Normal' },
    { name: 'netease', displayName: '网易云音乐', errorCount: 0, status: 'Normal' },
  ],
  lastSyncTime: 0,
};

export const formatUptime = (uptimeMs: number, locale: Locale = 'zh'): string => {
  const totalSeconds = Math.max(0, Math.floor(uptimeMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (locale === 'zh') {
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分`;
    }
    if (hours > 0) {
      return `${hours}小时 ${minutes}分`;
    }
    if (minutes > 0) {
      return `${minutes}分 ${seconds}秒`;
    }

    return `${seconds}秒`;
  }

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

export const formatTimestamp = (timestamp: number, locale: Locale = 'zh'): string => {
  if (!timestamp) {
    return '-';
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
};

export const statusVariant = (status: string): 'success' | 'warning' | 'danger' => {
  if (status === 'Normal' || status === 'enabled') {
    return 'success';
  }
  if (status === 'Warning' || status === 'maintenance') {
    return 'warning';
  }
  return 'danger';
};

export async function postJson<T>(url: string, body: unknown, fallbackError = 'Request failed.'): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || fallbackError);
  }

  return payload;
}
