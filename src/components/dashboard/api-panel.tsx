import { Plus, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyRow, SectionIntro, TableShell, controlClassName } from '@/components/dashboard/shared';
import { statusVariant, type ApiItem, type ProviderItem } from '@/components/dashboard/types';
import { dashboardCopy } from '@/lib/i18n/dashboard';

type ApiCopy = (typeof dashboardCopy)['zh']['apis'];

const getApiStatusLabel = (copy: ApiCopy, status: ApiItem['status']): string => {
  if (status === 'maintenance') {
    return 'Maintenance';
  }

  return (copy.statusLabels as Record<string, string>)[status] ?? status;
};

export function ApiPanel({
  apis,
  providers,
  editingApi,
  busy,
  onAdd,
  onEdit,
  onCancelEdit,
  onChange,
  onSave,
  onDelete,
  onToggleStatus,
  providerNameById,
  copy,
}: {
  apis: ApiItem[];
  providers: ProviderItem[];
  editingApi: ApiItem | null;
  busy: boolean;
  onAdd: () => void;
  onEdit: (api: ApiItem) => void;
  onCancelEdit: () => void;
  onChange: (api: ApiItem) => void;
  onSave: () => void;
  onDelete: (apiId: string) => void;
  onToggleStatus: (apiId: string) => void;
  providerNameById: (providerId: string) => string;
  copy: ApiCopy;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro title={copy.sectionTitle} description={copy.sectionDescription} badge={`${apis.length} ${copy.badgeUnit}`} />

      {editingApi ? (
        <Card className="rounded-[2rem]">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{apis.some((item) => item.id === editingApi.id) ? copy.editTitle : copy.createTitle}</CardTitle>
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
                value={editingApi.name}
                onChange={(event) => onChange({ ...editingApi, name: event.target.value })}
                placeholder={copy.placeholders.name}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.method}</label>
              <select
                value={editingApi.method}
                onChange={(event) => onChange({ ...editingApi, method: event.target.value })}
                className={controlClassName}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.path}</label>
              <Input
                value={editingApi.path}
                onChange={(event) => onChange({ ...editingApi, path: event.target.value })}
                placeholder="/api"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Request Type</label>
              <Input
                value={editingApi.requestType}
                onChange={(event) => onChange({ ...editingApi, requestType: event.target.value })}
                placeholder="info / search / playlist"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.pathType}</label>
              <select
                value={editingApi.pathType}
                onChange={(event) => onChange({ ...editingApi, pathType: event.target.value as ApiItem['pathType'] })}
                className={controlClassName}
              >
                <option value="relative">{copy.pathTypeLabels.relative}</option>
                <option value="absolute">{copy.pathTypeLabels.absolute}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.provider}</label>
              <select
                value={editingApi.provider}
                onChange={(event) => onChange({ ...editingApi, provider: event.target.value })}
                className={controlClassName}
              >
                <option value="">{copy.unassignedOption}</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{copy.fields.status}</label>
              <select
                value={editingApi.status}
                onChange={(event) => onChange({ ...editingApi, status: event.target.value as ApiItem['status'] })}
                className={controlClassName}
              >
                <option value="enabled">{copy.statusLabels.enabled}</option>
                <option value="maintenance">Maintenance</option>
                <option value="disabled">{copy.statusLabels.disabled}</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">{copy.fields.params}</label>
              <Textarea
                value={editingApi.params}
                onChange={(event) => onChange({ ...editingApi, params: event.target.value })}
                className="min-h-[120px] font-mono text-xs"
                placeholder={copy.placeholders.params}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">{copy.fields.headers}</label>
              <Textarea
                value={editingApi.headers}
                onChange={(event) => onChange({ ...editingApi, headers: event.target.value })}
                className="min-h-[100px] font-mono text-xs"
                placeholder={copy.placeholders.headers}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">{copy.fields.remark}</label>
              <Input
                value={editingApi.remark}
                onChange={(event) => onChange({ ...editingApi, remark: event.target.value })}
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
              copy.table.method,
              copy.table.path,
              'Request Type',
              copy.table.pathType,
              copy.table.provider,
              copy.table.status,
              copy.table.remark,
              copy.table.actions,
            ]}
          >
            {apis.length > 0 ? (
              apis.map((api) => (
                <tr key={api.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-semibold">{api.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{api.method}</td>
                  <td className="max-w-[280px] px-4 py-3 font-mono text-xs">{api.path}</td>
                  <td className="px-4 py-3 font-mono text-xs">{api.requestType}</td>
                  <td className="px-4 py-3">{copy.pathTypeLabels[api.pathType]}</td>
                  <td className="px-4 py-3">{providerNameById(api.provider)}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onToggleStatus(api.id)}>
                      <Badge variant={statusVariant(api.status)}>{getApiStatusLabel(copy, api.status)}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{api.remark || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(api)}>
                        {copy.edit}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(api.id)}>
                        <Trash2 className="h-4 w-4" />
                        {copy.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={9} message={copy.empty} />
            )}
          </TableShell>
        </CardContent>
      </Card>
    </div>
  );
}
