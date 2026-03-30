import { DocsPageShell } from '@/components/docs-page-shell';
import { loadApiDocHtml } from '@/lib/server/managed-docs';

export const dynamic = 'force-dynamic';

export default async function DocsPage() {
  let docContent = '';
  let hasError = false;

  try {
    docContent = await loadApiDocHtml();

    if (!docContent) {
      hasError = true;
    }
  } catch (loadError) {
    console.error('Failed to load docs page:', loadError);
    hasError = true;
  }

  return <DocsPageShell docContent={docContent} hasError={hasError} />;
}
