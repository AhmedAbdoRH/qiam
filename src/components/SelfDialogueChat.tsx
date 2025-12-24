import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Send, User, Heart, Repeat } from 'lucide-react';
import { SelfDialogueIconNew } from './icons/SelfDialogueIconNew';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// ✨ تحسينات الستايل: تغميق الخلفية وجعلها أكثر هدوءاً
const styles = `
  @keyframes message-pop {
    0% { opacity: 0; transform: translateY(10px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-message-pop {
    animation: message-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  [data-radix-scroll-area-viewport] {
    scrollbar-gutter: stable;
  }

  /* تمويه الخلفية المتحركة - جعلناها داكنة جداً */
  @keyframes wave-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .wave-gradient-bg {
    background: linear-gradient(
      45deg,
      rgba(139, 0, 0, 0.4),
      rgba(184, 134, 11, 0.4),
      rgba(255, 140, 0, 0.4),
      rgba(85, 107, 47, 0.4)
    );
    background-size: 300% 300%;
    animation: wave-gradient 10s ease-in-out infinite;
  }

  /* تعديل: خلفية سوداء شبه معتمة مع تموج خفيف جداً */
  .subtle-wave-bg {
    background: linear-gradient(
      180deg,
      rgba(5, 5, 5, 0.98) 0%,
      rgba(15, 15, 15, 0.99) 100%
    );
  }
`;

interface DialogueMessage {
  id: string;
  sender: 'me' | 'myself';
  message: string;
  created_at: string;
}

export function SelfDialogueChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentSender, setCurrentSender] = useState<'me' | 'myself'>('me');
  const [isAutoSwitch, setIsAutoSwitch] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadMessages();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('self_dialogue_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedMessages = (data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'me' | 'myself',
        message: msg.message,
        created_at: msg.created_at
      }));

      setMessages(formattedMessages);
      
      if (formattedMessages.length > 0) {
        const lastSender = formattedMessages[formattedMessages.length - 1].sender;
        if (isAutoSwitch) {
            setCurrentSender(lastSender === 'me' ? 'myself' : 'me');
        } else {
            setCurrentSender(lastSender);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('هل تريد حذف هذه الرسالة نهائياً؟')) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        try {
            const { error } = await supabase
                .from('self_dialogue_messages')
                .delete()
                .eq('id', messageId);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting message:', error);
            loadMessages();
        }
    }
  };

  const handleMouseDown = (id: string) => {
    longPressTimerRef.current = setTimeout(() => handleDeleteMessage(id), 600);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
  };

  const handleManualSwitch = (sender: 'me' | 'myself') => {
    setCurrentSender(sender);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const senderForThisMessage = currentSender;
    const newMessage: DialogueMessage = {
      id: crypto.randomUUID(),
      sender: senderForThisMessage,
      message: inputValue.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    if (isAutoSwitch) {
        setCurrentSender(prev => prev === 'me' ? 'myself' : 'me');
    }
    
    requestAnimationFrame(() => {
        inputRef.current?.focus();
    });

    try {
      const { error } = await supabase
        .from('self_dialogue_messages')
        .insert({
          user_id: user.id,
          sender: senderForThisMessage,
          message: newMessage.message
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <style>{styles}</style>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-32 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full wave-gradient-bg backdrop-blur-lg border border-white/20 shadow-xl shadow-black/40 transition-all hover:scale-110 hover:shadow-black/60"
          >
            <SelfDialogueIconNew className="h-7 w-7 drop-shadow-lg text-white" />
          </Button>
        </DialogTrigger>

        <DialogContent 
            // تعديل: خلفية سوداء تماماً تقريباً
            className="sm:max-w-[450px] bg-[#050505] subtle-wave-bg backdrop-blur-xl rounded-2xl border border-white/5 text-white p-0 overflow-hidden shadow-2xl"
            onOpenAutoFocus={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
            }}
        >
          <DialogHeader className="p-1 border-b border-white/5 h-0 opacity-0">
            <DialogTitle className="sr-only">حوار مع النفس</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-[60vh] w-full">
            {/* Messages Area - Darker background */}
            <ScrollArea className="flex-1 p-4 w-full bg-black/20" ref={scrollRef}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/30 text-sm animate-pulse">جاري استرجاع الذكريات...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <div className="p-4 rounded-full bg-white/5">
                    <SelfDialogueIconNew className="h-10 w-10 text-white/30" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm font-medium">مساحة هادئة للحديث مع ذاتك</p>
                    <p className="text-white/20 text-xs mt-2">ابدأ بكتابة أول رسالة</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex w-full animate-message-pop ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div 
                          className={`max-w-[85%] group cursor-pointer select-none transition-all duration-200 active:scale-95`}
                          onMouseDown={() => handleMouseDown(msg.id)}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onTouchStart={() => handleMouseDown(msg.id)}
                          onTouchEnd={handleMouseUp}
                      >
                        <div
                          className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.sender === 'me'
                              ? 'bg-blue-900/10 text-blue-100/90 rounded-bl-none border border-blue-500/10' // Darker bubble
                              : 'bg-pink-900/10 text-pink-100/90 rounded-br-none border border-pink-500/10' // Darker bubble
                          }`}
                        >
                          {msg.message}
                        </div>
                        
                        <div className={`flex items-center gap-1.5 mt-1.5 px-1 opacity-40 text-[10px] ${msg.sender === 'me' ? 'justify-start flex-row' : 'justify-end flex-row-reverse'}`}>
                          {msg.sender === 'me' ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Heart className="h-3 w-3" />
                          )}
                          <span>{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {/* Input Area */}
            <div className="p-3 bg-black/60 backdrop-blur-md border-t border-white/5">
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-3 mb-3">
                  {/* Auto Switch Toggle */}
                  <button
                      onClick={() => setIsAutoSwitch(!isAutoSwitch)}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                          isAutoSwitch 
                          ? 'bg-green-900/20 text-green-400/80 border border-green-500/20' 
                          : 'bg-white/5 text-white/20 hover:bg-white/10'
                      }`}
                      title="تبديل تلقائي للأدوار"
                  >
                      <Repeat className={`h-3.5 w-3.5 ${isAutoSwitch ? 'rotate-180' : ''} transition-transform duration-300`} />
                  </button>

                  {/* Role Switcher */}
                  <div className="relative flex bg-white/5 rounded-full p-1 w-32 border border-white/5">
                    <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 shadow-sm ${
                        currentSender === 'myself'
                            ? 'left-1 bg-pink-900/40 border border-pink-500/20'
                            : 'left-[calc(50%)] bg-blue-900/40 border border-blue-500/20'
                        }`}
                    />
                    
                    <button onClick={() => handleManualSwitch('myself')} className="relative z-10 w-1/2 text-[10px] py-1 font-medium text-center text-white/70 hover:text-white transition-colors">
                        نفسي
                    </button>
                    <button onClick={() => handleManualSwitch('me')} className="relative z-10 w-1/2 text-[10px] py-1 font-medium text-center text-white/70 hover:text-white transition-colors">
                        أنا
                    </button>
                  </div>
              </div>
              
              {/* Input & Send Button Layout Modification */}
              <div className="flex flex-col gap-2 w-full">
                <Textarea
                  ref={inputRef}
                  placeholder={currentSender === 'me' ? 'تحدث بصوتك...' : 'تحدث بصوت قلبك...'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className={`min-h-[44px] max-h-[120px] bg-white/5 border-white/5 focus:border-white/10 text-white placeholder:text-white/20 rounded-xl resize-none py-3 px-4 shadow-inner transition-colors ${
                    currentSender === 'me' 
                    ? 'focus:ring-1 focus:ring-blue-500/20' 
                    : 'focus:ring-1 focus:ring-pink-500/20'
                  }`}
                  rows={1}
                />
                
                {/* تعديل: الزر أسفل النص ورفيع جداً */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`w-full h-7 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    currentSender === 'me'
                      ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-100 border border-blue-500/20'
                      : 'bg-pink-900/30 hover:bg-pink-800/40 text-pink-100 border border-pink-500/20'
                  } disabled:opacity-30 disabled:grayscale disabled:border-transparent`}
                >
                  <Send className="h-3 w-3" />
                  {/* يمكن إضافة نص هنا إذا أردت، لكن تركته أيقونة فقط للحفاظ على البساطة */}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
