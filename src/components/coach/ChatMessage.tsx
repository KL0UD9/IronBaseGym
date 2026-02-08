import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

export function ChatMessage({ content, role }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn("flex", isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{content}</span>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-foreground prose-strong:font-semibold">
            <ReactMarkdown
              components={{
                // Override paragraph to avoid extra spacing
                p: ({ children }) => <p className="my-1">{children}</p>,
                // Style bold text
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                // Style lists properly
                ul: ({ children }) => (
                  <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                // Style headers
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold my-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold my-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold my-1">{children}</h3>
                ),
                // Style code
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                ),
                // Style blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
