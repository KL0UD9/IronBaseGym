import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessage } from '@/components/coach/ChatMessage';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export default function CoachPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!user
  });

  // Send message mutation with real AI
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      // Save user message
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({ user_id: user!.id, content, role: 'user' });
      if (userMsgError) throw userMsgError;

      // Invalidate to show user message immediately
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', user?.id] });

      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Call AI coach edge function
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: { 
            message: content,
            conversationHistory: messages?.slice(-10) || []
          }
        });

        if (error) throw error;

        const aiResponse = data.response || t('coach.errorResponse');
        
        // Save AI response
        const { error: aiMsgError } = await supabase
          .from('chat_messages')
          .insert({ user_id: user!.id, content: aiResponse, role: 'assistant' });
        if (aiMsgError) throw aiMsgError;
      } catch (error) {
        console.error('AI Coach error:', error);
        // Save fallback response
        const fallbackResponse = t('coach.fallbackResponse');
        await supabase
          .from('chat_messages')
          .insert({ user_id: user!.id, content: fallbackResponse, role: 'assistant' });
        toast.error(t('coach.aiError'));
      }
      
      setIsTyping(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', user?.id] });
      setMessage('');
    },
    onError: (error) => {
      console.error('Send message error:', error);
      setIsTyping(false);
      toast.error(t('coach.sendError'));
    }
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessage.isPending) return;
    sendMessage.mutate(message.trim());
  };

  return (
    <MemberLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)]">
        <Card className="glass-card h-full flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('coach.title')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('coach.subtitle')}</p>
              </div>
              <Sparkles className="h-5 w-5 text-primary ml-auto animate-pulse" />
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages?.length === 0 && !isTyping ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                    <Bot className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('coach.emptyState.title')}</h3>
                  <p className="text-muted-foreground max-w-sm">
                    {t('coach.emptyState.subtitle')}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[t('coach.suggestions.workout'), t('coach.suggestions.nutrition'), t('coach.suggestions.motivation')].map((suggestion, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages?.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      content={msg.content}
                      role={msg.role}
                    />
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('coach.input.placeholder')}
                  className="flex-1 bg-background/50"
                  disabled={sendMessage.isPending}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!message.trim() || sendMessage.isPending}
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
