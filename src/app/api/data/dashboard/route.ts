import { NextRequest, NextResponse } from 'next/server';
import { dashboardService, type DashboardData } from '@/lib/dashboard';
import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue } from '@/lib/server/data-store';

const DEFAULT_DASHBOARD_DATA: DashboardData = {
  proxyRequestCount: 0,
  systemUptime: 0,
  systemStartedAt: 0,
  uptimeSnapshotAt: 0,
  recentRequests: [],
  serviceStatus: [
    { name: 'kuwo', displayName: 'Kuwo', errorCount: 0, status: 'Normal' },
    { name: 'qq', displayName: 'QQ Music', errorCount: 0, status: 'Normal' },
    { name: 'Netease', displayName: 'Netease Music', errorCount: 0, status: 'Normal' },
  ],
  lastSyncTime: 0,
};

const normalizeDashboardData = (value: Partial<DashboardData>): DashboardData => ({
  ...DEFAULT_DASHBOARD_DATA,
  ...value,
  recentRequests: value.recentRequests ?? DEFAULT_DASHBOARD_DATA.recentRequests,
  serviceStatus: value.serviceStatus ?? DEFAULT_DASHBOARD_DATA.serviceStatus,
});

export async function GET() {
  try {
    dashboardService.initialize();
    const liveData = normalizeDashboardData(dashboardService.getData());
    const stored = await setStoredValue(STORE_KEYS.DASHBOARD, liveData);
    return NextResponse.json(normalizeDashboardData(stored));
  } catch (error) {
    console.warn('Failed to read live dashboard data, fallback to stored data:', error);

    try {
      const fallback = await getStoredValue(
        STORE_KEYS.DASHBOARD,
        () => readJsonFile('data/dashboard.json', DEFAULT_DASHBOARD_DATA),
      );
      return NextResponse.json(normalizeDashboardData(fallback));
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
    const dashboardData = (await request.json()) as Partial<DashboardData>;
    const stored = await setStoredValue(STORE_KEYS.DASHBOARD, normalizeDashboardData(dashboardData));

    return NextResponse.json({
      message: 'Dashboard data saved',
      data: normalizeDashboardData(stored),
    });
  } catch (error) {
    console.error('Failed to save dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard data' },
      { status: 500 },
    );
  }
}
