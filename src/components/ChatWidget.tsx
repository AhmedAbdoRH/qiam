import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquareText, Send, Cloud, RefreshCw, CloudOff, X, Trash2 } from 'lucide-react';
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
  
  @keyframes delete-fade {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.9); }
  }
  .animate-delete-fade {
    animation: delete-fade 0.3s ease-out forwards;
  }
  
  @keyframes timestamp-fade-in {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes timestamp-fade-out {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.8); }
  }
  
  .timestamp-display {
    animation: timestamp-fade-in 0.3s ease-out;
  }
  
  .timestamp-hide {
    animation: timestamp-fade-out 0.3s ease-out forwards;
  }
  
  /* تحسينات للهواتف المحمولة */
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
  isDeleting?: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const timestampTimer = useRef<NodeJS.Timeout | null>(null);
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
            isDeleting: false,
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

  const formatFullDateTime = (date: Date) => {
    const daysInArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = daysInArabic[date.getDay()];
    const dateStr = date.toLocaleDateString('ar-EG');
    const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${dayName}\n${dateStr}\n${timeStr}`;
  };

  const handleSendButtonLongPress = () => {
    const now = new Date();
    const timestamp = formatFullDateTime(now);
    setCurrentTimestamp(timestamp);
    setShowTimestamp(true);

    // إخفاء الطابع الزمني بعد 3 ثوانٍ
    if (timestampTimer.current) {
      clearTimeout(timestampTimer.current);
    }
    timestampTimer.current = setTimeout(() => {
      setShowTimestamp(false);
    }, 3000);
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
      isDeleting: false,
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

  const handleDeleteMessage = async (messageId: string) => {
    // إضافة تأثير الحذف
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isDeleting: true } : m
    ));

    // انتظار انتهاء الرسوم المتحركة
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('divine_name_monologues')
          .delete()
          .eq('id', messageId);
        
        if (error) throw error;
        
        // إزالة الرسالة من الحالة
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } catch (e) {
        console.error('Error deleting message:', e);
        // إعادة الرسالة في حالة الخطأ
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, isDeleting: false } : m
        ));
      }
    }, 300);

    setLongPressId(null);
  };

  const handleMessageLongPress = (messageId: string) => {
    setLongPressId(messageId);
  };

  const handleMessageTouchStart = (messageId: string) => {
    longPressTimer.current = setTimeout(() => {
      handleMessageLongPress(messageId);
    }, 600);
  };

  const handleMessageTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleSendButtonMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      handleSendButtonLongPress();
    }, 600);
  };

  const handleSendButtonMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
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
          
          <div className="mobile-chat-container flex flex-col h-[550px] w-full overflow-hidden sm:rounded-3xl border border-sky-400/20 bg-black/80 backdrop-blur-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-sky-400/10 bg-sky-950/30">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-sm font-medium text-sky-100">المحادثة المباشرة</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full text-sky-300/40 hover:text-sky-300 hover:bg-sky-400/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages area */}
            <ScrollArea ref={scrollRef} className="flex-grow w-full">
              <div className="p-4 space-y-1.5 min-h-full flex flex-col justify-end">
                {/* فراغ علوي افتراضي (8 أسطر) */}
                <div className="h-40" />

                {loading ? (
                  <div className="flex items-center justify-center h-full py-10">
                    <RefreshCw className="h-6 w-6 text-sky-400 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 opacity-20">
                    <MessageSquareText className="h-12 w-12 mb-2" />
                    <p className="text-sm">ابدأ المحادثة الآن...</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div 
                      key={msg.id} 
                      className={`flex justify-end group ${i === messages.length - 1 ? 'animate-chat-pop' : ''} ${msg.isDeleting ? 'animate-delete-fade' : ''}`}
                      onTouchStart={() => handleMessageTouchStart(msg.id)}
                      onTouchEnd={handleMessageTouchEnd}
                      onMouseDown={() => handleMessageTouchStart(msg.id)}
                      onMouseUp={handleMessageTouchEnd}
                      onMouseLeave={handleMessageTouchEnd}
                    >
                      <div className="max-w-[85%] relative">
                        <div className="relative px-4 py-2.5 rounded-2xl rounded-tr-sm break-words text-sky-50 border-0 shadow-none hover:bg-transparent transition-colors">
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-light" style={{ unicodeBidi: 'plaintext' }}>
                            {msg.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 justify-end px-1">
                          <span className="text-[9px] text-sky-300/40 font-medium">{formatTime(msg.created_at)}</span>
                          {msg.status === 'pending' && <RefreshCw className="h-3 w-3 text-sky-400/50 animate-spin" />}
                          {msg.status === 'error' && <CloudOff className="h-3 w-3 text-red-400/50" />}
                          {msg.status === 'synced' && <Cloud className="h-3 w-3 text-sky-400/40" />}
                        </div>

                        {/* Delete button on long press */}
                        {longPressId === msg.id && (
                          <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex gap-2">
                            <Button
                              onClick={() => handleDeleteMessage(msg.id)}
                              size="icon"
                              className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-600 text-white shadow-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-3 sm:p-4 border-t border-sky-400/10 bg-sky-950/20 backdrop-blur-md">
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
                  className="w-full resize-none rounded-2xl bg-sky-950/40 border-sky-400/20 text-sky-50 text-[14px] placeholder:text-sky-300/30 min-h-[50px] max-h-[150px] focus-visible:ring-2 focus-visible:ring-sky-400/50 p-4 transition-all"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  onMouseDown={handleSendButtonMouseDown}
                  onMouseUp={handleSendButtonMouseUp}
                  onMouseLeave={handleSendButtonMouseUp}
                  onTouchStart={handleSendButtonMouseDown}
                  onTouchEnd={handleSendButtonMouseUp}
                  disabled={!inputValue.trim()}
                  className="w-full h-12 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-lg shadow-lg shadow-sky-500/30 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>إرسال</span>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timestamp Display */}
      {showTimestamp && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]">
          <div className="timestamp-display bg-black/70 backdrop-blur-md px-8 py-6 rounded-2xl border border-sky-400/30 shadow-xl">
            <p className="text-sky-100 text-center text-xl font-semibold whitespace-pre-line leading-relaxed">
              {currentTimestamp}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
