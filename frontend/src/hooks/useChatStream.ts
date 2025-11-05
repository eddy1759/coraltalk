import { useState, useRef, useCallback } from 'react';
import type { ChatMessage } from '@/types/chat.types';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const useChatStream = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (query: string, useGeneralLLM: boolean) => {
    setIsLoading(true);
    setCurrentStreamingMessage('');
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          useGeneralLLM,
          conversationHistory,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = '';
      let citation: { source: string; confidence: number } | undefined;
      let currentEvent = '';
      
      // Batch updates for better performance
      let pendingUpdate = '';
      let updateTimer: NodeJS.Timeout | null = null;
      
      const flushUpdate = () => {
        if (pendingUpdate) {
          assistantMessage += pendingUpdate;
          setCurrentStreamingMessage(assistantMessage);
          pendingUpdate = '';
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          flushUpdate();
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) {
            currentEvent = '';
            continue;
          }
          
          if (line.startsWith(':')) continue;
          
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          
          if (line.startsWith('id: ')) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (currentEvent === 'token') {
              pendingUpdate += data;
              
              if (updateTimer) {
                clearTimeout(updateTimer);
              }
              updateTimer = setTimeout(flushUpdate, 16);
              
            } else if (currentEvent === 'citation') {
              flushUpdate();
              try {
                citation = JSON.parse(data);
              } catch (e) {
                console.error('Failed to parse citation:', e);
              }
            } else if (currentEvent === 'error') {
              flushUpdate();
              throw new Error(data || 'Stream error');
            } else if (currentEvent === 'end') {
              flushUpdate();
              break;
            }
          }
        }
      }
      
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      const completeAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantMessage,
        citation,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, completeAssistantMessage]);
      setCurrentStreamingMessage('');
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.info('Request cancelled');
        } else {
          console.error('Chat error:', error);
          toast.error('Failed to send message. Please check your backend connection.');
        }
      }
      
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    isLoading,
    currentStreamingMessage,
    sendMessage,
    cancelStream,
  };
};