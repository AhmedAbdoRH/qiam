import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircleHeart, Send, User, Heart, Repeat } from 'lucide-react';
import { SelfDialogueIconNew } from './icons/SelfDialogueIconNew';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// ✨ إضافة كلاسات الأنيميشن يدوياً لضمان النعومة
const styles = `
  @keyframes message-pop {
    0% { opacity: 0; transform: translateY(15px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-message-pop {
    animation: message-pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
  
  @keyframes wave-gradient {
    0% { background-position: 0% 50%; }
    25% { background-position: 50% 25%; }
    50% { background-position: 100% 50%; }
    75% { background-position: 50% 75%; }
    100% { background-position: 0% 50%; }
  }
  
  .wave-gradient-bg {
    background: linear-gradient(
      45deg,
      rgba(139, 0, 0, 0.3),
      rgba(184, 134, 11, 0.3),
      rgba(255, 140, 0, 0.3),
      rgba(85, 107, 47, 0.3),
      rgba(139, 0, 0, 0.3),
      rgba(184, 134, 11, 0.3)
    );
    background-size: 300% 300%;
    animation: wave-gradient 15s ease-in-out infinite;
  }
  
  .subtle-wave-bg {
    background: linear-gradient(
      45deg,
      rgba(139, 0, 0, 0.06),
      rgba(184, 134, 11, 0.06),
      rgba(255, 140, 0, 0.06),
      rgba(85, 107, 47, 0.06),
      rgba(139, 0, 0, 0.06),
      rgba(184, 134, 11, 0.06)
    );
    background-size: 400% 400%;
    animation: wave-gradient 25s ease-in-out infinite;
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
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100); // زيادة طفيفة للتأكد من ان الأنيميشن لا يعيق السكرول
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
      setMessages((data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'me' | 'myself',
        message: msg.message,
        created_at: msg.created_at
      })));
      
      if (data && data.length > 0) {
        const lastSender = data[data.length - 1].sender as 'me' | 'myself';
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
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
    
    setTimeout(() => {
        inputRef.current?.focus();
    }, 0);

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
      {/* Inject Styles */}
      <style>{styles}</style>
      
      {/* Floating Button - منفصل عن Dialog */}
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full wave-gradient-bg backdrop-blur-lg border border-white/20 shadow-xl shadow-black/40 transition-all hover:scale-110 hover:shadow-black/60"
      >
        <SelfDialogueIconNew className="h-7 w-7 drop-shadow-lg" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[85vh] bg-black subtle-wave-bg backdrop-blur-xl rounded-2xl border border-white/10 text-white p-0 overflow-hidden">
          <DialogHeader className="p-1 border-b border-white/5">
            <DialogTitle className="sr-only">حوار مع النفس</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-[60vh]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/50">جاري التحميل...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <SelfDialogueIconNew className="h-12 w-12 text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">ابدأ حوارك مع نفسك</p>
                  <p className="text-white/30 text-xs mt-1">اضغط مطولاً على الرسالة لحذفها</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex animate-message-pop ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div 
                          className={`max-w-[80%] cursor-pointer select-none active:scale-95 transition-transform ${msg.sender === 'me' ? 'order-1' : 'order-1'}`}
                          onMouseDown={() => handleMouseDown(msg.id)}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onTouchStart={() => handleMouseDown(msg.id)}
                          onTouchEnd={handleMouseUp}
                      >
                        <div
                          className={`inline-block p-3 rounded-2xl break-words transition-all duration-300 ${
                            msg.sender === 'me'
                              ? 'bg-blue-500/20 backdrop-blur-md text-blue-50 rounded-bl-sm border border-blue-400/30 shadow-[inset_0_1px_12px_rgba(59,130,246,0.2)]'
                              : 'bg-pink-500/20 backdrop-blur-md text-pink-50 rounded-br-sm border border-pink-400/30 shadow-[inset_0_1px_12px_rgba(236,72,153,0.2)]'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                          {msg.sender === 'me' ? (
                            <User className="h-3 w-3 text-blue-400/60" />
                          ) : (
                            <Heart className="h-3 w-3 text-pink-400/60" />
                          )}
                          <span className={`text-[10px] ${msg.sender === 'me' ? 'text-blue-400/60' : 'text-pink-400/60'}`}>
                            {msg.sender === 'me' ? 'أنا' : 'نفسي'} • {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {/* Input Area */}
            <div className="p-3 pt-2 border-t border-white/5 bg-black/30">
              
              <div className="flex items-center justify-center gap-2 mb-2">
                  
                  {/* زر التبديل التلقائي - زجاجي */}
                  <button
                      onClick={() => setIsAutoSwitch(!isAutoSwitch)}
                      className={`group relative flex items-center justify-center w-6 h-6 rounded-full backdrop-blur-md transition-all duration-500 ${
                          isAutoSwitch 
                          ? 'text-green-400 bg-green-500/15 border border-green-400/30 shadow-[inset_0_1px_8px_rgba(34,197,94,0.2)]'
                          : 'text-white/20 bg-white/5 border border-white/10 hover:text-white/40'
                      }`}
                      title={isAutoSwitch ? "إيقاف التبديل التلقائي" : "تفعيل التبديل التلقائي"}
                  >
                      <Repeat className={`h-3 w-3 transition-transform duration-700 ${isAutoSwitch ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Main Toggle Switch - زجاجي */}
                  <div dir="ltr" className="relative flex items-center justify-center bg-white/5 backdrop-blur-md rounded-full p-0.5 w-[140px] border border-white/10 select-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">
                  
                    {/* الخلفية المتحركة - زجاجية */}
                    <div 
                        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-0 backdrop-blur-md ${
                        currentSender === 'myself'
                            ? 'left-0.5 bg-pink-500/40 border border-pink-400/40 shadow-[inset_0_1px_10px_rgba(236,72,153,0.3),0_0_15px_rgba(236,72,153,0.2)]'
                            : 'left-[calc(50%+2px)] bg-blue-500/40 border border-blue-400/40 shadow-[inset_0_1px_10px_rgba(59,130,246,0.3),0_0_15px_rgba(59,130,246,0.2)]'
                        }`}
                    />

                    {/* زر "نفسي" */}
                    <button
                        onClick={() => handleManualSwitch('myself')}
                        className={`relative z-10 w-1/2 py-1 text-[10px] flex items-center justify-center gap-1 transition-colors duration-1000 ${
                            currentSender === 'myself' 
                            ? 'text-white font-bold drop-shadow-md'
                            : 'text-gray-400 font-medium hover:text-gray-200'
                        }`}
                    >
                        <Heart className="h-3 w-3" />
                        نفسي
                    </button>

                    {/* زر "أنا" */}
                    <button
                        onClick={() => handleManualSwitch('me')}
                        className={`relative z-10 w-1/2 py-1 text-[10px] flex items-center justify-center gap-1 transition-colors duration-1000 ${
                            currentSender === 'me' 
                            ? 'text-white font-bold drop-shadow-md'
                            : 'text-gray-400 font-medium hover:text-gray-200'
                        }`}
                    >
                        <User className="h-3 w-3" />
                        أنا
                    </button>
                  </div>
                  
                  {/* Spacer */}
                  <div className="w-6" />
              </div>
              
              <div className="flex flex-col gap-2">
                <Textarea
                  ref={inputRef}
                  placeholder={currentSender === 'me' ? 'اكتب كـ "أنا"...' : 'اكتب كـ "نفسي"...'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className={`w-full min-h-[40px] max-h-[100px] rounded-xl bg-white/5 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 resize-none transition-all duration-1000 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] ${
                    currentSender === 'me' 
                      ? 'focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 focus:shadow-[inset_0_2px_12px_rgba(59,130,246,0.15)]' 
                      : 'focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 focus:shadow-[inset_0_2px_12px_rgba(236,72,153,0.15)]'
                  }`}
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`w-full rounded-xl h-8 backdrop-blur-md transition-all duration-1000 ${
                    currentSender === 'me'
                      ? 'bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/30 shadow-[inset_0_1px_10px_rgba(59,130,246,0.2)] disabled:bg-blue-600/10 disabled:border-blue-400/10 text-white'
                      : 'bg-pink-500/30 hover:bg-pink-500/40 border border-pink-400/30 shadow-[inset_0_1px_10px_rgba(236,72,153,0.2)] disabled:bg-pink-600/10 disabled:border-pink-400/10 text-white'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
