import { STORE_KEYS, getStoredValue, readJsonFile, setStoredValue } from '@/lib/server/data-store';

export interface DashboardData {
  proxyRequestCount: number;
  systemUptime: number;
  systemStartedAt: number;
  uptimeSnapshotAt: number;
  recentRequests: RecentRequest[];
  serviceStatus: ServiceStatus[];
  lastSyncTime: number;
  latestCommitMessage: string;
  latestCommitTimestamp: number;
  latestCommitShortHash: string;
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

interface DashboardRuntimeSnapshot {
  systemStartedAt: number;
  systemUptime: number;
  uptimeSnapshotAt: number;
}

const MAX_RECENT_REQUESTS = 100;
const PERSIST_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_SERVICES: ServiceStatus[] = [
  { name: 'kuwo', displayName: 'Kuwo Music', errorCount: 0, status: 'Normal' },
  { name: 'qq', displayName: 'QQ Music', errorCount: 0, status: 'Normal' },
  { name: 'netease', displayName: 'Netease Music', errorCount: 0, status: 'Normal' },
];

const getProcessStartedAt = (): number => Math.max(0, Date.now() - Math.floor(process.uptime() * 1000));
const sanitizeNumber = (value: unknown, fallback = 0): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};
const cloneDefaultServices = (): ServiceStatus[] => DEFAULT_SERVICES.map((service) => ({ ...service }));

const createRuntimeSnapshot = (startedAt: number): DashboardRuntimeSnapshot => {
  const now = Date.now();

  return {
    systemStartedAt: startedAt,
    systemUptime: Math.max(0, now - startedAt),
    uptimeSnapshotAt: now,
  };
};

const createDefaultDashboardData = (startedAt: number): DashboardData => {
  const runtime = createRuntimeSnapshot(startedAt);

  return {
    proxyRequestCount: 0,
    systemUptime: runtime.systemUptime,
    systemStartedAt: runtime.systemStartedAt,
    uptimeSnapshotAt: runtime.uptimeSnapshotAt,
    recentRequests: [],
    serviceStatus: cloneDefaultServices(),
    lastSyncTime: 0,
    latestCommitMessage: '',
    latestCommitTimestamp: 0,
    latestCommitShortHash: '',
  };
};

const normalizeRecentRequest = (request: Partial<RecentRequest>): RecentRequest => ({
  timestamp: sanitizeNumber(request.timestamp),
  path: typeof request.path === 'string' ? request.path : '/',
  provider: typeof request.provider === 'string' ? request.provider : '-',
  statusCode: sanitizeNumber(request.statusCode, 200),
  duration: sanitizeNumber(request.duration),
  success: typeof request.success === 'boolean'
    ? request.success
    : sanitizeNumber(request.statusCode, 200) >= 200 && sanitizeNumber(request.statusCode, 200) < 400,
});

const normalizeServiceStatuses = (services: unknown): ServiceStatus[] => {
  const merged = new Map<string, ServiceStatus>();

  for (const service of cloneDefaultServices()) {
    merged.set(service.name.toLowerCase(), service);
  }

  if (!Array.isArray(services)) {
    return Array.from(merged.values());
  }

  for (const item of services) {
    const service = item as Partial<ServiceStatus>;
    const name = typeof service.name === 'string' && service.name.trim()
      ? service.name.trim()
      : 'unknown';
    const key = name.toLowerCase();
    const existing = merged.get(key) ?? {
      name,
      displayName: typeof service.displayName === 'string' && service.displayName.trim()
        ? service.displayName.trim()
        : name,
      errorCount: 0,
      status: 'Normal' as const,
    };

    existing.displayName = typeof service.displayName === 'string' && service.displayName.trim()
      ? service.displayName.trim()
      : existing.displayName;
    existing.errorCount = Math.max(existing.errorCount, sanitizeNumber(service.errorCount));

    if (existing.errorCount >= 1000) {
      existing.status = 'Error';
    } else if (existing.errorCount >= 100) {
      existing.status = 'Warning';
    } else {
      existing.status = 'Normal';
    }

    merged.set(key, existing);
  }

  return Array.from(merged.values());
};

const normalizeRuntimeSnapshot = (
  value: Partial<DashboardRuntimeSnapshot>,
  fallbackStartedAt: number,
): DashboardRuntimeSnapshot => {
  const startedAt = sanitizeNumber(value.systemStartedAt, fallbackStartedAt);
  const snapshotAt = sanitizeNumber(value.uptimeSnapshotAt, startedAt);
  const persistedUptime = sanitizeNumber(value.systemUptime, Math.max(0, snapshotAt - startedAt));

  return {
    systemStartedAt: startedAt,
    systemUptime: Math.max(0, persistedUptime),
    uptimeSnapshotAt: snapshotAt,
  };
};

const normalizeDashboardData = (
  value: Partial<DashboardData>,
  fallbackStartedAt: number,
): DashboardData => {
  const defaultData = createDefaultDashboardData(fallbackStartedAt);
  const runtime = normalizeRuntimeSnapshot(
    {
      systemStartedAt: value.systemStartedAt,
      systemUptime: value.systemUptime,
      uptimeSnapshotAt: value.uptimeSnapshotAt,
    },
    fallbackStartedAt,
  );

  return {
    ...defaultData,
    ...value,
    systemStartedAt: runtime.systemStartedAt,
    systemUptime: runtime.systemUptime,
    uptimeSnapshotAt: runtime.uptimeSnapshotAt,
    proxyRequestCount: sanitizeNumber(value.proxyRequestCount),
    recentRequests: Array.isArray(value.recentRequests)
      ? value.recentRequests.map((request) => normalizeRecentRequest(request))
      : defaultData.recentRequests,
    serviceStatus: normalizeServiceStatuses(value.serviceStatus),
    lastSyncTime: sanitizeNumber(value.lastSyncTime),
    latestCommitMessage: typeof value.latestCommitMessage === 'string' ? value.latestCommitMessage : '',
    latestCommitTimestamp: sanitizeNumber(value.latestCommitTimestamp),
    latestCommitShortHash: typeof value.latestCommitShortHash === 'string' ? value.latestCommitShortHash : '',
  };
};

const mergeRecentRequests = (...lists: RecentRequest[][]): RecentRequest[] => {
  return lists
    .flat()
    .map((request) => normalizeRecentRequest(request))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_RECENT_REQUESTS);
};

const mergeServiceStatuses = (...lists: ServiceStatus[][]): ServiceStatus[] => {
  const merged = new Map<string, ServiceStatus>();

  for (const service of cloneDefaultServices()) {
    merged.set(service.name.toLowerCase(), service);
  }

  for (const list of lists) {
    for (const item of list) {
      const key = item.name.toLowerCase();
      const existing = merged.get(key) ?? {
        name: item.name,
        displayName: item.displayName || item.name,
        errorCount: 0,
        status: 'Normal' as const,
      };

      existing.displayName = item.displayName || existing.displayName;
      existing.errorCount += Math.max(0, sanitizeNumber(item.errorCount));

      if (existing.errorCount >= 1000) {
        existing.status = 'Error';
      } else if (existing.errorCount >= 100) {
        existing.status = 'Warning';
      } else {
        existing.status = 'Normal';
      }

      merged.set(key, existing);
    }
  }

  return Array.from(merged.values());
};

class DashboardService {
  private data: DashboardData;
  private syncTimer: NodeJS.Timeout | null = null;
  private startedAt: number;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private persistPromise: Promise<void> | null = null;
  private lastPersistedAt = 0;

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

  private async hydrateFromStorage(): Promise<void> {
    try {
      const storedDashboard = normalizeDashboardData(
        await getStoredValue(
          STORE_KEYS.DASHBOARD,
          () => readJsonFile('data/dashboard.json', createDefaultDashboardData(this.startedAt)),
        ),
        this.startedAt,
      );

      const runtimeFallback = normalizeRuntimeSnapshot(
        {
          systemStartedAt: storedDashboard.systemStartedAt,
          systemUptime: storedDashboard.systemUptime,
          uptimeSnapshotAt: storedDashboard.uptimeSnapshotAt,
        },
        this.startedAt,
      );

      const storedRuntime = normalizeRuntimeSnapshot(
        await getStoredValue(STORE_KEYS.DASHBOARD_RUNTIME, () => runtimeFallback),
        runtimeFallback.systemStartedAt,
      );

      const pending = this.data;
      this.startedAt = storedRuntime.systemStartedAt > 0 ? storedRuntime.systemStartedAt : this.startedAt;

      this.data = {
        ...storedDashboard,
        proxyRequestCount: storedDashboard.proxyRequestCount + pending.proxyRequestCount,
        recentRequests: mergeRecentRequests(pending.recentRequests, storedDashboard.recentRequests),
        serviceStatus: mergeServiceStatuses(storedDashboard.serviceStatus, pending.serviceStatus),
        lastSyncTime: Math.max(storedDashboard.lastSyncTime, pending.lastSyncTime),
        latestCommitMessage: storedDashboard.latestCommitMessage || pending.latestCommitMessage,
        latestCommitTimestamp: Math.max(storedDashboard.latestCommitTimestamp, pending.latestCommitTimestamp),
        latestCommitShortHash: storedDashboard.latestCommitShortHash || pending.latestCommitShortHash,
        systemStartedAt: this.startedAt,
        systemUptime: storedRuntime.systemUptime,
        uptimeSnapshotAt: storedRuntime.uptimeSnapshotAt,
      };

      this.refreshUptime();
      this.lastPersistedAt = Math.max(this.data.lastSyncTime, storedRuntime.uptimeSnapshotAt);
      this.maybePersistSnapshot(true);
    } catch (error) {
      console.warn('Failed to hydrate dashboard storage state:', error);
      this.refreshUptime();
    }
  }

  private createSnapshot(): DashboardData {
    this.refreshUptime();

    return {
      ...this.data,
      recentRequests: [...this.data.recentRequests],
      serviceStatus: this.data.serviceStatus.map((service) => ({ ...service })),
    };
  }

  private maybePersistSnapshot(force = false): void {
    if (this.persistPromise) {
      return;
    }

    if (!force && Date.now() - this.lastPersistedAt < PERSIST_INTERVAL_MS) {
      return;
    }

    void this.persistSnapshot();
  }

  private ensureHydrated(): Promise<void> {
    this.initialize();

    if (!this.initializationPromise) {
      this.initializationPromise = this.hydrateFromStorage();
    }

    return this.initializationPromise;
  }

  async persistSnapshot(): Promise<void> {
    if (this.persistPromise) {
      return this.persistPromise;
    }

    this.persistPromise = (async () => {
      try {
        const persistedAt = Date.now();
        this.data.lastSyncTime = persistedAt;
        const snapshot = this.createSnapshot();

        await Promise.all([
          setStoredValue(STORE_KEYS.DASHBOARD, snapshot),
          setStoredValue(STORE_KEYS.DASHBOARD_RUNTIME, {
            systemStartedAt: snapshot.systemStartedAt,
            systemUptime: snapshot.systemUptime,
            uptimeSnapshotAt: snapshot.uptimeSnapshotAt,
          } satisfies DashboardRuntimeSnapshot),
        ]);

        this.lastPersistedAt = persistedAt;
      } catch (error) {
        console.error('Failed to persist dashboard snapshot:', error);
      } finally {
        this.persistPromise = null;
      }
    })();

    return this.persistPromise;
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.syncTimer = setInterval(() => {
      void this.persistSnapshot();
    }, PERSIST_INTERVAL_MS);
    console.log('Dashboard service initialized with 10-minute persistence sync');
  }

  async ready(): Promise<void> {
    await this.ensureHydrated();
  }

  incrementRequestCount(
    provider: string = '-',
    path: string = '/',
    statusCode: number = 200,
    duration: number = 0,
  ): void {
    void this.ensureHydrated();
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

    this.data.recentRequests = mergeRecentRequests([recentRequest], this.data.recentRequests);

    if (!recentRequest.success && provider !== '-') {
      this.incrementErrorCount(provider);
    }

    this.maybePersistSnapshot();
  }

  incrementErrorCount(provider: string): void {
    const service = this.data.serviceStatus.find((item) => item.name.toLowerCase() === provider.toLowerCase());
    if (!service) {
      return;
    }

    service.errorCount += 1;

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
    void this.ensureHydrated();
    const snapshot = this.createSnapshot();
    this.maybePersistSnapshot();
    return snapshot;
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
