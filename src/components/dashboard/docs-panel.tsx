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
        title="Docs Center"
        description="Edit README.md as Markdown and /docs as a full HTML document. Saves write back to local files first, then sync to the configured GitHub repository."
        badge="File-backed docs"
      />

      <Tabs value={activeDocTab} onValueChange={(value) => onDocTabChange(value as DocTabKey)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="readme">README.md</TabsTrigger>
            <TabsTrigger value="docs">doc/doc.html</TabsTrigger>
          </TabsList>
          <Badge variant="outline">
            {activeDocTab === 'readme' ? 'Path: /README.md' : 'Path: /doc/doc.html -> /docs'}
          </Badge>
        </div>

        <TabsContent value="readme">
          <Card className="rounded-[2rem]">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>README editor</CardTitle>
                <CardDescription>
                  This editor writes directly to the project README file, then mirrors the content to the admin data store and GitHub sync target.
                </CardDescription>
              </div>
              <Button type="button" onClick={onSaveReadme} disabled={readmeBusy}>
                <Save className="h-4 w-4" />
                {readmeBusy ? 'Saving...' : 'Save README'}
              </Button>
            </CardHeader>
            <CardContent>
              <MarkdownEditor
                value={readmeContent}
                onChange={onReadmeChange}
                placeholder="Edit README.md here"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card className="rounded-[2rem]">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>/docs HTML editor</CardTitle>
                <CardDescription>
                  Edit the full HTML document that is rendered at https://ddmusic.polofox.com/docs. Styles and scripts are preserved because the page is rendered from the saved HTML file.
                </CardDescription>
              </div>
              <Button type="button" onClick={onSaveDocsPage} disabled={docsBusy}>
                <Save className="h-4 w-4" />
                {docsBusy ? 'Saving...' : 'Save /docs'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="overflow-hidden rounded-[1.6rem] border border-border bg-card/80 shadow-sm">
                  <div className="border-b border-border/80 px-4 py-3">
                    <p className="text-sm font-semibold">HTML source</p>
                    <p className="text-xs text-muted-foreground">Full document stored in doc/doc.html</p>
                  </div>
                  <div className="p-4">
                    <Textarea
                      value={docsPageContent}
                      onChange={(event) => onDocsPageChange(event.target.value)}
                      className="min-h-[560px] resize-y font-mono text-xs"
                      placeholder="Paste the full HTML document for /docs"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.6rem] border border-border bg-card/80 shadow-sm">
                  <div className="border-b border-border/80 px-4 py-3">
                    <p className="text-sm font-semibold">Live preview</p>
                    <p className="text-xs text-muted-foreground">Rendered from the current HTML buffer</p>
                  </div>
                  <iframe
                    title="Docs preview"
                    srcDoc={docsPageContent}
                    className="min-h-[560px] w-full bg-white"
                    sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
