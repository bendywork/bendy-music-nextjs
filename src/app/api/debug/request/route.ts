import { NextRequest, NextResponse } from 'next/server';
import type { ApiItem, ProviderItem } from '@/lib/admin-config';
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/server/auth-session';
import { loadApiConfig, loadProviderConfig, loadSystemConfig } from '@/lib/server/admin-config-store';

interface DebugRequestPayload {
  apiId: string;
  method?: string;
  path?: string;
  pathType?: ApiItem['pathType'];
  requestType?: string;
  provider?: string;
  params?: string;
  headers?: string;
  body?: string;
}

const INTERNAL_ROUTE_PREFIXES = ['/api', '/dashboard', '/docs', '/login', '/_next'];

const parseQueryText = (raw: string): URLSearchParams => {
  const params = new URLSearchParams();
  const normalized = raw.replace(/\r?\n/g, '&').trim();

  if (!normalized) {
    return params;
  }

  for (const [key, value] of new URLSearchParams(normalized).entries()) {
    params.append(key, value);
  }

  return params;
};

const parseHeadersText = (raw: string): Headers => {
  const headers = new Headers();

  for (const line of raw.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    const separatorIndex = trimmedLine.includes(':')
      ? trimmedLine.indexOf(':')
      : trimmedLine.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key) {
      headers.set(key, value);
    }
  }

  return headers;
};

const isInternalPath = (path: string): boolean => {
  return INTERNAL_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const resolveTargetUrl = ({
  origin,
  path,
  pathType,
  provider,
}: {
  origin: string;
  path: string;
  pathType: ApiItem['pathType'];
  provider?: ProviderItem;
}): URL => {
  const trimmedPath = path.trim();

  if (!trimmedPath) {
    return new URL('/api', origin);
  }

  if (pathType === 'absolute' || /^https?:\/\//i.test(trimmedPath)) {
    return new URL(trimmedPath);
  }

  if (provider?.baseUrl && !isInternalPath(trimmedPath)) {
    const normalizedBaseUrl = provider.baseUrl.endsWith('/') ? provider.baseUrl : `${provider.baseUrl}/`;
    return new URL(trimmedPath.replace(/^\/+/, ''), normalizedBaseUrl);
  }

  return new URL(trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`, origin);
};

const normalizeBody = (method: string, body: string, headers: Headers): string | undefined => {
  if (method === 'GET' || method === 'DELETE' || !body.trim()) {
    return undefined;
  }

  if (!headers.has('Content-Type')) {
    const trimmedBody = body.trim();
    headers.set('Content-Type', trimmedBody.startsWith('{') || trimmedBody.startsWith('[') ? 'application/json' : 'text/plain');
  }

  return body;
};

const toObject = (headers: Headers): Record<string, string> => {
  return Object.fromEntries(headers.entries());
};

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(sessionToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as DebugRequestPayload;
    const [{ apis }, { providers }, systemConfig] = await Promise.all([
      loadApiConfig(),
      loadProviderConfig(),
      loadSystemConfig(),
    ]);

    const targetApi = apis.find((item) => item.id === payload.apiId);
    if (!targetApi) {
      return NextResponse.json({ error: 'API config not found' }, { status: 404 });
    }

    const requestType = payload.requestType?.trim() || targetApi.requestType.trim();
    const providerId = payload.provider?.trim() || targetApi.provider;
    const provider = providers.find((item) => item.id === providerId);
    const targetUrl = resolveTargetUrl({
      origin: request.nextUrl.origin,
      path: payload.path?.trim() || targetApi.path,
      pathType: payload.pathType || targetApi.pathType,
      provider,
    });

    const queryParams = parseQueryText(payload.params ?? targetApi.params);
    if (isInternalPath(targetUrl.pathname) && requestType && !queryParams.has('type')) {
      queryParams.set('type', requestType);
    }
    targetUrl.search = queryParams.toString();

    const headers = parseHeadersText(payload.headers ?? targetApi.headers);
    headers.delete('host');
    headers.delete('x-forwarded-host');
    headers.delete('x-forwarded-proto');
    headers.delete('content-length');
    if (targetUrl.origin === request.nextUrl.origin && request.headers.get('cookie') && !headers.has('cookie')) {
      headers.set('cookie', request.headers.get('cookie') as string);
    }

    const method = (payload.method?.trim().toUpperCase() || targetApi.method.trim().toUpperCase() || 'GET');
    const body = normalizeBody(method, payload.body ?? '', headers);
    const timeoutMs = Math.max(1000, Number(systemConfig.configuration.apiTimeout) || 300000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(targetUrl, {
        method,
        headers,
        body,
        cache: 'no-store',
        signal: controller.signal,
      });

      const responseText = await response.text();
      const responseHeaders = new Headers(response.headers);
      let formattedBody = responseText;

      try {
        formattedBody = JSON.stringify(JSON.parse(responseText), null, 2);
      } catch {
        formattedBody = responseText;
      }

      return NextResponse.json({
        ok: response.ok,
        status: response.status,
        durationMs: Date.now() - startedAt,
        requestUrl: targetUrl.toString(),
        responseHeaders: toObject(responseHeaders),
        responseBody: formattedBody,
        rawResponseBody: responseText,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown debug request error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('aborted') ? 504 : 500 },
    );
  }
}
