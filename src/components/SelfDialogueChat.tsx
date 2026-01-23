import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircleHeart, Send, User, Heart, Repeat, Cloud, CloudOff, RefreshCw, AlertCircle, Loader2, Archive } from 'lucide-react';
import { SelfDialogueIconNew } from './icons/SelfDialogueIconNew';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ✨ Optimized animations and styles for smoother chat experience
const styles = `
  @keyframes message-pop {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-message-pop {
    animation: message-pop 0.2s ease-out;
  }

  @keyframes pulse-sync {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  .animate-pulse-sync {
    animation: pulse-sync 1.5s infinite ease-in-out;
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

  @keyframes dynamic-gradient {
    0% { background-position: 0% 50%; }
    20% { background-position: 30% 25%; }
    40% { background-position: 60% 50%; }
    60% { background-position: 90% 75%; }
    80% { background-position: 120% 50%; }
    100% { background-position: 150% 25%; }
  }

  .dynamic-gradient-bg {
    background: linear-gradient(
      45deg,
      rgba(139, 0, 0, 0.4),
      rgba(255, 140, 0, 0.4),
      rgba(85, 107, 47, 0.4),
      rgba(184, 134, 11, 0.4),
      rgba(139, 0, 0, 0.4)
    );
    background-size: 400% 400%;
    animation: dynamic-gradient 15s ease-in-out infinite;
  }

  `;

interface DialogueMessage {
  id: string;
  sender: 'me' | 'myself';
  message: string;
  created_at: string;
  status?: 'synced' | 'pending' | 'error';
}

export function SelfDialogueChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentSender, setCurrentSender] = useState<'me' | 'myself'>('me');
  const [isAutoSwitch, setIsAutoSwitch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedMessages, setArchivedMessages] = useState<DialogueMessage[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const PENDING_MESSAGES_KEY = useMemo(() => user ? `pending_dialogue_messages_${user.id}` : null, [user]);
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const syncPendingMessages = useCallback(async () => {
    if (!user || !PENDING_MESSAGES_KEY || isSyncing) return;
    
    const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
    if (!stored) return;

    let pending: DialogueMessage[] = JSON.parse(stored);
    if (pending.length === 0) return;

    setIsSyncing(true);
    const successfullySynced: string[] = [];

    for (const msg of pending) {
      try {
        const { error } = await supabase
          .from('self_dialogue_messages')
          .insert({
            user_id: user.id,
            sender: msg.sender,
            message: msg.message,
            created_at: msg.created_at // Use original creation time
          });

        if (!error) {
          successfullySynced.push(msg.id);
          // Update message status in main list if it exists
          setMessages(prev => prev.map(m => 
            m.id === msg.id ? { ...m, status: 'synced' } : m
          ));
        }
      } catch (err) {
        console.error('Failed to sync message:', msg.id, err);
      }
    }

    // Filter out successfully synced messages from storage
    const remaining = pending.filter(msg => !successfullySynced.includes(msg.id));
    if (remaining.length > 0) {
      localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(PENDING_MESSAGES_KEY);
    }
    
    setIsSyncing(false);
    if (successfullySynced.length > 0) {
      toast.success(`تم حفظ ${successfullySynced.length} رسالة بنجاح`);
    }
  }, [user, PENDING_MESSAGES_KEY, isSyncing]);

  useEffect(() => {
    if (isOpen && user) {
      loadMessages();
      syncPendingMessages();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    
    // Listen for online status to sync
    const handleOnline = () => {
      if (user) syncPendingMessages();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOpen, user, syncPendingMessages]);

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message).then(() => {
      // Optional: Show a brief visual feedback
      // Could add a toast notification here if needed
    }).catch(err => {
      console.error('Failed to copy message: ', err);
    });
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

  const messageItems = useMemo(() => {
    const targetMessages = showArchive ? archivedMessages : messages;
    
    if (targetMessages.length === 0) return null;

    return targetMessages.map((msg, index) => {
      const shouldAnimate = targetMessages.length - index <= 5 && !showArchive;
      return (
        <div 
          key={msg.id}
          className={`flex ${shouldAnimate ? 'animate-message-pop' : ''} ${
            msg.sender === 'me' ? 'justify-start' : 'justify-end'
          }`}
        >
          <div 
            className="max-w-[80%] cursor-pointer select-none active:scale-95 transition-transform"
            onClick={() => handleCopyMessage(msg.message)}
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
              
              {/* Status Indicator */}
              {msg.status === 'pending' && (
                <RefreshCw className="h-2 w-2 text-blue-400/40 animate-spin ml-0.5" />
              )}
              {msg.status === 'error' && (
                <CloudOff className="h-2 w-2 text-red-400/60 ml-0.5" />
              )}
              {msg.status === 'synced' && (
                <Cloud className="h-2 w-2 text-green-400/20 ml-0.5" />
              )}
            </div>
          </div>
          {index === targetMessages.length - 1 && <div ref={messagesEndRef} />}
        </div>
      );
    });
  }, [messages, archivedMessages, showArchive, handleMouseDown, handleMouseUp]);

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
        .eq('is_archived', false) // Only load non-archived messages
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const remoteMessages = (data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'me' | 'myself',
        message: msg.message,
        created_at: msg.created_at,
        status: 'synced' as const
      }));

      // Get local pending messages
      let pendingMessages: DialogueMessage[] = [];
      if (PENDING_MESSAGES_KEY) {
        const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
        if (stored) {
          pendingMessages = JSON.parse(stored);
        }
      }

      // Merge and sort
      const allMessages = [...remoteMessages];
      pendingMessages.forEach(p => {
        if (!allMessages.some(m => m.id === p.id)) {
          allMessages.push(p);
        }
      });
      
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(allMessages);
      
      if (allMessages.length > 0) {
        const lastSender = allMessages[allMessages.length - 1].sender as 'me' | 'myself';
        if (isAutoSwitch) {
            setCurrentSender(lastSender === 'me' ? 'myself' : 'me');
        } else {
            setCurrentSender(lastSender);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('حدث خطأ أثناء تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('هل تريد حذف هذه الرسالة نهائياً؟')) {
        const messageToDelete = messages.find(m => m.id === messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));
        
        // Remove from local storage if pending
        if (PENDING_MESSAGES_KEY) {
          const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
          if (stored) {
            const pending = JSON.parse(stored);
            const filtered = pending.filter((m: any) => m.id !== messageId);
            if (filtered.length < pending.length) {
              if (filtered.length > 0) {
                localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(filtered));
              } else {
                localStorage.removeItem(PENDING_MESSAGES_KEY);
              }
            }
          }
        }

        // Only try to delete from Supabase if it wasn't just a local pending message
        if (messageToDelete && messageToDelete.status === 'synced') {
          try {
              const { error } = await supabase
                  .from('self_dialogue_messages')
                  .delete()
                  .eq('id', messageId);
              if (error) throw error;
          } catch (error) {
              console.error('Error deleting message:', error);
              toast.error('حدث خطأ أثناء حذف الرسالة من الكلاود');
              loadMessages();
          }
        }
    }
  };


  const loadArchivedMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('self_dialogue_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setArchivedMessages((data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'me' | 'myself',
        message: msg.message,
        created_at: msg.created_at,
        status: 'synced'
      })));
    } catch (error) {
      console.error('Error loading archived messages:', error);
      toast.error('حدث خطأ أثناء تحميل الأرشيف');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveChat = async () => {
    if (messages.length === 0) return;
    if (!window.confirm('هل تريد أرشفة هذه المحادثة والبدء بمحادثة جديدة؟')) return;

    setIsSyncing(true);
    try {
      // Archive all current non-archived messages for this user
      const { error } = await supabase
        .from('self_dialogue_messages')
        .update({ is_archived: true })
        .eq('user_id', user?.id)
        .eq('is_archived', false);

      if (error) throw error;

      // Clear local pending messages as well if they exist
      if (PENDING_MESSAGES_KEY) {
        localStorage.removeItem(PENDING_MESSAGES_KEY);
      }

      setMessages([]);
      toast.success('تم أرشفة المحادثة بنجاح');
    } catch (error) {
      console.error('Error archiving chat:', error);
      toast.error('حدث خطأ أثناء أرشفة المحادثة');
    } finally {
      setIsSyncing(false);
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
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    // Update UI immediately
    setMessages(prev => [...prev, newMessage]);
    
    // Save to local storage as pending
    if (PENDING_MESSAGES_KEY) {
      const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
      const pending = stored ? JSON.parse(stored) : [];
      localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify([...pending, newMessage]));
    }

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
          message: newMessage.message,
          created_at: newMessage.created_at
        });
        
      if (error) throw error;

      // Mark as synced in state
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'synced' } : m
      ));

      // Remove from pending in local storage
      if (PENDING_MESSAGES_KEY) {
        const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
        if (stored) {
          const pending = JSON.parse(stored);
          const filtered = pending.filter((m: any) => m.id !== tempId);
          if (filtered.length > 0) {
            localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(filtered));
          } else {
            localStorage.removeItem(PENDING_MESSAGES_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Error saving message:', error);
      // Mark as error in state instead of removing it
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'error' } : m
      ));
      
      // Update local storage to reflect error state
      if (PENDING_MESSAGES_KEY) {
        const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
        if (stored) {
          const pending = JSON.parse(stored);
          const updated = pending.map((m: any) => 
            m.id === tempId ? { ...m, status: 'error' } : m
          );
          localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(updated));
        }
      }
      toast.error('فشل حفظ الرسالة في الكلاود. تم حفظها محلياً.');
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
            className="fixed bottom-32 left-8 z-50 flex h-14 w-14 items-center justify-center rounded-full dynamic-gradient-bg backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-300 hover:scale-105"
          >
            <SelfDialogueIconNew className="h-7 w-7" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] max-h-[100vh] h-[100vh] bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 text-white p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-1 border-b border-white/5 flex-shrink-0 flex-row items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-sm font-medium text-white/70">
                {showArchive ? 'أرشيف المحادثات' : 'حوار مع النفس'}
              </DialogTitle>
              {isSyncing && (
                <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {messages.some(m => m.status === 'error' || m.status === 'pending') && !showArchive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={syncPendingMessages}
                  disabled={isSyncing}
                  className="h-7 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  مزامنة
                </Button>
              )}

              {messages.length > 0 && !isSyncing && !showArchive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArchiveChat}
                  className="h-7 px-2 text-[10px] text-white/50 hover:text-white hover:bg-white/10 gap-1"
                  title="أرشفة المحادثة وبدء جديدة"
                >
                  <Archive className="h-3 w-3" />
                  أرشفة
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!showArchive) {
                    loadArchivedMessages();
                  }
                  setShowArchive(!showArchive);
                }}
                className={`h-7 px-2 text-[10px] gap-1 ${
                  showArchive 
                    ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10' 
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {showArchive ? (
                  <>
                    <MessageCircleHeart className="h-3 w-3" />
                    المحادثة
                  </>
                ) : (
                  <>
                    <Archive className="h-3 w-3" />
                    الأرشيف
                  </>
                )}
              </Button>
            </div>
            
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
            {!showArchive && (
              <div className="p-2 pt-1 pb-3 border-t border-white/5 bg-black/30 flex-shrink-0">
                
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
                      inputValue.trim()
                        ? currentSender === 'me'
                          ? 'bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/30 shadow-[inset_0_1px_10px_rgba(59,130,246,0.2)] text-white'
                          : 'bg-pink-500/30 hover:bg-pink-500/40 border border-pink-400/30 shadow-[inset_0_1px_10px_rgba(236,72,153,0.2)] text-white'
                        : 'bg-black hover:bg-gray-900 border border-white/20 text-white'
                    }`}
                  >
                    {inputValue.trim() ? (
                      <>
                        <Send className="h-5 w-5 ml-2" />
                        إرسال
                      </>
                    ) : (
                      <Repeat className="h-5 w-5 opacity-60" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
