'use client';

import { ArrowRight, BookText, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { LocaleToggle } from '@/components/locale-toggle';
import { useLocale } from '@/components/locale-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { siteCopy } from '@/lib/i18n/site';

export default function HomePage() {
  const { locale } = useLocale();
  const copy = siteCopy[locale].home;

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

          <div className="flex items-center gap-2">
            <LocaleToggle variant="outline" />
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <Card className="rounded-[2.2rem]">
              <CardContent className="p-8 sm:p-10 lg:p-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center rounded-full border border-border bg-background/75 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.heroBadge}
                  </div>

                  <div className="space-y-4">
                    <h1 className="max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                      {copy.heroTitle}
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      {copy.heroDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg">
                      <Link href="/login">
                        {copy.enterDashboard}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/docs">
                        <BookText className="h-4 w-4" />
                        {copy.viewDocs}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="rounded-[2rem]">
                <CardContent className="space-y-3 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.featureEyebrow}</p>
                  <h2 className="text-2xl font-black tracking-[-0.04em]">{copy.featureTitle}</h2>
                  <p className="text-sm leading-7 text-muted-foreground">{copy.featureDescription}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem]">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    {copy.oauthTitle}
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{copy.oauthDescription}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem]">
                <CardContent className="space-y-3 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.docsEyebrow}</p>
                  <p className="text-sm leading-7 text-muted-foreground">{copy.docsDescription}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
