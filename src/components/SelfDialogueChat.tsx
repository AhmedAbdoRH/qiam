import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircleHeart, Send, User, Heart, Repeat, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
    }, 50);
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
        const lastSender = data[data.length - 1].sender;
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-32 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/80 to-purple-600/80 backdrop-blur-lg border border-white/20 shadow-lg shadow-purple-500/30 transition-all hover:scale-110 hover:shadow-purple-500/50">
          <MessageCircleHeart className="h-7 w-7 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-white/10">
          <DialogTitle className="text-white text-center text-lg">حوار مع النفس</DialogTitle>
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
                <MessageCircleHeart className="h-12 w-12 text-white/20 mb-3" />
                <p className="text-white/40 text-sm">ابدأ حوارك مع نفسك</p>
                <p className="text-white/30 text-xs mt-1">اضغط مطولاً على الرسالة لحذفها</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                        className={`max-w-[80%] cursor-pointer select-none active:scale-95 transition-transform ${msg.sender === 'me' ? 'order-1' : 'order-1'}`}
                        onMouseDown={() => handleMouseDown(msg.id)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={() => handleMouseDown(msg.id)}
                        onTouchEnd={handleMouseUp}
                    >
                      {/* ✨ العودة للألوان الأصلية: أنا=أزرق، نفسي=وردي */}
                      <div
                        className={`inline-block p-3 rounded-2xl break-words transition-all duration-300 ${
                          msg.sender === 'me'
                            ? 'bg-blue-500/30 text-blue-100 rounded-bl-sm border border-blue-400/30 hover:bg-blue-500/40'
                            : 'bg-pink-500/30 text-pink-100 rounded-br-sm border border-pink-400/30 hover:bg-pink-500/40'
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
          <div className="p-4 border-t border-white/10 bg-black/20">
            
            <div className="flex items-center justify-center gap-3 mb-4">
                
                {/* ✨ زر التبديل التلقائي: شفاف جداً وهادئ */}
                <button
                    onClick={() => setIsAutoSwitch(!isAutoSwitch)}
                    className={`group relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                        isAutoSwitch 
                        ? 'text-green-400 bg-green-500/10' // شفاف للغاية عند التفعيل
                        : 'text-white/10 hover:text-white/30' // شبه مخفي عند عدم التفعيل
                    }`}
                >
                    <Repeat className={`h-4 w-4 transition-transform duration-700 ${isAutoSwitch ? 'rotate-180' : ''}`} />
                </button>

                {/* ✨ Main Toggle Switch: Basic Colors, Smooth Animation ✨ */}
                <div className="relative flex items-center justify-center bg-white/5 rounded-full p-1 w-[160px] border border-white/5 select-none">
                
                {/* الخلفية المتحركة (Basic Colors + Slow Smooth Animation) */}
                <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-1000 ease-in-out shadow-lg ${
                    currentSender === 'me'
                        ? 'left-1 bg-blue-600' // لون أزرق أساسي
                        : 'left-[calc(50%+4px)] bg-pink-600' // لون وردي أساسي
                    }`}
                />

                {/* زر "أنا" */}
                <button
                    onClick={() => handleManualSwitch('me')}
                    className={`relative z-10 w-1/2 py-1.5 text-xs flex items-center justify-center gap-2 transition-colors duration-1000 ${
                        currentSender === 'me' 
                        ? 'text-white font-bold'
                        : 'text-white/40 font-medium hover:text-white/70'
                    }`}
                >
                    <User className="h-3 w-3" />
                    أنا
                </button>

                {/* زر "نفسي" */}
                <button
                    onClick={() => handleManualSwitch('myself')}
                    className={`relative z-10 w-1/2 py-1.5 text-xs flex items-center justify-center gap-2 transition-colors duration-1000 ${
                        currentSender === 'myself' 
                        ? 'text-white font-bold'
                        : 'text-white/40 font-medium hover:text-white/70'
                    }`}
                >
                    <Heart className="h-3 w-3" />
                    نفسي
                </button>
                </div>
                
                <div className="w-8" />
            </div>
            
            <div className="flex items-end gap-2">
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
                className={`flex-grow min-h-[44px] max-h-[120px] rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none transition-all duration-700 ${
                  currentSender === 'me' 
                    ? 'focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20' 
                    : 'focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20'
                }`}
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`rounded-xl h-[44px] px-4 transition-all duration-700 ${
                  currentSender === 'me'
                    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 text-white' // أزرق أساسي
                    : 'bg-pink-600 hover:bg-pink-700 disabled:bg-pink-600/30 text-white' // وردي أساسي
                }`}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
