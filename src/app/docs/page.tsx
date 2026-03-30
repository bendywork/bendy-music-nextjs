import { loadApiDocHtml } from '@/lib/server/managed-docs';

export const dynamic = 'force-dynamic';

export default async function DocsPage() {
  let docContent = '';
  let error = '';

  try {
    docContent = await loadApiDocHtml();

    if (!docContent) {
      error = 'Docs page content is unavailable.';
    }
  } catch (loadError) {
    console.error('Failed to load docs page:', loadError);
    error = 'Failed to load docs page content. Please try again later.';
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

  return (
    <iframe
      title="DDMusic API documentation"
      srcDoc={docContent}
      className="block min-h-screen w-full border-0 bg-white"
      sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
    />
  );
}
