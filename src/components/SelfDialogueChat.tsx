import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircleHeart, Send, User, Heart, Repeat, Cloud, CloudOff, RefreshCw, AlertCircle, Loader2, Archive, Lock, Edit2 } from 'lucide-react';
import { Input } from './ui/input';
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
    animation: message-pop 0.15s ease-out;
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
    -webkit-overflow-scrolling: touch;
  }
  
  /* Disable heavy effects on mobile for performance */
  @media (max-width: 768px) {
    .animate-message-pop {
      animation: none;
      opacity: 1;
    }
    .backdrop-blur-md {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    .dynamic-gradient-bg {
      animation: none !important;
      background: rgba(139, 0, 0, 0.3) !important;
    }
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
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
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
    background-size: 300% 300%;
    animation: dynamic-gradient 20s ease-in-out infinite;
  }

  `;

// Memoized message component for better performance
const MessageBubble = React.memo(function MessageBubble({
  msg,
  onCopy,
  onMouseDown,
  onMouseUp,
  formatTime,
  isRecent
}: {
  msg: DialogueMessage;
  onCopy: (message: string) => void;
  onMouseDown: (id: string) => void;
  onMouseUp: () => void;
  formatTime: (date: string) => string;
  isRecent: boolean;
}) {
  return (
    <div className={`flex ${isRecent ? 'animate-message-pop' : ''} ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
      <div
        className="max-w-[80%] cursor-pointer select-none active:scale-95 transition-transform"
        onClick={() => onCopy(msg.message)}
        onMouseDown={() => onMouseDown(msg.id)}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={() => onMouseDown(msg.id)}
        onTouchEnd={onMouseUp}
      >
        <div
          className={`inline-block p-2 rounded-2xl break-words ${msg.sender === 'me'
            ? 'bg-blue-500/20 text-blue-50 rounded-bl-sm border border-blue-400/30'
            : 'bg-pink-500/20 text-pink-50 rounded-br-sm border border-pink-400/30'
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
    </div>
  );
});

interface DialogueMessage {
  id: string;
  sender: 'me' | 'myself';
  message: string;
  created_at: string;
  session_title?: string | null;
  status?: 'synced' | 'pending' | 'error';
}

export function SelfDialogueChat() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentSender, setCurrentSender] = useState<'me' | 'myself'>('me');
  const [isAutoSwitch, setIsAutoSwitch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedMessages, setArchivedMessages] = useState<DialogueMessage[]>([]);
  const [archiveSessions, setArchiveSessions] = useState<{ id: string, date: string, title?: string | null, firstMessage: string }[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showPinInput, setShowPinInput] = useState(true);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

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

    // If showing archive but no session selected, show session list
    if (showArchive && !selectedSessionId) {
      if (archiveSessions.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4 p-8 text-center">
            <Archive className="h-12 w-12 opacity-20" />
            <p className="text-sm">لا توجد محادثات مؤرشفة بعد</p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-2 p-4">
          {archiveSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => loadArchivedMessages(session.id)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-right flex flex-col gap-1"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[10px] text-white/40">{new Date(session.date).toLocaleDateString('ar-SA')}</span>
                <Archive className="h-3 w-3 text-white/20" />
              </div>
              <div className="flex items-center gap-2">
                {session.id === 'legacy' && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/40">قديم</span>}
                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed flex-1">
                  {session.title || session.firstMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (targetMessages.length === 0) return null;

    return (
      <div className="flex flex-col gap-3 p-4">
        {showArchive && selectedSessionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSessionId(null)}
            className="self-start mb-2 h-7 px-2 text-[10px] text-white/50 hover:text-white hover:bg-white/10 gap-1"
          >
            <RefreshCw className="h-3 w-3 rotate-180" />
            العودة لقائمة الأرشيف
          </Button>
        )}

        {targetMessages.map((msg, index) => {
          const shouldAnimate = targetMessages.length - index <= 5 && !showArchive;
          return (
            <div
              key={msg.id}
              className={`flex ${shouldAnimate ? 'animate-message-pop' : ''} ${msg.sender === 'me' ? 'justify-start' : 'justify-end'
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
                  className={`inline-block p-2 rounded-2xl break-words ${msg.sender === 'me'
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
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  }, [messages, archivedMessages, showArchive, archiveSessions, selectedSessionId, handleMouseDown, handleMouseUp]);

  // Optimized scroll handler - only scroll when messages change or view shifts
  useEffect(() => {
    if (!isOpen) return;

    const scrollToBottom = () => {
      const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    };

    // Scroll immediately after render cycle
    requestAnimationFrame(scrollToBottom);

    // Also scroll after a short delay to be absolutely sure (especially on mobile/slow devices)
    const timeout = setTimeout(scrollToBottom, 100);
    const timeout2 = setTimeout(scrollToBottom, 300);

    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [messages.length, archivedMessages.length, isOpen, showPinInput, selectedSessionId, showArchive]);

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
      const allMessages: DialogueMessage[] = [...remoteMessages];
      pendingMessages.forEach(p => {
        if (!allMessages.some(m => m.id === p.id)) {
          allMessages.push(p as DialogueMessage);
        }
      });

      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(allMessages);

      if (allMessages.length > 0) {
        setSessionTitle(allMessages[0].session_title || 'حوار مع النفس');
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


  const loadArchiveSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all archived messages for this user
      const { data, error } = await supabase
        .from('self_dialogue_messages')
        .select('archive_session_id, created_at, message, session_title')
        .eq('user_id', user.id)
        .eq('is_archived', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by session ID
      const sessionsMap = new Map();
      (data || []).forEach(msg => {
        // Use 'legacy' as key for messages without session ID
        const sId = msg.archive_session_id || 'legacy';
        if (!sessionsMap.has(sId)) {
          sessionsMap.set(sId, {
            id: sId,
            date: msg.created_at,
            title: msg.session_title,
            firstMessage: msg.message
          });
        }
      });

      setArchiveSessions(Array.from(sessionsMap.values()));
    } catch (error) {
      console.error('Error loading archive sessions:', error);
      toast.error('حدث خطأ أثناء تحميل جلسات الأرشيف');
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedMessages = async (sessionId: string) => {
    if (!user) return;
    setLoading(true);
    setSelectedSessionId(sessionId);
    try {
      const query = supabase
        .from('self_dialogue_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', true);

      // Handle the 'legacy' or missing session ID
      if (sessionId === 'legacy') {
        query.is('archive_session_id', null);
      } else {
        query.eq('archive_session_id', sessionId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      const msgs = (data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'me' | 'myself',
        message: msg.message,
        created_at: msg.created_at,
        session_title: msg.session_title,
        status: 'synced'
      })) as DialogueMessage[];

      setArchivedMessages(msgs);
      if (msgs.length > 0) {
        setSessionTitle(msgs[0].session_title || 'جلسة مؤرشفة');
      }
    } catch (error) {
      console.error('Error loading archived messages:', error);
      toast.error('حدث خطأ أثناء تحميل رسائل الأرشيف');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveChat = async () => {
    if (messages.length === 0) return;
    if (!window.confirm('هل تريد أرشفة هذه المحادثة والبدء بمحادثة جديدة؟')) return;

    setIsSyncing(true);
    // Generate a proper UUID v4 as a fallback if crypto.randomUUID is not available
    const generateUUID = () => {
      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const sessionId = generateUUID();

    try {
      if (!user?.id) throw new Error('User not found');

      // Archive all current non-archived messages for this user with a new session ID
      const { error } = await supabase
        .from('self_dialogue_messages')
        .update({
          is_archived: true,
          archive_session_id: sessionId
        })
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (error) throw error;

      // Clear local pending messages as well if they exist
      if (PENDING_MESSAGES_KEY) {
        localStorage.removeItem(PENDING_MESSAGES_KEY);
      }

      setMessages([]);
      toast.success('تم أرشفة المحادثة كجلسة بنجاح');
    } catch (error) {
      console.error('Error archiving chat:', error);
      toast.error('حدث خطأ أثناء أرشفة المحادثة. يرجى التأكد من اتصال الإنترنت.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSessionTitle = async (newTitle: string) => {
    if (!user || !newTitle.trim()) return;
    setIsSyncing(true);
    try {
      const query = supabase
        .from('self_dialogue_messages')
        .update({ session_title: newTitle })
        .eq('user_id', user.id);

      if (showArchive && selectedSessionId) {
        if (selectedSessionId === 'legacy') {
          query.is('archive_session_id', null);
        } else {
          query.eq('archive_session_id', selectedSessionId);
        }
      } else {
        query.eq('is_archived', false);
      }

      const { error } = await query;
      if (error) throw error;

      // Update the title in state for all messages to ensure consistency
      if (showArchive) {
        setArchivedMessages(prev => prev.map(m => ({ ...m, session_title: newTitle })));
      } else {
        setMessages(prev => prev.map(m => ({ ...m, session_title: newTitle })));
      }

      setSessionTitle(newTitle);
      if (showArchive) {
        // Update local state for archive list
        setArchiveSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, title: newTitle } : s));
      }
      toast.success('تم تحديث العنوان');
    } catch (err) {
      console.error('Error updating title:', err);
      toast.error('فشل تحديث العنوان');
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
          created_at: newMessage.created_at,
          session_title: sessionTitle || null
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

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Reset PIN state when closing
          setShowPinInput(true);
          setPinValue('');
          setPinError(false);
        }
      }}>
        <DialogTrigger asChild>
          <Button
            type="button"
            className="fixed bottom-32 left-8 z-50 flex h-14 w-14 items-center justify-center rounded-full dynamic-gradient-bg backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-300 hover:scale-105"
          >
            <SelfDialogueIconNew className="h-7 w-7" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] max-h-[100vh] h-[100vh] bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 text-white p-0 overflow-hidden flex flex-col">
          {showPinInput ? (
            // PIN Entry Screen
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Lock className="h-16 w-16 text-white/30 mb-6" />
              <h2 className="text-lg font-medium text-white/80 mb-2">محادثة محمية</h2>
              <p className="text-sm text-white/50 mb-6 text-center">أدخل الرقم السري للوصول</p>

              <Input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={pinValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setPinValue(val);
                  setPinError(false);

                  if (val.length === 2) {
                    if (val === '88') {
                      setShowPinInput(false);
                      loadMessages();
                      syncPendingMessages();
                    } else {
                      setPinError(true);
                      setPinValue('');
                      toast.error('رقم سري خاطئ! جاري تسجيل الخروج...');
                      setTimeout(() => {
                        setIsOpen(false);
                        signOut();
                      }, 1500);
                    }
                  }
                }}
                className={`w-24 text-center text-2xl tracking-[0.5em] bg-white/10 border-white/20 text-white placeholder:text-white/30 ${pinError ? 'border-red-500 shake-animation' : ''
                  }`}
                placeholder="••"
                autoFocus
              />

              <p className="text-xs text-white/30 mt-4">أدخل رقمين</p>

              <DialogDescription className="sr-only">
                أدخل الرقم السري للوصول للمحادثة
              </DialogDescription>
            </div>
          ) : (
            // Regular Chat Content
            <>
              <DialogHeader className="p-1 border-b border-white/5 flex-shrink-0 flex-row items-center justify-between px-4">
                <div className="flex items-center gap-2 flex-1">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 w-full max-w-[200px]">
                      <Input
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        className="h-7 text-xs bg-white/10 border-white/20 text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateSessionTitle(sessionTitle);
                            setIsEditingTitle(false);
                          }
                        }}
                        onBlur={() => {
                          handleUpdateSessionTitle(sessionTitle);
                          setIsEditingTitle(false);
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => !showArchive || selectedSessionId ? setIsEditingTitle(true) : null}
                    >
                      <DialogTitle className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                        {showArchive && !selectedSessionId ? 'أرشيف المحادثات' : (sessionTitle || 'حوار مع النفس')}
                      </DialogTitle>
                      {(!showArchive || selectedSessionId) && (
                        <Edit2 className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
                      )}
                    </div>
                  )}
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
                        loadArchiveSessions();
                      } else {
                        setSelectedSessionId(null);
                      }
                      setShowArchive(!showArchive);
                    }}
                    className={`h-7 px-2 text-[10px] gap-1 ${showArchive
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
                        className={`group relative flex items-center justify-center w-6 h-6 rounded-full backdrop-blur-md transition-all duration-500 ${isAutoSwitch
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
                          className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-0 backdrop-blur-md ${currentSender === 'myself'
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
                          className={`relative z-10 w-1/2 py-1 text-[10px] flex items-center justify-center gap-1 transition-colors duration-1000 ${currentSender === 'myself'
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
                          className={`relative z-10 w-1/2 py-1 text-[10px] flex items-center justify-center gap-1 transition-colors duration-1000 ${currentSender === 'me'
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
                        className={`w-full min-h-[40px] max-h-[100px] rounded-xl resize-none transition-all duration-1000 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] ${inputValue.trim()
                          ? 'bg-black text-white border-white/20'
                          : 'bg-white/5 text-white border-white/10'
                          } ${currentSender === 'me'
                            ? 'focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 focus:shadow-[inset_0_2px_12px_rgba(59,130,246,0.15)]'
                            : 'focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 focus:shadow-[inset_0_2px_12px_rgba(236,72,153,0.15)]'
                          }`}
                        rows={1}
                      />
                      <Button
                        onClick={handleSendButtonClick}
                        onMouseDown={(e) => e.preventDefault()}
                        className={`w-full rounded-xl h-12 backdrop-blur-md transition-all duration-1000 font-semibold text-base ${inputValue.trim()
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
