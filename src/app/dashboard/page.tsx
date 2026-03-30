'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';
import {
  BookText,
  Cable,
  ExternalLink,
  Gauge,
  Languages,
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
  DEFAULT_DASHBOARD_DATA,
  DEFAULT_DOCS_PAGE,
  DEFAULT_README,
  DEFAULT_SYSTEM_CONFIG,
  DEFAULT_USER,
  postJson,
  type DocTabKey,
  type SessionResponse,
  type SystemConfigState,
  type UserInfo,
} from '@/components/dashboard/types';
import type { DashboardLocale } from '@/lib/i18n/dashboard';
import { dashboardCopy } from '@/lib/i18n/dashboard';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { githubService } from '@/lib/github';
import { cn } from '@/lib/utils';

const appVersion = packageJson.version;
const LOCALE_STORAGE_KEY = 'dashboard_locale';

export default function DashboardPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<DashboardLocale>('zh');
  const [activeMenu, setActiveMenu] = useState<DashboardMenuKey>('dashboard');
  const [activeDocTab, setActiveDocTab] = useState<DocTabKey>('readme');
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [busySection, setBusySection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [readmeContent, setReadmeContent] = useState(DEFAULT_README);
  const [docsPageContent, setDocsPageContent] = useState(DEFAULT_DOCS_PAGE);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [editingProvider, setEditingProvider] = useState<ProviderItem | null>(null);
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [editingApi, setEditingApi] = useState<ApiItem | null>(null);
  const [sysConfig, setSysConfig] = useState<SystemConfigState>(DEFAULT_SYSTEM_CONFIG);
  const [userInfo, setUserInfo] = useState<UserInfo>(DEFAULT_USER);
  const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD_DATA);

  const copy = dashboardCopy[locale] as (typeof dashboardCopy)['zh'];
  const currentMenuGroup = copy.menuGroups.flatMap((group) => [...group.items]).find((item) => item.id === activeMenu);

  useEffect(() => {
    const storedLocale = typeof window !== 'undefined'
      ? window.localStorage.getItem(LOCALE_STORAGE_KEY)
      : null;

    if (storedLocale === 'zh' || storedLocale === 'en') {
      setLocale(storedLocale);
    }
  }, []);

  const updateLocale = (nextLocale: DashboardLocale) => {
    setLocale(nextLocale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
  };

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
        setDocsPageContent(payload.content || DEFAULT_DOCS_PAGE);
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
  }, []);

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
      setError(persistError instanceof Error ? persistError.message : copy.messages.saveProvidersFailed);
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
      setError(persistError instanceof Error ? persistError.message : copy.messages.saveApisFailed);
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
      setError(copy.messages.providerNameRequired);
      setSuccess('');
      return;
    }

    const exists = providers.some((item) => item.id === editingProvider.id);
    const nextProviders = exists
      ? providers.map((item) => (item.id === editingProvider.id ? editingProvider : item))
      : [...providers, editingProvider];
    const saved = await persistProviders(nextProviders, exists ? copy.messages.providerUpdated : copy.messages.providerCreated);
    if (saved) {
      setEditingProvider(null);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!window.confirm(copy.messages.deleteProviderConfirm)) {
      return;
    }

    const saved = await persistProviders(
      providers.filter((item) => item.id !== providerId),
      copy.messages.providerDeleted,
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

    await persistProviders(nextProviders, copy.messages.providerStatusUpdated);
  };

  const handleSaveApi = async () => {
    if (!editingApi) {
      return;
    }

    if (!editingApi.name.trim() || !editingApi.path.trim() || !editingApi.method.trim()) {
      setError(copy.messages.apiRequired);
      setSuccess('');
      return;
    }

    const exists = apis.some((item) => item.id === editingApi.id);
    const nextApis = exists
      ? apis.map((item) => (item.id === editingApi.id ? editingApi : item))
      : [...apis, editingApi];
    const saved = await persistApis(nextApis, exists ? copy.messages.apiUpdated : copy.messages.apiCreated);
    if (saved) {
      setEditingApi(null);
    }
  };

  const handleDeleteApi = async (apiId: string) => {
    if (!window.confirm(copy.messages.deleteApiConfirm)) {
      return;
    }

    const saved = await persistApis(apis.filter((item) => item.id !== apiId), copy.messages.apiDeleted);
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

    await persistApis(nextApis, copy.messages.apiStatusUpdated);
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
          ? `${copy.messages.readmeSavedAndSynced} ${payload.repoSync.message}`
          : copy.messages.readmeSaved,
      );
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : copy.messages.readmeSaveFailed);
    } finally {
      setBusySection(null);
    }
  };

  const handleDocsPageSave = async () => {
    clearFeedback();
    setBusySection('docs-page');

    try {
      const payload = await postJson<{ repoSync?: { message?: string } }>('/api/data/docs/api', {
        content: docsPageContent,
      });
      setSuccess(
        payload.repoSync?.message
          ? `${copy.messages.docsSavedAndSynced} ${payload.repoSync.message}`
          : copy.messages.docsSaved,
      );
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : copy.messages.docsSaveFailed);
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
      setSuccess(copy.messages.settingsSaved);
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : copy.messages.settingsSaveFailed);
    } finally {
      setBusySection(null);
    }
  };

  const providerNameById = (providerId: string): string =>
    providers.find((item) => item.id === providerId)?.name || copy.messages.unassigned;

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md rounded-[2rem]">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="rounded-full border border-border bg-background/70 p-4">
              <RefreshCcw className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold">{copy.loadingTitle}</p>
              <p className="text-sm text-muted-foreground">{copy.loadingDesc}</p>
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
                <p className="text-lg font-black tracking-[-0.04em]">{copy.appTitle}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.appSubtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 px-4 py-5">
            {copy.menuGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const iconMap = {
                      dashboard: Gauge,
                      'provider-management': Cable,
                      'api-management': Waypoints,
                      'doc-management': BookText,
                      'config-management': Settings2,
                    } as const;
                    const Icon = iconMap[item.id];
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
                  <p className="truncate text-xs text-muted-foreground">{userInfo.name || copy.messages.githubAdmin}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-border bg-card/70 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    {copy.version}
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
                {copy.signOut}
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 text-[14px]">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-background/82 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {currentMenuGroup?.label || copy.menuGroups[0].items[0].label}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.05em]">{currentMenuGroup?.description}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateLocale(locale === 'zh' ? 'en' : 'zh')}
                  title={copy.switchTo}
                >
                  <Languages className="h-4 w-4" />
                  {copy.localeLabel}
                </Button>
                <Badge variant="outline">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  {copy.sessionBadge}
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
                docsPageContent={docsPageContent}
                onDocsPageChange={setDocsPageContent}
                readmeBusy={busySection === 'readme'}
                docsBusy={busySection === 'docs-page'}
                onSaveReadme={() => void handleReadmeSave()}
                onSaveDocsPage={() => void handleDocsPageSave()}
                copy={copy.docs}
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
                {copy.footerLead}
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {copy.footerDocs}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {copy.footerEditable}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
