import { NextRequest, NextResponse } from 'next/server';
import { loadApiDocHtml, saveApiDocHtml } from '@/lib/server/managed-docs';
import { syncDocToRepository } from '@/lib/server/repo-sync';

export async function GET() {
  try {
    const content = await loadApiDocHtml();

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
    const content = await saveApiDocHtml(payload.content ?? '');

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
