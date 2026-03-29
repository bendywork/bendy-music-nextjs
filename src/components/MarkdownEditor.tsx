'use client';

import React, { useEffect, useState } from 'react';
import Editor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import 'react-markdown-editor-lite/lib/index.css';

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

const renderHTML = (text: string) => mdParser.render(text);

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter markdown content',
}: MarkdownEditorProps) {
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorChange = ({ text }: { text: string }) => {
    setEditorValue(text);
    onChange(text);
  };

  return (
    <div className="markdown-editor-shell w-full overflow-hidden rounded-[1.6rem] border border-border bg-card/80 shadow-sm">
      <Editor
        value={editorValue}
        onChange={handleEditorChange}
        placeholder={placeholder}
        renderHTML={renderHTML}
        className="!border-0 !bg-transparent"
        style={{
          height: '520px',
        }}
      />
    </div>
  );
}
