import { Activity, Cable, Clock3, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardData, RecentRequest, ServiceStatus } from '@/lib/dashboard';
import { EmptyRow, MetricCard, SectionIntro, TableShell } from '@/components/dashboard/shared';
import { formatTimestamp, formatUptime, statusVariant } from '@/components/dashboard/types';

export function OverviewPanel({
  dashboardData,
  providersCount,
  enabledProviders,
  apisCount,
  enabledApis,
  repository,
}: {
  dashboardData: DashboardData;
  providersCount: number;
  enabledProviders: number;
  apisCount: number;
  enabledApis: number;
  repository: string;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title="运行总览"
        description="黑白灰后台布局已整体收紧，页面不再依赖浏览器缩放到 90% 才能正常使用。这里集中查看运行指标、服务状态和最近请求。"
        badge="Live dashboard"
      />

      <Card className="overflow-hidden rounded-[2rem]">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1.4fr_0.9fr] lg:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">系统运行中</Badge>
              <Badge variant="outline">README 采用 UTF-8 文件源</Badge>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-[-0.06em]">Bendy Music Admin Workspace</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                当前控制台基于 Tailwind CSS 和 shadcn 风格组件重做，支持浅色 / 深色切换，顶部按钮位置遵循常规 Web 后台布局。
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">GitHub Repo</p>
              <p className="mt-2 break-all text-sm font-semibold">{repository}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Last Sync</p>
              <p className="mt-2 text-sm font-semibold">{formatTimestamp(dashboardData.lastSyncTime)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="代理请求"
          value={String(dashboardData.proxyRequestCount || 0)}
          detail="累计记录的代理请求数量"
          icon={Activity}
        />
        <MetricCard
          title="启用服务商"
          value={String(enabledProviders)}
          detail={`共 ${providersCount} 个 Provider`}
          icon={Cable}
        />
        <MetricCard
          title="启用接口"
          value={String(enabledApis)}
          detail={`共 ${apisCount} 条 API 配置`}
          icon={Sparkles}
        />
        <MetricCard
          title="运行时间"
          value={formatUptime(dashboardData.systemUptime)}
          detail="由实时仪表盘持续刷新"
          icon={Clock3}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>服务健康度</CardTitle>
            <CardDescription>根据错误计数动态评估各音乐源的可用性。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboardData.serviceStatus.map((service: ServiceStatus) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-[1.4rem] border border-border bg-background/60 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{service.displayName}</p>
                  <p className="text-sm text-muted-foreground">错误次数 {service.errorCount}</p>
                </div>
                <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>最近请求</CardTitle>
            <CardDescription>最近一批代理请求的路径、来源和返回码。</CardDescription>
          </CardHeader>
          <CardContent>
            <TableShell columns={['时间', '路径', 'Provider', '状态', '耗时']}>
              {dashboardData.recentRequests.length > 0 ? (
                dashboardData.recentRequests.slice(0, 8).map((request: RecentRequest) => (
                  <tr key={`${request.timestamp}-${request.path}`} className="border-t border-border/70">
                    <td className="px-4 py-3">{formatTimestamp(request.timestamp)}</td>
                    <td className="max-w-[260px] px-4 py-3 font-mono text-xs">{request.path}</td>
                    <td className="px-4 py-3">{request.provider}</td>
                    <td className="px-4 py-3">
                      <Badge variant={request.success ? 'success' : 'danger'}>{request.statusCode}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{request.duration} ms</td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={5} message="暂时还没有最近请求记录。" />
              )}
            </TableShell>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
