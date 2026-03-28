import { NextRequest, NextResponse } from 'next/server';
import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue } from '@/lib/server/data-store';

export async function GET() {
  try {
    const providerConfig = await getStoredValue(
      STORE_KEYS.PROVIDER_CONFIG,
      () => readJsonFile('data/provider.json', { providers: [] }),
    );

    return NextResponse.json(providerConfig);
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
    const providerConfig = await request.json();
    const stored = await setStoredValue(STORE_KEYS.PROVIDER_CONFIG, providerConfig);

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
