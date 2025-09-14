'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { markdownSanitizeSchema } from '@/lib/markdown/sanitize-schema';

type Props = { content: string; className?: string; isDark?: boolean };

export default function MessageMarkdown({ content, className, isDark }: Props) {
  return (
    <div className={`prose max-w-none dark:prose-invert ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-2 hover:opacity-80'
            />
          ),
          p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-line' }} {...props} />,
          code({ node, className, children, ...props }) {
            // インライン: node.type !== 'code'
            const isInline = node?.tagName !== 'code';
            const match = /language-(\w+)/.exec(className || '');
            const language = match?.[1];
            if (!isInline && language) {
              return (
                <SyntaxHighlighter
                  style={isDark ? oneDark : oneLight}
                  language={language}
                  PreTag='div'
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className='' {...props}>
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className='w-full overflow-x-auto'>
              <table {...props} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
