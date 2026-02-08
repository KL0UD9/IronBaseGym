import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, RotateCcw, Check, X } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  messageId: string;
  onEdit?: (messageId: string, newContent: string) => void;
  onRetry?: (messageId: string) => void;
  isEditing?: boolean;
  isRetrying?: boolean;
}

export function ChatMessage({ 
  content, 
  role, 
  messageId,
  onEdit, 
  onRetry,
  isEditing: externalIsEditing,
  isRetrying 
}: ChatMessageProps) {
  const isUser = role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveEdit = () => {
    if (editedContent.trim() && onEdit) {
      onEdit(messageId, editedContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div 
      className={cn("flex group", isUser ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-1 max-w-[80%]">
        {isEditing ? (
          <div className="flex gap-2 items-end">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-[200px]"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-8 w-8 text-primary hover:text-primary">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 text-destructive hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm",
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
                      p: ({ children }) => <p className="my-1">{children}</p>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold my-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold my-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-bold my-1">{children}</h3>
                      ),
                      code: ({ children }) => (
                        <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                      ),
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

            {/* Action buttons */}
            <div 
              className={cn(
                "flex gap-1 transition-opacity duration-200",
                isUser ? 'justify-end' : 'justify-start',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            >
              {isUser && onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {!isUser && onRetry && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRetry(messageId)}
                  disabled={isRetrying}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className={cn("h-3 w-3 mr-1", isRetrying && "animate-spin")} />
                  {isRetrying ? 'Regenerating...' : 'Regenerate'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
