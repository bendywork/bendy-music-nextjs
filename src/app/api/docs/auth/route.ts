import { NextRequest, NextResponse } from 'next/server';
import {
  DOCS_ACCESS_COOKIE_NAME,
  DOCS_ACCESS_MAX_AGE_SECONDS,
  createDocsAccessToken,
} from '@/lib/server/auth-session';
import { getDocsAccessRuntimeConfig } from '@/lib/server/global-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { password?: string };
    const submittedPassword = payload.password?.trim() || '';
    const docsAccessConfig = getDocsAccessRuntimeConfig();

    if (!submittedPassword || submittedPassword !== docsAccessConfig.password) {
      return NextResponse.json(
        {
          code: 1002,
          message: '密码错误',
          data: null,
        },
        { status: 401 },
      );
    }

    const expiresAt = Date.now() + DOCS_ACCESS_MAX_AGE_SECONDS * 1000;
    const response = NextResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    });

    response.cookies.set({
      name: DOCS_ACCESS_COOKIE_NAME,
      value: createDocsAccessToken(expiresAt),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DOCS_ACCESS_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Failed to create docs access session:', error);
    return NextResponse.json(
      {
        code: 1001,
        message: '文档访问认证失败',
        data: null,
      },
      { status: 500 },
    );
  }
}
