import { NextRequest, NextResponse } from 'next/server';
import { loadReadmeMarkdown, saveReadmeMarkdown } from '@/lib/server/managed-docs';
import { syncDocToRepository } from '@/lib/server/repo-sync';

export async function GET() {
  try {
    const content = await loadReadmeMarkdown();
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read README document:', error);
    const message = error instanceof Error ? error.message : 'Failed to read README document';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { content?: string };
    const content = await saveReadmeMarkdown(payload.content ?? '');

    const repoSync = await syncDocToRepository('readme', content);

    return NextResponse.json({
      message: 'README saved',
      repoSync,
    });
  } catch (error) {
    console.error('Failed to save README document:', error);
    const message = error instanceof Error ? error.message : 'Failed to save README document';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
