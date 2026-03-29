import { Save } from 'lucide-react';
import MarkdownEditor from '@/components/MarkdownEditor';
import { SectionIntro } from '@/components/dashboard/shared';
import type { DocTabKey } from '@/components/dashboard/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export function DocsPanel({
  activeDocTab,
  onDocTabChange,
  readmeContent,
  onReadmeChange,
  docPropContent,
  onDocPropChange,
  readmeBusy,
  apiBusy,
  onSaveReadme,
  onSaveApiDoc,
}: {
  activeDocTab: DocTabKey;
  onDocTabChange: (value: DocTabKey) => void;
  readmeContent: string;
  onReadmeChange: (value: string) => void;
  docPropContent: string;
  onDocPropChange: (value: string) => void;
  readmeBusy: boolean;
  apiBusy: boolean;
  onSaveReadme: () => void;
  onSaveApiDoc: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title="文档中心"
        description="README 和 API 文档配置都会直接写回本地 UTF-8 文件，再同步数据库和 GitHub。"
        badge="UTF-8 source of truth"
      />

      <Tabs value={activeDocTab} onValueChange={(value) => onDocTabChange(value as DocTabKey)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="readme">README.md</TabsTrigger>
            <TabsTrigger value="api">API Doc Config</TabsTrigger>
          </TabsList>
          <Badge variant="outline">
            {activeDocTab === 'readme' ? '路径: /README.md' : '路径: /doc/doc-prop.json'}
          </Badge>
        </div>

        <TabsContent value="readme">
          <Card className="rounded-[2rem]">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>README 编辑器</CardTitle>
                <CardDescription>编辑器内容和外部值保持同步，避免重新拉取后仍显示旧内容。</CardDescription>
              </div>
              <Button type="button" onClick={onSaveReadme} disabled={readmeBusy}>
                <Save className="h-4 w-4" />
                {readmeBusy ? '保存中...' : '保存 README'}
              </Button>
            </CardHeader>
            <CardContent>
              <MarkdownEditor
                value={readmeContent}
                onChange={onReadmeChange}
                placeholder="在这里编辑 README.md"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="rounded-[2rem]">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>API 文档配置</CardTitle>
                <CardDescription>保存前会校验 JSON 格式，避免写出非法配置文件。</CardDescription>
              </div>
              <Button type="button" onClick={onSaveApiDoc} disabled={apiBusy}>
                <Save className="h-4 w-4" />
                {apiBusy ? '保存中...' : '保存 API 文档'}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={docPropContent}
                onChange={(event) => onDocPropChange(event.target.value)}
                className="min-h-[560px] font-mono text-xs"
                placeholder="输入 doc-prop.json 内容"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
