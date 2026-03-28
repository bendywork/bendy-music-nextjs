import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifyAdminSessionToken(sessionToken);

  if (!session) {
    return NextResponse.json(
      {
        code: 1002,
        message: 'Unauthorized',
        data: {
          authenticated: false,
        },
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    code: 0,
    message: 'ok',
    data: {
      authenticated: true,
      token: session.accessToken,
      user: {
        login: session.login,
        name: session.name,
        avatar_url: session.avatarUrl,
      },
    },
  });
}
