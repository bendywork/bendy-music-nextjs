import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
} from '@/lib/server/auth-session';
import { getGitHubAuthRuntimeConfig } from '@/lib/server/global-config';

const GITHUB_OAUTH_STATE_COOKIE = 'github_oauth_state';

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  login: string;
  name?: string;
  avatar_url?: string;
}

const isAdminMatched = (login: string | undefined, adminUsers: string[]): boolean => {
  const normalizedLogin = login?.toLowerCase().trim();
  if (!normalizedLogin) {
    return false;
  }

  return adminUsers.some((adminUser) => {
    const normalizedAdmin = adminUser.toLowerCase().trim();
    if (!normalizedAdmin) {
      return false;
    }

    return (
      normalizedAdmin === normalizedLogin
      || normalizedAdmin.includes(normalizedLogin)
      || normalizedLogin.includes(normalizedAdmin)
    );
  });
};

const redirectToLogin = (request: NextRequest, errorCode: string, login?: string) => {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('error', errorCode);
  if (login) {
    loginUrl.searchParams.set('login', login);
  }

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
  return response;
};

const buildBootstrapHtml = (token: string, user: GitHubUserResponse) => {
  const bootstrapPayload = JSON.stringify({
    token,
    login: user.login,
    avatarUrl: user.avatar_url ?? 'https://github.com/favicon.ico',
    name: user.name ?? user.login,
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Signing in...</title>
</head>
<body>
  <script>
    (function () {
      try {
        var payload = ${bootstrapPayload};
        localStorage.setItem('github_token', payload.token);
        localStorage.setItem('is_authenticated', 'true');
        localStorage.setItem('auth_timestamp', String(Date.now()));
        localStorage.setItem('github_login', payload.login);
        localStorage.setItem('github_avatar_url', payload.avatarUrl);
      } catch (e) {
        console.error(e);
      }
      window.location.replace('/dashboard');
    })();
  </script>
</body>
</html>`;
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const incomingError = request.nextUrl.searchParams.get('error');
  if (incomingError) {
    return redirectToLogin(request, 'oauth_callback_error');
  }

  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const expectedState = request.cookies.get(GITHUB_OAUTH_STATE_COOKIE)?.value;

  if (!state || !code || !expectedState || state !== expectedState) {
    return redirectToLogin(request, 'oauth_state_mismatch');
  }

  const runtimeConfig = getGitHubAuthRuntimeConfig(request.nextUrl.origin);
  if (!runtimeConfig.clientId || !runtimeConfig.clientSecret) {
    return redirectToLogin(request, 'missing_github_oauth_config');
  }

  try {
    const tokenBody = new URLSearchParams({
      client_id: runtimeConfig.clientId,
      client_secret: runtimeConfig.clientSecret,
      code,
      redirect_uri: runtimeConfig.redirectUri,
      state,
    });

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
      cache: 'no-store',
    });

    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token || tokenData.error) {
      return redirectToLogin(request, 'oauth_token_exchange_failed');
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    });

    if (!userResponse.ok) {
      return redirectToLogin(request, 'github_user_fetch_failed');
    }

    const user = (await userResponse.json()) as GitHubUserResponse;
    const isAdmin = isAdminMatched(user.login, runtimeConfig.adminUsers);

    if (!isAdmin) {
      return redirectToLogin(request, 'unauthorized_admin', user.login);
    }

    const now = Date.now();
    const sessionToken = createAdminSessionToken({
      login: user.login,
      name: user.name ?? user.login,
      avatarUrl: user.avatar_url ?? 'https://github.com/favicon.ico',
      accessToken: tokenData.access_token,
      issuedAt: now,
      expiresAt: now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    });

    const response = new NextResponse(buildBootstrapHtml(tokenData.access_token, user), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });
    response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);

    return response;
  } catch (error) {
    console.error('GitHub OAuth callback failed:', error);
    return redirectToLogin(request, 'oauth_callback_failed');
  }
}
