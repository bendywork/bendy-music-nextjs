'use client';

import { FileText } from 'lucide-react';
import { LocaleToggle } from '@/components/locale-toggle';
import { useLocale } from '@/components/locale-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { siteCopy } from '@/lib/i18n/site';

export function DocsPageShell({ docContent, hasError }: { docContent: string; hasError: boolean }) {
  const { locale } = useLocale();
  const copy = siteCopy[locale].docsPage;

  if (hasError || !docContent) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 text-foreground">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-2">
          <LocaleToggle variant="outline" />
          <ThemeToggle />
        </div>
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
          <Card className="w-full max-w-lg rounded-[2rem]">
            <CardContent className="space-y-3 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/70">
                <FileText className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black tracking-[-0.04em]">{copy.unavailableTitle}</h1>
              <p className="text-sm leading-7 text-muted-foreground">{copy.unavailableText}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/82 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{copy.label}</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.05em]">{copy.description}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LocaleToggle variant="outline" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <iframe
        title={copy.frameTitle}
        srcDoc={docContent}
        className="block h-[calc(100vh-89px)] w-full border-0 bg-white"
        sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
      />
    </div>
  );
}
