import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MarkdownResultProps {
  content: string;
}

export const MarkdownResult: React.FC<MarkdownResultProps> = ({ content }) => {
  return (
    <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700 prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:p-2 prose-th:bg-slate-100 prose-td:border prose-td:border-slate-300 prose-td:p-2">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isLatex = match && match[1] === 'latex';
            return isLatex ? (
              <div className="my-4 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-sm print:border-slate-300 print:bg-white">
                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center print:hidden">
                  <span className="text-xs font-mono text-slate-400">TikZ / LaTeX Code</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono print:text-black print:whitespace-pre-wrap">
                  {children}
                </pre>
              </div>
            ) : (
              <code className={`${className} bg-slate-100 px-1 py-0.5 rounded text-sm font-mono text-pink-600 print:text-black print:bg-transparent`} {...props}>
                {children}
              </code>
            );
          },
          // Custom rendering for block math to ensure centering and spacing
          p: ({ children }) => {
            return <p className="mb-4 leading-relaxed">{children}</p>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
