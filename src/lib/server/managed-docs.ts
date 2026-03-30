import { STORE_KEYS, getStoredValue, readTextFile, setStoredValue, writeTextFile } from '@/lib/server/data-store';
import { GENERATED_API_DOC_MARKER, generateProjectApiDocHtml } from '@/lib/server/api-doc-generator';

const README_FALLBACK = '# bendy-music-nextjs\n';

const tryWriteTextFile = async (relativePath: string, content: string): Promise<string> => {
  try {
    return await writeTextFile(relativePath, content);
  } catch (error) {
    console.warn(`Failed to write ${relativePath}; continuing with stored content only:`, error);
    return content;
  }
};

const loadStoredText = async (
  key: string,
  fallbackFactory: () => Promise<string> | string,
): Promise<string | null> => {
  try {
    return await getStoredValue<string>(key, fallbackFactory);
  } catch (error) {
    console.warn(`Failed to read ${key} from store, fallback to local source:`, error);
    return null;
  }
};

const syncStoreValueSafely = async (key: string, value: string): Promise<void> => {
  try {
    await setStoredValue(key, value);
  } catch (error) {
    console.warn(`Failed to mirror ${key} into store:`, error);
  }
};

const persistApiDocStore = async (value: string): Promise<void> => {
  await Promise.all([
    setStoredValue(STORE_KEYS.DOC_API, value),
    setStoredValue(STORE_KEYS.DOC_PAGE, value),
  ]);
};

const syncApiDocStoreSafely = async (value: string): Promise<void> => {
  await Promise.allSettled([persistApiDocStore(value)]);
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
  await persistApiDocStore(generatedContent);
  await tryWriteTextFile('doc/doc.html', generatedContent);
  return generatedContent;
};

const selectReadmeContent = (storedContent: string | null, fileContent: string): string => {
  if (storedContent && storedContent.trim() && storedContent !== README_FALLBACK) {
    return storedContent;
  }

  if (fileContent.trim()) {
    return fileContent;
  }

  if (storedContent && storedContent.trim()) {
    return storedContent;
  }

  return README_FALLBACK;
};

const selectApiDocContent = (storedContent: string | null, fileContent: string): string => {
  if (storedContent && storedContent.trim() && !isLegacyJsonPayload(storedContent)) {
    return storedContent;
  }

  if (fileContent.trim()) {
    return fileContent;
  }

  return storedContent ?? '';
};

export const loadReadmeMarkdown = async (): Promise<string> => {
  const fileContent = await readTextFile('README.md', '');
  const storedContent = await loadStoredText(
    STORE_KEYS.DOC_README,
    () => fileContent || README_FALLBACK,
  );
  const normalizedContent = selectReadmeContent(storedContent, fileContent);

  if (storedContent !== normalizedContent) {
    await syncStoreValueSafely(STORE_KEYS.DOC_README, normalizedContent);
  }

  return normalizedContent;
};

export const saveReadmeMarkdown = async (content: string): Promise<string> => {
  const normalizedContent = content || README_FALLBACK;
  await setStoredValue(STORE_KEYS.DOC_README, normalizedContent);
  await tryWriteTextFile('README.md', normalizedContent);
  return normalizedContent;
};

export const loadApiDocHtml = async (): Promise<string> => {
  const fileContent = await readTextFile('doc/doc.html', '');
  const storedContent = await loadStoredText(
    STORE_KEYS.DOC_API,
    async () => fileContent || generateProjectApiDocHtml(),
  );
  const content = selectApiDocContent(storedContent, fileContent);

  if (shouldRegenerateApiDoc(content)) {
    return regenerateApiDocHtml();
  }

  if (storedContent !== content) {
    await syncApiDocStoreSafely(content);
  }

  return content;
};

export const saveApiDocHtml = async (content: string): Promise<string> => {
  const normalizedContent = content.trim() ? content : await generateProjectApiDocHtml();
  await persistApiDocStore(normalizedContent);
  await tryWriteTextFile('doc/doc.html', normalizedContent);
  return normalizedContent;
};
