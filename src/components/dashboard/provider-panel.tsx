import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyRow, SectionIntro, TableShell, controlClassName } from '@/components/dashboard/shared';
import type { ProviderItem } from '@/components/dashboard/types';
import { dashboardCopy } from '@/lib/i18n/dashboard';

type ProviderCopy = (typeof dashboardCopy)['zh']['providers'];

const rowSelectClassName =
  'h-10 min-w-[112px] rounded-xl border border-input bg-background/90 px-3 py-1 text-xs font-semibold outline-none transition-colors focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/30';

export function ProviderPanel({
  providers,
  editingProvider,
  busy,
  onAdd,
  onEdit,
  onCancelEdit,
  onChange,
  onSave,
  onDelete,
  onStatusChange,
  copy,
}: {
  providers: ProviderItem[];
  editingProvider: ProviderItem | null;
  busy: boolean;
  onAdd: () => void;
  onEdit: (provider: ProviderItem) => void;
  onCancelEdit: () => void;
  onChange: (provider: ProviderItem) => void;
  onSave: () => void;
  onDelete: (providerId: string) => void;
  onStatusChange: (providerId: string, status: ProviderItem['status']) => void;
  copy: ProviderCopy;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title={copy.sectionTitle}
        description={copy.sectionDescription}
        badge={`${providers.length} ${copy.badgeUnit}`}
      />

      {editingProvider ? (
        <Card className="rounded-[2rem]">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{providers.some((item) => item.id === editingProvider.id) ? copy.editTitle : copy.createTitle}</CardTitle>
              <CardDescription>{copy.editDescription}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                {copy.cancel}
              </Button>
              <Button type="button" onClick={onSave} disabled={busy}>
                <Save className="h-4 w-4" />
                {busy ? copy.saving : copy.save}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.name}</label>
              <Input
                value={editingProvider.name}
                onChange={(event) => onChange({ ...editingProvider, name: event.target.value })}
                placeholder={copy.placeholders.name}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.code}</label>
              <Input
                value={editingProvider.code}
                onChange={(event) => onChange({ ...editingProvider, code: event.target.value })}
                placeholder={copy.placeholders.code}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.category}</label>
              <select
                value={editingProvider.category || 'official'}
                onChange={(event) =>
                  onChange({
                    ...editingProvider,
                    category: event.target.value as ProviderItem['category'],
                  })
                }
                className={controlClassName}
              >
                <option value="official">{copy.categoryLabels.official}</option>
                <option value="personal">{copy.categoryLabels.personal}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.nature}</label>
              <select
                value={editingProvider.nature || 'openSource'}
                onChange={(event) =>
                  onChange({
                    ...editingProvider,
                    nature: event.target.value as ProviderItem['nature'],
                  })
                }
                className={controlClassName}
              >
                <option value="openSource">{copy.natureLabels.openSource}</option>
                <option value="nonProfit">{copy.natureLabels.nonProfit}</option>
                <option value="paid">{copy.natureLabels.paid}</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">BaseURL</label>
              <Input
                value={editingProvider.baseUrl || ''}
                onChange={(event) => onChange({ ...editingProvider, baseUrl: event.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.status}</label>
              <select
                value={editingProvider.status}
                onChange={(event) =>
                  onChange({
                    ...editingProvider,
                    status: event.target.value as ProviderItem['status'],
                  })
                }
                className={controlClassName}
              >
                <option value="enabled">{copy.statusLabels.enabled}</option>
                <option value="maintenance">{copy.statusLabels.maintenance}</option>
                <option value="disabled">{copy.statusLabels.disabled}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.remark}</label>
              <Input
                value={editingProvider.remark || ''}
                onChange={(event) => onChange({ ...editingProvider, remark: event.target.value })}
                placeholder={copy.placeholders.remark}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-[2rem]">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{copy.listTitle}</CardTitle>
            <CardDescription>{copy.listDescription}</CardDescription>
          </div>
          <Button type="button" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {copy.add}
          </Button>
        </CardHeader>
        <CardContent>
          <TableShell
            columns={[
              copy.table.name,
              copy.table.code,
              copy.table.category,
              copy.table.nature,
              'BaseURL',
              copy.table.status,
              copy.table.remark,
              copy.table.actions,
            ]}
          >
            {providers.length > 0 ? (
              providers.map((provider) => (
                <tr key={provider.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-semibold">{provider.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{provider.code}</td>
                  <td className="px-4 py-3">{copy.categoryLabels[provider.category || 'official']}</td>
                  <td className="px-4 py-3">{copy.natureLabels[provider.nature || 'openSource']}</td>
                  <td className="max-w-[280px] px-4 py-3 font-mono text-xs">{provider.baseUrl || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={provider.status}
                      onChange={(event) => onStatusChange(provider.id, event.target.value as ProviderItem['status'])}
                      className={rowSelectClassName}
                    >
                      <option value="enabled">{copy.statusLabels.enabled}</option>
                      <option value="maintenance">{copy.statusLabels.maintenance}</option>
                      <option value="disabled">{copy.statusLabels.disabled}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{provider.remark || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(provider)}>
                        {copy.edit}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(provider.id)}>
                        <Trash2 className="h-4 w-4" />
                        {copy.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={8} message={copy.empty} />
            )}
          </TableShell>
        </CardContent>
      </Card>
    </div>
  );
}
