import { cookies } from 'next/headers';
import { DocsPageShell } from '@/components/docs-page-shell';
import { verifyDocsAccessToken, DOCS_ACCESS_COOKIE_NAME } from '@/lib/server/auth-session';
import { loadApiDocHtml } from '@/lib/server/managed-docs';

export const dynamic = 'force-dynamic';

export default async function DocsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(DOCS_ACCESS_COOKIE_NAME)?.value;
  const hasDocsAccess = verifyDocsAccessToken(accessToken);

  if (!hasDocsAccess) {
    return <DocsPageShell docContent="" hasError={false} requiresPassword />;
  }

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

  return <DocsPageShell docContent={docContent} hasError={hasError} requiresPassword={false} />;
}
