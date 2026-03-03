 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/components/SelfDialogueChat.tsx b/src/components/SelfDialogueChat.tsx
index 2d9e68c17bbabf82f5ce505e3bf7048b9546cef3..a7ad7d5797b8476f943326bde5dd2cac6cc3a1fa 100644
--- a/src/components/SelfDialogueChat.tsx
+++ b/src/components/SelfDialogueChat.tsx
@@ -90,168 +90,149 @@ const MessageBubble = React.memo(function MessageBubble({
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
-            ? 'bg-[#626FC4]/20 text-[#C8CCEC] rounded-bl-sm border border-[#626FC4]/30'
-            : 'bg-pink-500/20 text-pink-50 rounded-br-sm border border-pink-400/30'
+            ? 'bg-[#7E8AF0]/35 text-[#F3F5FF] rounded-bl-sm border border-[#AAB2FF]/55'
+            : 'bg-[#9A6A3E]/35 text-[#FFE8AA] rounded-br-sm border border-[#C28A57]/55'
             }`}
         >
           <p className="text-xs leading-tight whitespace-pre-wrap" style={{ unicodeBidi: 'plaintext' }}>{msg.message}</p>
         </div>
         <div className={`flex items-center gap-0.5 mt-0.5 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
           {msg.sender === 'me' ? (
-            <User className="h-2 w-2 text-[#626FC4]/40" />
+            <User className="h-2 w-2 text-[#C7CDFF]/90" />
           ) : (
-            <Heart className="h-2 w-2 text-pink-400/30" />
+            <Heart className="h-2 w-2 text-[#F4D7B8]/90" />
           )}
-          <span className={`text-[7px] ${msg.sender === 'me' ? 'text-[#626FC4]/40' : 'text-pink-400/15'}`}>
-            {msg.sender === 'me' ? 'أنا' : 'الأنيما'} • {formatTime(msg.created_at)}
+          <span className={`text-[7px] ${msg.sender === 'me' ? 'text-[#C7CDFF]/85' : 'text-[#F4D7B8]/85'}`}>
+            {msg.sender === 'me' ? 'أنا' : 'الراعية الحنون'} • {formatTime(msg.created_at)}
           </span>
           {msg.status === 'pending' && (
-            <RefreshCw className="h-2 w-2 text-[#626FC4]/50 animate-spin ml-0.5" />
+            <RefreshCw className="h-2 w-2 text-[#C7CDFF]/90 animate-spin ml-0.5" />
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
   localSeq?: number; // Local sequence number for stable ordering
   chat_mode?: ChatMode;
 }
 
 // chat_mode doubles as persona marker:
-// 'self' = me sender | 'anima' = anima persona | 'nurturing' = nurturing persona
+// 'self' = me sender | 'anima' = legacy persona | 'nurturing' = nurturing persona
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
   const [showArchive, setShowArchive] = useState(false);
   const [archivedMessages, setArchivedMessages] = useState<DialogueMessage[]>([]);
   const [archiveSessions, setArchiveSessions] = useState<{ id: string, date: string, title?: string | null, firstMessage: string }[]>([]);
   const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
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
-  const [animaPersona, setAnimaPersona] = useState<'anima' | 'nurturing'>('anima');
   const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
   const [milestoneRating, setMilestoneRating] = useState(5);
   const [milestoneNotes, setMilestoneNotes] = useState('راحة وأمان : \nلذة واستمتاع : \nعاطفة واتصال : ');
   const milestoneLongPressRef = useRef<NodeJS.Timeout | null>(null);
   const milestoneLongPressFiredRef = useRef(false);
 
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLTextAreaElement>(null);
   const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
   const pinInputRef = useRef<HTMLInputElement>(null);
-  const modeButtonLongPressRef = useRef<NodeJS.Timeout | null>(null);
   const sendLongPressRef = useRef<NodeJS.Timeout | null>(null);
   const sendLongPressFiredRef = useRef(false);
 
   const messagesEndRef = useRef<HTMLDivElement>(null);
 
   const PENDING_MESSAGES_KEY = useMemo(() => user ? `pending_dialogue_messages_${user.id}` : null, [user]);
 
-  const isNurturing = animaPersona === 'nurturing';
-
-  // Colors for each persona
-  const animaColors = {
-    msgBg:     isNurturing ? 'bg-[#7B5230]/20 backdrop-blur-md' : 'bg-pink-500/20 backdrop-blur-md',
-    msgText:   isNurturing ? 'text-[#D4A520]' : 'text-pink-50',
-    msgBorder: isNurturing ? 'border-[#7B5230]/30' : 'border-pink-400/30',
-    msgShadow: isNurturing ? 'shadow-[inset_0_1px_12px_rgba(123,82,48,0.2)]' : 'shadow-[inset_0_1px_12px_rgba(236,72,153,0.2)]',
-    iconColor: isNurturing ? 'text-[#7B5230]/40' : 'text-pink-400/30',
-    timeColor: isNurturing ? 'text-[#7B5230]/30' : 'text-pink-400/15',
-    toggleActiveBg: isNurturing
-      ? 'bg-[#7B5230]/40 border border-[#9B6840]/40 shadow-[inset_0_1px_10px_rgba(123,82,48,0.3),0_0_15px_rgba(123,82,48,0.2)]'
-      : 'bg-pink-500/40 border border-pink-400/40 shadow-[inset_0_1px_10px_rgba(236,72,153,0.3),0_0_15px_rgba(236,72,153,0.2)]',
-    inputFocus: isNurturing
-      ? 'focus:border-[#9B6840]/50 focus:ring-1 focus:ring-[#9B6840]/20 focus:shadow-[inset_0_2px_12px_rgba(123,82,48,0.15)]'
-      : 'focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/20 focus:shadow-[inset_0_2px_12px_rgba(236,72,153,0.15)]',
-    sendBtn: isNurturing
-      ? 'bg-[#7B5230]/30 hover:bg-[#7B5230]/40 border border-[#9B6840]/30 shadow-[inset_0_1px_10px_rgba(123,82,48,0.2)] text-[#D4A520]'
-      : 'bg-pink-500/30 hover:bg-pink-500/40 border border-pink-400/30 shadow-[inset_0_1px_10px_rgba(236,72,153,0.2)] text-white',
-    capabilitiesBtn: isNurturing
-      ? 'bg-[#7B5230]/20 text-[#D4A520] hover:bg-[#7B5230]/30'
-      : 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30',
+  const nurturingColors = {
+    toggleActiveBg: 'bg-[#7B5230]/40 border border-[#9B6840]/40 shadow-[inset_0_1px_10px_rgba(123,82,48,0.3),0_0_15px_rgba(123,82,48,0.2)]',
+    inputFocus: 'focus:border-[#9B6840]/50 focus:ring-1 focus:ring-[#9B6840]/20 focus:shadow-[inset_0_2px_12px_rgba(123,82,48,0.15)]',
+    sendBtn: 'bg-[#9A6A3E]/45 hover:bg-[#A67446]/60 border border-[#C28A57]/55 shadow-[inset_0_1px_10px_rgba(154,106,62,0.3)] text-[#FFE8AA]',
+    capabilitiesBtn: 'bg-[#9A6A3E]/35 text-[#FFE8AA] hover:bg-[#A67446]/45',
   };
 
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
@@ -560,71 +541,69 @@ export function SelfDialogueChat() {
                     <div className="relative text-[10px] text-white/40 mt-1 text-center whitespace-pre-wrap max-w-[200px]" style={{ unicodeBidi: 'plaintext' }}>{notes}</div>
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
-                      ? 'bg-[#626FC4]/20 backdrop-blur-md text-[#C8CCEC] rounded-bl-sm border border-[#626FC4]/30 shadow-[inset_0_1px_12px_rgba(98,111,196,0.2)]'
-                      : msg.chat_mode === 'nurturing'
-                        ? 'bg-[#7B5230]/20 backdrop-blur-md text-[#D4A520] rounded-br-sm border border-[#7B5230]/30 shadow-[inset_0_1px_12px_rgba(123,82,48,0.2)]'
-                        : 'bg-pink-500/20 backdrop-blur-md text-pink-50 rounded-br-sm border border-pink-400/30 shadow-[inset_0_1px_12px_rgba(236,72,153,0.2)]'
+                      ? 'bg-[#7E8AF0]/35 backdrop-blur-md text-[#F3F5FF] rounded-bl-sm border border-[#AAB2FF]/55 shadow-[inset_0_1px_12px_rgba(126,138,240,0.25)]'
+                      : 'bg-[#9A6A3E]/35 backdrop-blur-md text-[#FFE8AA] rounded-br-sm border border-[#C28A57]/55 shadow-[inset_0_1px_12px_rgba(154,106,62,0.25)]'
                       }`}
                   >
                     <p className="text-xs leading-tight whitespace-pre-wrap" style={{ unicodeBidi: 'plaintext' }}>{msg.message}</p>
                   </div>
                   <div className={`flex items-center gap-0.5 mt-0.5 ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                     {msg.sender === 'me' ? (
-                      <User className="h-2 w-2 text-[#626FC4]/40" />
+                      <User className="h-2 w-2 text-[#C7CDFF]/90" />
                     ) : (
-                      <Heart className={`h-2 w-2 ${msg.chat_mode === 'nurturing' ? 'text-[#7B5230]/40' : 'text-pink-400/30'}`} />
+                      <Heart className="h-2 w-2 text-[#F4D7B8]/90" />
                     )}
-                    <span className={`text-[7px] ${msg.sender === 'me' ? 'text-[#626FC4]/40' : msg.chat_mode === 'nurturing' ? 'text-[#7B5230]/50' : 'text-pink-400/15'}`}>
-                      {msg.sender === 'me' ? 'أنا' : (msg.chat_mode === 'nurturing' ? 'الراعية' : 'الأنيما')} • {formatTime(msg.created_at)}
+                    <span className={`text-[7px] ${msg.sender === 'me' ? 'text-[#C7CDFF]/85' : 'text-[#F4D7B8]/85'}`}>
+                      {msg.sender === 'me' ? 'أنا' : 'الراعية الحنون'} • {formatTime(msg.created_at)}
                     </span>
 
                     {/* Status Indicator */}
                     {msg.status === 'pending' && (
-                      <RefreshCw className="h-2 w-2 text-[#626FC4]/50 animate-spin ml-0.5" />
+                      <RefreshCw className="h-2 w-2 text-[#C7CDFF]/90 animate-spin ml-0.5" />
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
   }, [messages, archivedMessages, showArchive, archiveSessions, selectedSessionId, handleMouseDown, handleMouseUp]);
 
   // Optimized scroll handler - only scroll when messages change or view shifts
   useEffect(() => {
     if (!isOpen) return;
 
     const scrollToBottom = () => {
       const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
       if (scrollContainer) {
@@ -683,51 +662,51 @@ export function SelfDialogueChat() {
 
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
       setMessages(displayMessages);
 
       if (allMessages.length > 0) {
-        setSessionTitle(allMessages[0].session_title || 'حوار مع الأنيما');
+        setSessionTitle(allMessages[0].session_title || 'حوار مع الراعية الحنون');
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
 
     // Remove from local storage if pending
     if (PENDING_MESSAGES_KEY) {
       const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
       if (stored) {
         const pending = JSON.parse(stored);
         const filtered = pending.filter((m: any) => m.id !== messageId);
@@ -1018,51 +997,51 @@ export function SelfDialogueChat() {
 
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
     const lastMsg = messages.filter(m => m.message !== '__SPACER__').at(-1);
     if (lastMsg && (Date.now() - new Date(lastMsg.created_at).getTime()) > 90 * 60 * 1000) {
       await insertSpacer();
     }
 
     const messageText = inputValue.trim();
     setInputValue('');
 
     // Create optimistic update with sequence number to ensure stable ordering
     const tempId = crypto.randomUUID();
     const senderForThisMessage = currentSender;
     const chatModeForMsg: ChatMode = senderForThisMessage === 'myself'
-      ? (animaPersona === 'nurturing' ? 'nurturing' : 'anima')
+      ? 'nurturing'
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
 
     // Save to local storage as pending
     if (PENDING_MESSAGES_KEY) {
       const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
       const pending = stored ? JSON.parse(stored) : [];
       localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify([...pending, newMessage]));
     }
 
     // Switch sender if auto-switch is enabled
     if (isAutoSwitch) {
       setCurrentSender(prev => prev === 'me' ? 'myself' : 'me');
@@ -1210,51 +1189,51 @@ export function SelfDialogueChat() {
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
-                        {showArchive && !selectedSessionId ? 'أرشيف المحادثات' : (sessionTitle || 'حوار مع الأنيما')}
+                        {showArchive && !selectedSessionId ? 'أرشيف المحادثات' : (sessionTitle || 'حوار مع الراعية الحنون')}
                       </DialogTitle>
                       {(!showArchive || selectedSessionId) && (
                         <Edit2 className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
                       )}
                     </div>
                   )}
                   {isSyncing && (
                     <Loader2 className="h-3 w-3 text-[#626FC4] animate-spin" />
                   )}
                 </div>
 
                 <div className="flex items-center gap-1">
                   {!showArchive && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={openMilestoneDialog}
                       className="h-7 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1"
                       title="إضافة علامة إنجاز"
                     >
                       جماع مقدس
                     </Button>
                   )}
 
                   {/* Milestone Rating Dialog */}
@@ -1354,51 +1333,51 @@ export function SelfDialogueChat() {
                       } else {
                         setSelectedSessionId(null);
                       }
                       setShowArchive(!showArchive);
                     }}
                     className={`h-7 px-2 text-[10px] gap-1 ${showArchive
                       ? 'text-[#626FC4] hover:text-[#8A94D8] bg-[#626FC4]/10'
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
-                  نافذة محادثة خاصة لتسجيل رسائل بين "أنا" و"الأنيما".
+                  نافذة محادثة خاصة لتسجيل رسائل بين "أنا" و"الراعية الحنون".
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
@@ -1407,113 +1386,83 @@ export function SelfDialogueChat() {
 
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
-                            ? `left-0.5 ${animaColors.toggleActiveBg}`
+                            ? `left-0.5 ${nurturingColors.toggleActiveBg}`
                             : 'left-[calc(50%+2px)] bg-[#626FC4]/40 border border-[#626FC4]/40 shadow-[inset_0_1px_10px_rgba(98,111,196,0.3),0_0_15px_rgba(98,111,196,0.2)]'
                             }`}
                         />
 
-                        {/* زر الوضع الحالي (أمومتي/أنوثتي) */}
+                        {/* زر الوضع الحالي (الراعية الحنون) */}
                         <Popover open={showCapabilitiesMenu} onOpenChange={setShowCapabilitiesMenu}>
                           <PopoverTrigger asChild>
                             <button
                               onClick={(e) => {
                                 e.preventDefault();
                                 handleManualSwitch('myself');
                               }}
                               onMouseDown={(e) => {
                                 e.preventDefault();
-                                modeButtonLongPressRef.current = setTimeout(() => {
-                                  modeButtonLongPressRef.current = null;
-                                  setAnimaPersona(prev => prev === 'anima' ? 'nurturing' : 'anima');
-                                  toast.success(animaPersona === 'anima' ? '🌿 وضع الراعية الحنون' : '✨ وضع الأنيما');
-                                }, 500);
                               }}
-                              onMouseUp={() => {
-                                if (modeButtonLongPressRef.current) {
-                                  clearTimeout(modeButtonLongPressRef.current);
-                                  modeButtonLongPressRef.current = null;
-                                }
-                              }}
-                              onMouseLeave={() => {
-                                if (modeButtonLongPressRef.current) {
-                                  clearTimeout(modeButtonLongPressRef.current);
-                                  modeButtonLongPressRef.current = null;
-                                }
-                              }}
-                              onTouchStart={(e) => {
-                                modeButtonLongPressRef.current = setTimeout(() => {
-                                  modeButtonLongPressRef.current = null;
-                                  setAnimaPersona(prev => prev === 'anima' ? 'nurturing' : 'anima');
-                                  toast.success(animaPersona === 'anima' ? '🌿 وضع الراعية الحنون' : '✨ وضع الأنيما');
-                                }, 500);
-                              }}
-                              onTouchEnd={() => {
-                                if (modeButtonLongPressRef.current) {
-                                  clearTimeout(modeButtonLongPressRef.current);
-                                  modeButtonLongPressRef.current = null;
-                                }
-                              }}
-                              className={`relative z-10 w-1/2 py-1 text-[10px] flex items-center justify-center gap-1 transition-colors duration-1000 ${currentSender === 'myself'
+                                                            className={`relative z-10 w-1/2 py-1 text-[10px] flex items-center justify-center gap-1 transition-colors duration-1000 ${currentSender === 'myself'
                                 ? 'text-white font-bold drop-shadow-md'
                                 : 'text-gray-400 font-medium hover:text-gray-200'
                                 }`}
                             >
                               <Heart className="h-3 w-3" />
-                              {isNurturing ? 'الراعية' : 'الأنيما'}
+                              الراعية الحنون
                             </button>
                           </PopoverTrigger>
                           <PopoverContent 
                             className="w-64 p-3 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl max-h-[60vh] overflow-hidden flex flex-col"
                             side="top"
                             align="center"
                           >
                             <div className="flex flex-col gap-2 h-full">
                               <p className="text-[11px] text-white/50 px-1 pb-2 border-b border-white/10 font-medium">
-                                إمكانات الأنيما
+                                إمكانات الراعية الحنون
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
@@ -1535,140 +1484,140 @@ export function SelfDialogueChat() {
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
-                                  className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${animaColors.capabilitiesBtn}`}
+                                  className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${nurturingColors.capabilitiesBtn}`}
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
 
                       {/* Spacer */}
                       <div className="w-6" />
                     </div>
 
                     <div className="flex flex-col gap-2">
                       <Textarea
                         ref={inputRef}
-                        placeholder={currentSender === 'me' ? 'اكتب كـ "أنا"...' : isNurturing ? 'اكتب كـ "الراعية الحنون"...' : 'اكتب كـ "الأنيما"...'}
+                        placeholder={currentSender === 'me' ? 'اكتب كـ "أنا"...' : 'اكتب كـ "الراعية الحنون"...'}
                         value={inputValue}
                         onChange={(e) => setInputValue(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                             e.preventDefault();
                             handleSendButtonClick(e as any);
                           }
                         }}
                         className={`w-full min-h-[40px] max-h-[100px] rounded-xl resize-none transition-all duration-1000 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] ${inputValue.trim()
-                          ? 'bg-black text-white border-white/20'
-                          : 'bg-white/5 text-white border-white/10'
+                          ? 'bg-[#111318] text-white border-white/35'
+                          : 'bg-white/10 text-white border-white/20'
                           } ${currentSender === 'me'
                             ? 'focus:border-[#626FC4]/50 focus:ring-1 focus:ring-[#626FC4]/20 focus:shadow-[inset_0_2px_12px_rgba(98,111,196,0.15)]'
-                            : animaColors.inputFocus
+                            : nurturingColors.inputFocus
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
-                            ? 'bg-[#626FC4]/30 hover:bg-[#626FC4]/40 border border-[#626FC4]/30 shadow-[inset_0_1px_10px_rgba(98,111,196,0.2)] text-white'
-                            : animaColors.sendBtn
-                          : 'bg-black hover:bg-gray-900 border border-white/20 text-white'
+                            ? 'bg-[#6F7DFF]/45 hover:bg-[#7C89FF]/60 border border-[#AAB2FF]/60 shadow-[inset_0_1px_10px_rgba(126,138,240,0.3)] text-white'
+                            : nurturingColors.sendBtn
+                          : 'bg-[#1A1D24] hover:bg-[#252A34] border border-white/30 text-white'
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
 
EOF
)
