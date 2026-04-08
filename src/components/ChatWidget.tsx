import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquareText, Send, Cloud, RefreshCw, CloudOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const chatStyles = `
  @keyframes chat-message-pop {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-chat-pop {
    animation: chat-message-pop 0.15s ease-out;
  }
`;

interface Message {
  id: string;
  text: string;
  isSender: boolean;
  created_at: string;
  status: 'pending' | 'synced' | 'error';
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Load messages from DB
  useEffect(() => {
    if (!isOpen || !user) return;
    const loadMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('divine_name_monologues')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (data) {
          setMessages(data.map(m => ({
            id: m.id,
            text: m.message,
            isSender: true,
            created_at: m.created_at,
            status: 'synced' as const,
          })));
        }
      } catch (e) {
        console.error('Error loading messages:', e);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [isOpen, user]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;
    
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newMsg: Message = {
      id: tempId,
      text: inputValue.trim(),
      isSender: true,
      created_at: now,
      status: 'pending',
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    try {
      const { data, error } = await supabase
        .from('divine_name_monologues')
        .insert({
          user_id: user.id,
          divine_name: 'chat',
          message: newMsg.text,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, id: data.id, status: 'synced' as const } : m
      ));
    } catch (e) {
      console.error('Error sending message:', e);
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'error' as const } : m
      ));
    }
  };

  return (
    <>
      <style>{chatStyles}</style>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-32 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-lg border border-white/10 shadow-lg transition-all hover:scale-110 hover:bg-black/40">
            <MessageSquareText className="h-6 w-6 text-white/40" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>محادثة</DialogTitle>
            <DialogDescription>نافذة المحادثة</DialogDescription>
          </DialogHeader>
          
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
            {/* Messages area */}
            <ScrollArea ref={scrollRef} className="h-[350px] w-full">
              <div className="p-3 space-y-2 min-h-full flex flex-col justify-end">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-4 w-4 text-white/20 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[10px] text-white/15">ابدأ المحادثة...</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={msg.id} className={`flex justify-start ${i === messages.length - 1 ? 'animate-chat-pop' : ''}`}>
                      <div className="max-w-[85%]">
                        <div className="inline-block p-2.5 rounded-2xl rounded-bl-sm break-words bg-[#626FC4]/20 text-[#C8CCEC] border border-[#626FC4]/20">
                          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ unicodeBidi: 'plaintext' }}>{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 justify-start">
                          <span className="text-[7px] text-white/20">{formatTime(msg.created_at)}</span>
                          {msg.status === 'pending' && <RefreshCw className="h-2 w-2 text-white/30 animate-spin" />}
                          {msg.status === 'error' && <CloudOff className="h-2 w-2 text-red-400/50" />}
                          {msg.status === 'synced' && <Cloud className="h-2 w-2 text-green-400/20" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-2 border-t border-white/5 bg-black/30">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="اكتب هنا..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-grow resize-none rounded-xl bg-white/5 border-white/10 text-white/90 text-xs placeholder:text-white/20 min-h-[36px] max-h-[80px] focus-visible:ring-1 focus-visible:ring-[#626FC4]/30"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim()}
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border-0 shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:shadow-none transition-all"
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
