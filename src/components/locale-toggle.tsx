'use client';

import { Languages } from 'lucide-react';
import { useLocale } from '@/components/locale-provider';
import { Button, type ButtonProps } from '@/components/ui/button';
import { localeUiCopy } from '@/lib/i18n/locale';

export function LocaleToggle(props: Omit<ButtonProps, 'aria-label' | 'onClick' | 'title' | 'type'>) {
  const { locale, toggleLocale } = useLocale();
  const copy = localeUiCopy[locale];

  return (
    <Button
      type="button"
      onClick={toggleLocale}
      aria-label={copy.switchLanguage}
      title={copy.switchLanguage}
      {...props}
    >
      <Languages className="h-4 w-4" />
      {copy.localeLabel}
    </Button>
  );
}
