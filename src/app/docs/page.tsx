import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function DocsPage() {
  let docContent = '';
  let error = '';

  try {
    const docHtmlPath = join(/* turbopackIgnore: true */ process.cwd(), 'doc', 'doc.html');

    if (existsSync(docHtmlPath)) {
      docContent = readFileSync(docHtmlPath, 'utf8');
    } else {
      error = '未找到文档文件 doc/doc.html。';
    }
  } catch (loadError) {
    console.error('Failed to load docs page:', loadError);
    error = '文档加载失败，请稍后再试。';
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card/90 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black tracking-[-0.04em]">Docs Unavailable</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: docContent }} />;
}
