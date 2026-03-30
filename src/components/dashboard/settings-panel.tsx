import { Box, Clock3, GitBranch, Globe2, Save } from 'lucide-react';
import { SectionIntro } from '@/components/dashboard/shared';
import type { SystemConfigState } from '@/components/dashboard/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboardCopy } from '@/lib/i18n/dashboard';

type SettingsCopy = (typeof dashboardCopy)['zh']['settings'];

export function SettingsPanel({
  sysConfig,
  busy,
  onChange,
  onSave,
  copy,
}: {
  sysConfig: SystemConfigState;
  busy: boolean;
  onChange: (config: SystemConfigState) => void;
  onSave: () => void;
  copy: SettingsCopy;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro title={copy.sectionTitle} description={copy.sectionDescription} badge={copy.badge} />

      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>{copy.runtimeTitle}</CardTitle>
            <CardDescription>{copy.runtimeDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.repositoryLabel}</label>
              <Input
                value={sysConfig.project.github}
                onChange={(event) =>
                  onChange({
                    ...sysConfig,
                    project: {
                      ...sysConfig.project,
                      github: event.target.value,
                    },
                  })
                }
                placeholder="https://github.com/owner/repo"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">{copy.timeoutLabel}</label>
                <Input
                  type="number"
                  value={sysConfig.api.timeout}
                  onChange={(event) =>
                    onChange({
                      ...sysConfig,
                      api: {
                        ...sysConfig.api,
                        timeout: Number(event.target.value) || 30,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">{copy.maxConcurrentLabel}</label>
                <Input
                  type="number"
                  value={sysConfig.api.maxConcurrentRequests}
                  onChange={(event) =>
                    onChange({
                      ...sysConfig,
                      api: {
                        ...sysConfig.api,
                        maxConcurrentRequests: Number(event.target.value) || 100,
                      },
                    })
                  }
                />
              </div>
            </div>
            <Button type="button" onClick={onSave} disabled={busy}>
              <Save className="h-4 w-4" />
              {busy ? copy.saving : copy.save}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>{copy.summaryTitle}</CardTitle>
            <CardDescription>{copy.summaryDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <GitBranch className="h-4 w-4" />
                {copy.repositoryCardTitle}
              </div>
              <p className="mt-2 break-all text-sm text-muted-foreground">{sysConfig.project.github}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4" />
                {copy.timeoutCardTitle}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {sysConfig.api.timeout} {copy.secondsUnit}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Box className="h-4 w-4" />
                {copy.maxConcurrentCardTitle}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {sysConfig.api.maxConcurrentRequests} {copy.concurrentUnit}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Globe2 className="h-4 w-4" />
                {copy.entrypointCardTitle}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{copy.entrypointDescription}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
