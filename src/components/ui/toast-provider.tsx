'use client';

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastOptions {
  id: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const TOAST_DURATION_MS = 1900;
const ToastContext = createContext<ToastContextValue | null>(null);

const variantIconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} satisfies Record<ToastVariant, typeof Info>;

const variantClassNameMap: Record<ToastVariant, string> = {
  success: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-950 dark:text-emerald-50',
  error: 'border-rose-500/35 bg-rose-500/12 text-rose-950 dark:text-rose-50',
  info: 'border-sky-500/35 bg-sky-500/12 text-sky-950 dark:text-sky-50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const toast = (options: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'info',
    };

    setToasts((current) => [...current, nextToast]);
    window.setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION_MS);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="pointer-events-none fixed right-5 top-5 z-[120] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((item) => {
          const Icon = variantIconMap[item.variant];

          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto animate-[toast-in_180ms_ease-out] rounded-[1.5rem] border px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.14)] backdrop-blur',
                variantClassNameMap[item.variant],
              )}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-background/75 p-2 text-current dark:bg-background/30">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs leading-5 text-current/80">{item.description}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
