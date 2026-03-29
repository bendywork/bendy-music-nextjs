import { Plus, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyRow, SectionIntro, TableShell, controlClassName } from '@/components/dashboard/shared';
import { statusVariant, type ProviderItem } from '@/components/dashboard/types';

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
  onToggleStatus,
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
  onToggleStatus: (providerId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title="服务商管理"
        description="维护每个 Provider 的编码、来源类型、URL 与状态。"
        badge={`${providers.length} providers`}
      />

      {editingProvider ? (
        <Card className="rounded-[2rem]">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{providers.some((item) => item.id === editingProvider.id) ? '编辑服务商' : '新增服务商'}</CardTitle>
              <CardDescription>建议填写完整的服务商名称、简称和请求地址。</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                取消
              </Button>
              <Button type="button" onClick={onSave} disabled={busy}>
                <Save className="h-4 w-4" />
                {busy ? '保存中...' : '保存服务商'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">服务商名称</label>
              <Input
                value={editingProvider.name}
                onChange={(event) => onChange({ ...editingProvider, name: event.target.value })}
                placeholder="例如 tunehub"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">服务商代码</label>
              <Input
                value={editingProvider.code}
                onChange={(event) => onChange({ ...editingProvider, code: event.target.value })}
                placeholder="例如 TH"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">类别</label>
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
                <option value="official">官方</option>
                <option value="personal">个人</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">类型</label>
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
                <option value="openSource">开源</option>
                <option value="nonProfit">公益</option>
                <option value="paid">付费</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">请求地址</label>
              <Input
                value={editingProvider.url || ''}
                onChange={(event) => onChange({ ...editingProvider, url: event.target.value })}
                placeholder="https://example.com/api"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">状态</label>
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
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">备注</label>
              <Input
                value={editingProvider.remark || ''}
                onChange={(event) => onChange({ ...editingProvider, remark: event.target.value })}
                placeholder="例如 LinuxDO 公益 API"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-[2rem]">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>服务商列表</CardTitle>
            <CardDescription>统一维护名称、代码、来源类型、URL 与可用状态。</CardDescription>
          </div>
          <Button type="button" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            新增服务商
          </Button>
        </CardHeader>
        <CardContent>
          <TableShell columns={['名称', '代码', '类别', '类型', 'URL', '状态', '备注', '操作']}>
            {providers.length > 0 ? (
              providers.map((provider) => (
                <tr key={provider.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-semibold">{provider.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{provider.code}</td>
                  <td className="px-4 py-3">{provider.category === 'personal' ? '个人' : '官方'}</td>
                  <td className="px-4 py-3">
                    {provider.nature === 'nonProfit' ? '公益' : provider.nature === 'paid' ? '付费' : '开源'}
                  </td>
                  <td className="max-w-[280px] px-4 py-3 font-mono text-xs">{provider.url || '-'}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onToggleStatus(provider.id)}>
                      <Badge variant={statusVariant(provider.status)}>
                        {provider.status === 'enabled' ? '启用' : '停用'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{provider.remark || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(provider)}>
                        编辑
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(provider.id)}>
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={8} message="当前还没有服务商配置。" />
            )}
          </TableShell>
        </CardContent>
      </Card>
    </div>
  );
}
