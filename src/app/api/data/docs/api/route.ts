import { NextRequest, NextResponse } from 'next/server';
import { STORE_KEYS, readTextFile, setStoredValue, writeTextFile } from '@/lib/server/data-store';
import { syncDocToRepository } from '@/lib/server/repo-sync';

const API_DOC_FALLBACK = '{\n  "api": {}\n}\n';

export async function GET() {
  try {
    const content = await readTextFile('doc/doc-prop.json', API_DOC_FALLBACK);
    await setStoredValue(STORE_KEYS.DOC_API, content);
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read API document config:', error);
    return NextResponse.json(
      { error: 'Failed to read API document config' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { content?: string };
    const content = await writeTextFile('doc/doc-prop.json', payload.content ?? API_DOC_FALLBACK);
    await setStoredValue(STORE_KEYS.DOC_API, content);

    const repoSync = await syncDocToRepository('api', content);

    return NextResponse.json({
      message: 'API document config saved',
      repoSync,
    });
  } catch (error) {
    console.error('Failed to save API document config:', error);
    return NextResponse.json(
      { error: 'Failed to save API document config' },
      { status: 500 },
    );
  }
}
