'use client';

import { ArrowRight, BookText, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 surface-grid opacity-60" />
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-black/6 blur-3xl dark:bg-white/8" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-black/6 blur-3xl dark:bg-white/8" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/80">
              <Image src="/logo.svg" alt="bendy music logo" width={24} height={24} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black tracking-[-0.04em]">bendy-music-nextjs</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Music API Gateway</p>
            </div>
          </div>

          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <Card className="rounded-[2.2rem]">
              <CardContent className="p-8 sm:p-10 lg:p-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center rounded-full border border-border bg-background/75 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Next.js 16 + Tailwind 4 + shadcn style
                  </div>

                  <div className="space-y-4">
                    <h1 className="max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                      统一管理音乐接口、文档和后台配置
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      一个面向管理后台的音乐 API 网关项目。现在支持黑白灰主题、浅色/深色切换、README 在线编辑、Provider/API 管理，以及 Docker 化开发环境。
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg">
                      <Link href="/login">
                        进入后台
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/docs">
                        <BookText className="h-4 w-4" />
                        查看文档
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="rounded-[2rem]">
                <CardContent className="space-y-3 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">核心能力</p>
                  <h2 className="text-2xl font-black tracking-[-0.04em]">Admin Console</h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    服务商、接口、文档和系统设置全部集中在统一控制台中管理。
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem]">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    GitHub OAuth 管理登录
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    仅允许配置过的管理员账户进入后台，保持入口干净、简单且可控。
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem]">
                <CardContent className="space-y-3 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">文档链路</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    README 和 API 文档配置会直接写入本地 UTF-8 文件，再同步数据库缓存与 GitHub 仓库，避免乱码回流。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
