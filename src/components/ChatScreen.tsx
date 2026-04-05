import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function ChatScreen({ chatId, onBack }: { chatId: string | null, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reporting State
  const [reportTarget, setReportTarget] = useState<any | null>(null); // Can be a message or 'chat'
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;
    let pollInterval: any = null;

    const setupChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      setCurrentUserId(user.id);

      if (!chatId) return;

      // Fetch chat details to get the other user's profile
      const { data: chat } = await supabase.from('chats').select('user1_id, user2_id').eq('id', chatId).single();
      if (chat && isMounted) {
        const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
        if (profile && isMounted) {
          setOtherUserProfile(profile);
        }
      }

      const fetchMessages = async () => {
        const { data: existingMessages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
        } else if (existingMessages && isMounted) {
          setMessages(existingMessages);
        }
      };

      if (!isMounted) return;

      fetchMessages();
      pollInterval = setInterval(fetchMessages, 3000);

      if (!isMounted) return;

      // Subscribe to new messages and typing events
      subscription = supabase
        .channel(`chat_${chatId}_${Date.now()}`, {
          config: {
            broadcast: { self: false }
          }
        })
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, (payload) => {
          if (isMounted) {
            setMessages(prev => {
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            // If they sent a message, they stopped typing
            setIsOtherTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          }
        })
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (isMounted && payload.payload.userId !== user.id) {
            setIsOtherTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              if (isMounted) setIsOtherTyping(false);
            }, 2000);
          }
        })
        .subscribe();
        
      channelRef.current = subscription;
    };

    setupChat();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [chatId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !chatId || !currentUserId) return;

    const textToSend = inputText.trim();
    setInputText(''); // Optimistic clear

    try {
      const { data: chat, error: chatError } = await supabase.from('chats').select('user1_id, user2_id').eq('id', chatId).single();
      if (chatError) throw new Error("Chat fetch error: " + chatError.message);
      if (!chat) throw new Error("Chat not found");

      const receiverId = chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;

      const { data: newMsg, error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: textToSend
      }).select().single();

      if (error) throw new Error("Insert error: " + error.message);

      if (newMsg) {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert("فشل إرسال الرسالة: " + error.message);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (channelRef.current && currentUserId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId }
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !currentUserId) return;

    // Validate file type and size (max 5MB)
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار صورة صالحة.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${chatId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(fileName, file);

      if (uploadError) throw new Error("Upload error: " + uploadError.message);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(fileName);

      // 3. Send Message with image_url
      const { data: chat, error: chatError } = await supabase.from('chats').select('user1_id, user2_id').eq('id', chatId).single();
      if (chatError) throw new Error("Chat fetch error: " + chatError.message);

      const receiverId = chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;

      const { data: newMsg, error: insertError } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: '📷 صورة',
        image_url: publicUrl
      }).select().single();

      if (insertError) throw new Error("Insert error: " + insertError.message);

      if (newMsg) {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("فشل إرسال الصورة: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReport = async () => {
    if (!reportTarget || !reportReason) return;
    setIsSubmittingReport(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // If it's dummy data, just simulate a successful network request
      if (reportTarget === 'chat' || (reportTarget.id && String(reportTarget.id).startsWith('msg-'))) {
        // Send to Telegram via our server API
        await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_id: reportTarget.id || null,
            sender_id: reportTarget.sender_id || 'Dummy User',
            receiver_id: user?.id || 'Anonymous',
            reason: reportReason,
            text: reportTarget.content || null
          })
        });
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        // Real database insert
        const { error } = await supabase
          .from('reports')
          .insert({
            message_id: reportTarget.id || null,
            sender_id: reportTarget.sender_id || null,
            receiver_id: user?.id || null, // The person reporting
            reason: reportReason,
          });

        if (error) throw error;

        // Also notify Telegram
        await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_id: reportTarget.id || null,
            sender_id: reportTarget.sender_id || null,
            receiver_id: user?.id || null,
            reason: reportReason,
            text: reportTarget.content || null
          })
        });
      }

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('حدث خطأ أثناء إرسال البلاغ. يرجى المحاولة مرة أخرى.');
    } finally {
      // Reset state
      setIsSubmittingReport(false);
      setReportTarget(null);
      setReportReason('');
    }
  };

  return (
    <div className="bg-background flex justify-center items-center min-h-screen overflow-hidden">
      <main className="w-full max-w-[390px] h-[100dvh] flex flex-col relative overflow-hidden bg-background">
        {/* Header */}
        <header className="w-full z-50 flex justify-between items-center px-6 py-5 shrink-0 border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white/70 hover:text-white transition-colors p-2 -mr-2">
              <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-primary to-secondary">
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-surface-container-high flex items-center justify-center">
                  {otherUserProfile?.avatar_url ? (
                    <img src={otherUserProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-white/30 text-xl">person</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-white text-sm font-bold">{otherUserProfile?.username || 'مستخدم مجهول'}</h1>
                <span className="text-primary text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  نشط الآن
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setReportTarget('chat')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="إبلاغ"
            >
              <span className="material-symbols-outlined text-lg">flag</span>
            </button>
          </div>
        </header>

        {/* Main Content Canvas */}
        <section className="flex-1 px-4 overflow-y-auto no-scrollbar flex flex-col gap-4 py-4 chat-scroll">
          {/* Ice Breaker Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-3xl bg-white/5 p-6 flex flex-col items-center text-center gap-3 border border-white/5 mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
            </div>
            <p className="text-white font-bold text-sm">
              {otherUserProfile?.bio ? `"${otherUserProfile.bio}"` : 'ابدأ المحادثة بشيء مميز!'}
            </p>
            <p className="text-white/40 text-[10px] font-medium">
              {otherUserProfile?.bio ? 'نبذة عن المستخدم' : 'نصيحة لكسر الجليد'}
            </p>
          </motion.div>

          {/* Messages Timeline */}
          <div className="flex flex-col gap-3 flex-1">
            {messages.length > 0 && (
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/30 font-bold uppercase tracking-wider">اليوم</span>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-30 mt-10">
                <span className="material-symbols-outlined text-6xl">chat_bubble</span>
                <p className="text-sm font-bold">لا توجد رسائل بعد</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-1`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                      isMine 
                        ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-br-none' 
                        : 'bg-surface-container-high text-white/90 rounded-bl-none border border-white/5'
                    }`}>
                      {msg.image_url ? (
                        <div className="flex flex-col gap-2">
                          <img 
                            src={msg.image_url} 
                            alt="صورة" 
                            className="rounded-xl max-w-full h-auto max-h-[250px] object-cover cursor-pointer hover:brightness-110 transition-all" 
                            onClick={() => window.open(msg.image_url, '_blank')} 
                            referrerPolicy="no-referrer"
                          />
                          {msg.content !== '📷 صورة' && <span className="px-1">{msg.content}</span>}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    
                    {!isMine && (
                      <button 
                        onClick={() => setReportTarget(msg)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all mb-1"
                      >
                        <span className="material-symbols-outlined text-sm">flag</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-white/20 px-2 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            <AnimatePresence>
              {isOtherTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-start gap-1"
                >
                  <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-white/5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Bottom Action Layer */}
        <footer className="w-full px-6 py-4 pb-8 shrink-0 bg-background">
          <div className="flex justify-center mb-4">
            <button onClick={onBack} className="text-white/40 hover:text-white text-xs flex items-center gap-1.5 transition-colors">
              <span className="material-symbols-outlined text-[14px]">shuffle</span>
              <span>تخطي ومحادثة شخص آخر</span>
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2 bg-white/5 rounded-full p-1 pr-2 border border-white/5 focus-within:border-white/20 transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !chatId}
              className="p-2 text-white/50 hover:text-white transition-colors disabled:opacity-50 shrink-0"
              title="إرفاق صورة"
            >
              {isUploading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">image</span>
              )}
            </button>
            <input 
              className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-0 py-3 px-2" 
              placeholder="اكتب رسالة..." 
              type="text" 
              value={inputText}
              onChange={handleTyping}
              disabled={!chatId}
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || !chatId}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center transition-transform active:scale-95 shrink-0 disabled:opacity-50 ml-1"
            >
              <span className="material-symbols-outlined text-sm rtl:-rotate-180">send</span>
            </button>
          </form>
        </footer>

        {/* Report Modal */}
        <AnimatePresence>
          {reportTarget && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#1a1d24] w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 border border-white/10 shadow-2xl"
              >
                <h3 className="text-white font-bold text-lg">
                  {reportTarget === 'chat' ? 'الإبلاغ عن المستخدم' : 'الإبلاغ عن رسالة'}
                </h3>
                <p className="text-white/50 text-sm">لماذا تريد الإبلاغ؟ لن يتم إعلام الشخص الآخر.</p>
                
                <div className="flex flex-col gap-2 mt-2">
                  {['محتوى غير لائق', 'إزعاج أو بريد مزعج', 'مضايقة أو تنمر', 'أخرى'].map(reason => (
                    <button
                      key={reason}
                      onClick={() => setReportReason(reason)}
                      className={`px-4 py-3 rounded-xl text-sm text-right transition-colors ${reportReason === reason ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'}`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => {
                      setReportTarget(null);
                      setReportReason('');
                    }}
                    className="flex-1 py-3 text-white/50 hover:text-white text-sm font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={handleReport}
                    disabled={!reportReason || isSubmittingReport}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors flex justify-center items-center"
                  >
                    {isSubmittingReport ? (
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    ) : (
                      'إرسال البلاغ'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1a1d24] border border-white/10 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50"
            >
              <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
              <span className="text-sm whitespace-nowrap">تم إرسال البلاغ بنجاح</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
