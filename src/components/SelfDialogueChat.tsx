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
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, ReferenceLine } from 'recharts';

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

            {SPEAKER_META[getSpeaker(msg)].name} • {formatTime(msg.created_at)}

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

// 'self'/'sovereign' = sovereign-self | 'anima'/'nurturing' = anima persona | 'nafs' = self-soul

type ChatMode = 'self' | 'anima' | 'nurturing' | 'nafs' | 'sovereign';



// Three speakers in dialogue, ordered: anima, nafs, sovereign

export type Speaker = 'anima' | 'nafs' | 'sovereign';



export const getSpeaker = (msg: { sender?: string; chat_mode?: string | null }): Speaker => {

  if (msg.chat_mode === 'nafs') return 'nafs';

  if (msg.chat_mode === 'sovereign' || msg.sender === 'me') return 'sovereign';

  return 'anima';

};



// Visual metadata for each speaker. Anima = pink (current), Sovereign = indigo (current "أنا"),

// Nafs = violet (blend of the two).

export const SPEAKER_META: Record<Speaker, {

  name: string;

  bubbleClass: string;

  labelClass: string;

  iconClass: string;

  Icon: React.ComponentType<{ className?: string }>;

}> = {

  anima: {

    name: 'الأنيما',

    bubbleClass: 'bg-pink-500/20 backdrop-blur-md text-pink-50 border border-pink-400/30 shadow-[inset_0_1px_12px_rgba(236,72,153,0.2)]',

    labelClass: 'text-pink-400/40',

    iconClass: 'text-pink-400/60',

    Icon: Heart,

  },

  nafs: {

    name: 'النفس',

    bubbleClass: 'bg-[#9569C0]/20 backdrop-blur-md text-[#E8D8F0] border border-[#9569C0]/30 shadow-[inset_0_1px_12px_rgba(149,105,192,0.2)]',

    labelClass: 'text-[#9569C0]/50',

    iconClass: 'text-[#B894D9]/70',

    Icon: Sparkles,

  },

  sovereign: {

    name: 'الذات السيادية',

    bubbleClass: 'bg-[#626FC4]/20 backdrop-blur-md text-[#C8CCEC] border border-[#626FC4]/30 shadow-[inset_0_1px_12px_rgba(98,111,196,0.2)]',

    labelClass: 'text-[#626FC4]/50',

    iconClass: 'text-[#8A95D8]/70',

    Icon: User,

  },

};



const SPEAKER_ORDER: Speaker[] = ['anima', 'nafs', 'sovereign'];



interface AnimaCapability {

  id: string;

  capability_text: string;

  order_index: number;

}



// Global sequence counter to ensure message ordering even within same millisecond

let globalMessageSeq = 0;



interface SelfDialogueChatProps {

  onLongPress?: () => void;

}



export function SelfDialogueChat({ onLongPress }: SelfDialogueChatProps) {

  const { user, signOut } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<DialogueMessage[]>([]);

  const [inputValue, setInputValue] = useState('');

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

  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>('anima');

  const currentSender: 'me' | 'myself' = currentSpeaker === 'sovereign' ? 'me' : 'myself';

  const setCurrentSender = (s: 'me' | 'myself') => setCurrentSpeaker(s === 'me' ? 'sovereign' : 'anima');

  const [isAutoSwitch, setIsAutoSwitch] = useState(false);

  const [milestoneIntention, setMilestoneIntention] = useState('');

  const [milestoneIntentionAchievement, setMilestoneIntentionAchievement] = useState(9);

  const [milestonePleasure, setMilestonePleasure] = useState(9);

  const [milestoneSaturation, setMilestoneSaturation] = useState(9);

  const [milestoneComfort, setMilestoneComfort] = useState(9);

  const [milestoneAfterglow, setMilestoneAfterglow] = useState(false);

  const [milestoneSacred, setMilestoneSacred] = useState(false);

  const [milestoneDuration, setMilestoneDuration] = useState<'long' | 'medium' | 'short'>('medium');

  const [milestoneOutput, setMilestoneOutput] = useState<'full' | 'simple' | 'preserved'>('full');

  const [showMilestoneTable, setShowMilestoneTable] = useState(false);
  const [showUnionSelector, setShowUnionSelector] = useState(false);

  const [isEditingMilestone, setIsEditingMilestone] = useState(false);

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const [editingMilestoneCreatedAt, setEditingMilestoneCreatedAt] = useState<string | null>(null);

  const [milestoneDate, setMilestoneDate] = useState<string>('');

  const [showFallDialog, setShowFallDialog] = useState(false);

  const [fallDescription, setFallDescription] = useState('');

  const [editingFallId, setEditingFallId] = useState<string | null>(null);

  const [expandedMilestoneNotes, setExpandedMilestoneNotes] = useState<Set<string>>(new Set());

  const [realityNotes, setRealityNotes] = useState('');

  const [dreamNotes, setDreamNotes] = useState('');

  const [realityDate, setRealityDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [dreamDate, setDreamDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [realityTime, setRealityTime] = useState('');

  const [dreamTime, setDreamTime] = useState('');

  const [showRealityDialog, setShowRealityDialog] = useState(false);

  const [showDreamDialog, setShowDreamDialog] = useState(false);



  const scrollRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pinInputRef = useRef<HTMLInputElement>(null);

  const modeButtonLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyButtonLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyButtonLongPressFiredRef = useRef(false);

  const sendLongPressFiredRef = useRef(false);

  const toggleLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleLongPressFiredRef = useRef(false);
  const unionLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsExportLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsExportLongPressFiredRef = useRef(false);
  const unionLongPressFiredRef = useRef(false);

  

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

    return new Date(dateString).toLocaleTimeString('en-US', {

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



      if (msg.message === '__SELFHUG__') {

        return `[${time}] 🦋 حضن ذاتي`;

      }



      if (msg.message === '__REALITY__' || msg.message.startsWith('__REALITY__|')) {

        const parts = msg.message.split('|');

        const eventDate = parts.length >= 3 ? parts[1] : '';

        const eventTime = parts.length >= 4 ? parts[2] : '';

        const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));

        // Format event date for display
        const formattedEventDate = eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

        let text = `[${time}] 🌍 حدث في الواقع`;

        if (formattedEventDate) text += ` (${formattedEventDate}${eventTime ? ` ${eventTime}` : ''})`;

        if (notes) text += `: ${notes}`;

        return text;

      }



      if (msg.message === '__DREAM__' || msg.message.startsWith('__DREAM__|')) {

        const parts = msg.message.split('|');

        const eventDate = parts.length >= 3 ? parts[1] : '';

        const eventTime = parts.length >= 4 ? parts[2] : '';

        const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));

        let text = `[${time}] 🌙 حلم`;

        if (eventDate) text += ` (${eventDate}${eventTime ? ` ${eventTime}` : ''})`;

        if (notes) text += `: ${notes}`;

        return text;

      }



      if (msg.message.startsWith('__FALL__')) {

        const content = msg.message.replace('__FALL__|', '');

        const parts = content.split('|');

        const description = parts[1] || '';

        return `[${time}] 📉 سقوط: ${description}`;

      }

      

      if (msg.message.startsWith('__MILESTONE__')) {

        const content = msg.message.replace('__MILESTONE__', '');

        const parts = content.split('|');

        const title = parts[0] || '';

        const rating = parts[1] || '';

        const isSacredFmt = parts.length > 8;

        const notes = isSacredFmt ? '' : (parts[2] || '');

        const intention = isSacredFmt ? (parts[9] || '') : (parts[4] || '');

        const duration = !isSacredFmt && parts[5] ? parts[5] : '';

        const output = !isSacredFmt && parts[6] ? parts[6] : '';

        const durationLabel = duration === 'long' ? 'طويل' : duration === 'medium' ? 'متوسط' : duration === 'short' ? 'قصير' : '';

        const outputLabel = output === 'full' ? 'كامل' : output === 'simple' ? 'بسيط' : output === 'preserved' ? 'محفوظ' : '';

        let line = `[${time}] ⭐ ${title} - تقييم: ${rating}`;

        if (intention) line += ` | نية: ${intention}`;

        if (durationLabel) line += ` | المدة: ${durationLabel}`;

        if (outputLabel) line += ` | القذف: ${outputLabel}`;

        if (notes) line += ` | ملاحظات: ${notes}`;

        return line;

      }

      

      const senderName = SPEAKER_META[getSpeaker(msg)].name;

      return `[${time}] ${senderName}: ${msg.message}`;

    }).join('\n\n');

    

    const header = `محادثة اليوم (${new Date().toLocaleDateString('en-US')})\n` + '='.repeat(30) + '\n\n';

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

      msg.message !== '__SELFHUG__' &&

      !msg.message.startsWith('__REALITY__') &&

      !msg.message.startsWith('__DREAM__')

    );

    

    const conversation = todayMsgs.map(msg => {

      const time = formatTime(msg.created_at);

      const senderName = SPEAKER_META[getSpeaker(msg)].name;

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
    copyButtonLongPressFiredRef.current = false;
    copyButtonLongPressRef.current = setTimeout(() => {
      copyButtonLongPressFiredRef.current = true;
      copyTodayMessagesOnly();
    }, 600);
  };

  const handleCopyButtonMouseUp = () => {
    if (copyButtonLongPressRef.current) {
      clearTimeout(copyButtonLongPressRef.current);
      copyButtonLongPressRef.current = null;
      if (!copyButtonLongPressFiredRef.current) {
        copyTodayConversation();
      }
    }
  };



  const syncPendingMessages = useCallback(async () => {

    if (!user || !PENDING_MESSAGES_KEY || isSyncing) return;



    // Verify session is still active

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {

      console.warn('No active session for sync');

      return;

    }



    const stored = localStorage.getItem(PENDING_MESSAGES_KEY);

    if (!stored) return;



    let pending: DialogueMessage[] = JSON.parse(stored);

    if (pending.length === 0) return;



    setIsSyncing(true);

    const successfullySynced: string[] = [];

    const failedMessages: string[] = [];



    for (const msg of pending) {

      try {

        console.log('Syncing pending message:', msg.id, { chat_mode: msg.chat_mode });

        

        const { error, data } = await supabase

          .from('self_dialogue_messages')

          .insert({

            user_id: user.id,

            sender: msg.sender,

            message: msg.message,

            chat_mode: msg.chat_mode || 'self'

          })

          .select();



        if (error) {

          console.error('Sync error for message:', msg.id, {

            code: error.code,

            message: error.message,

            details: error.details

          });

          failedMessages.push(msg.id);

        } else {

          console.log('Message synced successfully:', msg.id, data);

          successfullySynced.push(msg.id);

          // Update message status in main list if it exists

          setMessages(prev => prev.map(m =>

            m.id === msg.id ? { ...m, status: 'synced' } : m

          ));

        }

      } catch (err) {

        console.error('Failed to sync message:', msg.id, err);

        failedMessages.push(msg.id);

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

    if (failedMessages.length > 0) {

      console.warn(`Failed to sync ${failedMessages.length} messages`);

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

    console.log('=== Loading capabilities ===');
    console.log('Chat mode:', modeToLoad);
    setLoadingCapabilities(true);

    try {

      const startTime = Date.now();
      
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



    console.log('=== Adding capability ===');
    console.log('Chat mode:', currentChatMode);
    console.log('Capability text:', newCapabilityText.trim());
    console.log('Order index:', maxOrder);

    try {

      const startTime = Date.now();
      
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

    console.log('=== Deleting capability ===');
    console.log('Capability ID:', id);

    try {

      const startTime = Date.now();
      
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


    console.log('=== Reordering capability ===');
    console.log('Capability ID:', id);
    console.log('Direction:', direction);


    const newCapabilities = [...capabilities];

    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    

    // Swap order_index values

    const tempOrder = newCapabilities[index].order_index;

    newCapabilities[index].order_index = newCapabilities[swapIndex].order_index;

    newCapabilities[swapIndex].order_index = tempOrder;

    
    console.log('New order index for item:', newCapabilities[index].order_index);
    console.log('New order index for swap item:', newCapabilities[swapIndex].order_index);
    

    // Swap positions in array

    [newCapabilities[index], newCapabilities[swapIndex]] = [newCapabilities[swapIndex], newCapabilities[index]];

    

    setCapabilities(newCapabilities);



    // Update in database

    try {

      const startTime = Date.now();
      
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


      const duration = Date.now() - startTime;
      console.log(`Capabilities reordered in ${duration}ms`);
      console.log('Reorder completed successfully');
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



  const longPressFiredRef = useRef(false);

  const handleMouseDown = (id: string) => {

    longPressFiredRef.current = false;

    longPressTimerRef.current = setTimeout(() => {

      longPressFiredRef.current = true;

      if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

      handleDeleteMessage(id);

      toast.success('تم حذف الرسالة');

    }, 600);

  };



  const handleMouseUp = () => {

    if (longPressTimerRef.current) {

      clearTimeout(longPressTimerRef.current);

      longPressTimerRef.current = null;

    }

  };



  const handleMessageClick = (message: string) => {

    if (longPressFiredRef.current) {

      longPressFiredRef.current = false;

      return;

    }

    handleCopyMessage(message);

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

                </div>

              </div>

            );

          }



          // Render reality label

          if (msg.message === '__REALITY__' || msg.message.startsWith('__REALITY__|')) {

            const msgDate = new Date(msg.created_at);

            const msgTime = msgDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            const parts = msg.message.split('|');

            const eventDate = parts.length >= 3 ? parts[1] : '';

            const eventTime = parts.length >= 4 ? parts[2] : '';

            const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));

            const formattedEventDate = eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

            const formattedEventTime = eventTime || '';

            return (

              <div key={msg.id} className="flex justify-center py-3">

                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 w-full max-w-md">

                  <div className="flex items-center justify-between mb-1">

                    <div className="flex items-center gap-2">

                      <span className="text-green-400 text-sm">🌍</span>

                      <span className="text-xs text-green-300/70">{msgTime}</span>

                    </div>

                  </div>

                  <p className="text-xs text-green-200">حدث في الواقع</p>

                  {formattedEventDate && <p className="text-[10px] text-green-200/70 mt-1">التاريخ: {formattedEventDate}{formattedEventTime ? ` ${formattedEventTime}` : ''}</p>}

                  {notes && <p className="text-[10px] text-green-200/70 mt-1">{notes}</p>}

                </div>

              </div>

            );

          }



          // Render dream label

          if (msg.message === '__DREAM__' || msg.message.startsWith('__DREAM__|')) {

            const msgDate = new Date(msg.created_at);

            const msgTime = msgDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            const parts = msg.message.split('|');

            const eventDate = parts.length >= 3 ? parts[1] : '';

            const eventTime = parts.length >= 4 ? parts[2] : '';

            const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));

            const formattedEventDate = eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

            const formattedEventTime = eventTime || '';

            return (

              <div key={msg.id} className="flex justify-center py-3">

                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-2 w-full max-w-md">

                  <div className="flex items-center justify-between mb-1">

                    <div className="flex items-center gap-2">

                      <span className="text-purple-400 text-sm">🌙</span>

                      <span className="text-xs text-purple-300/70">{msgTime}</span>

                    </div>

                  </div>

                  <p className="text-xs text-purple-200">حلم</p>

                  {formattedEventDate && <p className="text-[10px] text-purple-200/70 mt-1">التاريخ: {formattedEventDate}{formattedEventTime ? ` ${formattedEventTime}` : ''}</p>}

                  {notes && <p className="text-[10px] text-purple-200/70 mt-1">{notes}</p>}

                </div>

              </div>

            );

          }



          // Render fall event

          if (msg.message.startsWith('__FALL__')) {

            const fallContent = msg.message.replace('__FALL__|', '');

            const fallParts = fallContent.split('|');

            const fallDescription = fallParts[1] || '';

            const fallDate = new Date(msg.created_at);

            const fallTime = fallDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            return (

              <div key={msg.id} className="flex justify-center py-3">

                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 max-w-[80%]">

                  <div className="flex items-center gap-2 mb-1">

                    <span className="text-red-400 text-sm">📉</span>

                    <span className="text-xs text-red-300/70">{fallTime}</span>

                  </div>

                  <p className="text-xs text-red-200 leading-relaxed">{fallDescription}</p>

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

            let duration = '';

            let output = '';

            

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

              // Non-sacred format: title|rating|notes|type|intention|duration|output

              notes = parts.length > 2 ? parts[2] : '';

              type = parts.length > 3 ? parts[3] : 'normal';

              intention = parts.length > 4 ? parts[4] : '';

              duration = parts.length > 5 ? parts[5] : '';

              output = parts.length > 6 ? parts[6] : '';

            }

            // Get base color by type, then interpolate with rating

            let baseColor = { r: 100, g: 150, b: 220 }; // normal (blue)

            if (type === 'sacred') baseColor = { r: 220, g: 80, b: 40 }; // red-orange

            else if (type === 'heart') baseColor = { r: 220, g: 100, b: 150 }; // pink

            else if (type === 'imaginary') baseColor = { r: 180, g: 100, b: 200 }; // purple

            else if (type === 'nursing') baseColor = { r: 180, g: 140, b: 80 }; // tan/wheat

            else if (type === 'fall') baseColor = { r: 127, g: 29, b: 29 }; // dark red

            

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

                case 'fall': return <span className="text-lg leading-none flex-shrink-0">🛑</span>;

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

                      <>

                        {duration && <span>{duration === 'long' ? 'طويل' : duration === 'medium' ? 'متوسط' : 'قصير'}</span>}

                        {output && <span>{output === 'full' ? 'كامل' : output === 'simple' ? 'بسيط' : 'محفوظ'}</span>}

                      </>

                    )}

                  </div>

                  {!isSacredFormat && notes && (() => {

                    const isExpanded = expandedMilestoneNotes.has(msg.id);

                    const toggle = (e: React.MouseEvent) => {

                      e.stopPropagation();

                      setExpandedMilestoneNotes(prev => {

                        const next = new Set(prev);

                        if (next.has(msg.id)) next.delete(msg.id);

                        else next.add(msg.id);

                        return next;

                      });

                    };

                    return (

                      <div className="relative text-[8px] text-blue-300/80 mt-0.5 max-w-[240px]" dir="rtl">

                        <span

                          className={isExpanded ? '' : 'block overflow-hidden'}

                          style={isExpanded ? undefined : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}

                        >

                          ملاحظات: {notes}

                        </span>

                        <button onClick={toggle} className="text-[8px] text-blue-400/70 hover:text-blue-300 mt-0.5">

                          {isExpanded ? 'عرض أقل' : 'عرض المزيد'}

                        </button>

                      </div>

                    );

                  })()}

                  {intention && (

                    <div className="relative text-[9px] text-white/40 mt-0.5 text-center max-w-[200px]" dir="rtl" style={{ unicodeBidi: 'plaintext' }}>«{intention}»</div>

                  )}

                </div>

              </div>

            );

          }



          const speaker = getSpeaker(msg);

          const meta = SPEAKER_META[speaker];

          const SpeakerIcon = meta.Icon;

          return (

            <React.Fragment key={msg.id}>

              {showAutoSpacer && <div className="h-10" />}

              <div className={`flex justify-end ${shouldAnimate ? 'animate-message-pop' : ''}`}>

                <div className="flex items-start gap-1.5 max-w-[85%] flex-row-reverse">

                  {/* Speaker avatar/icon next to message */}

                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${meta.bubbleClass}`}>

                    <SpeakerIcon className={`h-3 w-3 ${meta.iconClass}`} />

                  </div>



                  <div

                    className="cursor-pointer select-none active:scale-95 transition-transform"

                    onClick={() => handleMessageClick(msg.message)}

                    onMouseDown={() => handleMouseDown(msg.id)}

                    onMouseUp={handleMouseUp}

                    onMouseLeave={handleMouseUp}

                    onTouchStart={() => handleMouseDown(msg.id)}

                    onTouchEnd={handleMouseUp}

                  >

                    <div className={`inline-block p-2 rounded-2xl rounded-tr-sm break-words ${meta.bubbleClass}`}>

                      <p className="text-xs leading-tight whitespace-pre-wrap" style={{ unicodeBidi: 'plaintext' }}>{msg.message}</p>

                    </div>

                    <div className="flex items-center gap-0.5 mt-0.5 justify-end">

                      <SpeakerIcon className={`h-2 w-2 ${meta.labelClass}`} />

                      <span className={`text-[7px] ${meta.labelClass}`}>

                        {meta.name} • {formatTime(msg.created_at)}

                      </span>

                      {msg.status === 'pending' && (

                        <RefreshCw className="h-2 w-2 text-white/40 animate-spin ml-0.5" />

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

    console.log('=== loadMessages called ===');

    console.log('User ID:', user?.id);

    console.log('Mode:', mode);

    

    if (!user) return;

    setLoading(true);

    try {

      console.log('Querying database...');

      const { data, error } = await supabase

        .from('self_dialogue_messages')

        .select('*')

        .eq('user_id', user.id)

        .eq('is_archived', false)

        .in('chat_mode', ['self', 'anima', 'nurturing', 'nafs', 'sovereign'])

        .order('created_at', { ascending: false })

        .order('id', { ascending: false })

        .limit(100);



      console.log('Query result:', { error, data, count: data?.length });



      if (error) throw error;



      const remoteMessages = (data || []).reverse().map(msg => ({

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

            ['self', 'anima', 'nurturing', 'nafs', 'sovereign'].includes(m.chat_mode || 'self')

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



      // Sort by timestamp first (oldest first), then by localSeq, then by id

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

      // Display all loaded messages (already limited to 100 from DB)

      const displayMessages = allMessages;

      setAllMessages(allMessages);

      setMessages(displayMessages);



      console.log('=== Messages loaded ===');

      console.log('Total messages:', allMessages.length);

      console.log('Display messages:', displayMessages.length);

      console.log('Remote messages:', remoteMessages.length);

      console.log('Pending messages:', pendingMessages.length);

      

      if (displayMessages.length > 0) {

        console.log('First display message:', displayMessages[0]);

        console.log('First display message created_at:', displayMessages[0].created_at);

        console.log('First display message chat_mode:', displayMessages[0].chat_mode);

        console.log('Last display message:', displayMessages[displayMessages.length - 1]);

        console.log('Last display message created_at:', displayMessages[displayMessages.length - 1].created_at);

        console.log('Last display message chat_mode:', displayMessages[displayMessages.length - 1].chat_mode);

      }



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



  const insertRealityLabel = async () => {

    if (!user) return;

    const tempId = crypto.randomUUID();

    globalMessageSeq++;

    const messageContent = realityDate ? `__REALITY__|${realityDate}|${realityTime}|${realityNotes}` : `__REALITY__|${realityNotes}`;

    const realityMessage: DialogueMessage = {

      id: tempId,

      sender: 'me',

      message: messageContent,

      created_at: new Date().toISOString(),

      status: 'pending',

      localSeq: globalMessageSeq,

      chat_mode: 'self'

    };

    setMessages(prev => [...prev, realityMessage]);

    setAllMessages(prev => [...prev, realityMessage]);

    setRealityNotes('');

    setRealityDate('');

    setRealityTime('');

    try {

      await supabase.from('self_dialogue_messages').insert({

        user_id: user.id,

        sender: 'me',

        message: messageContent,

        created_at: realityMessage.created_at,

        session_title: sessionTitle || null,

        chat_mode: 'self'

      });

      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'synced' } : m));

    } catch {

      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));

    }

  };



  const insertDreamLabel = async () => {

    if (!user) return;

    const tempId = crypto.randomUUID();

    globalMessageSeq++;

    const messageContent = dreamDate ? `__DREAM__|${dreamDate}|${dreamTime}|${dreamNotes}` : `__DREAM__|${dreamNotes}`;

    const dreamMessage: DialogueMessage = {

      id: tempId,

      sender: 'me',

      message: messageContent,

      created_at: new Date().toISOString(),

      status: 'pending',

      localSeq: globalMessageSeq,

      chat_mode: 'self'

    };

    setMessages(prev => [...prev, dreamMessage]);

    setAllMessages(prev => [...prev, dreamMessage]);

    setDreamNotes('');

    setDreamDate('');

    setDreamTime('');

    try {

      await supabase.from('self_dialogue_messages').insert({

        user_id: user.id,

        sender: 'me',

        message: messageContent,

        created_at: dreamMessage.created_at,

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



  const openMilestoneDialog = (type: 'sacred' | 'heart' | 'imaginary' | 'normal' | 'nursing' | 'fall' = 'normal') => {

    setMilestoneType(type);

    setMilestoneIntention('');

    setMilestoneNotes('');

    setMilestoneIntentionAchievement(type === 'fall' ? 0 : 9);

    setMilestonePleasure(9);

    setMilestoneSaturation(9);

    setMilestoneComfort(9);

    setMilestoneAfterglow(false);

    setMilestoneSacred(type === 'sacred');

    setMilestoneDuration('medium');

    setMilestoneOutput('full');

    setIsEditingMilestone(false);

    setEditingMilestoneId(null);

    const now = new Date();

    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    setMilestoneDate(now.toISOString().slice(0, 16));

    setShowMilestoneDialog(true);

  };



  const openMilestoneEditDialog = (milestoneMessage: DialogueMessage) => {

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

    

    // Parse duration and output (parts[5] and parts[6] in non-sacred format)

    let duration: 'long' | 'medium' | 'short' = 'medium';

    let output: 'full' | 'simple' | 'preserved' = 'full';

    if (!isSacredFmt && parts.length > 5) {

      duration = (parts[5] as any) || 'medium';

      output = (parts[6] as any) || 'full';

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

    setMilestoneDuration(duration);

    setMilestoneOutput(output);

    setIsEditingMilestone(true);

    setEditingMilestoneId(milestoneMessage.id);

    setEditingMilestoneCreatedAt(milestoneMessage.created_at);

    const d = new Date(milestoneMessage.created_at);

    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());

    setMilestoneDate(d.toISOString().slice(0, 16));

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

      normal: 'جماع عادي',

      nursing: 'جماع امومي اضاعي',

      fall: 'سقوط'

    };

    

    const milestoneName = typeNames[milestoneType];

    let finalRating: number;

    let milestoneContent: string;

    

    // For all types, use simple decimal rating

    finalRating = milestoneIntentionAchievement;

    

    // Format: __MILESTONE__title|rating|notes|type|intention|duration|output

    milestoneContent = `__MILESTONE__${milestoneName}|${finalRating}|${milestoneNotes}|${milestoneType}|${milestoneIntention}|${milestoneDuration}|${milestoneOutput}`;

    

    // If editing, update existing milestone

    if (isEditingMilestone && editingMilestoneId) {

      try {

        console.log('Updating milestone:', { editingMilestoneId, userId: user?.id, content: milestoneContent });

        

        const newCreatedAt = milestoneDate ? new Date(milestoneDate).toISOString() : undefined;

        const updatePayload: any = { message: milestoneContent };

        if (newCreatedAt) updatePayload.created_at = newCreatedAt;

        const { data, error } = await supabase

          .from('self_dialogue_messages')

          .update(updatePayload)

          .eq('id', editingMilestoneId);



        if (error) {

          console.error('Supabase update error:', error);

          throw error;

        }



        console.log('Update successful:', data);



        // Update local state

        setMessages(prev => prev.map(m => m.id === editingMilestoneId ? { ...m, message: milestoneContent, created_at: newCreatedAt || m.created_at } : m));

        setAllMessages(prev => prev.map(m => m.id === editingMilestoneId ? { ...m, message: milestoneContent, created_at: newCreatedAt || m.created_at } : m));

        

        setShowMilestoneDialog(false);

        setIsEditingMilestone(false);

        setEditingMilestoneId(null);

        setEditingMilestoneCreatedAt(null);

        setMilestoneIntention('');

        setMilestoneNotes('');

        setMilestoneIntentionAchievement(9);

        setMilestonePleasure(9);

        setMilestoneSaturation(9);

        setMilestoneComfort(9);

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

      

      const createdAt = milestoneDate ? new Date(milestoneDate).toISOString() : new Date().toISOString();

      const milestoneMessage: DialogueMessage = {

        id: tempId,

        sender: 'me',

        message: milestoneContent,

        created_at: createdAt,

        status: 'pending',

        localSeq: globalMessageSeq,

        chat_mode: 'self'

      };

      setMessages(prev => [...prev, milestoneMessage]);

      setAllMessages(prev => [...prev, milestoneMessage]);

      setShowMilestoneDialog(false);

      setMilestoneIntention('');

      setMilestoneNotes('');

      setMilestoneIntentionAchievement(9);

      setMilestonePleasure(9);

      setMilestoneSaturation(9);

      setMilestoneComfort(9);

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

    return allMessages.filter(m => m.message.startsWith('__MILESTONE__') || m.message === '__KISS__' || m.message === '__TOUCH__' || m.message === '__SHOWER__' || m.message === '__SELFHUG__' || m.message.startsWith('__REALITY__') || m.message.startsWith('__DREAM__'));

  }, [allMessages]);



  const exportMilestonesCSV = () => {

    const rows = [['التاريخ', 'الوقت', 'النوع', 'التقييم', 'المدة', 'القذف', 'الملاحظات', 'النية']];

    [...milestoneMessages].reverse().forEach(m => {

      const date = new Date(m.created_at);

      const dateStr = date.toLocaleDateString('en-US');

      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      

      if (m.message === '__KISS__') {

        rows.push([dateStr, timeStr, 'قبلة حميمية', '-', '-', '-', '-', '-']);

        return;

      }

      

      if (m.message === '__TOUCH__') {

        rows.push([dateStr, timeStr, 'لمس حنون', '-', '-', '-', '-', '-']);

        return;

      }



      if (m.message === '__SHOWER__') {

        rows.push([dateStr, timeStr, 'دش دافئ حميمي', '-', '-', '-', '-', '-']);

        return;

      }



      if (m.message === '__SELFHUG__') {

        rows.push([dateStr, timeStr, 'حضن ذاتي', '-', '-', '-', '-', '-']);

        return;

      }



      if (m.message === '__REALITY__' || m.message.startsWith('__REALITY__|')) {

        const parts = m.message.split('|');

        const eventDate = parts.length > 2 ? parts[1] : '';

        const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');

        // Format event date for display
        const formattedEventDate = eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

        const displayNotes = formattedEventDate && notes ? `${formattedEventDate} - ${notes}` : (formattedEventDate || notes || '-');

        rows.push([dateStr, timeStr, 'حدث في الواقع', '-', '-', '-', displayNotes, '-']);

        return;

      }



      if (m.message === '__DREAM__' || m.message.startsWith('__DREAM__|')) {

        const parts = m.message.split('|');

        const eventDate = parts.length > 2 ? parts[1] : '';

        const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');

        // Format event date for display
        const formattedEventDate = eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

        const displayNotes = formattedEventDate && notes ? `${formattedEventDate} - ${notes}` : (formattedEventDate || notes || '-');

        rows.push([dateStr, timeStr, 'حلم', '-', '-', '-', displayNotes, '-']);

        return;

      }



      if (m.message.startsWith('__FALL__')) {

        const fallContent = m.message.replace('__FALL__|', '');

        const fallParts = fallContent.split('|');

        const description = fallParts[1] || '';

        rows.push([dateStr, timeStr, 'سقوط', '0', '-', '-', description, '-']);

        return;

      }

      

      const content = m.message.replace('__MILESTONE__', '');

      const parts = content.split('|');

      const isSacredFmt = parts.length > 8;

      const notes = isSacredFmt ? '' : (parts[2] || '');

      const intention = isSacredFmt ? (parts[9] || '') : (parts[4] || '');

      const duration = !isSacredFmt && parts[5] ? (parts[5] === 'long' ? 'طويل' : parts[5] === 'medium' ? 'متوسط' : 'قصير') : '-';

      const output = !isSacredFmt && parts[6] ? (parts[6] === 'full' ? 'كامل' : parts[6] === 'simple' ? 'بسيط' : 'محفوظ') : '-';

      rows.push([

        dateStr, timeStr,

        parts[0] || '',

        parts[1] || '',

        duration, output,

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



  const exportConversationCSV = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    // Show loading state
    const toastId = toast.loading('جاري تحميل المحادثة من قاعدة البيانات...');

    try {
      // Fetch ALL messages from DB with pagination (1000 per page) to bypass any row limits
      const PAGE_SIZE = 1000;
      const allDbMessages: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('self_dialogue_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }
        allDbMessages.push(...data);
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
        }
      }

      // Merge with local pending messages (if any) — these are unsynced and live only in localStorage
      let pendingMessages: any[] = [];
      if (PENDING_MESSAGES_KEY) {
        const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          pendingMessages = (parsed || []).filter((m: any) =>
            ['self', 'anima', 'nurturing', 'nafs', 'sovereign'].includes(m.chat_mode || 'self')
          );
        }
      }

      // Merge + dedupe by id, then sort chronologically
      const seenIds = new Set<string>();
      const merged: any[] = [];
      for (const m of allDbMessages) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          merged.push(m);
        }
      }
      for (const m of pendingMessages) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          merged.push(m);
        }
      }
      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // Build CSV with FULL coverage: regular messages, milestones, kisses, touches, showers, hugs, realities, dreams, falls
      const rows: string[][] = [['التاريخ', 'الوقت', 'المرسل', 'النوع', 'المحتوى']];

      const formatSpecial = (m: any): { type: string; content: string } | null => {
        const msg = m.message || '';
        if (msg === '__SPACER__') return null;
        if (msg === '__KISS__') return { type: '💋 بوس حميمي', content: 'جلسة بوس حميمي' };
        if (msg === '__TOUCH__') return { type: '🤲 لمس حنون', content: 'لمس حنون' };
        if (msg === '__SHOWER__') return { type: '🛀 دش دافئ', content: 'دش دافئ حميمي' };
        if (msg === '__SELFHUG__') return { type: '🦋 حضن ذاتي', content: 'حضن ذاتي' };
        if (msg === '__REALITY__' || msg.startsWith('__REALITY__|')) {
          const parts = msg.split('|');
          const eventDate = parts.length >= 4 ? parts[1] : (parts.length === 3 ? parts[1] : '');
          const eventTime = parts.length >= 4 ? parts[2] : '';
          const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));
          const dt = [eventDate, eventTime].filter(Boolean).join(' ');
          return { type: '🌍 حدث في الواقع', content: [dt, notes].filter(Boolean).join(' - ') || '-' };
        }
        if (msg === '__DREAM__' || msg.startsWith('__DREAM__|')) {
          const parts = msg.split('|');
          const eventDate = parts.length >= 4 ? parts[1] : (parts.length === 3 ? parts[1] : '');
          const eventTime = parts.length >= 4 ? parts[2] : '';
          const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));
          const dt = [eventDate, eventTime].filter(Boolean).join(' ');
          return { type: '🌙 حلم', content: [dt, notes].filter(Boolean).join(' - ') || '-' };
        }
        if (msg.startsWith('__FALL__')) {
          const stripped = msg.replace(/^__FALL__\|?/, '');
          const parts = stripped.split('|');
          const description = parts[parts.length - 1] || parts[0] || '';
          return { type: '📉 سقوط', content: description };
        }
        if (msg.startsWith('__MILESTONE__')) {
          const content = msg.replace('__MILESTONE__', '');
          const parts = content.split('|');
          const title = parts[0] || 'مايلستون';
          const rating = parts[1] || '';
          const isSacred = parts.length > 8;
          const notes = isSacred ? '' : (parts[2] || '');
          const intention = isSacred ? (parts[9] || '') : (parts[4] || '');
          const duration = !isSacred && parts[5] ? (parts[5] === 'long' ? 'طويل' : parts[5] === 'medium' ? 'متوسط' : 'قصير') : '';
          const output = !isSacred && parts[6] ? (parts[6] === 'full' ? 'كامل' : parts[6] === 'simple' ? 'بسيط' : 'محفوظ') : '';
          let line = `${title} - تقييم ${rating}/10`;
          if (intention) line += ` | نية: ${intention}`;
          if (duration) line += ` | المدة: ${duration}`;
          if (output) line += ` | القذف: ${output}`;
          if (notes) line += ` | ملاحظات: ${notes}`;
          return { type: '⭐ مايلستون', content: line };
        }
        return null;
      };

      for (const m of merged) {
        const date = new Date(m.created_at);
        const dateStr = date.toLocaleDateString('en-US');
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const special = formatSpecial(m);
        if (special) {
          const sender = m.sender === 'me' ? 'أنا' : (m.chat_mode === 'nafs' ? 'النفس' : 'الأنيما');
          rows.push([dateStr, timeStr, sender, special.type, special.content]);
          continue;
        }

        const speakerLabel = (() => {
          if (m.chat_mode === 'nafs') return 'النفس';
          if (m.chat_mode === 'anima' || m.chat_mode === 'nurturing') return 'الأنيما';
          if (m.chat_mode === 'sovereign' || m.sender === 'me') return 'الذات السيادية';
          if (m.sender === 'me') return 'الذات السيادية';
          if (m.sender === 'anima') return 'النفس';
          return m.sender || 'الأنيما';
        })();

        rows.push([dateStr, timeStr, speakerLabel, 'رسالة', m.message || '']);
      }

      // Build CSV safely (quote every cell, escape internal quotes) + UTF-8 BOM for Arabic
      const escapeCsv = (v: string) => `"${(v ?? '').toString().replace(/"/g, '""')}"`;
      const csv = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success(`تم تصدير ${merged.length} رسالة من قاعدة البيانات`);
    } catch (err) {
      console.error('Export conversation failed:', err);
      toast.dismiss(toastId);
      toast.error('فشل تصدير المحادثة');
    }
  };

  // Combined events exporter: messages + milestones unified as a single chronological events stream.
  // - mode "recent": last 100 events only (single DB query, fast)
  // - mode "all": every event ever stored (pagination, slower)
  const exportCombinedEventsCSV = async (mode: "recent" | "all") => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    const isAll = mode === "all";
    const toastId = toast.loading(isAll ? 'جاري تحميل كل الأحداث من قاعدة البيانات...' : 'جاري تحميل آخر 100 حدث...');

    try {
      let allDbMessages: any[] = [];

      if (isAll) {
        // Paginate to fetch everything (1000 per page)
        const PAGE_SIZE = 1000;
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('self_dialogue_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw error;
          if (!data || data.length === 0) { hasMore = false; break; }
          allDbMessages.push(...data);
          if (data.length < PAGE_SIZE) { hasMore = false; } else { from += PAGE_SIZE; }
        }
      } else {
        // Just last 100 (most recent) — sort desc + limit
        const { data, error } = await supabase
          .from('self_dialogue_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        // Sort ascending for chronological CSV output
        allDbMessages = (data || []).slice().reverse();
      }

      // Merge with local pending messages (so even unsynced ones get exported)
      let pendingMessages: any[] = [];
      if (PENDING_MESSAGES_KEY) {
        const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          pendingMessages = (parsed || []).filter((m: any) =>
            ['self', 'anima', 'nurturing', 'nafs', 'sovereign'].includes(m.chat_mode || 'self')
          );
        }
      }
      const seenIds = new Set<string>();
      const merged: any[] = [];
      for (const m of allDbMessages) {
        if (!seenIds.has(m.id)) { seenIds.add(m.id); merged.push(m); }
      }
      for (const m of pendingMessages) {
        if (!seenIds.has(m.id)) { seenIds.add(m.id); merged.push(m); }
      }
      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // Keep only "events" (everything except plain dialogue text and spacers).
      // i.e. regular messages + all special markers count as events, spacers don't.
      const isEvent = (m: any) => {
        const msg = m.message || '';
        if (msg === '__SPACER__') return false;
        return true; // every non-spacer is an "event" — dialogue, milestone, kiss, reality, etc.
      };
      const events = merged.filter(isEvent);

      // Final limit when "recent"
      const finalEvents = isAll ? events : events.slice(-100);

      // Build CSV: a single chronological stream of events
      const rows: string[][] = [['التاريخ', 'الوقت', 'المرسل', 'النوع', 'التفاصيل']];

      // Format a special marker (milestone / kiss / touch / shower / reality / dream / fall / selfhug)
      const formatSpecial = (m: any): { type: string; details: string } | null => {
        const msg = m.message || '';
        if (msg === '__KISS__') return { type: '💋 بوس حميمي', details: 'جلسة بوس حميمي' };
        if (msg === '__TOUCH__') return { type: '🤲 لمس حنون', details: 'لمس حنون' };
        if (msg === '__SHOWER__') return { type: '🛀 دش دافئ', details: 'دش دافئ حميمي' };
        if (msg === '__SELFHUG__') return { type: '🦋 حضن ذاتي', details: 'حضن ذاتي' };
        if (msg === '__REALITY__' || msg.startsWith('__REALITY__|')) {
          const parts = msg.split('|');
          const eventDate = parts.length >= 4 ? parts[1] : (parts.length === 3 ? parts[1] : '');
          const eventTime = parts.length >= 4 ? parts[2] : '';
          const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));
          const dt = [eventDate, eventTime].filter(Boolean).join(' ');
          return { type: '🌍 حدث في الواقع', details: [dt, notes].filter(Boolean).join(' - ') || '-' };
        }
        if (msg === '__DREAM__' || msg.startsWith('__DREAM__|')) {
          const parts = msg.split('|');
          const eventDate = parts.length >= 4 ? parts[1] : (parts.length === 3 ? parts[1] : '');
          const eventTime = parts.length >= 4 ? parts[2] : '';
          const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));
          const dt = [eventDate, eventTime].filter(Boolean).join(' ');
          return { type: '🌙 حلم', details: [dt, notes].filter(Boolean).join(' - ') || '-' };
        }
        if (msg.startsWith('__FALL__')) {
          const stripped = msg.replace(/^__FALL__\|?/, '');
          const parts = stripped.split('|');
          const description = parts[parts.length - 1] || parts[0] || '';
          return { type: '📉 سقوط', details: description };
        }
        if (msg.startsWith('__MILESTONE__')) {
          const content = msg.replace('__MILESTONE__', '');
          const parts = content.split('|');
          const title = parts[0] || 'مايلستون';
          const rating = parts[1] || '';
          const isSacred = parts.length > 8;
          const notes = isSacred ? '' : (parts[2] || '');
          const intention = isSacred ? (parts[9] || '') : (parts[4] || '');
          const duration = !isSacred && parts[5] ? (parts[5] === 'long' ? 'طويل' : parts[5] === 'medium' ? 'متوسط' : 'قصير') : '';
          const output = !isSacred && parts[6] ? (parts[6] === 'full' ? 'كامل' : parts[6] === 'simple' ? 'بسيط' : 'محفوظ') : '';
          let line = `${title} - تقييم ${rating}/10`;
          if (intention) line += ` | نية: ${intention}`;
          if (duration) line += ` | المدة: ${duration}`;
          if (output) line += ` | القذف: ${output}`;
          if (notes) line += ` | ملاحظات: ${notes}`;
          return { type: '⭐ جماع (مايلستون)', details: line };
        }
        return null;
      };

      for (const m of finalEvents) {
        const date = new Date(m.created_at);
        const dateStr = date.toLocaleDateString('en-US');
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const special = formatSpecial(m);
        if (special) {
          const sender = m.sender === 'me' ? 'أنا' : (m.chat_mode === 'nafs' ? 'النفس' : 'الأنيما');
          rows.push([dateStr, timeStr, sender, special.type, special.details]);
          continue;
        }

        // Regular dialogue message — still an event in this combined stream
        const speakerLabel = (() => {
          if (m.chat_mode === 'nafs') return 'النفس';
          if (m.chat_mode === 'anima' || m.chat_mode === 'nurturing') return 'الأنيما';
          if (m.chat_mode === 'sovereign' || m.sender === 'me') return 'الذات السيادية';
          if (m.sender === 'me') return 'الذات السيادية';
          if (m.sender === 'anima') return 'النفس';
          return m.sender || 'الأنيما';
        })();

        rows.push([dateStr, timeStr, speakerLabel, '💬 رسالة', m.message || '']);
      }

      const escapeCsv = (v: string) => `"${(v ?? '').toString().replace(/"/g, '""')}"`;
      const csv = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = isAll ? 'all' : 'last100';
      a.download = `events-${suffix}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success(isAll
        ? `تم تصدير ${finalEvents.length} حدث من قاعدة البيانات`
        : `تم تصدير آخر ${finalEvents.length} حدث`);
    } catch (err) {
      console.error('Export combined events failed:', err);
      toast.dismiss(toastId);
      toast.error('فشل تصدير الأحداث');
    }
  };

  // Long-press handlers for the combined-events button.
  // Mouse/touch start -> start a timer. If it fires -> long press = export ALL.
  // If the user releases before the timer fires -> short tap = export last 100.
  const handleEventsExportMouseDown = () => {
    eventsExportLongPressFiredRef.current = false;
    if (eventsExportLongPressRef.current) {
      clearTimeout(eventsExportLongPressRef.current);
    }
    eventsExportLongPressRef.current = setTimeout(() => {
      eventsExportLongPressFiredRef.current = true;
      exportCombinedEventsCSV("all");
    }, 600);
  };

  const handleEventsExportMouseUp = () => {
    if (eventsExportLongPressRef.current) {
      clearTimeout(eventsExportLongPressRef.current);
      eventsExportLongPressRef.current = null;
    }
    if (!eventsExportLongPressFiredRef.current) {
      exportCombinedEventsCSV("recent");
    }
  };

  const handleEventsExportMouseLeave = () => {
    if (eventsExportLongPressRef.current) {
      clearTimeout(eventsExportLongPressRef.current);
      eventsExportLongPressRef.current = null;
    }
  };



  const copyMilestoneData = (msg: DialogueMessage) => {

    const content = msg.message.replace('__MILESTONE__', '');

    const parts = content.split('|');

    const date = new Date(msg.created_at);

    const isSacredFmt = parts.length > 8;

    const notes = isSacredFmt ? '' : (parts[2] || '');

    const intention = isSacredFmt ? (parts[9] || '') : (parts[4] || '');

    const duration = !isSacredFmt && parts[5] ? parts[5] : '';

    const output = !isSacredFmt && parts[6] ? parts[6] : '';

    const durationLabel = duration === 'long' ? 'طويل' : duration === 'medium' ? 'متوسط' : duration === 'short' ? 'قصير' : '';

    const outputLabel = output === 'full' ? 'كامل' : output === 'simple' ? 'بسيط' : output === 'preserved' ? 'محفوظ' : '';

    const text = `التاريخ: ${date.toLocaleDateString('en-US')}

الوقت: ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}

النوع: ${parts[0] || ''}

التقييم: ${parts[1] || ''}${durationLabel ? `\nالمدة: ${durationLabel}` : ''}${outputLabel ? `\nالقذف: ${outputLabel}` : ''}

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

    console.log('=== handleSendMessage called ===');

    console.log('Input value:', inputValue);

    console.log('User:', user);

    console.log('User ID:', user?.id);

    

    if (!inputValue.trim() || !user) {

      console.error('Missing input or user');

      toast.error('يجب تسجيل الدخول أولاً');

      return;

    }



    // Verify session is still active

    console.log('Checking session...');

    const { data: { session } } = await supabase.auth.getSession();

    console.log('Session:', session);

    console.log('Session user ID:', session?.user?.id);

    

    if (!session) {

      console.error('No active session');

      toast.error('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجدداً');

      return;

    }



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

    const senderForThisMessage: 'me' | 'myself' = currentSpeaker === 'sovereign' ? 'me' : 'myself';

    const chatModeForMsg: ChatMode =

      currentSpeaker === 'sovereign' ? 'sovereign'

      : currentSpeaker === 'nafs' ? 'nafs'

      : (animaPersona === 'nurturing' ? 'nurturing' : 'anima');

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



    // Switch speaker if auto-switch is enabled (cycle anima → nafs → sovereign → anima)

    if (isAutoSwitch) {

      setCurrentSpeaker(prev => {

        const idx = SPEAKER_ORDER.indexOf(prev);

        return SPEAKER_ORDER[(idx + 1) % SPEAKER_ORDER.length];

      });

    }



    // Focus input after state updates to keep keyboard open

    requestAnimationFrame(() => {

      inputRef.current?.focus();

    });



    try {

      console.log('=== Attempting to save message to database ===');

      console.log('Data to insert:', {

        user_id: user.id,

        sender: senderForThisMessage,

        chat_mode: chatModeForMsg,

        message: newMessage.message,

        session_title: sessionTitle || null

      });

      console.log('chatModeForMsg:', chatModeForMsg);

      console.log('currentSender:', currentSender);

      console.log('animaPersona:', animaPersona);



      const { error, data } = await supabase

        .from('self_dialogue_messages')

        .insert({

          user_id: user.id,

          sender: senderForThisMessage,

          message: newMessage.message,

          session_title: sessionTitle || null,

          chat_mode: chatModeForMsg

        })

        .select();



      console.log('Supabase response:', { error, data });



      if (error) {

        console.error('=== Supabase insert error ===');

        console.error('Error code:', error.code);

        console.error('Error message:', error.message);

        console.error('Error details:', error.details);

        console.error('Error hint:', error.hint);

        throw error;

      }



      console.log('=== Message saved successfully ===');

      console.log('Saved data:', data);



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

    } catch (error: any) {

      console.error('Error saving message:', error);

      

      // Provide detailed error message based on error type

      let errorMessage = 'فشل حفظ الرسالة في الكلاود. تم حفظها محلياً.';

      

      if (error?.code === '42P01') {

        errorMessage = 'خطأ في قاعدة البيانات: الجدول غير موجود';

      } else if (error?.code === 'PGRST301') {

        errorMessage = 'خطأ في الصلاحيات: تحقق من تسجيل الدخول';

      } else if (error?.message?.includes('RLS')) {

        errorMessage = 'خطأ في سياسات الأمان: تحقق من حسابك';

      } else if (error?.message?.includes('auth')) {

        errorMessage = 'خطأ في المصادقة: يرجى تسجيل الدخول مجدداً';

      }

      

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

      toast.error(errorMessage);

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

            onTouchStart={() => {

              if (onLongPress) {

                modeButtonLongPressRef.current = setTimeout(() => {

                  onLongPress();

                }, 1500);

              }

            }}

            onTouchEnd={() => {

              if (modeButtonLongPressRef.current) {

                clearTimeout(modeButtonLongPressRef.current);

                modeButtonLongPressRef.current = null;

              }

            }}

            onMouseDown={() => {

              if (onLongPress) {

                modeButtonLongPressRef.current = setTimeout(() => {

                  onLongPress();

                }, 1500);

              }

            }}

            onMouseUp={() => {

              if (modeButtonLongPressRef.current) {

                clearTimeout(modeButtonLongPressRef.current);

                modeButtonLongPressRef.current = null;

              }

            }}

            onMouseLeave={() => {

              if (modeButtonLongPressRef.current) {

                clearTimeout(modeButtonLongPressRef.current);

                modeButtonLongPressRef.current = null;

              }

            }}

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

              <DialogHeader className="p-3 border-b border-white/10 flex-shrink-0">

                <div className="flex items-center gap-2 mb-1">

                  {isSyncing && (

                    <Loader2 className="h-3 w-3 text-[#626FC4] animate-spin" />

                  )}

                </div>



                <div className="flex items-center justify-center gap-1 flex-wrap">

                    <Button variant="ghost" size="sm" onClick={(e) => {
                        e.preventDefault();
                        if (unionLongPressFiredRef.current) {
                          unionLongPressFiredRef.current = false;
                          return;
                        }
                        setShowUnionSelector(true);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        unionLongPressFiredRef.current = false;
                        unionLongPressRef.current = setTimeout(() => {
                          unionLongPressFiredRef.current = true;
                          openMilestoneDialog('sacred');
                        }, 500);
                      }}
                      onMouseUp={() => {
                        if (unionLongPressRef.current) clearTimeout(unionLongPressRef.current);
                      }}
                      onMouseLeave={() => {
                        if (unionLongPressRef.current) clearTimeout(unionLongPressRef.current);
                      }}
                      onTouchStart={() => {
                        unionLongPressFiredRef.current = false;
                        unionLongPressRef.current = setTimeout(() => {
                          unionLongPressFiredRef.current = true;
                          openMilestoneDialog('sacred');
                        }, 500);
                      }}
                      onTouchEnd={() => {
                        if (unionLongPressRef.current) clearTimeout(unionLongPressRef.current);
                      }} className="h-7 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1" title="اختيار نوع الجماع (اضغط مطولاً للمقدس)">

                      <Flame className="h-3 w-3" />

                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => openMilestoneDialog('heart')} className="hidden h-7 px-2 text-[10px] text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 gap-1" title="إضافة جماع قلبي">

                      <HeartHandshake className="h-3 w-3" />

                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => openMilestoneDialog('normal')} className="hidden h-7 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1" title="إضافة جماع عادي">

                      <Zap className="h-3 w-3" />

                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => openMilestoneDialog('nursing')} className="hidden h-7 px-2 text-[10px] text-amber-700 hover:text-amber-600 hover:bg-amber-600/10 gap-1" title="إضافة جماع امومي اضاعي">

                      <Droplets className="h-3 w-3" />

                    </Button>

                    <Button variant="ghost" size="sm" onClick={openFallDialog} className="hidden h-7 px-2 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-600/10 gap-1" title="سقوط">

                      📉

                    </Button>

                    <Button variant="ghost" size="sm" onClick={insertKissLabel} className="h-7 px-2 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1" title="بوس حميمي">

                      💋

                    </Button>

                    <Button variant="ghost" size="sm" onClick={insertShowerLabel} className="h-7 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1" title="دش دافئ حميمي">

                      🛀

                    </Button>

                    <Button variant="ghost" size="sm" onClick={insertSelfHugLabel} className="h-7 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1" title="حضن ذاتي">

                      🦋

                    </Button>

                    {milestoneMessages.length > 0 && (

                      <Button variant="ghost" size="sm" onClick={() => setShowMilestoneTable(true)} className="h-7 px-2 text-[10px] text-red-500/60 hover:text-red-400 hover:bg-red-500/10 gap-1" title="جدول الجماعات">

                        <Table2 className="h-3 w-3" />

                      </Button>

                    )}

                    <Button variant="ghost" size="sm" onClick={() => { setRealityDate(new Date().toISOString().split('T')[0]); setRealityTime(''); setShowRealityDialog(true); }} className="h-7 px-2 text-[10px] text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-1" title="حدث في الواقع">

                      🌍

                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => { setDreamDate(new Date().toISOString().split('T')[0]); setDreamTime(''); setShowDreamDialog(true); }} className="h-7 px-2 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1" title="حلم">

                      🌙

                    </Button>

                    {displayedMessages.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={copyTodayMessagesOnly} className="h-7 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10" title="نسخ رسائل اليوم">
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}

                  </div>

              </DialogHeader>



                  {/* Union Type Selector Modal */}
                  {showUnionSelector && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUnionSelector(false)}>
                      <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-5 w-[85vw] max-w-[320px] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-center text-sm font-semibold text-white/80">اختر نوع الجماع</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => { setShowUnionSelector(false); openMilestoneDialog('sacred'); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all">
                            <Flame className="h-5 w-5 text-red-400" />
                            <span className="text-[11px] text-red-300 font-medium">مقدس</span>
                          </button>
                          <button onClick={() => { setShowUnionSelector(false); openMilestoneDialog('heart'); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 transition-all">
                            <HeartHandshake className="h-5 w-5 text-pink-400" />
                            <span className="text-[11px] text-pink-300 font-medium">قلبي</span>
                          </button>
                          <button onClick={() => { setShowUnionSelector(false); openMilestoneDialog('imaginary'); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all">
                            <Brain className="h-5 w-5 text-purple-400" />
                            <span className="text-[11px] text-purple-300 font-medium">خيالي</span>
                          </button>
                          <button onClick={() => { setShowUnionSelector(false); openMilestoneDialog('normal'); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all">
                            <Zap className="h-5 w-5 text-blue-400" />
                            <span className="text-[11px] text-blue-300 font-medium">عادي</span>
                          </button>
                          <button onClick={() => { setShowUnionSelector(false); openMilestoneDialog('nursing'); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all">
                            <Droplets className="h-5 w-5 text-amber-400" />
                            <span className="text-[11px] text-amber-300 font-medium">أمومي</span>
                          </button>
                          <button onClick={() => { setShowUnionSelector(false); openMilestoneDialog('fall'); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 transition-all">
                            <span className="text-xl">📉</span>
                            <span className="text-[11px] text-red-400 font-medium">سقوط</span>
                          </button>
                        </div>
                        <Button variant="ghost" onClick={() => setShowUnionSelector(false)} className="h-8 text-xs text-white/50 hover:text-white mt-2">إلغاء</Button>
                      </div>
                    </div>
                  )}

                  {/* Milestone Table View */}

                  {showMilestoneTable && (

                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMilestoneTable(false)}>

                      <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-4 w-[95vw] max-w-[500px] max-h-[80vh] flex flex-col gap-3" onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between">

                         <div className="flex items-center gap-1">

                           <h3 className="text-sm font-semibold text-white/80">سجل الجماع والعلاقة الحميمة مع الانيما</h3>

                         </div>

                         <div className="flex items-center gap-1">

                           <Button

                             variant="ghost"

                             size="sm"

                             onClick={exportConversationCSV}

                             className="h-7 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/10 gap-1"

                           >

                             <Download className="h-3 w-3" />

                             المحادثة

                           </Button>

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

                        </div>

                        {(() => {
                          const milestonesOnly = milestoneMessages.filter(m => m.message.startsWith('__MILESTONE__'));
                          if (milestonesOnly.length <= 1) return null;

                          const filtered = [...milestonesOnly].reverse().filter(m => {
                            const daysAgo = Math.floor((Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24));
                            return daysAgo <= 7;
                          });

                          if (filtered.length <= 1) return null;

                          const earliestDate = new Date(filtered[0].created_at);
                          const dayStart = new Date(earliestDate);
                          dayStart.setHours(0, 0, 0, 0);
                          const dayStartMs = dayStart.getTime();

                          const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

                          return (
                            <div className="mb-4">
                              <div className="h-[100px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={filtered.map(m => {
                                    const content = m.message.replace('__MILESTONE__', '');
                                    const parts = content.split('|');
                                    const isSacredFmt = parts.length > 8;
                                    const title = parts[0] || '';
                                    const rating = parseFloat(parts[1]) || 0;
                                    const type = isSacredFmt ? (parts[8] || 'normal') : (parts[3] || 'normal');
                                    const intention = isSacredFmt ? (parts[9] || '') : (parts[4] || '');
                                    const notes = isSacredFmt ? '' : (parts[2] || '');
                                    const duration = !isSacredFmt && parts[5] ? parts[5] : '';
                                    const output = !isSacredFmt && parts[6] ? parts[6] : '';
                                    const hoursSinceDayStart = (new Date(m.created_at).getTime() - dayStartMs) / (1000 * 60 * 60);

                                    return {
                                      val: rating,
                                      timePosition: hoursSinceDayStart,
                                      title,
                                      rating: parts[1] || '',
                                      notes,
                                      type,
                                      intention,
                                      duration,
                                      output,
                                      date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                      time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                                    };
                                  })}>
                                    <defs>
                                      <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="rgba(239,68,68,0.1)" /><stop offset="100%" stopColor="rgba(239,68,68,0.8)" /></linearGradient>
                                      <linearGradient id="sacredGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="rgba(255,140,0,0.4)" /><stop offset="50%" stopColor="rgba(255,69,0,0.6)" /><stop offset="100%" stopColor="rgba(255,0,0,0.8)" /></linearGradient>
                                    </defs>
                                    <YAxis hide domain={[5, 10]} />
                                    <XAxis
                                      dataKey="timePosition"
                                      domain={[0, 'dataMax + 2']}
                                      type="number"
                                      ticks={[0, 24, 48, 72, 96, 120, 144, 168]}
                                      tickFormatter={(value) => {
                                        const tickDate = new Date(dayStartMs + value * 3600000);
                                        return days[tickDate.getDay()];
                                      }}
                                      tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 9 }}
                                      interval={0}
                                    />
                                    <Tooltip content={({ active, payload }) => (active && payload?.[0] ?
                                      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-lg text-[10px] text-red-100 space-y-1">
                                        <div className="font-bold text-white">{payload[0].payload.title}</div>
                                        <div>التقييم: {payload[0].payload.rating}</div>
                                        {payload[0].payload.intention && <div>النية: {payload[0].payload.intention}</div>}
                                        {payload[0].payload.duration && <div>المدة: {payload[0].payload.duration === 'long' ? 'طويل' : payload[0].payload.duration === 'medium' ? 'متوسط' : 'قصير'}</div>}
                                        {payload[0].payload.output && <div>الخروج: {payload[0].payload.output === 'full' ? 'كامل' : payload[0].payload.output === 'simple' ? 'بسيط' : 'محفوظ'}</div>}
                                        {payload[0].payload.notes && <div>الملاحظات: {payload[0].payload.notes}</div>}
                                        <div className="text-[9px] text-white/60">{payload[0].payload.date} - {payload[0].payload.time}</div>
                                      </div>
                                      : null)}
                                    />
                                    <ReferenceLine y={10} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <ReferenceLine x={24} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <ReferenceLine x={48} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <ReferenceLine x={72} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <ReferenceLine x={96} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <ReferenceLine x={120} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <ReferenceLine x={144} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <ReferenceLine x={168} stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                                    <Line
                                      type="monotone"
                                      dataKey="val"
                                      stroke="url(#lineG)"
                                      strokeWidth={2}
                                      dot={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        const iconType = payload.type;
                                        const iconColor =
                                          iconType === 'sacred' ? '#ef4444' :
                                            iconType === 'heart' ? '#f472b6' :
                                              iconType === 'imaginary' ? '#a855f7' :
                                                iconType === 'normal' ? '#3b82f6' :
                                                  iconType === 'nursing' ? '#d97706' : '#6b7280';
                                        return (
                                          <g key={`dot-${cx}-${cy}`}>
                                            <g transform={`translate(${cx - 3}, ${cy - 3})`}>
                                              {iconType === 'sacred' && <circle cx="3" cy="3" r="2.0" fill="url(#sacredGradient)" />}
                                              {iconType === 'heart' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                                              {iconType === 'imaginary' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                                              {iconType === 'normal' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                                              {iconType === 'nursing' && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                                              {!['sacred', 'heart', 'imaginary', 'normal', 'nursing'].includes(iconType) && <circle cx="3" cy="3" r="2.0" fill={iconColor} />}
                                            </g>
                                          </g>
                                        );
                                      }}
                                      animationDuration={3000}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })()}

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



                            // Reality entry

                            if (m.message === '__REALITY__' || m.message.startsWith('__REALITY__|')) {

                              const parts = m.message.split('|');

                              const eventDate = parts.length > 2 ? parts[1] : '';

                              const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');

                              const displayNotes = eventDate && notes ? `${eventDate} - ${notes}` : (eventDate || notes || '');

                              return (

                                <div key={m.id} className="bg-green-500/10 rounded-lg p-3 border border-green-400/20 text-right" dir="rtl">

                                  <div className="flex items-center justify-between mb-1">

                                    <span className="text-xs font-semibold text-green-300">🌍 حدث في الواقع</span>

                                    <div className="flex items-center gap-1">

                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">

                                        <Trash2 className="h-3 w-3" />

                                      </button>

                                      <button onClick={() => { navigator.clipboard.writeText(`🌍 حدث في الواقع${displayNotes ? `: ${displayNotes}` : ''} - ${dateStr} ${timeStr}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">

                                        <Copy className="h-3 w-3" />

                                      </button>

                                    </div>

                                  </div>

                                  <div className="text-[9px] text-white/40">{dateStr} • {timeStr}</div>

                                  {displayNotes && <div className="text-[10px] text-green-200/70 mt-1">{displayNotes}</div>}

                                </div>

                              );

                            }



                            // Dream entry

                            if (m.message === '__DREAM__' || m.message.startsWith('__DREAM__|')) {

                              const parts = m.message.split('|');

                              const eventDate = parts.length > 2 ? parts[1] : '';

                              const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');

                              const displayNotes = eventDate && notes ? `${eventDate} - ${notes}` : (eventDate || notes || '');

                              return (

                                <div key={m.id} className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20 text-right" dir="rtl">

                                  <div className="flex items-center justify-between mb-1">

                                    <span className="text-xs font-semibold text-purple-300">🌙 حلم</span>

                                    <div className="flex items-center gap-1">

                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">

                                        <Trash2 className="h-3 w-3" />

                                      </button>

                                      <button onClick={() => { navigator.clipboard.writeText(`🌙 حلم${displayNotes ? `: ${displayNotes}` : ''} - ${dateStr} ${timeStr}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">

                                        <Copy className="h-3 w-3" />

                                      </button>

                                    </div>

                                  </div>

                                  <div className="text-[9px] text-white/40">{dateStr} • {timeStr}</div>

                                  {displayNotes && <div className="text-[10px] text-purple-200/70 mt-1">{displayNotes}</div>}

                                </div>

                              );

                            }



                            // Fall entry

                            if (m.message.startsWith('__FALL__')) {

                              const fallContent = m.message.replace('__FALL__|', '');

                              const fallParts = fallContent.split('|');

                              const fallDescription = fallParts[1] || '';



                              return (

                                <div key={m.id} className="bg-red-500/10 rounded-lg p-3 border border-red-400/20 text-right" dir="rtl">

                                  <div className="flex items-center justify-between mb-1">

                                    <span className="text-xs font-semibold text-red-300">📉 سقوط</span>

                                    <div className="flex items-center gap-1">

                                      <button onClick={() => { setShowMilestoneTable(false); openMilestoneEditDialog(m); }} className="p-1 text-white/30 hover:text-red-300 transition-colors" title="تعديل">

                                        <Edit2 className="h-3 w-3" />

                                      </button>

                                      <button onClick={() => deleteMilestone(m.id)} className="p-1 text-white/30 hover:text-red-400 transition-colors">

                                        <Trash2 className="h-3 w-3" />

                                      </button>

                                      <button onClick={() => { navigator.clipboard.writeText(`📉 سقوط - ${dateStr} ${timeStr}: ${fallDescription}`); toast.success('تم نسخ البيانات'); }} className="p-1 text-white/30 hover:text-white/60">

                                        <Copy className="h-3 w-3" />

                                      </button>

                                    </div>

                                  </div>

                                  <div className="text-[9px] text-white/40 mb-1">{dateStr} • {timeStr}</div>

                                  <div className="text-[9px] text-red-200">{fallDescription}</div>

                                </div>

                              );

                            }



                            // Milestone entry - simplified: intention, rating, notes, duration, output, date

                            const content = m.message.replace('__MILESTONE__', '');

                            const p = content.split('|');

                            const isSacredFmt = p.length > 8;

                            const title = p[0] || '';

                            const rating = p[1] || '';

                            const notes = isSacredFmt ? '' : (p[2] || '');

                            const intention = isSacredFmt ? (p[9] || '') : (p[4] || '');

                            const mDuration = !isSacredFmt && p[5] ? p[5] : '';

                            const mOutput = !isSacredFmt && p[6] ? p[6] : '';

                            const durationLabel = mDuration === 'long' ? 'طويل' : mDuration === 'medium' ? 'متوسط' : mDuration === 'short' ? 'قصير' : '';

                            const outputLabel = mOutput === 'full' ? 'كامل' : mOutput === 'simple' ? 'بسيط' : mOutput === 'preserved' ? 'محفوظ' : '';

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

                                <div className="flex gap-2 text-[9px] text-white/40 mb-0.5">

                                  {durationLabel && <span>المدة: {durationLabel}</span>}

                                  {outputLabel && <span>القذف: {outputLabel}</span>}

                                </div>

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

                                           milestoneType === 'nursing' ? 'الجماع الأمومي الإرضاعي' :

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

                              title="جماع امومي اضاعي"

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

                        

                        {/* Date/Time Editor */}

                        <div className="flex flex-col gap-1.5">

                          <span className="text-xs text-white/60">تاريخ ووقت التسجيل</span>

                          <Input

                            type="datetime-local"

                            value={milestoneDate}

                            onChange={(e) => setMilestoneDate(e.target.value)}

                            className="h-8 text-xs bg-white/5 border-white/15 text-white"

                          />

                        </div>



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

                              {/* Duration Radio */}

                              <div className="flex flex-col gap-1.5">

                                <span className="text-xs text-white/60">المدة</span>

                                <div className="flex gap-2 justify-end">

                                  {[

                                    { value: 'long', label: 'طويل' },

                                    { value: 'medium', label: 'متوسط' },

                                    { value: 'short', label: 'قصير' },

                                  ].map(opt => (

                                    <button

                                      key={opt.value}

                                      onClick={() => setMilestoneDuration(opt.value as any)}

                                      className={`px-3 py-1 rounded-full text-[11px] border transition-all ${

                                        milestoneDuration === opt.value

                                          ? 'bg-white/15 border-white/40 text-white'

                                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'

                                      }`}

                                    >

                                      {opt.label}

                                    </button>

                                  ))}

                                </div>

                              </div>



                              {/* Output Radio */}

                              <div className="flex flex-col gap-1.5">

                                <span className="text-xs text-white/60">القذف</span>

                                <div className="flex gap-2 justify-end">

                                  {[

                                    { value: 'full', label: 'كامل' },

                                    { value: 'simple', label: 'بسيط' },

                                    { value: 'preserved', label: 'محفوظ' },

                                  ].map(opt => (

                                    <button

                                      key={opt.value}

                                      onClick={() => setMilestoneOutput(opt.value as any)}

                                      className={`px-3 py-1 rounded-full text-[11px] border transition-all ${

                                        milestoneOutput === opt.value

                                          ? 'bg-white/15 border-white/40 text-white'

                                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'

                                      }`}

                                    >

                                      {opt.label}

                                    </button>

                                  ))}

                                </div>

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

                            className="h-9 text-xs text-white/50 hover:text-white"

                          >

                            إلغاء

                          </Button>

                        </div>

                      </div>

                    </div>

                  )}


                  {/* Reality Notes Dialog */}
                  {showRealityDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowRealityDialog(false); setRealityNotes(''); setRealityDate(new Date().toISOString().split('T')[0]); setRealityTime(''); }}>
                      <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-6 w-[90vw] max-w-[380px] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-green-300">🌍 حدث في الواقع</h3>
                        <div className="flex gap-2">
                          <Input type="date" value={realityDate} onChange={(e) => setRealityDate(e.target.value)} className="flex-1 bg-white/5 border-white/10 text-white" />
                          <Input type="time" value={realityTime} onChange={(e) => setRealityTime(e.target.value)} className="w-28 bg-white/5 border-white/10 text-white" />
                        </div>
                        <Textarea value={realityNotes} onChange={(e) => setRealityNotes(e.target.value)} placeholder="اكتب ملاحظاتك عن الحدث..." className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30" autoFocus />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={() => { setShowRealityDialog(false); setRealityNotes(''); setRealityDate(new Date().toISOString().split('T')[0]); setRealityTime(''); }} className="h-9 text-xs text-white/50 hover:text-white">إلغاء</Button>
                          <Button onClick={() => { setShowRealityDialog(false); insertRealityLabel(); }} className="h-9 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30">إضافة</Button>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Dream Notes Dialog */}
                  {showDreamDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowDreamDialog(false); setDreamNotes(''); setDreamDate(new Date().toISOString().split('T')[0]); setDreamTime(''); }}>
                      <div className="bg-[#1a1a2e] border border-white/15 rounded-2xl p-6 w-[90vw] max-w-[380px] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-purple-300">🌙 حلم</h3>
                        <div className="flex gap-2">
                          <Input type="date" value={dreamDate} onChange={(e) => setDreamDate(e.target.value)} className="flex-1 bg-white/5 border-white/10 text-white" />
                          <Input type="time" value={dreamTime} onChange={(e) => setDreamTime(e.target.value)} className="w-28 bg-white/5 border-white/10 text-white" />
                        </div>
                        <Textarea value={dreamNotes} onChange={(e) => setDreamNotes(e.target.value)} placeholder="اكتب ملاحظاتك عن الحلم..." className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30" autoFocus />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={() => { setShowDreamDialog(false); setDreamNotes(''); setDreamDate(new Date().toISOString().split('T')[0]); setDreamTime(''); }} className="h-9 text-xs text-white/50 hover:text-white">إلغاء</Button>
                          <Button onClick={() => { setShowDreamDialog(false); insertDreamLabel(); }} className="h-9 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30">إضافة</Button>
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



                      {/* Three-speaker switcher: anima, nafs, sovereign — all on the right */}

                      <div dir="rtl" className="relative flex items-center justify-end gap-1 bg-white/5 backdrop-blur-md rounded-full p-0.5 border border-white/10 select-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">

                        {SPEAKER_ORDER.map((sp) => {

                          const meta = SPEAKER_META[sp];

                          const Icon = meta.Icon;

                          const isActive = currentSpeaker === sp;

                          const baseBtn = `relative z-10 px-2.5 py-1 text-[10px] flex items-center justify-center gap-1 rounded-full transition-all duration-300 ${

                            isActive

                              ? `${meta.bubbleClass} text-white font-bold drop-shadow-md`

                              : 'text-gray-400 font-medium hover:text-gray-200'

                          }`;



                          // Anima keeps capabilities popover when active

                          if (sp === 'anima') {

                            return (

                              <Popover key={sp} open={showCapabilitiesMenu && isActive} onOpenChange={(o) => setShowCapabilitiesMenu(o && isActive)}>

                                <PopoverTrigger asChild>

                                  <button

                                    onClick={(e) => {

                                      e.preventDefault();

                                      setCurrentSpeaker('anima');

                                      setTimeout(() => inputRef.current?.focus(), 0);

                                    }}

                                    onMouseDown={(e) => e.preventDefault()}

                                    className={baseBtn}

                                  >

                                    <Icon className="h-3 w-3" />

                                    {meta.name}

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

                                          <div key={cap.id} className="flex items-center gap-1 p-2 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors">

                                            <div className="flex flex-col gap-0.5">

                                              <button onClick={() => handleMoveCapability(cap.id, 'up')} disabled={index === 0} className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">

                                                <GripVertical className="h-2.5 w-2.5 rotate-90" />

                                              </button>

                                              <button onClick={() => handleMoveCapability(cap.id, 'down')} disabled={index === capabilities.length - 1} className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">

                                                <GripVertical className="h-2.5 w-2.5 -rotate-90" />

                                              </button>

                                            </div>

                                            <span className="flex-1 text-xs text-white/80 pr-1">{cap.capability_text}</span>

                                            <button onClick={() => handleDeleteCapability(cap.id)} className="p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">

                                              <X className="h-3 w-3" />

                                            </button>

                                          </div>

                                        ))

)}
                                    </div>
                                  </div>

                                </PopoverContent>

                              </Popover>

                            );

                          }



                          return (

                            <button

                              key={sp}

                              onClick={(e) => {

                                e.preventDefault();

                                setCurrentSpeaker(sp);

                                setTimeout(() => inputRef.current?.focus(), 0);

                              }}

                              onMouseDown={(e) => e.preventDefault()}

                              className={baseBtn}

                            >

                              <Icon className="h-3 w-3" />

                              {meta.name}

                            </button>

                          );

                        })}

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

                        placeholder={`اكتب كـ "${SPEAKER_META[currentSpeaker].name}"...`}

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
