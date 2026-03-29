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
  docsPageContent,
  onDocsPageChange,
  readmeBusy,
  docsBusy,
  onSaveReadme,
  onSaveDocsPage,
}: {
  activeDocTab: DocTabKey;
  onDocTabChange: (value: DocTabKey) => void;
  readmeContent: string;
  onReadmeChange: (value: string) => void;
  docsPageContent: string;
  onDocsPageChange: (value: string) => void;
  readmeBusy: boolean;
  docsBusy: boolean;
  onSaveReadme: () => void;
  onSaveDocsPage: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title="文档中心"
        description="README 和 /docs 页面内容都会先保存到 PostgreSQL，再按配置同步回本地文件和 GitHub。"
        badge="PostgreSQL source of truth"
      />

      <Tabs value={activeDocTab} onValueChange={(value) => onDocTabChange(value as DocTabKey)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="readme">README.md</TabsTrigger>
            <TabsTrigger value="docs">Docs Page</TabsTrigger>
          </TabsList>
          <Badge variant="outline">
            {activeDocTab === 'readme' ? '路径: /README.md' : '渲染页: /docs'}
          </Badge>
        </div>

        <TabsContent value="readme">
          <Card className="rounded-[2rem]">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>README 编辑器</CardTitle>
                <CardDescription>编辑内容会与数据库和仓库同步，避免刷新后又回到旧版本。</CardDescription>
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

        <TabsContent value="docs">
          <Card className="rounded-[2rem]">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>/docs 页面内容</CardTitle>
                <CardDescription>这里编辑的 HTML 会直接作为 https://ddmusic.polofox.com/docs 的渲染内容。</CardDescription>
              </div>
              <Button type="button" onClick={onSaveDocsPage} disabled={docsBusy}>
                <Save className="h-4 w-4" />
                {docsBusy ? '保存中...' : '保存 /docs'}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={docsPageContent}
                onChange={(event) => onDocsPageChange(event.target.value)}
                className="min-h-[560px] font-mono text-xs"
                placeholder="输入 /docs 页面 HTML 内容"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
