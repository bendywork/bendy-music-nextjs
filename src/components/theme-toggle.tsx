'use client';

import { useEffect, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocale } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { localeUiCopy } from '@/lib/i18n/locale';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const copy = localeUiCopy[locale];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className={cn('rounded-full', className)} aria-label={copy.switchToDark}>
        <SunMedium className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('rounded-full', className)}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? copy.switchToLight : copy.switchToDark}
      title={isDark ? copy.lightMode : copy.darkMode}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </Button>
  );
}
