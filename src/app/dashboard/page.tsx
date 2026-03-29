'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';
import {
  BookText,
  Cable,
  ExternalLink,
  Gauge,
  LogOut,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  Waypoints,
} from 'lucide-react';
import packageJson from '../../../package.json';
import { ApiPanel } from '@/components/dashboard/api-panel';
import { DocsPanel } from '@/components/dashboard/docs-panel';
import { OverviewPanel } from '@/components/dashboard/overview-panel';
import { ProviderPanel } from '@/components/dashboard/provider-panel';
import { SettingsPanel } from '@/components/dashboard/settings-panel';
import type { ApiItem, DashboardMenuKey, ProviderItem } from '@/components/dashboard/types';
import {
  createEmptyApi,
  createEmptyProvider,
  DEFAULT_API_DOC,
  DEFAULT_DASHBOARD_DATA,
  DEFAULT_README,
  DEFAULT_SYSTEM_CONFIG,
  DEFAULT_USER,
  postJson,
  type DocTabKey,
  type SessionResponse,
  type SystemConfigState,
  type UserInfo,
} from '@/components/dashboard/types';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { githubService } from '@/lib/github';
import { cn } from '@/lib/utils';

const appVersion = packageJson.version;

const menuGroups: Array<{
  title: string;
  items: Array<{
    id: DashboardMenuKey;
    label: string;
    icon: typeof Gauge;
    description: string;
  }>;
}> = [
  {
    title: '控制台',
    items: [
      {
        id: 'dashboard',
        label: '总览',
        icon: Gauge,
        description: '运行状态、请求趋势与服务健康度',
      },
    ],
  },
  {
    title: '工作区',
    items: [
      {
        id: 'provider-management',
        label: '服务商',
        icon: Cable,
        description: '维护 Provider 来源与状态',
      },
      {
        id: 'api-management',
        label: '接口管理',
        icon: Waypoints,
        description: '维护 API 路径、请求方式与备注',
      },
      {
        id: 'doc-management',
        label: '文档中心',
        icon: BookText,
        description: 'README 与 API 文档配置',
      },
      {
        id: 'config-management',
        label: '系统设置',
        icon: Settings2,
        description: 'GitHub 仓库地址与运行参数',
      },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<DashboardMenuKey>('dashboard');
  const [activeDocTab, setActiveDocTab] = useState<DocTabKey>('readme');
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [busySection, setBusySection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [readmeContent, setReadmeContent] = useState(DEFAULT_README);
  const [docPropContent, setDocPropContent] = useState(DEFAULT_API_DOC);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [editingProvider, setEditingProvider] = useState<ProviderItem | null>(null);
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [editingApi, setEditingApi] = useState<ApiItem | null>(null);
  const [sysConfig, setSysConfig] = useState<SystemConfigState>(DEFAULT_SYSTEM_CONFIG);
  const [userInfo, setUserInfo] = useState<UserInfo>(DEFAULT_USER);
  const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD_DATA);

  const currentMenu = menuGroups.flatMap((group) => group.items).find((item) => item.id === activeMenu);

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/data/dashboard', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const payload = (await response.json()) as typeof DEFAULT_DASHBOARD_DATA;
      setDashboardData({
        ...DEFAULT_DASHBOARD_DATA,
        ...payload,
        recentRequests: payload.recentRequests ?? [],
        serviceStatus: payload.serviceStatus ?? DEFAULT_DASHBOARD_DATA.serviceStatus,
      });
    } catch (loadError) {
      console.warn('Failed to load dashboard data:', loadError);
    }
  };

  const loadDocuments = async () => {
    try {
      const [readmeResponse, apiDocResponse] = await Promise.all([
        fetch('/api/data/docs/readme', { cache: 'no-store' }),
        fetch('/api/data/docs/api', { cache: 'no-store' }),
      ]);

      if (readmeResponse.ok) {
        const payload = (await readmeResponse.json()) as { content?: string };
        setReadmeContent(payload.content || DEFAULT_README);
      }

      if (apiDocResponse.ok) {
        const payload = (await apiDocResponse.json()) as { content?: string };
        setDocPropContent(payload.content || DEFAULT_API_DOC);
      }
    } catch (loadError) {
      console.warn('Failed to load documents:', loadError);
    }
  };

  const loadProviderConfig = async () => {
    try {
      const response = await fetch('/api/data/provider', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load providers');
      }

      const payload = (await response.json()) as { providers?: ProviderItem[] };
      setProviders(payload.providers ?? []);
    } catch (loadError) {
      console.warn('Failed to load providers:', loadError);
    }
  };

  const loadApiConfig = async () => {
    try {
      const response = await fetch('/api/data/api', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load APIs');
      }

      const payload = (await response.json()) as { apis?: ApiItem[] };
      setApis(payload.apis ?? []);
    } catch (loadError) {
      console.warn('Failed to load APIs:', loadError);
    }
  };

  const loadSysConfig = async () => {
    try {
      const response = await fetch('/api/sys', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load system config');
      }

      const payload = (await response.json()) as {
        configuration?: {
          githubProjectPath?: string;
          apiTimeout?: number;
          maxConcurrentRequests?: number;
        };
      };

      const timeoutMs = Number(payload.configuration?.apiTimeout ?? 30000);
      setSysConfig({
        project: {
          github: payload.configuration?.githubProjectPath || DEFAULT_SYSTEM_CONFIG.project.github,
        },
        api: {
          timeout: Math.max(1, Math.round(timeoutMs / 1000)),
          maxConcurrentRequests: Number(
            payload.configuration?.maxConcurrentRequests ?? DEFAULT_SYSTEM_CONFIG.api.maxConcurrentRequests,
          ),
        },
      });
    } catch (loadError) {
      console.warn('Failed to load system config:', loadError);
    }
  };

  const initializeDashboard = useEffectEvent(async () => {
    setInitializing(true);

    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unauthenticated');
      }

      const payload = (await response.json()) as SessionResponse;
      const session = payload.data;
      if (!session?.authenticated || !session.user?.login) {
        throw new Error('Unauthenticated');
      }

      if (session.token) {
        localStorage.setItem('github_token', session.token);
      }
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('auth_timestamp', String(Date.now()));
      localStorage.setItem('github_login', session.user.login);
      if (session.user.avatar_url) {
        localStorage.setItem('github_avatar_url', session.user.avatar_url);
      }

      setUserInfo({
        login: session.user.login || DEFAULT_USER.login,
        avatar_url: session.user.avatar_url || DEFAULT_USER.avatar_url,
        name: session.user.name,
      });
      setAuthenticated(true);

      await Promise.all([
        loadDashboardData(),
        loadDocuments(),
        loadProviderConfig(),
        loadApiConfig(),
        loadSysConfig(),
      ]);
    } catch {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      githubService.logout();
      router.replace('/login');
    } finally {
      setInitializing(false);
    }
  });

  useEffect(() => {
    void initializeDashboard();
  }, [router]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadDashboardData();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [authenticated]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    githubService.logout();
    setAuthenticated(false);
    router.push('/login');
  };

  const persistProviders = async (nextProviders: ProviderItem[], successMessage: string) => {
    const previous = providers;
    setProviders(nextProviders);
    setBusySection('providers');
    clearFeedback();

    try {
      await postJson('/api/data/provider', { providers: nextProviders });
      setSuccess(successMessage);
      return true;
    } catch (persistError) {
      setProviders(previous);
      setError(persistError instanceof Error ? persistError.message : '保存服务商失败');
      return false;
    } finally {
      setBusySection(null);
    }
  };

  const persistApis = async (nextApis: ApiItem[], successMessage: string) => {
    const previous = apis;
    setApis(nextApis);
    setBusySection('apis');
    clearFeedback();

    try {
      await postJson('/api/data/api', { apis: nextApis });
      setSuccess(successMessage);
      return true;
    } catch (persistError) {
      setApis(previous);
      setError(persistError instanceof Error ? persistError.message : '保存接口失败');
      return false;
    } finally {
      setBusySection(null);
    }
  };

  const handleSaveProvider = async () => {
    if (!editingProvider) {
      return;
    }
    if (!editingProvider.name.trim() || !editingProvider.code.trim()) {
      setError('服务商名称和代码不能为空。');
      setSuccess('');
      return;
    }

    const exists = providers.some((item) => item.id === editingProvider.id);
    const nextProviders = exists
      ? providers.map((item) => (item.id === editingProvider.id ? editingProvider : item))
      : [...providers, editingProvider];
    const saved = await persistProviders(nextProviders, exists ? '服务商已更新。' : '服务商已创建。');
    if (saved) {
      setEditingProvider(null);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!window.confirm('确定删除这个服务商吗？')) {
      return;
    }

    const saved = await persistProviders(
      providers.filter((item) => item.id !== providerId),
      '服务商已删除。',
    );
    if (saved && editingProvider?.id === providerId) {
      setEditingProvider(null);
    }
  };

  const handleToggleProviderStatus = async (providerId: string) => {
    const nextProviders = providers.map((item) =>
      item.id === providerId
        ? {
            ...item,
            status: (item.status === 'enabled' ? 'disabled' : 'enabled') as ProviderItem['status'],
          }
        : item,
    );

    await persistProviders(nextProviders, '服务商状态已更新。');
  };

  const handleSaveApi = async () => {
    if (!editingApi) {
      return;
    }
    if (!editingApi.name.trim() || !editingApi.path.trim() || !editingApi.method.trim()) {
      setError('接口名称、路径和方法不能为空。');
      setSuccess('');
      return;
    }

    const exists = apis.some((item) => item.id === editingApi.id);
    const nextApis = exists
      ? apis.map((item) => (item.id === editingApi.id ? editingApi : item))
      : [...apis, editingApi];
    const saved = await persistApis(nextApis, exists ? '接口已更新。' : '接口已创建。');
    if (saved) {
      setEditingApi(null);
    }
  };

  const handleDeleteApi = async (apiId: string) => {
    if (!window.confirm('确定删除这个接口吗？')) {
      return;
    }

    const saved = await persistApis(apis.filter((item) => item.id !== apiId), '接口已删除。');
    if (saved && editingApi?.id === apiId) {
      setEditingApi(null);
    }
  };

  const handleToggleApiStatus = async (apiId: string) => {
    const nextApis = apis.map((item) =>
      item.id === apiId
        ? {
            ...item,
            status: (item.status === 'enabled' ? 'disabled' : 'enabled') as ApiItem['status'],
          }
        : item,
    );

    await persistApis(nextApis, '接口状态已更新。');
  };

  const handleReadmeSave = async () => {
    setBusySection('readme');
    clearFeedback();

    try {
      const payload = await postJson<{ repoSync?: { message?: string } }>('/api/data/docs/readme', {
        content: readmeContent,
      });
      setSuccess(
        payload.repoSync?.message
          ? `README 已保存，并完成同步：${payload.repoSync.message}`
          : 'README 已保存。',
      );
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : '保存 README 失败');
    } finally {
      setBusySection(null);
    }
  };

  const handleApiDocSave = async () => {
    clearFeedback();

    try {
      JSON.parse(docPropContent);
    } catch {
      setError('API 文档配置必须是有效的 JSON。');
      return;
    }

    setBusySection('api-doc');
    try {
      const payload = await postJson<{ repoSync?: { message?: string } }>('/api/data/docs/api', {
        content: docPropContent,
      });
      setSuccess(
        payload.repoSync?.message
          ? `API 文档配置已保存，并完成同步：${payload.repoSync.message}`
          : 'API 文档配置已保存。',
      );
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : '保存 API 文档失败');
    } finally {
      setBusySection(null);
    }
  };

  const handleConfigSave = async () => {
    setBusySection('settings');
    clearFeedback();

    try {
      await postJson('/api/sys', {
        apiManagement: { apis },
        providerManagement: { providers },
        configuration: {
          githubProjectPath: sysConfig.project.github.trim(),
          apiTimeout: Math.max(1, Number(sysConfig.api.timeout)) * 1000,
          maxConcurrentRequests: Math.max(1, Number(sysConfig.api.maxConcurrentRequests)),
        },
      });
      setSuccess('系统设置已保存。');
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : '保存系统设置失败');
    } finally {
      setBusySection(null);
    }
  };

  const providerNameById = (providerId: string): string =>
    providers.find((item) => item.id === providerId)?.name || '未分配';

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md rounded-[2rem]">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="rounded-full border border-border bg-background/70 p-4">
              <RefreshCcw className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold">正在加载后台控制台</p>
              <p className="text-sm text-muted-foreground">读取会话、配置与文档内容中。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="flex flex-col border-b border-border/80 bg-sidebar lg:w-[248px] lg:border-b-0 lg:border-r">
          <div className="border-b border-border/80 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/80">
                <Image src="/logo.svg" alt="bendy music logo" width={24} height={24} className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black tracking-[-0.04em]">Admin Console</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bendywork Service Base</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 px-4 py-5">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === activeMenu;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveMenu(item.id)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-[1.35rem] px-3 py-3 text-left transition-colors',
                          active ? 'bg-foreground text-background shadow-sm' : 'hover:bg-background/70',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 rounded-xl border p-2',
                            active ? 'border-white/15 bg-white/10' : 'border-border bg-background/70',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className={cn('mt-0.5 text-xs', active ? 'text-background/75' : 'text-muted-foreground')}>
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto border-t border-border/80 px-4 py-4">
            <div className="rounded-[1.5rem] border border-border bg-background/75 p-3">
              <div className="flex items-center gap-3">
                <Image
                  src={userInfo.avatar_url}
                  alt={userInfo.login}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-2xl border border-border object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{userInfo.login}</p>
                  <p className="truncate text-xs text-muted-foreground">{userInfo.name || 'GitHub 管理员'}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-border bg-card/70 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    系统版本
                  </div>
                  <span className="text-sm font-bold">v{appVersion}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="mt-3 w-full justify-start rounded-xl px-3"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 text-[14px]">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-background/82 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {currentMenu?.label || '控制台'}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.05em]">{currentMenu?.description}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  GitHub Session
                </Badge>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="space-y-5 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            {error ? (
              <div className="rounded-[1.5rem] border border-zinc-400/60 bg-zinc-200/55 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-[1.5rem] border border-border bg-card/90 px-4 py-3 text-sm">{success}</div>
            ) : null}

            {activeMenu === 'dashboard' ? (
              <OverviewPanel
                dashboardData={dashboardData}
                providersCount={providers.length}
                enabledProviders={providers.filter((item) => item.status === 'enabled').length}
                apisCount={apis.length}
                enabledApis={apis.filter((item) => item.status === 'enabled').length}
                repository={sysConfig.project.github}
              />
            ) : null}

            {activeMenu === 'provider-management' ? (
              <ProviderPanel
                providers={providers}
                editingProvider={editingProvider}
                busy={busySection === 'providers'}
                onAdd={() => setEditingProvider(createEmptyProvider())}
                onEdit={(provider) => setEditingProvider({ ...provider })}
                onCancelEdit={() => setEditingProvider(null)}
                onChange={(provider) => setEditingProvider(provider)}
                onSave={() => void handleSaveProvider()}
                onDelete={(providerId) => void handleDeleteProvider(providerId)}
                onToggleStatus={(providerId) => void handleToggleProviderStatus(providerId)}
              />
            ) : null}

            {activeMenu === 'api-management' ? (
              <ApiPanel
                apis={apis}
                providers={providers}
                editingApi={editingApi}
                busy={busySection === 'apis'}
                onAdd={() => setEditingApi(createEmptyApi())}
                onEdit={(api) => setEditingApi({ ...api })}
                onCancelEdit={() => setEditingApi(null)}
                onChange={(api) => setEditingApi(api)}
                onSave={() => void handleSaveApi()}
                onDelete={(apiId) => void handleDeleteApi(apiId)}
                onToggleStatus={(apiId) => void handleToggleApiStatus(apiId)}
                providerNameById={providerNameById}
              />
            ) : null}

            {activeMenu === 'doc-management' ? (
              <DocsPanel
                activeDocTab={activeDocTab}
                onDocTabChange={setActiveDocTab}
                readmeContent={readmeContent}
                onReadmeChange={setReadmeContent}
                docPropContent={docPropContent}
                onDocPropChange={setDocPropContent}
                readmeBusy={busySection === 'readme'}
                apiBusy={busySection === 'api-doc'}
                onSaveReadme={() => void handleReadmeSave()}
                onSaveApiDoc={() => void handleApiDocSave()}
              />
            ) : null}

            {activeMenu === 'config-management' ? (
              <SettingsPanel
                sysConfig={sysConfig}
                busy={busySection === 'settings'}
                onChange={(config) => setSysConfig(config)}
                onSave={() => void handleConfigSave()}
              />
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-border bg-card/70 px-4 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                后台布局已扩展为左右贴合的全宽视图，并收紧整体密度。
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  README / API doc 文件直写
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  主题切换位于顶部右侧
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
