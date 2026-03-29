import type { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const controlClassName =
  'flex h-11 w-full rounded-2xl border border-input bg-background/90 px-4 py-2 text-sm outline-none transition-colors focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/30';

export function SectionIntro({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-[-0.04em]">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {badge ? (
        <div className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {badge}
        </div>
      ) : null}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-[1.8rem]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
            <p className="text-3xl font-black tracking-[-0.05em]">{value}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 p-3">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableShell({
  children,
  columns,
}: {
  children: ReactNode;
  columns: string[];
}) {
  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-border/80">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-background/60">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}
