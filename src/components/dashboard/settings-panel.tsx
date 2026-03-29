import { Box, Clock3, GitBranch, Globe2, Save } from 'lucide-react';
import { SectionIntro } from '@/components/dashboard/shared';
import type { SystemConfigState } from '@/components/dashboard/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function SettingsPanel({
  sysConfig,
  busy,
  onChange,
  onSave,
}: {
  sysConfig: SystemConfigState;
  busy: boolean;
  onChange: (config: SystemConfigState) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title="系统设置"
        description="仓库地址、请求超时与最大并发参数统一维护在这里。保存时会同时写入 sys 配置。"
        badge="System config"
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>运行参数</CardTitle>
            <CardDescription>这里控制 GitHub 仓库地址、接口超时和最大并发数。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">项目仓库地址</label>
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
                <label className="text-sm font-semibold">超时时间（秒）</label>
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
                <label className="text-sm font-semibold">最大并发请求数</label>
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
              {busy ? '保存中...' : '保存系统设置'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>当前环境摘要</CardTitle>
            <CardDescription>用来快速确认后台当前写入的数据上下文。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <GitBranch className="h-4 w-4" />
                文档仓库
              </div>
              <p className="mt-2 break-all text-sm text-muted-foreground">{sysConfig.project.github}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4" />
                API Timeout
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{sysConfig.api.timeout} 秒</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Box className="h-4 w-4" />
                最大并发
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {sysConfig.api.maxConcurrentRequests} 个并发请求
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Globe2 className="h-4 w-4" />
                外部入口
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                文档、Provider 和 API 配置都会通过服务端接口持久化。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
