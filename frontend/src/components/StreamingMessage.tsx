import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMessageProps {
  content: string;
}

export const StreamingMessage = ({ content }: StreamingMessageProps) => {
  return (
    <div className="flex gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
        <Bot className="w-4 h-4 text-muted-foreground animate-pulse" />
      </div>
      
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className="rounded-2xl px-4 py-3 bg-muted/50 text-foreground border rounded-tl-sm">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            <span className="inline-block w-1 h-4 bg-foreground animate-pulse ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};