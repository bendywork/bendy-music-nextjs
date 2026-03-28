import { NextRequest, NextResponse } from 'next/server';
import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue } from '@/lib/server/data-store';

export async function GET() {
  try {
    const apiConfig = await getStoredValue(
      STORE_KEYS.API_CONFIG,
      () => readJsonFile('data/api.json', { apis: [] }),
    );

    return NextResponse.json(apiConfig);
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
    const apiConfig = await request.json();
    const stored = await setStoredValue(STORE_KEYS.API_CONFIG, apiConfig);

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
