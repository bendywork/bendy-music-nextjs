import { NextRequest, NextResponse } from 'next/server';
import { STORE_KEYS, getStoredValue, readTextFile, setStoredValue, writeTextFile } from '@/lib/server/data-store';
import { syncDocToRepository } from '@/lib/server/repo-sync';

const DOC_PAGE_FALLBACK = '';

export async function GET() {
  try {
    const content = await getStoredValue(
      STORE_KEYS.DOC_PAGE,
      () => readTextFile('doc/doc.html', DOC_PAGE_FALLBACK),
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read docs page content:', error);
    return NextResponse.json(
      { error: 'Failed to read docs page content' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { content?: string };
    const content = await writeTextFile('doc/doc.html', payload.content ?? DOC_PAGE_FALLBACK);
    await setStoredValue(STORE_KEYS.DOC_PAGE, content);

    const repoSync = await syncDocToRepository('api', content);

    return NextResponse.json({
      message: 'Docs page saved',
      repoSync,
    });
  } catch (error) {
    console.error('Failed to save docs page content:', error);
    return NextResponse.json(
      { error: 'Failed to save docs page content' },
      { status: 500 },
    );
  }
}
