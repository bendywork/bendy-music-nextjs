import { Plus, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyRow, SectionIntro, TableShell, controlClassName } from '@/components/dashboard/shared';
import { statusVariant, type ApiItem, type ProviderItem } from '@/components/dashboard/types';

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
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title="接口管理"
        description="维护 API 路径、路径类型、请求头和参数模版，并和服务商建立映射。"
        badge={`${apis.length} APIs`}
      />

      {editingApi ? (
        <Card className="rounded-[2rem]">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{apis.some((item) => item.id === editingApi.id) ? '编辑接口' : '新增接口'}</CardTitle>
              <CardDescription>支持相对路径或绝对路径，请求头和参数可以先保存原始字符串。</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                取消
              </Button>
              <Button type="button" onClick={onSave} disabled={busy}>
                <Save className="h-4 w-4" />
                {busy ? '保存中...' : '保存接口'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">接口名称</label>
              <Input
                value={editingApi.name}
                onChange={(event) => onChange({ ...editingApi, name: event.target.value })}
                placeholder="例如 获取歌曲信息"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">HTTP 方法</label>
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
              <label className="text-sm font-semibold">接口路径</label>
              <Input
                value={editingApi.path}
                onChange={(event) => onChange({ ...editingApi, path: event.target.value })}
                placeholder="/v1/parse"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">路径类型</label>
              <select
                value={editingApi.pathType}
                onChange={(event) =>
                  onChange({ ...editingApi, pathType: event.target.value as ApiItem['pathType'] })
                }
                className={controlClassName}
              >
                <option value="relative">相对路径</option>
                <option value="absolute">绝对路径</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">绑定服务商</label>
              <select
                value={editingApi.provider}
                onChange={(event) => onChange({ ...editingApi, provider: event.target.value })}
                className={controlClassName}
              >
                <option value="">未分配</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">状态</label>
              <select
                value={editingApi.status}
                onChange={(event) => onChange({ ...editingApi, status: event.target.value as ApiItem['status'] })}
                className={controlClassName}
              >
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">参数模版</label>
              <Textarea
                value={editingApi.params}
                onChange={(event) => onChange({ ...editingApi, params: event.target.value })}
                className="min-h-[120px] font-mono text-xs"
                placeholder='{"platform":"","ids":"","quality":""}'
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">请求头</label>
              <Textarea
                value={editingApi.headers}
                onChange={(event) => onChange({ ...editingApi, headers: event.target.value })}
                className="min-h-[100px] font-mono text-xs"
                placeholder="X-API-Key=xxx"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">备注</label>
              <Input
                value={editingApi.remark}
                onChange={(event) => onChange({ ...editingApi, remark: event.target.value })}
                placeholder="例如 解析歌曲，额度有限"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-[2rem]">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>接口列表</CardTitle>
            <CardDescription>将请求方法、Provider、请求头与参数模版放在同一个视图里管理。</CardDescription>
          </div>
          <Button type="button" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            新增接口
          </Button>
        </CardHeader>
        <CardContent>
          <TableShell columns={['名称', '方法', '路径', '类型', 'Provider', '状态', '备注', '操作']}>
            {apis.length > 0 ? (
              apis.map((api) => (
                <tr key={api.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-semibold">{api.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{api.method}</td>
                  <td className="max-w-[280px] px-4 py-3 font-mono text-xs">{api.path}</td>
                  <td className="px-4 py-3">{api.pathType === 'absolute' ? '绝对' : '相对'}</td>
                  <td className="px-4 py-3">{providerNameById(api.provider)}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onToggleStatus(api.id)}>
                      <Badge variant={statusVariant(api.status)}>
                        {api.status === 'enabled' ? '启用' : '停用'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{api.remark || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(api)}>
                        编辑
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(api.id)}>
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={8} message="当前还没有接口配置。" />
            )}
          </TableShell>
        </CardContent>
      </Card>
    </div>
  );
}
