import { NextRequest, NextResponse } from 'next/server';
import { STORE_KEYS, readTextFile, setStoredValue, writeTextFile } from '@/lib/server/data-store';
import { syncDocToRepository } from '@/lib/server/repo-sync';

const README_FALLBACK = '# bendy-music-nextjs\n';

export async function GET() {
  try {
    const content = await readTextFile('README.md', README_FALLBACK);
    await setStoredValue(STORE_KEYS.DOC_README, content);
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
    const content = await writeTextFile('README.md', payload.content ?? README_FALLBACK);
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
