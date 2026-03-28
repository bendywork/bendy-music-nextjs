import { NextRequest, NextResponse } from 'next/server';
import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue } from '@/lib/server/data-store';

const DEFAULT_SYS_CONFIG = {
  apiManagement: {
    apis: [],
  },
  providerManagement: {
    providers: [],
  },
  configuration: {
    githubProjectPath: 'https://github.com/yokeay/ddmusic-nextjs',
    apiTimeout: 300000,
    maxConcurrentRequests: 100,
  },
};

export async function GET() {
  try {
    const sysConfig = await getStoredValue(
      STORE_KEYS.SYS_CONFIG,
      () => readJsonFile('sys.json', DEFAULT_SYS_CONFIG),
    );

    return NextResponse.json(sysConfig);
  } catch (error) {
    console.error('Failed to read system config:', error);
    return NextResponse.json(
      { error: 'Failed to read system config' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sysConfig = await request.json();
    const stored = await setStoredValue(STORE_KEYS.SYS_CONFIG, sysConfig);

    return NextResponse.json({
      message: 'System config saved',
      data: stored,
    });
  } catch (error) {
    console.error('Failed to save system config:', error);
    return NextResponse.json(
      { error: 'Failed to save system config' },
      { status: 500 },
    );
  }
}
