export interface DashboardData {
  proxyRequestCount: number;
  systemUptime: number;
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

class DashboardService {
  private data: DashboardData;
  private syncTimer: NodeJS.Timeout | null = null;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.data = {
      proxyRequestCount: 0,
      systemUptime: 0,
      recentRequests: [],
      serviceStatus: [
        { name: 'kuwo', displayName: '酷我音乐', errorCount: 0, status: 'Normal' },
        { name: 'qq', displayName: 'QQ音乐', errorCount: 0, status: 'Normal' },
        { name: 'Netease', displayName: '网易云音乐', errorCount: 0, status: 'Normal' }
      ],
      lastSyncTime: Date.now()
    };
  }

  initialize() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.syncTimer = setInterval(() => {
      this.syncToFile();
    }, 60 * 60 * 1000);
    console.log('Dashboard服务已启动，每小时自动同步到GitHub');
  }

  incrementRequestCount(provider: string = '-', path: string = '/', statusCode: number = 200, duration: number = 0) {
    this.data.proxyRequestCount++;
    this.data.systemUptime = Date.now() - this.startTime;

    const recentRequest: RecentRequest = {
      timestamp: Date.now(),
      path: path,
      provider: provider,
      statusCode: statusCode,
      duration: duration,
      success: statusCode >= 200 && statusCode < 400
    };

    this.data.recentRequests.unshift(recentRequest);
    if (this.data.recentRequests.length > 100) {
      this.data.recentRequests = this.data.recentRequests.slice(0, 100);
    }

    if (!recentRequest.success && provider !== '-') {
      this.incrementErrorCount(provider);
    }
  }

  incrementErrorCount(provider: string) {
    const service = this.data.serviceStatus.find(s => s.name.toLowerCase() === provider.toLowerCase());
    if (service) {
      service.errorCount++;
      this.updateServiceStatus(service);
    }
  }

  private updateServiceStatus(service: ServiceStatus) {
    if (service.errorCount >= 1000) {
      service.status = 'Error';
    } else if (service.errorCount >= 100) {
      service.status = 'Warning';
    } else {
      service.status = 'Normal';
    }
  }

  getData(): DashboardData {
    this.data.systemUptime = Date.now() - this.startTime;
    return { ...this.data };
  }

  getServiceStatus(): ServiceStatus[] {
    return [...this.data.serviceStatus];
  }

  getRecentRequests(): RecentRequest[] {
    return [...this.data.recentRequests];
  }

  getProxyRequestCount(): number {
    return this.data.proxyRequestCount;
  }

  getSystemUptime(): number {
    return this.data.systemUptime;
  }

  async syncToFile() {
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.data)
      });

      if (response.ok) {
        this.data.lastSyncTime = Date.now();
        console.log('Dashboard数据已同步到GitHub');
      } else {
        console.warn('Dashboard数据同步到GitHub失败');
      }
    } catch (error) {
      console.error('Dashboard数据同步失败:', error);
    }
  }

  formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

export const dashboardService = new DashboardService();
