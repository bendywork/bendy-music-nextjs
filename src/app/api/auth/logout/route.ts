import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    code: 0,
    message: 'ok',
    data: null,
  });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
