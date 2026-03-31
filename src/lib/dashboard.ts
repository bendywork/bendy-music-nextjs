export interface DashboardData {
  proxyRequestCount: number;
  systemUptime: number;
  systemStartedAt: number;
  uptimeSnapshotAt: number;
  recentRequests: RecentRequest[];
  serviceStatus: ServiceStatus[];
  lastSyncTime: number;
}

export interface RecentRequest {
  timestamp: number;
  path: string;
  provider: string;
  statusCode: number;
  duration: number;
  success: boolean;
}

export interface ServiceStatus {
  name: string;
  displayName: string;
  errorCount: number;
  status: 'Normal' | 'Warning' | 'Error';
}

const MAX_RECENT_REQUESTS = 100;
const HOURLY_SYNC_INTERVAL_MS = 60 * 60 * 1000;

const getProcessStartedAt = (): number => {
  return Math.max(0, Date.now() - Math.floor(process.uptime() * 1000));
};

const createDefaultDashboardData = (startedAt: number): DashboardData => {
  const now = Date.now();

  return {
    proxyRequestCount: 0,
    systemUptime: Math.max(0, now - startedAt),
    systemStartedAt: startedAt,
    uptimeSnapshotAt: now,
    recentRequests: [],
    serviceStatus: [
      { name: 'kuwo', displayName: '酷我音乐', errorCount: 0, status: 'Normal' },
      { name: 'qq', displayName: 'QQ音乐', errorCount: 0, status: 'Normal' },
      { name: 'netease', displayName: '网易云音乐', errorCount: 0, status: 'Normal' },
    ],
    lastSyncTime: 0,
  };
};

class DashboardService {
  private data: DashboardData;
  private syncTimer: NodeJS.Timeout | null = null;
  private readonly startedAt: number;
  private initialized = false;

  constructor() {
    this.startedAt = getProcessStartedAt();
    this.data = createDefaultDashboardData(this.startedAt);
  }

  private refreshUptime(): void {
    const now = Date.now();
    this.data.systemStartedAt = this.startedAt;
    this.data.systemUptime = Math.max(0, now - this.startedAt);
    this.data.uptimeSnapshotAt = now;
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.refreshUptime();
    this.syncTimer = setInterval(() => {
      void this.syncToFile();
    }, HOURLY_SYNC_INTERVAL_MS);
    console.log('Dashboard service initialized with hourly persistence sync');
  }

  incrementRequestCount(
    provider: string = '-',
    path: string = '/',
    statusCode: number = 200,
    duration: number = 0,
  ): void {
    this.refreshUptime();
    this.data.proxyRequestCount += 1;

    const recentRequest: RecentRequest = {
      timestamp: Date.now(),
      path,
      provider,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 400,
    };

    this.data.recentRequests.unshift(recentRequest);
    if (this.data.recentRequests.length > MAX_RECENT_REQUESTS) {
      this.data.recentRequests = this.data.recentRequests.slice(0, MAX_RECENT_REQUESTS);
    }

    if (!recentRequest.success && provider !== '-') {
      this.incrementErrorCount(provider);
    }
  }

  incrementErrorCount(provider: string): void {
    const service = this.data.serviceStatus.find((item) => item.name.toLowerCase() === provider.toLowerCase());
    if (!service) {
      return;
    }

    service.errorCount += 1;
    this.updateServiceStatus(service);
  }

  private updateServiceStatus(service: ServiceStatus): void {
    if (service.errorCount >= 1000) {
      service.status = 'Error';
      return;
    }

    if (service.errorCount >= 100) {
      service.status = 'Warning';
      return;
    }

    service.status = 'Normal';
  }

  getData(): DashboardData {
    this.refreshUptime();

    return {
      ...this.data,
      recentRequests: [...this.data.recentRequests],
      serviceStatus: this.data.serviceStatus.map((service) => ({ ...service })),
    };
  }

  async syncToFile(): Promise<void> {
    try {
      const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, '')
        || process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
        || process.env.GITHUB_OAUTH_BASE_URL?.replace(/\/$/, '');

      if (!baseUrl) {
        return;
      }

      const response = await fetch(`${baseUrl}/api/data/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.getData()),
      });

      if (!response.ok) {
        console.warn('Dashboard data persistence sync failed');
        return;
      }

      this.data.lastSyncTime = Date.now();
      console.log('Dashboard data persisted successfully');
    } catch (error) {
      console.error('Dashboard data sync failed:', error);
    }
  }

  formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }

    return `${seconds}s`;
  }
}

export const dashboardService = new DashboardService();
