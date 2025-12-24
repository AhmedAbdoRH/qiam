import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Send, User, Heart, Repeat, X } from 'lucide-react';
import { SelfDialogueIconNew } from './icons/SelfDialogueIconNew';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/* ================== Styles ================== */
const styles = `
@keyframes message-pop {
  0% { opacity: 0; transform: translateY(12px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-message-pop {
  animation: message-pop 0.4s ease-out forwards;
}
[data-radix-scroll-area-viewport] {
  scrollbar-gutter: stable;
  overflow-y: auto;
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
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentSender, setCurrentSender] = useState<'me' | 'myself'>('me');
  const [isAutoSwitch, setIsAutoSwitch] = useState(true);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* تحميل الرسائل مرة واحدة فقط */
  useEffect(() => {
    if (isOpen && user && !loadedOnce) {
      loadMessages();
      setLoadedOnce(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user, loadedOnce]);

  /* تثبيت السكرول */
  useEffect(() => {
    const el = scrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement | null;
    if (el) el.scrollTop = el.scrollHeight;
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

      const mapped = (data || []).map(m => ({
        id: m.id,
        sender: m.sender,
        message: m.message,
        created_at: m.created_at
      }));

      setMessages(mapped);

      if (mapped.length && isAutoSwitch) {
        setCurrentSender(mapped[mapped.length - 1].sender === 'me' ? 'myself' : 'me');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const sender = currentSender;
    const tempMessage: DialogueMessage = {
      id: crypto.randomUUID(),
      sender,
      message: inputValue.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(p => [...p, tempMessage]);
    setInputValue('');

    if (isAutoSwitch) {
      setCurrentSender(p => (p === 'me' ? 'myself' : 'me'));
    }

    try {
      await supabase.from('self_dialogue_messages').insert({
        user_id: user.id,
        sender,
        message: tempMessage.message
      });
    } catch {
      setMessages(p => p.filter(m => m.id !== tempMessage.id));
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('حذف الرسالة؟')) return;
    setMessages(p => p.filter(m => m.id !== id));
    await supabase.from('self_dialogue_messages').delete().eq('id', id);
  };

  const handleLongPress = (id: string) => {
    longPressTimerRef.current = setTimeout(() => handleDeleteMessage(id), 600);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <>
      <style>{styles}</style>

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 left-4 z-50 h-14 w-14 rounded-full bg-zinc-800 hover:bg-zinc-700 shadow-xl"
      >
        <SelfDialogueIconNew className="h-7 w-7 text-white" />
      </Button>

      {/* Dialog ثابت */}
      <Dialog open={isOpen}>
        <DialogContent
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
          className="sm:max-w-[450px] h-[70vh] bg-black text-white p-0 rounded-2xl overflow-hidden"
        >
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-2 border-b border-white/10">
            <DialogTitle>حوار مع النفس</DialogTitle>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 text-white/60 hover:text-red-400" />
            </button>
          </DialogHeader>

          <div className="flex flex-col h-full">
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              {loading ? (
                <p className="text-center text-white/40">جاري التحميل...</p>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`animate-message-pop flex ${
                        msg.sender === 'me' ? 'justify-start' : 'justify-end'
                      }`}
                      onMouseDown={() => handleLongPress(msg.id)}
                      onMouseUp={clearLongPress}
                      onMouseLeave={clearLongPress}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          msg.sender === 'me'
                            ? 'bg-blue-500/20 text-blue-50'
                            : 'bg-pink-500/20 text-pink-50'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="اكتب رسالتك..."
                className="mb-2 bg-white/5 text-white"
              />

              {/* زر إرسال رصاصي غامق ثابت */}
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="w-full h-9 bg-zinc-700 hover:bg-zinc-800 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

