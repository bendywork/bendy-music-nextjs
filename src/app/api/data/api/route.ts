import { NextRequest, NextResponse } from 'next/server';
import type { ApiItem } from '@/lib/admin-config';
import { saveApiConfig, loadApiConfig } from '@/lib/server/admin-config-store';

export async function GET() {
  try {
    return NextResponse.json(await loadApiConfig());
  } catch (error) {
    console.error('Failed to read API config:', error);
    return NextResponse.json(
      { error: 'Failed to read API config' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiConfig = (await request.json()) as { apis?: ApiItem[] };
    const stored = await saveApiConfig(apiConfig.apis ?? []);

    return NextResponse.json({
      message: 'API config saved',
      data: stored,
    });
  } catch (error) {
    console.error('Failed to save API config:', error);
    return NextResponse.json(
      { error: 'Failed to save API config' },
      { status: 500 },
    );
  }
}
