'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';
import { ArrowLeft, Clock3, SendHorizontal, Waypoints } from 'lucide-react';
import type { ApiItem, ProviderItem } from '@/lib/admin-config';
import { useLocale } from '@/components/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast-provider';
import { controlClassName } from '@/components/dashboard/shared';
import type { SessionResponse } from '@/components/dashboard/types';
import { dashboardCopy } from '@/lib/i18n/dashboard';

interface DebugResponseState {
  ok: boolean;
  status: number;
  durationMs: number;
  requestUrl: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
}

interface DebugFormState {
  method: string;
  path: string;
  pathType: ApiItem['pathType'];
  requestType: string;
  provider: string;
  params: string;
  headers: string;
  body: string;
}

const INTERNAL_ROUTE_PREFIXES = ['/api', '/dashboard', '/docs', '/login', '/_next'];

const parseParamsText = (raw: string): URLSearchParams => {
  return new URLSearchParams(raw.replace(/\r?\n/g, '&').trim());
};

const resolvePreviewUrl = (origin: string, form: DebugFormState, provider?: ProviderItem): string => {
  const trimmedPath = form.path.trim() || '/api';
  const isAbsolute = form.pathType === 'absolute' || /^https?:\/\//i.test(trimmedPath);
  const isInternalPath = INTERNAL_ROUTE_PREFIXES.some((prefix) => trimmedPath.startsWith(prefix));

  let baseUrl: URL;
  if (isAbsolute) {
    baseUrl = new URL(trimmedPath);
  } else if (provider?.baseUrl && !isInternalPath) {
    const normalizedBaseUrl = provider.baseUrl.endsWith('/') ? provider.baseUrl : `${provider.baseUrl}/`;
    baseUrl = new URL(trimmedPath.replace(/^\/+/, ''), normalizedBaseUrl);
  } else {
    baseUrl = new URL(trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`, origin);
  }

  const queryParams = parseParamsText(form.params);
  if (isInternalPath && form.requestType.trim() && !queryParams.has('type')) {
    queryParams.set('type', form.requestType.trim());
  }

  baseUrl.search = queryParams.toString();
  return baseUrl.toString();
};

const normalizeResponseBody = (value: string): string => {
  if (!value.trim()) {
    return '';
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export default function ApiDebugPage() {
  const params = useParams<{ apiId: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const { toast } = useToast();
  const copy = dashboardCopy[locale] as (typeof dashboardCopy)['zh'];
  const debugCopy = copy.debugger;
  const apiId = typeof params.apiId === 'string' ? params.apiId : '';

  const [initializing, setInitializing] = useState(true);
  const [sending, setSending] = useState(false);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [form, setForm] = useState<DebugFormState>({
    method: 'GET',
    path: '/api',
    pathType: 'relative',
    requestType: 'info',
    provider: '',
    params: '',
    headers: '',
    body: '',
  });
  const [responseState, setResponseState] = useState<DebugResponseState | null>(null);

  const currentProvider = providers.find((item) => item.id === form.provider);
  const requestPreviewUrl = typeof window === 'undefined'
    ? ''
    : resolvePreviewUrl(window.location.origin, form, currentProvider);

  const initializePage = useEffectEvent(async () => {
    setInitializing(true);

    try {
      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!sessionResponse.ok) {
        throw new Error('Unauthenticated');
      }

      const sessionPayload = (await sessionResponse.json()) as SessionResponse;
      if (!sessionPayload.data?.authenticated) {
        throw new Error('Unauthenticated');
      }

      const [apiResponse, providerResponse] = await Promise.all([
        fetch('/api/data/api', { cache: 'no-store' }),
        fetch('/api/data/provider', { cache: 'no-store' }),
      ]);

      if (!apiResponse.ok || !providerResponse.ok) {
        throw new Error(debugCopy.loadFailed);
      }

      const apiPayload = (await apiResponse.json()) as { apis?: ApiItem[] };
      const providerPayload = (await providerResponse.json()) as { providers?: ProviderItem[] };
      const loadedApis = apiPayload.apis ?? [];
      const loadedProviders = providerPayload.providers ?? [];
      const matchedApi = loadedApis.find((item) => item.id === apiId);

      if (!matchedApi) {
        toast({ title: debugCopy.notFound, variant: 'error' });
        router.replace('/dashboard');
        return;
      }

      setProviders(loadedProviders);
      setSelectedApi(matchedApi);
      setForm({
        method: matchedApi.method,
        path: matchedApi.path,
        pathType: matchedApi.pathType,
        requestType: matchedApi.requestType,
        provider: matchedApi.provider,
        params: matchedApi.params,
        headers: matchedApi.headers,
        body: '',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthenticated') {
        router.replace('/login');
        return;
      }

      toast({
        title: debugCopy.loadFailed,
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      router.replace('/dashboard');
    } finally {
      setInitializing(false);
    }
  });

  useEffect(() => {
    void initializePage();
  }, []);

  const handleSendRequest = async () => {
    if (!selectedApi) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/debug/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiId: selectedApi.id,
          method: form.method,
          path: form.path,
          pathType: form.pathType,
          requestType: form.requestType,
          provider: form.provider,
          params: form.params,
          headers: form.headers,
          body: form.body,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | DebugResponseState
        | {
            error?: string;
          };

      if (!response.ok) {
        throw new Error('error' in payload ? payload.error || debugCopy.sendFailed : debugCopy.sendFailed);
      }

      const nextResponseState = payload as DebugResponseState;
      setResponseState({
        ...nextResponseState,
        responseBody: normalizeResponseBody(nextResponseState.responseBody),
      });

      if (!nextResponseState.ok) {
        toast({
          title: debugCopy.sendFailed,
          description: `${debugCopy.statusLabel} ${nextResponseState.status}`,
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: debugCopy.sendFailed,
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md rounded-[2rem]">
          <CardContent className="space-y-2 p-8 text-center">
            <p className="text-lg font-bold">{debugCopy.loadingTitle}</p>
            <p className="text-sm text-muted-foreground">{debugCopy.loadingDescription}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card/70 p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline">{copy.apis.sectionTitle}</Badge>
              <h1 className="text-3xl font-black tracking-[-0.05em]">{debugCopy.title}</h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{debugCopy.description}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                {debugCopy.back}
              </Link>
            </Button>
          </div>

          {selectedApi ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-[1.6rem] border border-border/80">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {debugCopy.summaryTitle}
                  </p>
                  <p className="mt-2 text-base font-semibold">{selectedApi.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{debugCopy.summaryDescription}</p>
                </CardContent>
              </Card>
              <Card className="rounded-[1.6rem] border border-border/80">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {debugCopy.providerLabel}
                  </p>
                  <p className="mt-2 text-base font-semibold">{currentProvider?.name || debugCopy.noProvider}</p>
                </CardContent>
              </Card>
              <Card className="rounded-[1.6rem] border border-border/80">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {debugCopy.requestTypeLabel}
                  </p>
                  <p className="mt-2 font-mono text-sm">{form.requestType || '-'}</p>
                </CardContent>
              </Card>
              <Card className="rounded-[1.6rem] border border-border/80">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {debugCopy.pathTypeLabel}
                  </p>
                  <p className="mt-2 text-base font-semibold">{copy.apis.pathTypeLabels[form.pathType]}</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>{debugCopy.requestCardTitle}</CardTitle>
              <CardDescription>{debugCopy.requestCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{debugCopy.methodLabel}</label>
                  <select
                    value={form.method}
                    onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
                    className={controlClassName}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{debugCopy.pathTypeLabel}</label>
                  <select
                    value={form.pathType}
                    onChange={(event) => setForm((current) => ({ ...current, pathType: event.target.value as ApiItem['pathType'] }))}
                    className={controlClassName}
                  >
                    <option value="relative">{copy.apis.pathTypeLabels.relative}</option>
                    <option value="absolute">{copy.apis.pathTypeLabels.absolute}</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold">{debugCopy.pathLabel}</label>
                  <Input
                    value={form.path}
                    onChange={(event) => setForm((current) => ({ ...current, path: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{debugCopy.requestTypeLabel}</label>
                  <Input
                    value={form.requestType}
                    onChange={(event) => setForm((current) => ({ ...current, requestType: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{debugCopy.providerLabel}</label>
                  <select
                    value={form.provider}
                    onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
                    className={controlClassName}
                  >
                    <option value="">{debugCopy.noProvider}</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{debugCopy.paramsLabel}</label>
                <Textarea
                  value={form.params}
                  onChange={(event) => setForm((current) => ({ ...current, params: event.target.value }))}
                  className="min-h-[110px] font-mono text-xs"
                  placeholder={debugCopy.paramsPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{debugCopy.headersLabel}</label>
                <Textarea
                  value={form.headers}
                  onChange={(event) => setForm((current) => ({ ...current, headers: event.target.value }))}
                  className="min-h-[110px] font-mono text-xs"
                  placeholder={debugCopy.headersPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{debugCopy.bodyLabel}</label>
                <Textarea
                  value={form.body}
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  className="min-h-[150px] font-mono text-xs"
                  placeholder={debugCopy.bodyPlaceholder}
                />
              </div>

              <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Waypoints className="h-4 w-4" />
                  {debugCopy.targetUrlLabel}
                </div>
                <p className="mt-2 break-all font-mono text-xs leading-6">{requestPreviewUrl || '-'}</p>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => void handleSendRequest()} disabled={sending}>
                  <SendHorizontal className="h-4 w-4" />
                  {sending ? debugCopy.sending : debugCopy.send}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>{debugCopy.responseCardTitle}</CardTitle>
              <CardDescription>{debugCopy.responseCardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {responseState ? (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-border bg-background/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {debugCopy.statusLabel}
                      </p>
                      <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{responseState.status}</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border bg-background/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {debugCopy.durationLabel}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
                        <Clock3 className="h-5 w-5" />
                        {responseState.durationMs}ms
                      </div>
                    </div>
                    <div className="rounded-[1.4rem] border border-border bg-background/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {debugCopy.targetUrlLabel}
                      </p>
                      <p className="mt-2 break-all font-mono text-xs leading-6">{responseState.requestUrl}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">{debugCopy.headersResultLabel}</label>
                    <Textarea
                      readOnly
                      value={JSON.stringify(responseState.responseHeaders, null, 2)}
                      className="min-h-[150px] font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">{debugCopy.bodyResultLabel}</label>
                    <Textarea
                      readOnly
                      value={responseState.responseBody || debugCopy.noResponseBody}
                      className="min-h-[320px] font-mono text-xs"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-background/60 px-4 py-14 text-center text-sm text-muted-foreground">
                  {debugCopy.emptyResponse}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
