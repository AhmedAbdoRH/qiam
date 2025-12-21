import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircleHeart, Send, User, Heart } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadMessages();
    }
  }, [isOpen, user]);

  // Scroll to bottom when messages change
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
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const newMessage: DialogueMessage = {
      id: crypto.randomUUID(),
      sender: currentSender,
      message: inputValue.trim(),
      created_at: new Date().toISOString()
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    try {
      const { error } = await supabase
        .from('self_dialogue_messages')
        .insert({
          user_id: user.id,
          sender: currentSender,
          message: newMessage.message
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      // Remove optimistic message on error
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
                <p className="text-white/30 text-xs mt-1">اختر من تريد أن يتحدث ثم اكتب</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] ${msg.sender === 'me' ? 'order-1' : 'order-1'}`}>
                      <div
                        className={`inline-block p-3 rounded-2xl break-words ${
                          msg.sender === 'me'
                            ? 'bg-blue-500/30 text-blue-100 rounded-bl-sm border border-blue-400/30'
                            : 'bg-pink-500/30 text-pink-100 rounded-br-sm border border-pink-400/30'
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
          
          {/* Input Area with Sender Toggle */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            {/* Sender Toggle - Above input */}
            <div className="flex justify-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSender('me')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                  currentSender === 'me'
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <User className="h-4 w-4" />
                <span>أنا</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSender('myself')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                  currentSender === 'myself'
                    ? 'bg-pink-500/30 text-pink-300 border border-pink-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>نفسي</span>
              </Button>
            </div>
            
            {/* Input field */}
            <div className="flex items-end gap-2">
              <Textarea
                placeholder={currentSender === 'me' ? 'اكتب كـ "أنا"...' : 'اكتب كـ "نفسي"...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={`flex-grow min-h-[44px] max-h-[120px] rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none ${
                  currentSender === 'me' ? 'focus:border-blue-400/50' : 'focus:border-pink-400/50'
                }`}
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`rounded-xl h-[44px] px-4 transition-all ${
                  currentSender === 'me'
                    ? 'bg-blue-500/80 hover:bg-blue-500 disabled:bg-blue-500/30'
                    : 'bg-pink-500/80 hover:bg-pink-500 disabled:bg-pink-500/30'
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
