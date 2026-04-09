import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquareText, Send, Cloud, RefreshCw, CloudOff, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const chatStyles = `
  @keyframes chat-message-pop {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-chat-pop {
    animation: chat-message-pop 0.2s ease-out;
  }
  
  /* تحسينات للهواتf المحمولة */
  @media (max-width: 640px) {
    .mobile-chat-container {
      height: 100dvh !important;
      width: 100vw !important;
      max-width: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }
    .dialog-content-mobile {
      padding: 0 !important;
      margin: 0 !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      transform: none !important;
      height: 100dvh !important;
      width: 100vw !important;
      max-width: none !important;
    }
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  }, [messages, isOpen]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;
    
    const textToSend = inputValue.trim();
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newMsg: Message = {
      id: tempId,
      text: textToSend,
      isSender: true,
      created_at: now,
      status: 'pending',
    };
    
    // إظهار الرسالة فوراً عند الإرسال
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    
    // إعادة التركيز على حقل النص بعد الإرسال (للموبايل)
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    try {
      const { data, error } = await supabase
        .from('divine_name_monologues')
        .insert({
          user_id: user.id,
          divine_name: 'chat',
          message: textToSend,
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

  const handleLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    // محاكاة الضغط المطول لإضافة سطرين
    let timer: any;
    const start = () => {
      timer = setTimeout(() => {
        setInputValue(prev => prev + '\n\n');
      }, 600);
    };
    const stop = () => clearTimeout(timer);

    if (e.type === 'touchstart' || e.type === 'mousedown') start();
    if (e.type === 'touchend' || e.type === 'mouseup' || e.type === 'mouseleave') stop();
  };

  return (
    <>
      <style>{chatStyles}</style>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-32 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/80 backdrop-blur-lg border border-white/20 shadow-xl transition-all hover:scale-110 hover:bg-blue-500 active:scale-95">
            <MessageSquareText className="h-7 w-7 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="dialog-content-mobile sm:max-w-[450px] p-0 border-0 bg-transparent shadow-none [&>button]:hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>محادثة</DialogTitle>
            <DialogDescription>نافذة المحادثة الاحترافية</DialogDescription>
          </DialogHeader>
          
          <div className="mobile-chat-container flex flex-col h-[550px] w-full overflow-hidden sm:rounded-3xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-white/90">المحادثة المباشرة</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages area */}
            <ScrollArea ref={scrollRef} className="flex-grow w-full">
              <div className="p-4 space-y-4 min-h-full flex flex-col justify-end">
                {loading ? (
                  <div className="flex items-center justify-center h-full py-10">
                    <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 opacity-20">
                    <MessageSquareText className="h-12 w-12 mb-2" />
                    <p className="text-sm">ابدأ المحادثة الآن...</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={msg.id} className={`flex justify-end ${i === messages.length - 1 ? 'animate-chat-pop' : ''}`}>
                      <div className="max-w-[85%] group">
                        <div className="relative px-4 py-3 rounded-2xl rounded-tr-sm break-words bg-blue-600/20 text-blue-50 border border-blue-500/30 shadow-sm">
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-light" style={{ unicodeBidi: 'plaintext' }}>
                            {msg.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 justify-end px-1">
                          <span className="text-[10px] text-white/30 font-medium">{formatTime(msg.created_at)}</span>
                          {msg.status === 'pending' && <RefreshCw className="h-3 w-3 text-blue-400/50 animate-spin" />}
                          {msg.status === 'error' && <CloudOff className="h-3 w-3 text-red-400/50" />}
                          {msg.status === 'synced' && <Cloud className="h-3 w-3 text-green-400/40" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
              <div className="flex flex-col gap-3">
                <Textarea
                  ref={textareaRef}
                  placeholder="اكتب رسالتك هنا..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full resize-none rounded-2xl bg-white/5 border-white/10 text-white text-[15px] placeholder:text-white/20 min-h-[50px] max-h-[150px] focus-visible:ring-2 focus-visible:ring-blue-500/50 p-4 transition-all"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage} 
                  onMouseDown={handleLongPress}
                  onMouseUp={handleLongPress}
                  onMouseLeave={handleLongPress}
                  onTouchStart={handleLongPress}
                  onTouchEnd={handleLongPress}
                  disabled={!inputValue.trim()}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-600/20 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>إرسال</span>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
