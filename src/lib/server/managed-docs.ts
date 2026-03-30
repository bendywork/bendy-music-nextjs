import { STORE_KEYS, readTextFile, setStoredValue, writeTextFile } from '@/lib/server/data-store';

const README_FALLBACK = '# bendy-music-nextjs\n';

const DOCS_HTML_FALLBACK = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DDMusic Docs</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Segoe UI", Arial, sans-serif;
      background: #f5f6f8;
      color: #111827;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px;
      background:
        radial-gradient(circle at top left, rgba(239, 68, 68, 0.12), transparent 28%),
        radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.12), transparent 30%),
        #f5f6f8;
    }

    main {
      width: min(840px, 100%);
      padding: 40px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(17, 24, 39, 0.08);
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 5vw, 3rem);
    }

    p {
      margin: 0 0 16px;
      line-height: 1.7;
    }

    code {
      padding: 2px 8px;
      border-radius: 999px;
      background: #eef2ff;
      color: #3730a3;
    }
  </style>
</head>
<body>
  <main>
    <h1>DDMusic Docs</h1>
    <p>The HTML documentation file has not been initialized yet.</p>
    <p>Edit <code>doc/doc.html</code> from the dashboard and this page will render it directly.</p>
  </main>
</body>
</html>
`;

const syncStoreValueSafely = async (key: string, value: string): Promise<void> => {
  try {
    await setStoredValue(key, value);
  } catch (error) {
    console.warn(`Failed to mirror ${key} into store:`, error);
  }
};

const syncApiDocStoreSafely = async (value: string): Promise<void> => {
  await Promise.allSettled([
    syncStoreValueSafely(STORE_KEYS.DOC_API, value),
    syncStoreValueSafely(STORE_KEYS.DOC_PAGE, value),
  ]);
};

const isLegacyJsonPayload = (content: string): boolean => {
  const trimmed = content.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return false;
  }

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
};

export const loadReadmeMarkdown = async (): Promise<string> => {
  const content = await readTextFile('README.md', README_FALLBACK);
  const normalizedContent = content || README_FALLBACK;
  await syncStoreValueSafely(STORE_KEYS.DOC_README, normalizedContent);
  return normalizedContent;
};

export const saveReadmeMarkdown = async (content: string): Promise<string> => {
  const savedContent = await writeTextFile('README.md', content || README_FALLBACK);
  await syncStoreValueSafely(STORE_KEYS.DOC_README, savedContent);
  return savedContent;
};

export const loadApiDocHtml = async (): Promise<string> => {
  const content = await readTextFile('doc/doc.html', DOCS_HTML_FALLBACK);
  const normalizedContent = !content.trim() || isLegacyJsonPayload(content)
    ? DOCS_HTML_FALLBACK
    : content;

  if (normalizedContent !== content) {
    await writeTextFile('doc/doc.html', normalizedContent);
  }

  await syncApiDocStoreSafely(normalizedContent);
  return normalizedContent;
};

export const saveApiDocHtml = async (content: string): Promise<string> => {
  const normalizedContent = content.trim() ? content : DOCS_HTML_FALLBACK;
  const savedContent = await writeTextFile('doc/doc.html', normalizedContent);
  await syncApiDocStoreSafely(savedContent);
  return savedContent;
};
