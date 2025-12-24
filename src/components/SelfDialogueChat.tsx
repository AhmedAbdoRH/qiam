import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircleHeart, Send, User, Heart, Repeat } from 'lucide-react';
import { SelfDialogueIconNew } from './icons/SelfDialogueIconNew';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// ✨ Optimized animations and styles for smoother chat experience
const styles = `
  @keyframes message-pop {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-message-pop {
    animation: message-pop 0.2s ease-out;
  }

  /* Optimized scroll container */
  [data-radix-scroll-area-viewport] {
    overflow-y: auto;
    scroll-behavior: auto;
  }
  
  /* Disable animations when user prefers reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .animate-message-pop {
      animation: none;
    }
    [data-radix-scroll-area-viewport] {
      scroll-behavior: auto;
    }
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  useEffect(() => {
    if (isOpen && user) {
      loadMessages();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  const handleMouseDown = (id: string) => {
    longPressTimerRef.current = setTimeout(() => handleDeleteMessage(id), 600);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const messageItems = useMemo(() => {
    return messages.map((msg, index) => {
      const shouldAnimate = messages.length - index <= 5;
      return (
        <div 
          key={msg.id}
          className={`flex ${shouldAnimate ? 'animate-message-pop' : ''} ${
            msg.sender === 'me' ? 'justify-start' : 'justify-end'
          }`}
        >
          <div 
            className="max-w-[80%] cursor-pointer select-none active:scale-95 transition-transform"
            onMouseDown={() => handleMouseDown(msg.id)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={() => handleMouseDown(msg.id)}
            onTouchEnd={handleMouseUp}
          >
            <div
              className={`inline-block p-2 rounded-2xl break-words ${
                msg.sender === 'me'
                  ? 'bg-blue-500/20 backdrop-blur-md text-blue-50 rounded-bl-sm border border-blue-400/30 shadow-[inset_0_1px_12px_rgba(59,130,246,0.2)]'
                  : 'bg-pink-500/20 backdrop-blur-md text-pink-50 rounded-br-sm border border-pink-400/30 shadow-[inset_0_1px_12px_rgba(236,72,153,0.2)]'
              }`}
            >
              <p className="text-xs leading-tight">{msg.message}</p>
            </div>
            <div className={`flex items-center gap-0.5 mt-0.5 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
              {msg.sender === 'me' ? (
                <User className="h-2 w-2 text-blue-400/30" />
              ) : (
                <Heart className="h-2 w-2 text-pink-400/30" />
              )}
              <span className={`text-[7px] ${msg.sender === 'me' ? 'text-blue-400/15' : 'text-pink-400/15'}`}>
                {msg.sender === 'me' ? 'أنا' : 'نفسي'} • {formatTime(msg.created_at)}
              </span>
            </div>
          </div>
          {index === messages.length - 1 && <div ref={messagesEndRef} />}
        </div>
      );
    });
  }, [messages, handleMouseDown, handleMouseUp]);

  // Simple scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, []);

  // Optimized scroll handler with better stability
  useEffect(() => {
    if (!isOpen) return;
    
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    // Immediate scroll to bottom
    const scrollToBottom = () => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    };
    
    // Scroll immediately
    scrollToBottom();
    
    // Also scroll after a short delay to ensure it's at the bottom
    const scrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // And one more time after messages are rendered
    const finalScrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 300);
    
    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(finalScrollTimeout);
    };
  }, [messages, isOpen]);

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


  const handleManualSwitch = (sender: 'me' | 'myself') => {
    setCurrentSender(sender);
    // Prevent keyboard from closing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSendButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      // If no text, toggle between 'me' and 'myself'
      const newSender = currentSender === 'me' ? 'myself' : 'me';
      handleManualSwitch(newSender);
    } else {
      // If there's text, send the message
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const messageText = inputValue.trim();
    setInputValue('');
    
    // Create optimistic update
    const tempId = crypto.randomUUID();
    const senderForThisMessage = currentSender;
    const newMessage: DialogueMessage = {
      id: tempId,
      sender: senderForThisMessage,
      message: messageText,
      created_at: new Date().toISOString()
    };

    // Update UI immediately
    setMessages(prev => [...prev, newMessage]);
    
    // Switch sender if auto-switch is enabled
    if (isAutoSwitch) {
      setCurrentSender(prev => prev === 'me' ? 'myself' : 'me');
    }
    
    // Focus input after state updates to keep keyboard open
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

  return (
    <>
      {/* Inject Styles */}
      <style>{styles}</style>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            className="fixed bottom-32 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-300 hover:scale-105"
          >
            <SelfDialogueIconNew className="h-7 w-7" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] max-h-[100vh] h-[100vh] bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 text-white p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-1 border-b border-white/5 flex-shrink-0">
            <DialogTitle className="sr-only">حوار مع النفس</DialogTitle>
            <DialogDescription className="sr-only">
              نافذة محادثة خاصة لتسجيل رسائل بين "أنا" و"نفسي".
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0">
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
                <div className="space-y-1">
                  {messageItems}
                </div>
              )}
            </ScrollArea>
            
            {/* Input Area */}
            <div className="p-3 pt-2 border-t border-white/5 bg-black/30 flex-shrink-0">
              
              <div className="flex items-center justify-center gap-2 mb-2">
                  
                  {/* زر التبديل التلقائي - زجاجي */}
                  <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAutoSwitch(!isAutoSwitch);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className={`group relative flex items-center justify-center w-6 h-6 rounded-full backdrop-blur-md transition-all duration-500 ${
                          isAutoSwitch 
                          ? 'text-green-300/60 bg-green-900/20 border border-green-800/30 shadow-[inset_0_1px_8px_rgba(34,197,94,0.1)]'
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
                        onClick={(e) => {
                          e.preventDefault();
                          handleManualSwitch('myself');
                        }}
                        onMouseDown={(e) => e.preventDefault()}
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
                        onClick={(e) => {
                          e.preventDefault();
                          handleManualSwitch('me');
                        }}
                        onMouseDown={(e) => e.preventDefault()}
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
                      handleSendButtonClick(e as any);
                    }
                  }}
                  className={`w-full min-h-[40px] max-h-[100px] rounded-xl resize-none transition-all duration-1000 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] ${
                    inputValue.trim()
                      ? 'bg-black text-white border-white/20'
                      : 'bg-white/5 text-white border-white/10'
                  } ${
                    currentSender === 'me' 
                      ? 'focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 focus:shadow-[inset_0_2px_12px_rgba(59,130,246,0.15)]' 
                      : 'focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 focus:shadow-[inset_0_2px_12px_rgba(236,72,153,0.15)]'
                  }`}
                  rows={1}
                />
                <Button
                  onClick={handleSendButtonClick}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`w-full rounded-xl h-12 backdrop-blur-md transition-all duration-1000 font-semibold text-base ${
                    currentSender === 'me'
                      ? 'bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/30 shadow-[inset_0_1px_10px_rgba(59,130,246,0.2)] text-white'
                      : 'bg-pink-500/30 hover:bg-pink-500/40 border border-pink-400/30 shadow-[inset_0_1px_10px_rgba(236,72,153,0.2)] text-white'
                  }`}
                >
                  <Send className="h-5 w-5 ml-2" />
                  إرسال
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
