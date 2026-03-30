import { Activity, Cable, Clock3, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardData, RecentRequest, ServiceStatus } from '@/lib/dashboard';
import { EmptyRow, MetricCard, SectionIntro, TableShell } from '@/components/dashboard/shared';
import { formatTimestamp, formatUptime, statusVariant } from '@/components/dashboard/types';
import { dashboardCopy, getServiceDisplayName } from '@/lib/i18n/dashboard';
import type { Locale } from '@/lib/i18n/locale';

type OverviewCopy = (typeof dashboardCopy)['zh']['overview'];

export function OverviewPanel({
  dashboardData,
  providersCount,
  enabledProviders,
  apisCount,
  enabledApis,
  repository,
  locale,
  copy,
}: {
  dashboardData: DashboardData;
  providersCount: number;
  enabledProviders: number;
  apisCount: number;
  enabledApis: number;
  repository: string;
  locale: Locale;
  copy: OverviewCopy;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro title={copy.sectionTitle} description={copy.sectionDescription} badge={copy.badge} />

      <Card className="overflow-hidden rounded-[2rem]">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1.45fr_0.95fr] lg:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{copy.healthyBadge}</Badge>
              <Badge variant="outline">{copy.utf8Badge}</Badge>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-[-0.06em]">{copy.heroTitle}</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{copy.heroDescription}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.repositoryLabel}</p>
              <p className="mt-2 break-all text-sm font-semibold">{repository}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-background/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.lastSyncLabel}</p>
              <p className="mt-2 text-sm font-semibold">{formatTimestamp(dashboardData.lastSyncTime, locale)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={copy.proxyRequestsTitle}
          value={String(dashboardData.proxyRequestCount || 0)}
          detail={copy.proxyRequestsDetail}
          icon={Activity}
        />
        <MetricCard
          title={copy.enabledProvidersTitle}
          value={String(enabledProviders)}
          detail={copy.enabledProvidersDetail.replace('{count}', String(providersCount))}
          icon={Cable}
        />
        <MetricCard
          title={copy.enabledApisTitle}
          value={String(enabledApis)}
          detail={copy.enabledApisDetail.replace('{count}', String(apisCount))}
          icon={Sparkles}
        />
        <MetricCard
          title={copy.uptimeTitle}
          value={formatUptime(dashboardData.systemUptime, locale)}
          detail={copy.uptimeDetail}
          icon={Clock3}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>{copy.servicesTitle}</CardTitle>
            <CardDescription>{copy.servicesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboardData.serviceStatus.map((service: ServiceStatus) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-[1.4rem] border border-border bg-background/60 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {getServiceDisplayName(locale, service.name, service.displayName)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {copy.errorsLabel} {service.errorCount}
                  </p>
                </div>
                <Badge variant={statusVariant(service.status)}>{copy.statusLabels[service.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>{copy.recentTitle}</CardTitle>
            <CardDescription>{copy.recentDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <TableShell
              columns={[
                copy.columns.time,
                copy.columns.path,
                copy.columns.provider,
                copy.columns.status,
                copy.columns.duration,
              ]}
            >
              {dashboardData.recentRequests.length > 0 ? (
                dashboardData.recentRequests.slice(0, 8).map((request: RecentRequest) => (
                  <tr key={`${request.timestamp}-${request.path}`} className="border-t border-border/70">
                    <td className="px-4 py-3">{formatTimestamp(request.timestamp, locale)}</td>
                    <td className="max-w-[260px] px-4 py-3 font-mono text-xs">{request.path}</td>
                    <td className="px-4 py-3">{request.provider}</td>
                    <td className="px-4 py-3">
                      <Badge variant={request.success ? 'success' : 'danger'}>{request.statusCode}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.duration} {copy.durationUnit}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={5} message={copy.emptyRecent} />
              )}
            </TableShell>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
