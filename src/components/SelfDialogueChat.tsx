import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircleHeart, Send, User, Heart, Repeat, Cloud, CloudOff, RefreshCw, AlertCircle, Loader2, Lock, Edit2, Sparkles, Plus, X, GripVertical, Download, Trash2, Trophy, Star, Table2, Copy, Flame, HeartHandshake, Brain, Zap, Droplets } from 'lucide-react';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { SelfDialogueIconNew } from './icons/SelfDialogueIconNew';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
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

  @keyframes kiss-sway {
    0% { transform: scale(0.92) rotate(-2deg) translateY(3px); opacity: 0.7; }
    25% { transform: scale(1.04) rotate(1.5deg) translateY(-2px); opacity: 1; }
    50% { transform: scale(0.96) rotate(-1deg) translateY(2px); opacity: 0.85; }
    75% { transform: scale(1.02) rotate(2deg) translateY(-1px); opacity: 0.95; }
    100% { transform: scale(0.92) rotate(-2deg) translateY(3px); opacity: 0.7; }
  }
  @keyframes kiss-hearts {
    0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
    20% { opacity: 1; transform: translateY(-8px) scale(1); }
    80% { opacity: 0.6; transform: translateY(-16px) scale(0.8); }
  }
  @keyframes kiss-glow {
    0%, 100% { box-shadow: inset 0 1px 12px rgba(244,63,94,0.15), 0 0 12px rgba(244,63,94,0.08); }
    50% { box-shadow: inset 0 1px 16px rgba(244,63,94,0.3), 0 0 24px rgba(244,63,94,0.2); }
  }
  .kiss-animated {
    animation: kiss-sway 14s ease-in-out infinite, kiss-glow 14s ease-in-out infinite;
  }
  .kiss-animated.kiss-static {
    animation: none;
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  .kiss-heart-1 { animation: kiss-hearts 8s ease-in-out infinite; }
  .kiss-heart-2 { animation: kiss-hearts 8s ease-in-out 1.5s infinite; }
  .kiss-heart-3 { animation: kiss-hearts 8s ease-in-out 3s infinite; }
  .kiss-heart-static .kiss-heart-1,
  .kiss-heart-static .kiss-heart-2,
  .kiss-heart-static .kiss-heart-3 { animation: none; opacity: 0.5; }

  @keyframes touch-sway {
    0% { transform: rotate(-1.5deg) scale(0.98); }
    50% { transform: rotate(1.5deg) scale(1.02); }
    100% { transform: rotate(-1.5deg) scale(0.98); }
  }
  @keyframes touch-glow {
    0%, 100% { box-shadow: inset 0 1px 10px rgba(168,85,247,0.12), 0 0 10px rgba(168,85,247,0.06); }
    50% { box-shadow: inset 0 1px 14px rgba(168,85,247,0.25), 0 0 20px rgba(168,85,247,0.15); }
  }
  .touch-animated {
    animation: touch-sway 6s ease-in-out infinite, touch-glow 6s ease-in-out infinite;
  }
  .touch-animated.touch-static {
    animation: none;
    transform: scale(1) rotate(0deg);
  }

  @keyframes anima-transition-expand {
    0% { transform: scale(0); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: scale(50); opacity: 1; }
  }
  .anima-transition-circle {
    background: radial-gradient(circle, rgba(40,10,30,1) 10%, rgba(20,5,20,0.95) 50%, rgba(5,0,5,0.9) 80%);
    animation: anima-transition-expand 1.2s cubic-bezier(0.7, 0, 0.3, 1) forwards;
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
            ? 'bg-[#626FC4]/20 text-[#C8CCEC] rounded-bl-sm border border-[#626FC4]/30'
            : 'bg-pink-500/20 text-pink-50 rounded-br-sm border border-pink-400/30'
            }`}
        >
          <p className="text-xs leading-tight whitespace-pre-wrap" style={{ unicodeBidi: 'plaintext' }}>{msg.message}</p>
        </div>
        <div className={`flex items-center gap-0.5 mt-0.5 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
          {msg.sender === 'me' ? (
            <User className="h-2 w-2 text-[#626FC4]/40" />
          ) : (
            <Heart className="h-2 w-2 text-pink-400/30" />
          )}
          <span className={`text-[7px] ${msg.sender === 'me' ? 'text-[#626FC4]/40' : 'text-pink-400/15'}`}>
            {msg.sender === 'me' ? 'أنا' : 'الأنيما'} • {formatTime(msg.created_at)}
          </span>
          {msg.status === 'pending' && (
            <RefreshCw className="h-2 w-2 text-[#626FC4]/50 animate-spin ml-0.5" />
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

// Animated Kiss Label component - stops permanently on tap
const KissLabel = React.memo(function KissLabel({ messageId, timestamp }: { messageId: string; timestamp: string }) {
  const storageKey = `kiss-stopped-${messageId}`;
  const [isAnimating, setIsAnimating] = useState(() => !localStorage.getItem(storageKey));

  const handleStop = () => {
    if (isAnimating) {
      localStorage.setItem(storageKey, '1');
      setIsAnimating(false);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center gap-1 cursor-pointer select-none"
      onClick={handleStop}
    >
      <div className={`relative ${isAnimating ? '' : 'kiss-heart-static'}`}>
        <span className={`kiss-heart-1 absolute -top-3 -right-2 text-[10px]`}>💕</span>
        <span className={`kiss-heart-2 absolute -top-4 right-3 text-[8px]`}>❤️</span>
        <span className={`kiss-heart-3 absolute -top-3 -left-1 text-[9px]`}>💗</span>
        <div className={`px-5 py-2.5 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-400/30 kiss-animated ${!isAnimating ? 'kiss-static' : ''}`}>
          <span className="text-lg">💋</span>
          <span className="text-sm font-semibold text-rose-300 mr-2">جلسة بوس حميمي</span>
        </div>
      </div>
      <span className="text-[8px] text-white/30">{timestamp}</span>
    </div>
  );
});

// Animated Touch Label component - very slow sway, stops permanently on tap
const TouchLabel = React.memo(function TouchLabel({ messageId, timestamp }: { messageId: string; timestamp: string }) {
  const storageKey = `touch-stopped-${messageId}`;
  const [isAnimating, setIsAnimating] = useState(() => !localStorage.getItem(storageKey));

  const handleStop = () => {
    if (isAnimating) {
      localStorage.setItem(storageKey, '1');
      setIsAnimating(false);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center gap-1 cursor-pointer select-none"
      onClick={handleStop}
    >
      <div className={`touch-animated ${!isAnimating ? 'touch-static' : ''} px-5 py-2.5 rounded-2xl bg-purple-500/15 backdrop-blur-md border border-purple-400/25`}>
        <span className="text-lg">🤲</span>
        <span className="text-sm font-semibold text-purple-300 mr-2">لمس حنون</span>
      </div>
      <span className="text-[8px] text-white/30">{timestamp}</span>
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
  localSeq?: number; // Local sequence number for stable ordering
  chat_mode?: ChatMode;
}

// chat_mode doubles as persona marker:
// 'self' = me sender | 'anima' = anima persona | 'nurturing' = nurturing persona
type ChatMode = 'self' | 'anima' | 'nurturing';

interface AnimaCapability {
  id: string;
  capability_text: string;
  order_index: number;
}

// Global sequence counter to ensure message ordering even within same millisecond
let globalMessageSeq = 0;

export function SelfDialogueChat() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentSender, setCurrentSender] = useState<'me' | 'myself'>('myself');
  const [isAutoSwitch, setIsAutoSwitch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPinInput, setShowPinInput] = useState(true);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentChatMode, setCurrentChatMode] = useState<ChatMode>('self');
  const [showCapabilitiesMenu, setShowCapabilitiesMenu] = useState(false);
  const [capabilities, setCapabilities] = useState<AnimaCapability[]>([]);
  const [newCapabilityText, setNewCapabilityText] = useState('');
  const [loadingCapabilities, setLoadingCapabilities] = useState(false);
  const [animaPersona, setAnimaPersona] = useState<'anima' | 'nurturing'>('nurturing');
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [milestoneType, setMilestoneType] = useState<'sacred' | 'heart' | 'imaginary' | 'normal' | 'nursing' | 'fall'>('normal');
  const [milestoneNotes, setMilestoneNotes] = useState('');
   const [displayCount, setDisplayCount] = useState(20);
   const [allMessages, setAllMessages] = useState<DialogueMessage[]>([]);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [milestoneIntention, setMilestoneIntention] = useState('');
  const [milestoneIntentionAchievement, setMilestoneIntentionAchievement] = useState(5);
  const [milestonePleasure, setMilestonePleasure] = useState(5);
  const [milestoneSaturation, setMilestoneSaturation] = useState(5);
  const [milestoneComfort, setMilestoneComfort] = useState(5);
  const [milestoneAfterglow, setMilestoneAfterglow] = useState(false);
  const [milestoneSacred, setMilestoneSacred] = useState(false);
  const [showMilestoneTable, setShowMilestoneTable] = useState(false);
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingMilestoneCreatedAt, setEditingMilestoneCreatedAt] = useState<string | null>(null);
  const milestoneLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const milestoneLongPressFiredRef = useRef(false);

  // Fall event states
  const [showFallDialog, setShowFallDialog] = useState(false);
  const [fallDescription, setFallDescription] = useState('');
  const [editingFallId, setEditingFallId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const modeButtonLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyButtonLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendLongPressFiredRef = useRef(false);
  const toggleLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleLongPressFiredRef = useRef(false);
  
  // Transition properties for Anima navigation
  const [isTransitioningToAnima, setIsTransitioningToAnima] = useState(false);
  const animaNavLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animaNavFiredRef = useRef(false);
  
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const PENDING_MESSAGES_KEY = useMemo(() => user ? `pending_dialogue_messages_${user.id}` : null, [user]);

  const isNurturing = animaPersona === 'nurturing';

  // Colors for each persona
  const animaColors = {
    msgBg:     isNurturing ? 'bg-[#7B5230]/20 backdrop-blur-md' : 'bg-pink-500/20 backdrop-blur-md',
    msgText:   isNurturing ? 'text-[#D4A520]' : 'text-pink-50',
    msgBorder: isNurturing ? 'border-[#7B5230]/30' : 'border-pink-400/30',
    msgShadow: isNurturing ? 'shadow-[inset_0_1px_12px_rgba(123,82,48,0.2)]' : 'shadow-[inset_0_1px_12px_rgba(236,72,153,0.2)]',
    iconColor: isNurturing ? 'text-[#7B5230]/40' : 'text-pink-400/30',
    timeColor: isNurturing ? 'text-[#7B5230]/30' : 'text-pink-400/15',
    toggleActiveBg: isNurturing
      ? 'bg-[#7B5230]/40 border border-[#9B6840]/40 shadow-[inset_0_1px_10px_rgba(123,82,48,0.3),0_0_15px_rgba(123,82,48,0.2)]'
      : 'bg-pink-500/40 border border-pink-400/40 shadow-[inset_0_1px_10px_rgba(236,72,153,0.3),0_0_15px_rgba(236,72,153,0.2)]',
    inputFocus: isNurturing
      ? 'focus:border-[#9B6840]/50 focus:ring-1 focus:ring-[#9B6840]/20 focus:shadow-[inset_0_2px_12px_rgba(123,82,48,0.15)]'
      : 'focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 focus:shadow-[inset_0_2px_12px_rgba(236,72,153,0.15)]',
    sendBtn: isNurturing
      ? 'bg-[#7B5230]/30 hover:bg-[#7B5230]/40 border border-[#9B6840]/30 shadow-[inset_0_1px_10px_rgba(123,82,48,0.2)] text-[#D4A520]'
      : 'bg-pink-500/30 hover:bg-pink-500/40 border border-pink-400/30 shadow-[inset_0_1px_10px_rgba(236,72,153,0.2)] text-white',
    capabilitiesBtn: isNurturing
      ? 'bg-[#7B5230]/20 text-[#D4A520] hover:bg-[#7B5230]/30'
      : 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30',
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to check if a message is from today (anima day starts at 4 AM)
  const isFromToday = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    // Anima day starts at 4 AM
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    return messageDate >= todayStart && messageDate < tomorrowStart;
  };

  // Display messages: last N from allMessages
  const displayedMessages = useMemo(() => {
    if (allMessages.length <= displayCount) return allMessages;
    return allMessages.slice(-displayCount);
  }, [allMessages, displayCount]);

  const hasMoreMessages = allMessages.length > displayCount;

  // Get today's conversation for copying (includes milestones and kisses)
  const getTodayConversation = () => {
    const todayMsgs = allMessages.filter(msg => isFromToday(msg.created_at) && !msg.message.startsWith('__SPACER__'));
    const conversation = todayMsgs.map(msg => {
      const time = formatTime(msg.created_at);
      
      if (msg.message === '__KISS__') {
        return `[${time}] 💋 جلسة بوس حميمي`;
      }
      
      if (msg.message === '__TOUCH__') {
        return `[${time}] 🤲 لمس حنون`;
      }

      if (msg.message === '__SHOWER__') {
        return `[${time}] 🛀 دش دافئ حميمي`;
      }

<<<<<<< HEAD
      if (msg.message === '__SELFHUG__') {
        return `[${time}] 🦋 حضن ذاتي`;
      }

=======
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
      if (msg.message.startsWith('__FALL__')) {
        const content = msg.message.replace('__FALL__|', '');
        const parts = content.split('|');
        const description = parts[1] || '';
        return `[${time}] � سقوط: ${description}`;
      }
      
      if (msg.message.startsWith('__MILESTONE__')) {
        const content = msg.message.replace('__MILESTONE__', '');
        const parts = content.split('|');
        const title = parts[0] || '';
        const rating = parts[1] || '';
        const isSacredFmt = parts.length > 8;
        const notes = isSacredFmt ? '' : (parts[2] || '');
        const intention = isSacredFmt ? (parts[9] || '') : (parts[4] || '');
        let line = `[${time}] ⭐ ${title} - تقييم: ${rating}`;
        if (intention) line += ` | نية: ${intention}`;
        if (notes) line += ` | ملاحظات: ${notes}`;
        return line;
      }
      
      const senderName = msg.sender === 'me' ? 'أنا' : 'الأنيما';
      return `[${time}] ${senderName}: ${msg.message}`;
    }).join('\n\n');
    
    const header = `محادثة اليوم (${new Date().toLocaleDateString('ar-SA')})\n` + '='.repeat(30) + '\n\n';
    return header + conversation;
  };

  const copyTodayConversation = () => {
    const conversation = getTodayConversation();
    navigator.clipboard.writeText(conversation).then(() => {
      toast.success('تم نسخ محادثة اليوم');
    }).catch(err => {
      console.error('Failed to copy conversation: ', err);
      toast.error('فشل نسخ المحادثة');
    });
  };

  const getTodayMessagesOnly = () => {
    // Get today's date at 3 AM
    const now = new Date();
    const todayAt3AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0);
    
    // If current time is before 3 AM, get yesterday's 3 AM
    if (now < todayAt3AM) {
      todayAt3AM.setDate(todayAt3AM.getDate() - 1);
    }
    
    // Get messages from 3 AM onwards, excluding special messages and spacers
    const todayMsgs = allMessages.filter(msg => 
      new Date(msg.created_at) >= todayAt3AM && 
      !msg.message.startsWith('__SPACER__') &&
      !msg.message.startsWith('__MILESTONE__') &&
      msg.message !== '__KISS__' &&
      msg.message !== '__TOUCH__' &&
      msg.message !== '__SHOWER__' &&
      msg.message !== '__SELFHUG__'
    );
    
    const conversation = todayMsgs.map(msg => {
      const time = formatTime(msg.created_at);
      const senderName = msg.sender === 'me' ? 'أنا' : 'الأنيما';
      return `[${time}] ${senderName}: ${msg.message}`;
    }).join('\n\n');
    
    const header = `رسائل اليوم من الساعة 3 صباحاً (${todayAt3AM.toLocaleDateString('ar-SA')})\n` + '='.repeat(40) + '\n\n';
    return header + conversation;
  };

  const copyTodayMessagesOnly = () => {
    const conversation = getTodayMessagesOnly();
    navigator.clipboard.writeText(conversation).then(() => {
      toast.success('تم نسخ رسائل اليوم فقط');
    }).catch(err => {
      console.error('Failed to copy messages: ', err);
      toast.error('فشل نسخ الرسائل');
    });
  };

  const handleCopyButtonMouseDown = () => {
    copyButtonLongPressRef.current = setTimeout(() => {
      copyTodayMessagesOnly();
    }, 600);
  };

  const handleCopyButtonMouseUp = () => {
    if (copyButtonLongPressRef.current) {
      clearTimeout(copyButtonLongPressRef.current);
      copyButtonLongPressRef.current = null;
    }
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
            created_at: msg.created_at,
            chat_mode: msg.chat_mode || 'self'
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

  // Force focus + keyboard on PIN input when dialog opens (especially on mobile)
  useEffect(() => {
    if (isOpen && showPinInput) {
      // Multiple attempts to handle Dialog animation delay on mobile
      const attempts = [50, 150, 300, 500, 800, 1200];
      const timers = attempts.map(delay => setTimeout(() => {
        if (pinInputRef.current) {
          pinInputRef.current.focus();
          pinInputRef.current.click();
        }
      }, delay));
      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen, showPinInput]);

  useEffect(() => {
    if (isOpen && user) {
      if (showPinInput) {
        setTimeout(() => pinInputRef.current?.focus(), 100);
      } else {
        loadMessages(currentChatMode);
        syncPendingMessages();
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }

    // Listen for online status to sync
    const handleOnline = () => {
      if (user) syncPendingMessages();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOpen, user, syncPendingMessages, currentChatMode, showPinInput]);


  // Load capabilities for current mode
  const loadCapabilities = useCallback(async (mode?: ChatMode) => {
    if (!user) return;
    const modeToLoad = mode || currentChatMode;
    setLoadingCapabilities(true);
    try {
      const { data, error } = await supabase
        .from('anima_capabilities')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_mode', modeToLoad)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCapabilities(data || []);
    } catch (error) {
      console.error('Error loading capabilities:', error);
    } finally {
      setLoadingCapabilities(false);
    }
  }, [user, currentChatMode]);

  // Add new capability
  const handleAddCapability = async () => {
    if (!user || !newCapabilityText.trim()) return;
    
    const maxOrder = capabilities.length > 0 
      ? Math.max(...capabilities.map(c => c.order_index)) + 1 
      : 0;

    try {
      const { data, error } = await supabase
        .from('anima_capabilities')
        .insert({
          user_id: user.id,
          chat_mode: currentChatMode,
          capability_text: newCapabilityText.trim(),
          order_index: maxOrder
        })
        .select()
        .single();

      if (error) throw error;
      
      setCapabilities(prev => [...prev, data]);
      setNewCapabilityText('');
      toast.success('تم إضافة الإمكانية');
    } catch (error) {
      console.error('Error adding capability:', error);
      toast.error('فشل إضافة الإمكانية');
    }
  };

  // Delete capability
  const handleDeleteCapability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('anima_capabilities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCapabilities(prev => prev.filter(c => c.id !== id));
      toast.success('تم حذف الإمكانية');
    } catch (error) {
      console.error('Error deleting capability:', error);
      toast.error('فشل حذف الإمكانية');
    }
  };

  // Move capability up/down
  const handleMoveCapability = async (id: string, direction: 'up' | 'down') => {
    const index = capabilities.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === capabilities.length - 1) return;

    const newCapabilities = [...capabilities];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap order_index values
    const tempOrder = newCapabilities[index].order_index;
    newCapabilities[index].order_index = newCapabilities[swapIndex].order_index;
    newCapabilities[swapIndex].order_index = tempOrder;
    
    // Swap positions in array
    [newCapabilities[index], newCapabilities[swapIndex]] = [newCapabilities[swapIndex], newCapabilities[index]];
    
    setCapabilities(newCapabilities);

    // Update in database
    try {
      await Promise.all([
        supabase
          .from('anima_capabilities')
          .update({ order_index: newCapabilities[index].order_index })
          .eq('id', newCapabilities[index].id),
        supabase
          .from('anima_capabilities')
          .update({ order_index: newCapabilities[swapIndex].order_index })
          .eq('id', newCapabilities[swapIndex].id)
      ]);
    } catch (error) {
      console.error('Error reordering capabilities:', error);
    }
  };

  // Load capabilities when menu opens
  useEffect(() => {
    if (showCapabilitiesMenu && user) {
      loadCapabilities();
    }
  }, [showCapabilitiesMenu, user, loadCapabilities]);

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
    const targetMessages = displayedMessages;

    if (targetMessages.length === 0) return null;

    return (
      <div className="flex flex-col gap-3 p-4">
        {hasMoreMessages && (
          <div className="flex justify-center py-2">
            <span className="text-[9px] text-white/25">{isLoadingMore ? 'جاري التحميل...' : '⬆ مرر لأعلى لعرض رسائل أقدم'}</span>
          </div>
        )}
        {targetMessages.map((msg, index) => {
          const shouldAnimate = targetMessages.length - index <= 5;
          
          // Check if there's a time gap > 1.5 hours from previous message (auto spacer)
          const prevMsg = index > 0 ? targetMessages[index - 1] : null;
          const showAutoSpacer = prevMsg && 
            msg.message !== '__SPACER__' && 
            prevMsg.message !== '__SPACER__' &&
            (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 90 * 60 * 1000;

          // Render spacer message
          if (msg.message === '__SPACER__') {
            return <div key={msg.id} className="h-10" />;
          }

          // Render kiss label
          if (msg.message === '__KISS__') {
            const kissDate = new Date(msg.created_at);
            const kissTime = kissDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className="flex justify-center py-3">
                <KissLabel messageId={msg.id} timestamp={kissTime} />
              </div>
            );
          }

          // Render touch label
          if (msg.message === '__TOUCH__') {
            const touchDate = new Date(msg.created_at);
            const touchTime = touchDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className="flex justify-center py-3">
                <TouchLabel messageId={msg.id} timestamp={touchTime} />
              </div>
            );
          }

<<<<<<< HEAD
          // Render shower label
          if (msg.message === '__SHOWER__') {
            const showerDate = new Date(msg.created_at);
            const showerTime = showerDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className="flex justify-center py-3">
                <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 text-sm">🛀</span>
                    <span className="text-xs text-cyan-300/70">{showerTime}</span>
                  </div>
                  <p className="text-xs text-cyan-200 mt-0.5">دش دافئ حميمي</p>
                </div>
              </div>
            );
          }

          // Render self-hug label
          if (msg.message === '__SELFHUG__') {
            const selfhugDate = new Date(msg.created_at);
            const selfhugTime = selfhugDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className="flex justify-center py-3">
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">🦋</span>
                    <span className="text-xs text-amber-300/70">{selfhugTime}</span>
                  </div>
                  <p className="text-xs text-amber-200 mt-0.5">حضن ذاتي</p>
=======
          // Render fall event
          if (msg.message.startsWith('__FALL__')) {
            const fallContent = msg.message.replace('__FALL__|', '');
            const fallParts = fallContent.split('|');
            const fallDescription = fallParts[1] || '';
            const fallDate = new Date(msg.created_at);
            const fallTime = fallDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className="flex justify-center py-3">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 max-w-[300px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400 text-sm">📉</span>
                    <span className="text-xs text-red-300/70">{fallTime}</span>
                  </div>
                  <p className="text-xs text-red-200 leading-relaxed">{fallDescription}</p>
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
                </div>
              </div>
            );
          }

          // Render milestone message
          if (msg.message.startsWith('__MILESTONE__')) {
            const milestoneBody = msg.message.replace('__MILESTONE__', '');
            const parts = milestoneBody.split('|');
            const milestoneTitle = parts[0] || 'جماع مقدس';
            const rating = parts.length > 1 ? parseFloat(parts[1]) : 5;
            
            // Check if this is a sacred type (has more detailed fields)
            const isSacredFormat = parts.length > 8;
            
            let pleasure = '';
            let saturation = '';
            let comfort = '';
            let intentionAch = '';
            let afterglow = false;
            let sacred = false;
            let type = 'normal';
            let intention = '';
            let notes = '';
            
            if (isSacredFormat) {
              // Sacred format: title|rating|pleasure|saturation|comfort|intentionAch|afterglow|sacred|type|intention
              pleasure = parts.length > 2 ? parts[2] : '';
              saturation = parts.length > 3 ? parts[3] : '';
              comfort = parts.length > 4 ? parts[4] : '';
              intentionAch = parts.length > 5 ? parts[5] : '';
              afterglow = parts.length > 6 ? parts[6] === '1' : false;
              sacred = parts.length > 7 ? parts[7] === '1' : false;
              type = parts.length > 8 ? parts[8] : 'normal';
              intention = parts.length > 9 ? parts[9] : '';
            } else {
              // Non-sacred format: title|rating|notes|type|intention
              notes = parts.length > 2 ? parts[2] : '';
              type = parts.length > 3 ? parts[3] : 'normal';
              intention = parts.length > 4 ? parts[4] : '';
            }
            // Get base color by type, then interpolate with rating
            let baseColor = { r: 100, g: 150, b: 220 }; // normal (blue)
            if (type === 'sacred') baseColor = { r: 220, g: 80, b: 40 }; // red-orange
            else if (type === 'heart') baseColor = { r: 220, g: 100, b: 150 }; // pink
            else if (type === 'imaginary') baseColor = { r: 180, g: 100, b: 200 }; // purple
            else if (type === 'nursing') baseColor = { r: 180, g: 140, b: 80 }; // tan/wheat
<<<<<<< HEAD
            else if (type === 'fall') baseColor = { r: 127, g: 29, b: 29 }; // dark red
=======
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
            
            const r = baseColor.r;
            const g = baseColor.g;
            const b = baseColor.b;
            const ratingColor = `rgb(${r}, ${g}, ${b})`;
            const milestoneDate = new Date(msg.created_at);
            const dateStr = milestoneDate.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = milestoneDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            
            // Get icon based on type
            const getMilestoneIconElement = () => {
              switch (type) {
                case 'sacred': return <Flame className="h-4 w-4 flex-shrink-0" />;
                case 'heart': return <HeartHandshake className="h-4 w-4 flex-shrink-0" />;
                case 'imaginary': return <Brain className="h-4 w-4 flex-shrink-0" />;
                case 'nursing': return <span className="text-lg leading-none flex-shrink-0">💧</span>;
<<<<<<< HEAD
                case 'fall': return <span className="text-lg leading-none flex-shrink-0">🛑</span>;
=======
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
                default: return <Zap className="h-4 w-4 flex-shrink-0" />;
              }
            };
            
            return (
              <div key={msg.id} className="flex justify-center py-3">
                <div className="relative flex flex-col items-center gap-1">
                  <div className="absolute -inset-1 rounded-xl blur-md" style={{ background: `${ratingColor}22` }} />
                  <div className="relative flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border" dir="rtl" style={{ borderColor: `${ratingColor}66`, background: `${ratingColor}15` }}>
                    <div style={{ color: ratingColor }}>{getMilestoneIconElement()}</div>
                    <span className="text-sm font-semibold" style={{ color: ratingColor }}>{milestoneTitle}</span>
                    <span className="text-[9px] font-bold min-w-[22px] h-[22px] flex items-center justify-center rounded-full flex-shrink-0" style={{ background: `${ratingColor}30`, color: ratingColor }}>{rating}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMilestoneEditDialog(msg);
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors ml-auto"
                      title="تعديل الجماع"
                    >
                      <Edit2 className="h-3 w-3" style={{ color: ratingColor }} />
                    </button>
                  </div>
                  <div className="relative text-[8px] text-white/30 mt-0.5">{dateStr} • {timeStr}</div>
                  <div className="relative flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[8px] text-white/35 mt-0.5 max-w-[240px]" dir="rtl">
                    {isSacredFormat ? (
                      <>
                        {pleasure && <span>ممتع:{pleasure}</span>}
                        {saturation && <span>مشبع:{saturation}</span>}
                        {comfort && <span>مريح:{comfort}</span>}
                        {intentionAch && <span>نية:{intentionAch}</span>}
                        {afterglow && <span>✨Afterglow</span>}
                        {sacred && <span>🕊مقدس</span>}
                      </>
                    ) : (
                      notes && <span className="text-blue-300">ملاحظات: {notes}</span>
                    )}
                  </div>
                  {intention && (
                    <div className="relative text-[9px] text-white/40 mt-0.5 text-center max-w-[200px]" dir="rtl" style={{ unicodeBidi: 'plaintext' }}>«{intention}»</div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <React.Fragment key={msg.id}>
              {showAutoSpacer && <div className="h-10" />}
              <div
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
                      ? 'bg-[#626FC4]/20 backdrop-blur-md text-[#C8CCEC] rounded-bl-sm border border-[#626FC4]/30 shadow-[inset_0_1px_12px_rgba(98,111,196,0.2)]'
                      : msg.chat_mode === 'nurturing'
                        ? 'bg-[#7B5230]/20 backdrop-blur-md text-[#D4A520] rounded-br-sm border border-[#7B5230]/30 shadow-[inset_0_1px_12px_rgba(123,82,48,0.2)]'
                        : 'bg-pink-500/20 backdrop-blur-md text-pink-50 rounded-br-sm border border-pink-400/30 shadow-[inset_0_1px_12px_rgba(236,72,153,0.2)]'
                      }`}
                  >
                    <p className="text-xs leading-tight whitespace-pre-wrap" style={{ unicodeBidi: 'plaintext' }}>{msg.message}</p>
                  </div>
                  <div className={`flex items-center gap-0.5 mt-0.5 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                    {msg.sender === 'me' ? (
                      <User className="h-2 w-2 text-[#626FC4]/40" />
                    ) : (
                      <Heart className={`h-2 w-2 ${msg.chat_mode === 'nurturing' ? 'text-[#7B5230]/40' : 'text-pink-400/30'}`} />
                    )}
                    <span className={`text-[7px] ${msg.sender === 'me' ? 'text-[#626FC4]/40' : msg.chat_mode === 'nurturing' ? 'text-[#7B5230]/50' : 'text-pink-400/15'}`}>
                      {msg.sender === 'me' ? 'أنا' : 'الأنيما'} • {formatTime(msg.created_at)}
                    </span>

                    {/* Status Indicator */}
                    {msg.status === 'pending' && (
                      <RefreshCw className="h-2 w-2 text-[#626FC4]/50 animate-spin ml-0.5" />
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
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  }, [displayedMessages, handleMouseDown, handleMouseUp]);

  // Scroll-to-top handler: load more older messages
  useEffect(() => {
    if (!isOpen) return;
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (scrollContainer.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
        setIsLoadingMore(true);
        const prevHeight = scrollContainer.scrollHeight;
        setDisplayCount(prev => prev + 20);
        // Preserve scroll position after loading
        requestAnimationFrame(() => {
          const newHeight = scrollContainer.scrollHeight;
          scrollContainer.scrollTop = newHeight - prevHeight;
          setIsLoadingMore(false);
        });
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isOpen, hasMoreMessages, isLoadingMore]);

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
    const timeout = setTimeout(scrollToBottom, 50);
    const timeout2 = setTimeout(scrollToBottom, 150);

    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [messages.length, isOpen, showPinInput]);

  const loadMessages = async (mode?: ChatMode) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('self_dialogue_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .in('chat_mode', ['self', 'anima', 'nurturing'])
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;

      const remoteMessages = (data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'me' | 'myself',
        message: msg.message,
        created_at: msg.created_at,
        status: 'synced' as const,
        chat_mode: msg.chat_mode as ChatMode
      }));

      // Get local pending messages
      let pendingMessages: DialogueMessage[] = [];
      if (PENDING_MESSAGES_KEY) {
        const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
        if (stored) {
          const allPending = JSON.parse(stored);
          pendingMessages = allPending.filter((m: DialogueMessage) =>
            ['self', 'anima', 'nurturing'].includes(m.chat_mode || 'self')
          );
        }
      }

      // Merge and sort
      const allMessages: DialogueMessage[] = [...remoteMessages];
      pendingMessages.forEach(p => {
        if (!allMessages.some(m => m.id === p.id)) {
          allMessages.push(p as DialogueMessage);
        }
      });

      // Sort by timestamp first, then by localSeq (for local messages), then by id
      allMessages.sort((a, b) => {
        const t = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (t !== 0) return t;
        // Use localSeq for stable ordering of locally-created messages
        if (a.localSeq !== undefined && b.localSeq !== undefined) {
          return a.localSeq - b.localSeq;
        }
        // Fallback to id comparison for database messages
        return a.id.localeCompare(b.id);
      });
      // Keep only last 20 messages for better performance
      const displayMessages = allMessages.slice(-20);
      setAllMessages(allMessages);
      setMessages(displayMessages);

      if (allMessages.length > 0) {
        setSessionTitle(allMessages[0].session_title || 'حوار مع الأنيما');
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
    const messageToDelete = messages.find(m => m.id === messageId);
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setAllMessages(prev => prev.filter(m => m.id !== messageId));

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
  };


  const handleUpdateSessionTitle = async (newTitle: string) => {
    if (!user || !newTitle.trim()) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('self_dialogue_messages')
        .update({ session_title: newTitle })
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (error) throw error;

      // Update title in state for all messages to ensure consistency
      setMessages(prev => prev.map(m => ({ ...m, session_title: newTitle })));
      setSessionTitle(newTitle);
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

  const insertSpacer = async () => {
    if (!user) return;
    const tempId = crypto.randomUUID();
    globalMessageSeq++;
    const spacerMessage: DialogueMessage = {
      id: tempId,
      sender: 'me',
      message: '__SPACER__',
      created_at: new Date().toISOString(),
      status: 'pending',
      localSeq: globalMessageSeq,
      chat_mode: 'self'
    };
    setMessages(prev => [...prev, spacerMessage]);
    try {
      await supabase.from('self_dialogue_messages').insert({
        user_id: user.id,
        sender: 'me',
        message: '__SPACER__',
        created_at: spacerMessage.created_at,
        session_title: sessionTitle || null,
        chat_mode: 'self'
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));
    } catch { 
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const insertKissLabel = async () => {
    if (!user) return;
    const tempId = crypto.randomUUID();
    globalMessageSeq++;
    const kissMessage: DialogueMessage = {
      id: tempId,
      sender: 'me',
      message: '__KISS__',
      created_at: new Date().toISOString(),
      status: 'pending',
      localSeq: globalMessageSeq,
      chat_mode: 'self'
    };
    setMessages(prev => [...prev, kissMessage]);
    setAllMessages(prev => [...prev, kissMessage]);
    try {
      await supabase.from('self_dialogue_messages').insert({
        user_id: user.id,
        sender: 'me',
        message: '__KISS__',
        created_at: kissMessage.created_at,
        session_title: sessionTitle || null,
        chat_mode: 'self'
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const insertTouchLabel = async () => {
    if (!user) return;
    const tempId = crypto.randomUUID();
    globalMessageSeq++;
    const touchMessage: DialogueMessage = {
      id: tempId,
      sender: 'me',
      message: '__TOUCH__',
      created_at: new Date().toISOString(),
      status: 'pending',
      localSeq: globalMessageSeq,
      chat_mode: 'self'
    };
    setMessages(prev => [...prev, touchMessage]);
    setAllMessages(prev => [...prev, touchMessage]);
    try {
      await supabase.from('self_dialogue_messages').insert({
        user_id: user.id,
        sender: 'me',
        message: '__TOUCH__',
        created_at: touchMessage.created_at,
        session_title: sessionTitle || null,
        chat_mode: 'self'
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

<<<<<<< HEAD
  const insertShowerLabel = async () => {
    if (!user) return;
    const tempId = crypto.randomUUID();
    globalMessageSeq++;
    const showerMessage: DialogueMessage = {
      id: tempId,
      sender: 'me',
      message: '__SHOWER__',
      created_at: new Date().toISOString(),
      status: 'pending',
      localSeq: globalMessageSeq,
      chat_mode: 'self'
    };
    setMessages(prev => [...prev, showerMessage]);
    setAllMessages(prev => [...prev, showerMessage]);
    try {
      await supabase.from('self_dialogue_messages').insert({
        user_id: user.id,
        sender: 'me',
        message: '__SHOWER__',
        created_at: showerMessage.created_at,
        session_title: sessionTitle || null,
        chat_mode: 'self'
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const insertSelfHugLabel = async () => {
    if (!user) return;
    const tempId = crypto.randomUUID();
    globalMessageSeq++;
    const selfhugMessage: DialogueMessage = {
      id: tempId,
      sender: 'me',
      message: '__SELFHUG__',
      created_at: new Date().toISOString(),
      status: 'pending',
      localSeq: globalMessageSeq,
      chat_mode: 'self'
    };
    setMessages(prev => [...prev, selfhugMessage]);
    setAllMessages(prev => [...prev, selfhugMessage]);
    try {
      await supabase.from('self_dialogue_messages').insert({
        user_id: user.id,
        sender: 'me',
        message: '__SELFHUG__',
        created_at: selfhugMessage.created_at,
        session_title: sessionTitle || null,
        chat_mode: 'self'
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const openFallDialog = () => {
    openMilestoneDialog('fall');
  };

=======
  const openFallDialog = () => {
    setFallDescription('');
    setShowFallDialog(true);
  };

  const insertFall = async () => {
    if (!user || !fallDescription.trim()) {
      toast.error('الرجاء إدخال وصف السقوط');
      return;
    }
    
    const fallContent = `__FALL__|0|${fallDescription}`;
    
    // Handle editing
    if (editingFallId) {
      try {
        await supabase
          .from('self_dialogue_messages')
          .update({ message: fallContent })
          .eq('id', editingFallId)
          .eq('user_id', user.id);
        
        setMessages(prev => prev.map(m => m.id === editingFallId ? { ...m, message: fallContent } : m));
        setAllMessages(prev => prev.map(m => m.id === editingFallId ? { ...m, message: fallContent } : m));
        setShowFallDialog(false);
        setEditingFallId(null);
        setFallDescription('');
        toast.success('تم تحديث السقوط');
      } catch (err) {
        console.error('Failed to update fall:', err);
        toast.error('فشل تحديث السقوط');
      }
      return;
    }

    // Handle new fall event
    const tempId = crypto.randomUUID();
    globalMessageSeq++;
    const fallMessage: DialogueMessage = {
      id: tempId,
      sender: 'me',
      message: fallContent,
      created_at: new Date().toISOString(),
      status: 'pending',
      localSeq: globalMessageSeq,
      chat_mode: 'self'
    };
    setMessages(prev => [...prev, fallMessage]);
    setAllMessages(prev => [...prev, fallMessage]);
    setShowFallDialog(false);
    
    try {
      await supabase.from('self_dialogue_messages').insert({
        user_id: user.id,
        sender: 'me',
        message: fallContent,
        created_at: fallMessage.created_at,
        session_title: sessionTitle || null,
        chat_mode: 'self'
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));
      toast.success('تم تسجيل السقوط');
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
      toast.error('فشل تسجيل السقوط');
    }
  };
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7

  const openMilestoneDialog = (type: 'sacred' | 'heart' | 'imaginary' | 'normal' | 'nursing' | 'fall' = 'normal') => {
    setMilestoneType(type);
    setMilestoneIntention('');
    setMilestoneNotes('');
    setMilestoneIntentionAchievement(type === 'fall' ? 0 : 5);
    setMilestonePleasure(5);
    setMilestoneSaturation(5);
    setMilestoneComfort(5);
    setMilestoneAfterglow(false);
    setMilestoneSacred(type === 'sacred');
    setIsEditingMilestone(false);
    setEditingMilestoneId(null);
    setShowMilestoneDialog(true);
  };

  const openMilestoneEditDialog = (milestoneMessage: DialogueMessage) => {
<<<<<<< HEAD
=======
    // Check if it's a fall event - convert to milestone format for editing
    if (milestoneMessage.message.startsWith('__FALL__')) {
      const fallContent = milestoneMessage.message.replace('__FALL__|', '');
      const fallParts = fallContent.split('|');
      const description = fallParts[1] || '';
      
      // Set fall type in milestone editor
      setMilestoneType('fall');
      setMilestoneNotes(description);
      setMilestoneIntention('');
      setMilestoneIntentionAchievement(0);
      setMilestonePleasure(5);
      setMilestoneSaturation(5);
      setMilestoneComfort(5);
      setMilestoneAfterglow(false);
      setMilestoneSacred(false);
      setIsEditingMilestone(true);
      setEditingMilestoneId(milestoneMessage.id);
      setEditingMilestoneCreatedAt(milestoneMessage.created_at);
      setShowMilestoneDialog(true);
      return;
    }

>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
    const content = milestoneMessage.message.replace('__MILESTONE__', '');
    const parts = content.split('|');
    const isSacredFmt = parts.length > 8;
    
    // Parse milestone data
    const title = parts[0] || '';
    const rating = parseFloat(parts[1] || '5');
    
    // Determine type
    let type: 'sacred' | 'heart' | 'imaginary' | 'normal' | 'nursing' | 'fall' = 'normal';
    if (isSacredFmt) {
      type = (parts[8] as any) || 'normal';
    } else {
      type = (parts[3] as any) || 'normal';
    }
    
    // Extract other fields
    let notes = '';
    let intention = '';
    let pleasure = 5;
    let saturation = 5;
    let comfort = 5;
    let afterglow = false;
    let sacred = false;
    let intentionAch = 5;
    
    if (isSacredFmt) {
      pleasure = parseFloat(parts[2] || '5');
      saturation = parseFloat(parts[3] || '5');
      comfort = parseFloat(parts[4] || '5');
      intentionAch = parseFloat(parts[5] || '5');
      afterglow = parts[6] === '1';
      sacred = parts[7] === '1';
      intention = parts[9] || '';
    } else {
      notes = parts[2] || '';
      intention = parts[4] || '';
      intentionAch = rating;
    }
    
    // Set all states
    setMilestoneType(type);
    setMilestoneIntention(intention);
    setMilestoneNotes(notes);
    setMilestoneIntentionAchievement(intentionAch);
    setMilestonePleasure(pleasure);
    setMilestoneSaturation(saturation);
    setMilestoneComfort(comfort);
    setMilestoneAfterglow(afterglow);
    setMilestoneSacred(sacred);
    setIsEditingMilestone(true);
    setEditingMilestoneId(milestoneMessage.id);
    setEditingMilestoneCreatedAt(milestoneMessage.created_at);
    setShowMilestoneDialog(true);
  };

  const calculateMilestoneRating = (pleasure: number, saturation: number, comfort: number, intentionAch: number, afterglow: boolean, sacred: boolean) => {
    // Each slider (0-10) contributes 2 points: (slider/10)*2
    const sliderPoints = (pleasure / 10 * 2) + (saturation / 10 * 2) + (comfort / 10 * 2) + (intentionAch / 10 * 2);
    // Each checkbox contributes 1 point
    const checkboxPoints = (afterglow ? 1 : 0) + (sacred ? 1 : 0);
    return Math.round((sliderPoints + checkboxPoints) * 10) / 10;
  };

  const insertMilestone = async () => {
    if (!user) return;
    
    const typeNames = {
      sacred: 'جماع مقدس',
      heart: 'جماع قلبي',
      imaginary: 'جماع خيالي',
      normal: 'جماع عادي',
      nursing: 'جماع ارضاعي',
      fall: 'سقوط'
    };
    
    const milestoneName = typeNames[milestoneType];
    let finalRating: number;
    let milestoneContent: string;
    
    // For all types, use simple decimal rating
    finalRating = milestoneIntentionAchievement;
<<<<<<< HEAD
    
    // Format: __MILESTONE__title|rating|notes|type|intention
    // Fall now uses milestone format too, with 0 rating
    milestoneContent = `__MILESTONE__${milestoneName}|${finalRating}|${milestoneNotes}|${milestoneType}|${milestoneIntention}`;
    
=======
    
    // Handle fall type - convert to __FALL__ format
    if (milestoneType === 'fall') {
      milestoneContent = `__FALL__|0|${milestoneNotes}`;
    } else {
      // Format: __MILESTONE__title|rating|notes|type|intention
      milestoneContent = `__MILESTONE__${milestoneName}|${finalRating}|${milestoneNotes}|${milestoneType}|${milestoneIntention}`;
    }
    
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
    // If editing, update existing milestone
    if (isEditingMilestone && editingMilestoneId) {
      try {
        console.log('Updating milestone:', { editingMilestoneId, userId: user?.id, content: milestoneContent });
        
        const { data, error } = await supabase
          .from('self_dialogue_messages')
          .update({
            message: milestoneContent
          })
          .eq('id', editingMilestoneId);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        console.log('Update successful:', data);

        // Update local state
        setMessages(prev => prev.map(m => m.id === editingMilestoneId ? { ...m, message: milestoneContent } : m));
        setAllMessages(prev => prev.map(m => m.id === editingMilestoneId ? { ...m, message: milestoneContent } : m));
        
        setShowMilestoneDialog(false);
        setIsEditingMilestone(false);
        setEditingMilestoneId(null);
        setEditingMilestoneCreatedAt(null);
        setMilestoneIntention('');
        setMilestoneNotes('');
        setMilestoneIntentionAchievement(5);
        setMilestonePleasure(5);
        setMilestoneSaturation(5);
        setMilestoneComfort(5);
        setMilestoneAfterglow(false);
        setMilestoneSacred(false);
        toast.success('تم تحديث الإنجاز بنجاح!');
      } catch (error) {
        console.error('Error updating milestone:', error);
        toast.error('فشل تحديث الإنجاز');
      }
    } else {
      // Create new milestone
      const tempId = crypto.randomUUID();
      globalMessageSeq++;
      
      const milestoneMessage: DialogueMessage = {
        id: tempId,
        sender: 'me',
        message: milestoneContent,
        created_at: new Date().toISOString(),
        status: 'pending',
        localSeq: globalMessageSeq,
        chat_mode: 'self'
      };
      setMessages(prev => [...prev, milestoneMessage]);
      setAllMessages(prev => [...prev, milestoneMessage]);
      setShowMilestoneDialog(false);
      setMilestoneIntention('');
      setMilestoneNotes('');
      setMilestoneIntentionAchievement(5);
      setMilestonePleasure(5);
      setMilestoneSaturation(5);
      setMilestoneComfort(5);
      setMilestoneAfterglow(false);
      setMilestoneSacred(false);
      try {
        await supabase.from('self_dialogue_messages').insert({
          user_id: user.id,
          sender: 'me',
          message: milestoneContent,
          created_at: milestoneMessage.created_at,
          session_title: sessionTitle || null,
          chat_mode: 'self'
        });
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));
        toast.success('تم إضافة الإنجاز بنجاح!');
      } catch { 
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        toast.error('فشل إضافة الإنجاز');
      }
    }
  };

  // Get all milestone and kiss messages for the table view
  const milestoneMessages = useMemo(() => {
<<<<<<< HEAD
    return allMessages.filter(m => m.message.startsWith('__MILESTONE__') || m.message === '__KISS__' || m.message === '__TOUCH__' || m.message === '__SHOWER__' || m.message === '__SELFHUG__');
=======
    return allMessages.filter(m => m.message.startsWith('__MILESTONE__') || m.message === '__KISS__' || m.message === '__TOUCH__' || m.message.startsWith('__FALL__'));
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
  }, [allMessages]);

  const exportMilestonesCSV = () => {
    const rows = [['التاريخ', 'الوقت', 'النوع', 'التقييم', 'الملاحظات', 'النية']];
    [...milestoneMessages].reverse().forEach(m => {
      const date = new Date(m.created_at);
      const dateStr = date.toLocaleDateString('ar-SA');
      const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      
      if (m.message === '__KISS__') {
        rows.push([dateStr, timeStr, 'قبلة حميمية', '-', '-', '-']);
        return;
      }
      
      if (m.message === '__TOUCH__') {
        rows.push([dateStr, timeStr, 'لمس حنون', '-', '-', '-']);
        return;
      }

      if (m.message === '__SHOWER__') {
        rows.push([dateStr, timeStr, 'دش دافئ حميمي', '-', '-', '-']);
        return;
      }

      if (m.message === '__SELFHUG__') {
        rows.push([dateStr, timeStr, 'حضن ذاتي', '-', '-', '-']);
        return;
      }

      if (m.message.startsWith('__FALL__')) {
        const fallContent = m.message.replace('__FALL__|', '');
        const fallParts = fallContent.split('|');
        const description = fallParts[1] || '';
        rows.push([dateStr, timeStr, '0', description, '-']);
        return;
      }
      
      const content = m.message.replace('__MILESTONE__', '');
      const parts = content.split('|');
      const isSacredFmt = parts.length > 8;
      const notes = isSacredFmt ? '' : (parts[2] || '');
      const intention = isSacredFmt ? (parts[9] || '') : (parts[4] || '');
      const type = parts[3] || 'normal';
      rows.push([
        dateStr, timeStr,
        parts[0] || '',
        parts[1] || '',
        notes, intention
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'milestones.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات');
  };

  const copyMilestoneData = (msg: DialogueMessage) => {
    const content = msg.message.replace('__MILESTONE__', '');
    const parts = content.split('|');
    const date = new Date(msg.created_at);
    const isSacredFmt = parts.length > 8;
    const notes = isSacredFmt ? '' : (parts[2] || '');
    const intention = isSacredFmt ? (parts[9] || '') : (parts[4] || '');
    const text = `التاريخ: ${date.toLocaleDateString('ar-SA')}
الوقت: ${date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
النوع: ${parts[0] || ''}
التقييم: ${parts[1] || ''}
الملاحظات: ${notes}
النية: ${intention}`;
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ البيانات');
  };

  const deleteMilestone = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    
    try {
      const { error } = await supabase
        .from('self_dialogue_messages')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== id));
      setAllMessages(prev => prev.filter(m => m.id !== id));
      toast.success('تم حذف السجل بنجاح');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleSendButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Skip if long-press just fired
    if (sendLongPressFiredRef.current) {
      sendLongPressFiredRef.current = false;
      return;
    }

    if (!inputValue.trim()) {
      const newSender = currentSender === 'me' ? 'myself' : 'me';
      handleManualSwitch(newSender);
    } else {
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    // Auto-insert spacer if last message was > 1.5 hours ago
    const filtered = messages.filter(m => m.message !== '__SPACER__');
    const lastMsg = filtered.length > 0 ? filtered[filtered.length - 1] : undefined;
    if (lastMsg && (Date.now() - new Date(lastMsg.created_at).getTime()) > 90 * 60 * 1000) {
      await insertSpacer();
    }

    const messageText = inputValue.trim();
    setInputValue('');

    // Create optimistic update with sequence number to ensure stable ordering
    const tempId = crypto.randomUUID();
    const senderForThisMessage = currentSender;
    const chatModeForMsg: ChatMode = senderForThisMessage === 'myself'
      ? (animaPersona === 'nurturing' ? 'nurturing' : 'anima')
      : 'self';
    globalMessageSeq++;
    const newMessage: DialogueMessage = {
      id: tempId,
      sender: senderForThisMessage,
      message: messageText,
      created_at: new Date().toISOString(),
      status: 'pending',
      localSeq: globalMessageSeq,
      chat_mode: chatModeForMsg
    };

    // Update UI immediately - just append, don't re-sort
    setMessages(prev => [...prev, newMessage]);
    setAllMessages(prev => [...prev, newMessage]);

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
          session_title: sessionTitle || null,
          chat_mode: chatModeForMsg
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

        <DialogContent
          className="top-0 left-0 translate-x-0 translate-y-0 w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none sm:top-[50%] sm:left-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-[600px] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 text-white p-0 overflow-hidden flex flex-col"
        >
          {showPinInput ? (
            // PIN Entry Screen
            <div className="flex flex-col items-center justify-center h-full p-8" onClick={() => pinInputRef.current?.focus()}>
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
                autoComplete="off"
                autoFocus
                onClick={() => pinInputRef.current?.focus()}
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
              />

              <p className="text-xs text-white/30 mt-4">أدخل رقمين</p>

              <DialogDescription className="sr-only">
                أدخل الرقم السري للوصول للمحادثة
              </DialogDescription>
            </div>
          ) : (
            // Regular Chat Content
            <>
              <DialogHeader className="p-4 border-b border-white/10 flex-shrink-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {isSyncing && (
                    <Loader2 className="h-3 w-3 text-[#626FC4] animate-spin" />
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMilestoneDialog('sacred')}
                      className="h-7 px-2 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-1"
                      title="إضافة جماع مقدس"
                    >
                      <Flame className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMilestoneDialog('heart')}
                      className="h-7 px-2 text-[10px] text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 gap-1"
                      title="إضافة جماع قلبي"
                    >
                      <HeartHandshake className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMilestoneDialog('imaginary')}
                      className="h-7 px-2 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1"
                      title="إضافة جماع خيالي"
                    >
                      <Brain className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMilestoneDialog('normal')}
                      className="h-7 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1"
                      title="إضافة جماع عادي"
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMilestoneDialog('nursing')}
                      className="h-7 px-2 text-[10px] text-amber-700 hover:text-amber-600 hover:bg-amber-600/10 gap-1"
                      title="إضافة جماع ارضاعي"
                    >
                      <Droplets className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertKissLabel}
                      className="h-7 px-2 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1"
                      title="بوس حميمي"
                    >
                      💋
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertTouchLabel}
                      className="h-7 px-2 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1"
                      title="لمس حنون"
                    >
                      🤲
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
<<<<<<< HEAD
                      onClick={insertShowerLabel}
                      className="h-7 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1"
                      title="دش دافئ حميمي"
                    >
                      🛀
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insertSelfHugLabel}
                      className="h-7 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1"
                      title="حضن ذاتي"
                    >
                      🦋
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
=======
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
                      onClick={openFallDialog}
                      className="h-7 px-2 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-600/10 gap-1"
                      title="سقوط"
                    >
<<<<<<< HEAD
                      🛑
=======
                      📉
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
                    </Button>

                  {/* Milestone Table Button */}
                  {milestoneMessages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMilestoneTable(true)}
                      className="h-7 px-2 text-[10px] text-red-500/60 hover:text-red-400 hover:bg-red-500/10 gap-1"
                      title="جدول الجماعات"
                    >
                      <Table2 className="h-3 w-3" />
                    </Button>
                  )}


                  {/* Copy Today's Conversation */}
                  {displayedMessages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyTodayConversation}
<<<<<<< HEAD
                      onMouseDown={handleCopyButtonMouseDown}
                      onMouseUp={handleCopyButtonMouseUp}
                      onMouseLeave={handleCopyButtonMouseUp}
                      onTouchStart={handleCopyButtonMouseDown}
                      onTouchEnd={handleCopyButtonMouseUp}
                      className="h-7 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      title="نسخ محادثة اليوم (اضغط مطولاً لنسخ الرسائل فقط)"
=======
                      className="h-7 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      title="نسخ محادثة اليوم"
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}

                  {/* Milestone Table View */}
                  {showMilestoneTable && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMilestoneTable(false)}>
                      <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-4 w-[95vw] max-w-[500px] max-h-[80vh] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white/80">سجل الجماعات والبوس واللمس</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={exportMilestonesCSV}
                            className="h-7 px-2 text-[10px] text-amber-300 hover:bg-amber-500/10 gap-1"
                          >
                            <Download className="h-3 w-3" />
                            CSV
                          </Button>
                        </div>
                        <div className="overflow-y-auto flex-1 space-y-2">
                          {[...milestoneMessages].reverse().map(m => {
                            const date = new Date(m.created_at);
                            const dateStr = date.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
                            const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

                            // Kiss entry
                            if (m.message === '__KISS__') {
                              return (
                                <div key={m.id} className="bg-rose-500/10 rounded-lg p-3 border border-rose-400/20 text-right" dir="rtl">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-rose-300">💋 بوس حميمي</span>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => { setShowMilestoneTable(false); openMilestoneEditDialog(m); }} className="p-1 text-white/30 hover:text-rose-300 transition-colors" title="تعديل">
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => { navigator.clipboard.writeText(`💋 بوس حميمي - ${dateStr} ${timeStr}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-[9px] text-white/40">{dateStr} • {timeStr}</div>
                                </div>
                              );
                            }

                            // Touch entry
                            if (m.message === '__TOUCH__') {
                              return (
                                <div key={m.id} className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20 text-right" dir="rtl">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-purple-300">🤲 لمس حنون</span>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => { setShowMilestoneTable(false); openMilestoneEditDialog(m); }} className="p-1 text-white/30 hover:text-purple-300 transition-colors" title="تعديل">
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => { navigator.clipboard.writeText(`🤲 لمس حنون - ${dateStr} ${timeStr}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-[9px] text-white/40">{dateStr} • {timeStr}</div>
                                </div>
                              );
                            }

<<<<<<< HEAD
                            // Shower entry
                            if (m.message === '__SHOWER__') {
                              return (
                                <div key={m.id} className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-400/20 text-right" dir="rtl">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-cyan-300">🛀 دش دافئ حميمي</span>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => { navigator.clipboard.writeText(`🛀 دش دافئ حميمي - ${dateStr} ${timeStr}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-[9px] text-white/40">{dateStr} • {timeStr}</div>
                                </div>
                              );
                            }

                            // Self-hug entry
                            if (m.message === '__SELFHUG__') {
                              return (
                                <div key={m.id} className="bg-amber-500/10 rounded-lg p-3 border border-amber-400/20 text-right" dir="rtl">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-amber-300">🦋 حضن ذاتي</span>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => { navigator.clipboard.writeText(`🦋 حضن ذاتي - ${dateStr} ${timeStr}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-[9px] text-white/40">{dateStr} • {timeStr}</div>
                                </div>
                              );
                            }

                            // Fall entry
                            if (false) { // __FALL__ is now stored as __MILESTONE__ format
                              const fallDescription = '';
=======
                            // Fall entry
                            if (m.message.startsWith('__FALL__')) {
                              const fallContent = m.message.replace('__FALL__|', '');
                              const fallParts = fallContent.split('|');
                              const fallDescription = fallParts[1] || '';
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
                              return (
                                <div key={m.id} className="bg-red-500/10 rounded-lg p-3 border border-red-400/20 text-right" dir="rtl">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-red-300">� سقوط</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded-full">0</span>
                                      <button onClick={() => { setShowMilestoneTable(false); openMilestoneEditDialog(m); }} className="p-1 text-white/30 hover:text-red-300 transition-colors" title="تعديل">
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => { navigator.clipboard.writeText(`� سقوط - ${dateStr} ${timeStr}: ${fallDescription}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-[9px] text-white/40 mb-1">{dateStr} • {timeStr}</div>
                                  <div className="text-[9px] text-red-200">{fallDescription}</div>
                                </div>
                              );
                            }

                            // Milestone entry - simplified: intention, rating, notes, date
                            const content = m.message.replace('__MILESTONE__', '');
                            const p = content.split('|');
                            const isSacredFmt = p.length > 8;
                            const title = p[0] || '';
                            const rating = p[1] || '';
                            const notes = isSacredFmt ? '' : (p[2] || '');
                            const intention = isSacredFmt ? (p[9] || '') : (p[4] || '');
                            return (
                              <div key={m.id} className="bg-white/5 rounded-lg p-3 border border-white/10 text-right" dir="rtl">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-amber-300">{title}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded-full">{rating}</span>
                                    <button onClick={() => { setShowMilestoneTable(false); openMilestoneEditDialog(m); }} className="p-1 text-white/30 hover:text-amber-300 transition-colors" title="تعديل">
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => copyMilestoneData(m)} className="p-1 text-white/30 hover:text-white/60">
                                      <Copy className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-[9px] text-white/40 mb-1">{dateStr} • {timeStr}</div>
                                {intention && <div className="text-[9px] text-white/50 mb-0.5">نية: {intention}</div>}
                                {notes && <div className="text-[9px] text-white/40">ملاحظات: {notes}</div>}
                              </div>
                            );
                          })}
                        </div>
                        <Button variant="ghost" onClick={() => setShowMilestoneTable(false)} className="h-8 text-xs text-white/50 hover:text-white">إغلاق</Button>
                      </div>
                    </div>
                  )}

                  {/* Milestone Rating Dialog */}
                  {showMilestoneDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowMilestoneDialog(false); setIsEditingMilestone(false); setEditingMilestoneId(null); setEditingMilestoneCreatedAt(null); }}>
                      <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-6 w-[90vw] max-w-[380px] flex flex-col gap-3 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-center text-sm font-semibold text-white/80">
                          {isEditingMilestone ? 'تعديل' : 'تقييم'} {milestoneType === 'sacred' ? 'الجماع المقدس' : 
                                   milestoneType === 'heart' ? 'الجماع القلبي' :
                                   milestoneType === 'imaginary' ? 'الجماع الخيالي' :
                                   milestoneType === 'nursing' ? 'الجماع الإرضاعي' :
                                   milestoneType === 'fall' ? 'السقوط' : 'الجماع العادي'}
                        </h3>
                        
                        {/* Type Selector for Editing */}
                        {isEditingMilestone && (
                          <div className="flex justify-center gap-2 pb-2 border-b border-white/10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMilestoneType('sacred')}
                              className={`h-7 px-2 text-[10px] gap-1 transition-all ${
                                milestoneType === 'sacred'
                                  ? 'text-red-500 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30'
                                  : 'text-red-500/50 hover:text-red-400 hover:bg-red-500/10'
                              }`}
                              title="جماع مقدس"
                            >
                              <Flame className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMilestoneType('heart')}
                              className={`h-7 px-2 text-[10px] gap-1 transition-all ${
                                milestoneType === 'heart'
                                  ? 'text-pink-400 bg-pink-500/20 border border-pink-400/50 hover:bg-pink-500/30'
                                  : 'text-pink-400/50 hover:text-pink-300 hover:bg-pink-500/10'
                              }`}
                              title="جماع قلبي"
                            >
                              <HeartHandshake className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMilestoneType('imaginary')}
                              className={`h-7 px-2 text-[10px] gap-1 transition-all ${
                                milestoneType === 'imaginary'
                                  ? 'text-purple-400 bg-purple-500/20 border border-purple-400/50 hover:bg-purple-500/30'
                                  : 'text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10'
                              }`}
                              title="جماع خيالي"
                            >
                              <Brain className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMilestoneType('normal')}
                              className={`h-7 px-2 text-[10px] gap-1 transition-all ${
                                milestoneType === 'normal'
                                  ? 'text-blue-400 bg-blue-500/20 border border-blue-400/50 hover:bg-blue-500/30'
                                  : 'text-blue-400/50 hover:text-blue-300 hover:bg-blue-500/10'
                              }`}
                              title="جماع عادي"
                            >
                              <Zap className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMilestoneType('nursing')}
                              className={`h-7 px-2 text-[10px] gap-1 transition-all ${
                                milestoneType === 'nursing'
                                  ? 'text-amber-700 bg-amber-600/20 border border-amber-700/50 hover:bg-amber-600/30'
                                  : 'text-amber-700/50 hover:text-amber-600 hover:bg-amber-600/10'
                              }`}
                              title="جماع ارضاعي"
                            >
                              <Droplets className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMilestoneType('fall')}
                              className={`h-7 px-2 text-[10px] gap-1 transition-all ${
                                milestoneType === 'fall'
                                  ? 'text-red-500 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30'
                                  : 'text-red-500/50 hover:text-red-400 hover:bg-red-500/10'
                              }`}
                              title="سقوط"
                            >
                              📉
                            </Button>
                          </div>
                        )}
                        
                        {/* Simple Interface for All Types */}
                        <>
                          {/* Show only notes for fall type */}
                          {milestoneType !== 'fall' && (
                            <>
                              {/* Intention Notes */}
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-white/60">نية الجماع</span>
                                <Input
                                  value={milestoneIntention}
                                  onChange={(e) => setMilestoneIntention(e.target.value)}
                                  placeholder="اكتب نيتك..."
                                  className="h-8 text-xs bg-white/5 border-white/15 text-white placeholder:text-white/25"
                                  dir="rtl"
                                />
                              </div>

                              {/* Simple Rating Slider */}
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-white/60">التقييم (من ٠ إلى ١٠)</span>
                                  <span className="xs font-semibold text-white">{milestoneIntentionAchievement.toFixed(1)}</span>
                                </div>
                                <Slider
                                  value={[milestoneIntentionAchievement]}
                                  onValueChange={([v]) => setMilestoneIntentionAchievement(v)}
                                  min={0}
                                  max={10}
                                  step={0.1}
                                  className="w-full"
                                  rangeClassName="bg-white"
                                />
                              </div>
                            </>
                          )}

                          {/* Notes Field */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-white/60">{milestoneType === 'fall' ? 'وصف السقوط' : 'ملحوظات'}</span>
                            <textarea
                              value={milestoneNotes}
                              onChange={(e) => setMilestoneNotes(e.target.value)}
                              placeholder={milestoneType === 'fall' ? 'وصف السقوط والأسباب...' : 'اكتب أي ملاحظات...'}
                              className="h-16 text-xs bg-white/5 border-white/15 text-white placeholder:text-white/25 resize-none"
                              dir="rtl"
                            />
                          </div>
                        </>

                        <div className="flex gap-2">
                          <Button
                            onClick={insertMilestone}
                            className={`flex-1 h-9 text-xs ${
                              milestoneType === 'fall'
                                ? 'bg-red-600/30 hover:bg-red-600/40 border border-red-500/30 text-red-200'
                                : 'bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/30 text-amber-200'
                            }`}
                          >
                            {isEditingMilestone ? 'حفظ التعديل' : milestoneType === 'fall' ? 'حفظ السقوط' : 'حفظ الجماع'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setShowMilestoneDialog(false);
                              setIsEditingMilestone(false);
                              setEditingMilestoneId(null);
                              setEditingMilestoneCreatedAt(null);
                            }}
<<<<<<< HEAD
=======
                            className="h-9 text-xs text-white/50 hover:text-white"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fall Event Dialog */}
                  {showFallDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowFallDialog(false); setEditingFallId(null); }}>
                      <div className="bg-[#1a1a2e] border border-red-500/30 rounded-2xl p-4 w-[95vw] max-w-[400px] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="text-red-500 text-lg">📉</div>
                          <h3 className="font-medium text-white">{editingFallId ? 'تعديل سقوط' : 'تسجيل سقوط'}</h3>
                        </div>
                        
                        <textarea
                          value={fallDescription}
                          onChange={(e) => setFallDescription(e.target.value)}
                          placeholder="وصف السقوط والأسباب..."
                          className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-red-500/50"
                        />

                        <div className="flex gap-2">
                          <Button
                            onClick={insertFall}
                            className="flex-1 h-9 text-xs bg-red-600/30 hover:bg-red-600/40 border border-red-500/30 text-red-200"
                          >
                            {editingFallId ? 'حفظ التعديل' : 'حفظ السقوط'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => { setShowFallDialog(false); setEditingFallId(null); }}
>>>>>>> c072901c79bd49c158f8f85c2761c53a85b23da7
                            className="h-9 text-xs text-white/50 hover:text-white"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}


                  {messages.some(m => m.status === 'error' || m.status === 'pending') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={syncPendingMessages}
                      disabled={isSyncing}
                      className="h-7 px-2 text-[10px] text-[#626FC4] hover:text-[#8A94D8] hover:bg-[#626FC4]/10 gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      مزامنة
                    </Button>
                  )}

                </div>

                <DialogDescription className="sr-only">
                  نافذة محادثة خاصة لتسجيل رسائل بين "أنا" و"الأنيما".
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
                      <span className="text-4xl mb-3">💬</span>
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
                <div className="p-2 pt-1 pb-3 border-t border-white/5 bg-black/30 flex-shrink-0">

                    <div className="flex items-center justify-center gap-2 mb-2">

                      {/* زر التبديل التلقائي - زجاجي + ضغط مطول يفتح صفحة الأنيما */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (toggleLongPressFiredRef.current) {
                            toggleLongPressFiredRef.current = false;
                            return;
                          }
                          setIsAutoSwitch(!isAutoSwitch);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggleLongPressFiredRef.current = false;
                          toggleLongPressRef.current = setTimeout(() => {
                            toggleLongPressFiredRef.current = true;
                            navigate('/anima');
                          }, 1500);
                        }}
                        onMouseUp={() => {
                          if (toggleLongPressRef.current) clearTimeout(toggleLongPressRef.current);
                        }}
                        onMouseLeave={() => {
                          if (toggleLongPressRef.current) clearTimeout(toggleLongPressRef.current);
                        }}
                        onTouchStart={() => {
                          toggleLongPressFiredRef.current = false;
                          toggleLongPressRef.current = setTimeout(() => {
                            toggleLongPressFiredRef.current = true;
                            navigate('/anima');
                          }, 1500);
                        }}
                        onTouchEnd={() => {
                          if (toggleLongPressRef.current) clearTimeout(toggleLongPressRef.current);
                        }}
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
                            ? `left-0.5 ${animaColors.toggleActiveBg}`
                            : 'left-[calc(50%+2px)] bg-[#626FC4]/40 border border-[#626FC4]/40 shadow-[inset_0_1px_10px_rgba(98,111,196,0.3),0_0_15px_rgba(98,111,196,0.2)]'
                            }`}
                        />

                        {/* زر الوضع الحالي (أمومتي/أنوثتي) */}
                        <Popover open={showCapabilitiesMenu} onOpenChange={setShowCapabilitiesMenu}>
                          <PopoverTrigger asChild>
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
                              الأنيما
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-64 p-3 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl max-h-[60vh] overflow-hidden flex flex-col"
                            side="top"
                            align="center"
                          >
                            <div className="flex flex-col gap-2 h-full">
                              <p className="text-[11px] text-white/50 px-1 pb-2 border-b border-white/10 font-medium">
                                إمكانات الأنيما
                              </p>
                              
                              {/* Capabilities List */}
                              <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                                {loadingCapabilities ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                                  </div>
                                ) : capabilities.length === 0 ? (
                                  <p className="text-[10px] text-white/30 text-center py-4">
                                    لا توجد إمكانات بعد
                                  </p>
                                ) : (
                                  capabilities.map((cap, index) => (
                                    <div 
                                      key={cap.id}
                                      className="flex items-center gap-1 p-2 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <button
                                          onClick={() => handleMoveCapability(cap.id, 'up')}
                                          disabled={index === 0}
                                          className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                        >
                                          <GripVertical className="h-2.5 w-2.5 rotate-90" />
                                        </button>
                                        <button
                                          onClick={() => handleMoveCapability(cap.id, 'down')}
                                          disabled={index === capabilities.length - 1}
                                          className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                        >
                                          <GripVertical className="h-2.5 w-2.5 -rotate-90" />
                                        </button>
                                      </div>
                                      <span className="flex-1 text-xs text-white/80 pr-1">
                                        {cap.capability_text}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteCapability(cap.id)}
                                        className="p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add New Capability */}
                              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                <Input
                                  value={newCapabilityText}
                                  onChange={(e) => setNewCapabilityText(e.target.value)}
                                  placeholder="إضافة إمكانية..."
                                  className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCapability();
                                    }
                                  }}
                                />
                                <button
                                  onClick={handleAddCapability}
                                  disabled={!newCapabilityText.trim()}
                                  className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${animaColors.capabilitiesBtn}`}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>

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

                      {/* زر الوصول المباشر لصفحة الأنيما بالضغط المطول */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (animaNavFiredRef.current) {
                            animaNavFiredRef.current = false;
                            return;
                          }
                          toast('طوّل الضغطة للانتقال لصفحة الأنيما 💖');
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          animaNavFiredRef.current = false;
                          animaNavLongPressRef.current = setTimeout(() => {
                            animaNavFiredRef.current = true;
                            setIsTransitioningToAnima(true);
                            setTimeout(() => {
                              navigate('/anima');
                            }, 1100);
                          }, 600);
                        }}
                        onMouseUp={() => { if (animaNavLongPressRef.current) clearTimeout(animaNavLongPressRef.current); }}
                        onMouseLeave={() => { if (animaNavLongPressRef.current) clearTimeout(animaNavLongPressRef.current); }}
                        onTouchStart={() => {
                          animaNavFiredRef.current = false;
                          animaNavLongPressRef.current = setTimeout(() => {
                            animaNavFiredRef.current = true;
                            setIsTransitioningToAnima(true);
                            setTimeout(() => {
                              navigate('/anima');
                            }, 1100);
                          }, 600);
                        }}
                        onTouchEnd={() => { if (animaNavLongPressRef.current) clearTimeout(animaNavLongPressRef.current); }}
                        className="group relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-500 text-pink-300/40 hover:text-pink-300 bg-transparent active:scale-95"
                        title="طوّل الضغطة للانتقال لصفحة الأنيما"
                      >
                        <Heart className="h-3.5 w-3.5 fill-pink-300/20" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Textarea
                        ref={inputRef}
                        placeholder={currentSender === 'me' ? 'اكتب كـ "أنا"...' : isNurturing ? 'اكتب كـ "الراعية الحنون"...' : 'اكتب كـ "الأنيما"...'}
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
                            ? 'focus:border-[#626FC4]/50 focus:ring-1 focus:ring-[#626FC4]/20 focus:shadow-[inset_0_2px_12px_rgba(98,111,196,0.15)]'
                            : animaColors.inputFocus
                          }`}
                        rows={1}
                      />
                      <Button
                        onClick={handleSendButtonClick}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          sendLongPressFiredRef.current = false;
                          sendLongPressRef.current = setTimeout(() => {
                            sendLongPressFiredRef.current = true;
                            insertSpacer();
                            sendLongPressRef.current = null;
                          }, 600);
                        }}
                        onMouseUp={() => {
                          if (sendLongPressRef.current) {
                            clearTimeout(sendLongPressRef.current);
                            sendLongPressRef.current = null;
                          }
                        }}
                        onMouseLeave={() => {
                          if (sendLongPressRef.current) {
                            clearTimeout(sendLongPressRef.current);
                            sendLongPressRef.current = null;
                          }
                        }}
                        onTouchStart={() => {
                          sendLongPressFiredRef.current = false;
                          sendLongPressRef.current = setTimeout(() => {
                            sendLongPressFiredRef.current = true;
                            insertSpacer();
                            sendLongPressRef.current = null;
                          }, 600);
                        }}
                        onTouchEnd={() => {
                          if (sendLongPressRef.current) {
                            clearTimeout(sendLongPressRef.current);
                            sendLongPressRef.current = null;
                          }
                        }}
                        className={`w-full rounded-xl h-12 backdrop-blur-md transition-all duration-1000 font-semibold text-base ${inputValue.trim()
                          ? currentSender === 'me'
                            ? 'bg-[#626FC4]/30 hover:bg-[#626FC4]/40 border border-[#626FC4]/30 shadow-[inset_0_1px_10px_rgba(98,111,196,0.2)] text-white'
                            : animaColors.sendBtn
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
              </div>
            </>
          )}

          {/* Anima Page Navigation Transition Overlay */}
          {isTransitioningToAnima && (
            <div className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500" />
              <div className="relative flex items-center justify-center w-[120px] h-[120px] anima-transition-circle" />
              <Heart className="absolute z-10 w-24 h-24 text-pink-200 fill-pink-400/60 animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
