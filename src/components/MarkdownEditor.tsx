'use client';

import React, { useState } from 'react';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// 创建markdown-it实例
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
});

// 渲染HTML
const renderHTML = (text: string) => {
  return mdParser.render(text);
};

export default function MarkdownEditor({ value, onChange, placeholder = '请输入Markdown内容' }: MarkdownEditorProps) {
  const [editorValue, setEditorValue] = useState(value);

  const handleEditorChange = ({ text }: { text: string }) => {
    setEditorValue(text);
    onChange(text);
  };

  return (
    <div className="w-full">
      <Editor
        value={editorValue}
        onChange={handleEditorChange}
        placeholder={placeholder}
        renderHTML={renderHTML}
        style={{
          height: '600px',
          border: '1px solid #e2e8f0',
          borderRadius: '0.375rem'
        }}
      />
    </div>
  );
}
