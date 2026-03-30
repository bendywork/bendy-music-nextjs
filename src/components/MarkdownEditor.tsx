'use client';

import { useDeferredValue } from 'react';
import MarkdownIt from 'markdown-it';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter markdown content',
}: MarkdownEditorProps) {
  const deferredValue = useDeferredValue(value);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card/80 shadow-sm">
        <div className="border-b border-border/80 px-4 py-3">
          <p className="text-sm font-semibold">Markdown</p>
          <p className="text-xs text-muted-foreground">Editing README.md</p>
        </div>
        <div className="p-4">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="min-h-[520px] resize-y border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.6rem] border border-border bg-card/80 shadow-sm">
        <div className="border-b border-border/80 px-4 py-3">
          <p className="text-sm font-semibold">Preview</p>
          <p className="text-xs text-muted-foreground">Rendered markdown output</p>
        </div>
        <div
          className="prose prose-sm max-w-none p-6 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: mdParser.render(deferredValue || '') }}
        />
      </section>
    </div>
  );
}
