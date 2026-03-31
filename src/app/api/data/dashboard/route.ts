import { NextRequest, NextResponse } from 'next/server';
import { dashboardService, type DashboardData } from '@/lib/dashboard';
import { readBuildMetadata } from '@/lib/server/build-metadata';
import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue } from '@/lib/server/data-store';

const DEFAULT_DASHBOARD_DATA: DashboardData = {
  proxyRequestCount: 0,
  systemUptime: 0,
  systemStartedAt: 0,
  uptimeSnapshotAt: 0,
  recentRequests: [],
  serviceStatus: [
    { name: 'kuwo', displayName: 'Kuwo Music', errorCount: 0, status: 'Normal' },
    { name: 'qq', displayName: 'QQ Music', errorCount: 0, status: 'Normal' },
    { name: 'netease', displayName: 'Netease Music', errorCount: 0, status: 'Normal' },
  ],
  lastSyncTime: 0,
  latestCommitMessage: '',
  latestCommitTimestamp: 0,
  latestCommitShortHash: '',
};

const normalizeDashboardData = (value: Partial<DashboardData>): DashboardData => ({
  ...DEFAULT_DASHBOARD_DATA,
  ...value,
  recentRequests: Array.isArray(value.recentRequests) ? value.recentRequests : DEFAULT_DASHBOARD_DATA.recentRequests,
  serviceStatus: Array.isArray(value.serviceStatus) ? value.serviceStatus : DEFAULT_DASHBOARD_DATA.serviceStatus,
  latestCommitMessage: typeof value.latestCommitMessage === 'string'
    ? value.latestCommitMessage
    : DEFAULT_DASHBOARD_DATA.latestCommitMessage,
  latestCommitTimestamp: Number.isFinite(value.latestCommitTimestamp)
    ? Number(value.latestCommitTimestamp)
    : DEFAULT_DASHBOARD_DATA.latestCommitTimestamp,
  latestCommitShortHash: typeof value.latestCommitShortHash === 'string'
    ? value.latestCommitShortHash
    : DEFAULT_DASHBOARD_DATA.latestCommitShortHash,
});

const applyLiveUptime = (value: DashboardData): DashboardData => {
  if (!value.systemStartedAt) {
    return value;
  }

  const now = Date.now();

  return {
    ...value,
    systemUptime: Math.max(0, now - value.systemStartedAt),
    uptimeSnapshotAt: now,
  };
};

const applyBuildMetadata = async (value: DashboardData): Promise<DashboardData> => {
  const buildMetadata = await readBuildMetadata();

  return {
    ...value,
    latestCommitMessage: buildMetadata.latestCommitMessage,
    latestCommitTimestamp: buildMetadata.latestCommitTimestamp,
    latestCommitShortHash: buildMetadata.latestCommitShortHash,
  };
};

export async function GET() {
  try {
    await dashboardService.ready();
    const liveData = applyLiveUptime(normalizeDashboardData(dashboardService.getData()));
    return NextResponse.json(await applyBuildMetadata(liveData));
  } catch (error) {
    console.warn('Failed to read live dashboard data, fallback to stored data:', error);

    try {
      const fallback = normalizeDashboardData(
        await getStoredValue(
          STORE_KEYS.DASHBOARD,
          () => readJsonFile('data/dashboard.json', DEFAULT_DASHBOARD_DATA),
        ),
      );

      return NextResponse.json(await applyBuildMetadata(applyLiveUptime(fallback)));
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
    const dashboardData = normalizeDashboardData((await request.json()) as Partial<DashboardData>);
    const [stored] = await Promise.all([
      setStoredValue(STORE_KEYS.DASHBOARD, dashboardData),
      setStoredValue(STORE_KEYS.DASHBOARD_RUNTIME, {
        systemStartedAt: dashboardData.systemStartedAt,
        systemUptime: dashboardData.systemUptime,
        uptimeSnapshotAt: dashboardData.uptimeSnapshotAt,
      }),
    ]);

    return NextResponse.json({
      message: 'Dashboard data saved',
      data: await applyBuildMetadata(normalizeDashboardData(stored)),
    });
  } catch (error) {
    console.error('Failed to save dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard data' },
      { status: 500 },
    );
  }
}
