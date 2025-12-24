import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Send, User, Heart, Repeat } from 'lucide-react';
import { SelfDialogueIconNew } from './icons/SelfDialogueIconNew';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const styles = `
@keyframes message-pop {
  0% { opacity: 0; transform: translateY(15px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-message-pop {
  animation: message-pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}
[data-radix-scroll-area-viewport] {
  scrollbar-gutter: stable;
  overflow-y: scroll;
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

  useEffect(() => {
    if (isOpen && user) {
      loadMessages();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('self_dialogue_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const msg: DialogueMessage = {
      id: crypto.randomUUID(),
      sender: currentSender,
      message: inputValue,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, msg]);
    setInputValue('');

    if (isAutoSwitch) {
      setCurrentSender(p => (p === 'me' ? 'myself' : 'me'));
    }

    await supabase.from('self_dialogue_messages').insert({
      user_id: user.id,
      sender: msg.sender,
      message: msg.message
    });

    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <>
      <style>{styles}</style>

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 left-4 z-50 h-14 w-14 rounded-full shadow-xl"
      >
        <SelfDialogueIconNew className="h-7 w-7" />
      </Button>

      {/* ✅ Dialog ثابت بدون رعشة */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[85vh] bg-black rounded-2xl p-0 text-white">
          <DialogHeader className="sr-only">
            <DialogTitle>حوار مع النفس</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[60vh]">
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
                    >
                      <div className="max-w-[80%] p-3 rounded-xl bg-white/10">
                        <p className="text-sm">{msg.message}</p>
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
                className="mb-2 resize-none bg-white/5"
              />

              {/* ✅ زر إرسال بلون رصاص غامق */}
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="
                  w-full h-9 rounded-xl
                  bg-zinc-700
                  hover:bg-zinc-600
                  disabled:bg-zinc-800
                  text-white
                "
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
