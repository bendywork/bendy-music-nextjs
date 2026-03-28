import { NextRequest, NextResponse } from 'next/server';
import { STORE_KEYS, getStoredValue, readTextFile, setStoredValue } from '@/lib/server/data-store';
import { syncDocToRepository } from '@/lib/server/repo-sync';

export async function GET() {
  try {
    const content = await getStoredValue(
      STORE_KEYS.DOC_README,
      () => readTextFile('README.md', '# ddmusic-nextjs\n'),
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read README document:', error);
    return NextResponse.json(
      { error: 'Failed to read README document' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { content?: string };
    const content = payload.content ?? '';
    await setStoredValue(STORE_KEYS.DOC_README, content);

    const repoSync = await syncDocToRepository('readme', content);

    return NextResponse.json({
      message: 'README saved',
      repoSync,
    });
  } catch (error) {
    console.error('Failed to save README document:', error);
    return NextResponse.json(
      { error: 'Failed to save README document' },
      { status: 500 },
    );
  }
}
