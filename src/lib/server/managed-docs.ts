import { STORE_KEYS, readTextFile, setStoredValue, writeTextFile } from '@/lib/server/data-store';
import { GENERATED_API_DOC_MARKER, generateProjectApiDocHtml } from '@/lib/server/api-doc-generator';

const README_FALLBACK = '# bendy-music-nextjs\n';

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

const shouldRegenerateApiDoc = (content: string): boolean => {
  const trimmed = content.trim();
  if (!trimmed || isLegacyJsonPayload(trimmed)) {
    return true;
  }

  if (trimmed.includes(GENERATED_API_DOC_MARKER)) {
    return false;
  }

  return [
    '<title>DDMusic Docs</title>',
    '<title>DDMusic API Documentation</title>',
    'Built for DDMusic admin-managed documentation workflow.',
  ].some((marker) => trimmed.includes(marker));
};

export const regenerateApiDocHtml = async (): Promise<string> => {
  const generatedContent = await generateProjectApiDocHtml();
  const savedContent = await writeTextFile('doc/doc.html', generatedContent);
  await syncApiDocStoreSafely(savedContent);
  return savedContent;
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
  const content = await readTextFile('doc/doc.html', '');
  if (shouldRegenerateApiDoc(content)) {
    return regenerateApiDocHtml();
  }

  await syncApiDocStoreSafely(content);
  return content;
};

export const saveApiDocHtml = async (content: string): Promise<string> => {
  const normalizedContent = content.trim() ? content : await generateProjectApiDocHtml();
  const savedContent = await writeTextFile('doc/doc.html', normalizedContent);
  await syncApiDocStoreSafely(savedContent);
  return savedContent;
};
