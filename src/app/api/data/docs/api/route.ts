import { NextRequest, NextResponse } from 'next/server';
import { loadApiDocHtml, regenerateApiDocHtml, saveApiDocHtml } from '@/lib/server/managed-docs';
import { syncDocToRepository } from '@/lib/server/repo-sync';

export async function GET() {
  try {
    const content = await loadApiDocHtml();

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read docs page content:', error);
    const message = error instanceof Error ? error.message : 'Failed to read docs page content';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { content?: string; regenerate?: boolean };
    const content = payload.regenerate
      ? await regenerateApiDocHtml()
      : await saveApiDocHtml(payload.content ?? '');

    const repoSync = await syncDocToRepository('api', content);

    return NextResponse.json({
      message: payload.regenerate ? 'Docs page regenerated' : 'Docs page saved',
      repoSync,
    });
  } catch (error) {
    console.error('Failed to save docs page content:', error);
    const message = error instanceof Error ? error.message : 'Failed to save docs page content';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
