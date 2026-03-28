import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getGitHubAuthRuntimeConfig } from '@/lib/server/global-config';

const GITHUB_OAUTH_STATE_COOKIE = 'github_oauth_state';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const runtimeConfig = getGitHubAuthRuntimeConfig(request.nextUrl.origin);

  if (!runtimeConfig.clientId) {
    return NextResponse.redirect(
      new URL('/login?error=missing_github_oauth_config', request.url),
    );
  }

  const state = randomBytes(24).toString('hex');
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', runtimeConfig.clientId);
  authorizeUrl.searchParams.set('redirect_uri', runtimeConfig.redirectUri);
  authorizeUrl.searchParams.set('scope', runtimeConfig.scopes.join(' '));
  authorizeUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set({
    name: GITHUB_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  });

  return response;
}
