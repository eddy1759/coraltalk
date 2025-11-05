import { useState, useEffect, useRef } from 'react';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { useChatStream } from '@/hooks/useChatStream';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';
import { StreamingMessage } from '@/components/StreamingMessage';

const Index = () => {
  const [useGeneralLLM, setUseGeneralLLM] = useState(false);
  const { messages, isLoading, currentStreamingMessage, sendMessage } = useChatStream();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  const handleSendMessage = (message: string) => {
    sendMessage(message, useGeneralLLM);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
      <div className="flex flex-col w-full max-w-3xl h-[85vh] bg-background rounded-2xl shadow-xl overflow-hidden border">
        <ChatHeader useGeneralLLM={useGeneralLLM} onToggleLLM={setUseGeneralLLM} />
        
        <ScrollArea className="flex-1 min-h-0 p-6" ref={scrollAreaRef}>
          <div>
            {messages.length === 0 && !currentStreamingMessage && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Welcome to CoralTalk Chat Support
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Ask me anything!
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            
            {currentStreamingMessage && (
              <StreamingMessage content={currentStreamingMessage} />
            )}
            
            {isLoading && !currentStreamingMessage && (
              <div className="flex gap-3 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                  <Bot className="w-4 h-4 text-muted-foreground animate-pulse" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="dot-bounce dot-bounce-1" />
                  <span className="dot-bounce dot-bounce-2" />
                  <span className="dot-bounce dot-bounce-3" />
                </div>
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t border-border bg-card p-4">
          <div>
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;