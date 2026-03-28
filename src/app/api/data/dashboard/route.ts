import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/lib/dashboard';
import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue } from '@/lib/server/data-store';

const DEFAULT_DASHBOARD_DATA = {
  proxyRequestCount: 0,
  systemUptime: 0,
  recentRequests: [],
  serviceStatus: [
    { name: 'kuwo', displayName: 'Kuwo', errorCount: 0, status: 'Normal' },
    { name: 'qq', displayName: 'QQ Music', errorCount: 0, status: 'Normal' },
    { name: 'Netease', displayName: 'Netease Music', errorCount: 0, status: 'Normal' },
  ],
  lastSyncTime: 0,
};

export async function GET() {
  try {
    const liveData = dashboardService.getData();
    const stored = await setStoredValue(STORE_KEYS.DASHBOARD, liveData);
    return NextResponse.json(stored);
  } catch (error) {
    console.warn('Failed to read live dashboard data, fallback to stored data:', error);

    try {
      const fallback = await getStoredValue(
        STORE_KEYS.DASHBOARD,
        () => readJsonFile('data/dashboard.json', DEFAULT_DASHBOARD_DATA),
      );
      return NextResponse.json(fallback);
    } catch (fallbackError) {
      console.error('Failed to read dashboard data:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to read dashboard data' },
        { status: 500 },
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const dashboardData = await request.json();
    const stored = await setStoredValue(STORE_KEYS.DASHBOARD, dashboardData);

    return NextResponse.json({
      message: 'Dashboard data saved',
      data: stored,
    });
  } catch (error) {
    console.error('Failed to save dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard data' },
      { status: 500 },
    );
  }
}
