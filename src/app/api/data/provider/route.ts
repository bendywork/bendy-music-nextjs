import { NextRequest, NextResponse } from 'next/server';
import type { ProviderItem } from '@/lib/admin-config';
import { saveProviderConfig, loadProviderConfig } from '@/lib/server/admin-config-store';

export async function GET() {
  try {
    return NextResponse.json(await loadProviderConfig());
  } catch (error) {
    console.error('Failed to read provider config:', error);
    return NextResponse.json(
      { error: 'Failed to read provider config' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const providerConfig = (await request.json()) as { providers?: ProviderItem[] };
    const stored = await saveProviderConfig(providerConfig.providers ?? []);

    return NextResponse.json({
      message: 'Provider config saved',
      data: stored,
    });
  } catch (error) {
    console.error('Failed to save provider config:', error);
    return NextResponse.json(
      { error: 'Failed to save provider config' },
      { status: 500 },
    );
  }
}
