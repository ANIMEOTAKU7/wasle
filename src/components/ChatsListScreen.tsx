import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface ChatItem {
  id: string;
  created_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

export default function ChatsListScreen({ onChatSelect, onBack, onNav }: { onChatSelect: (id: string) => void, onBack: () => void, onNav: (screen: string) => void }) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
  const channelsRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        // Fetch chats where user is participant
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select(`
            id,
            created_at,
            user1_id,
            user2_id
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (chatsError) throw chatsError;

        // Fetch muted chats (if table exists, otherwise fallback to empty)
        try {
          const { data: mutesData } = await supabase
            .from('chat_mutes')
            .select('chat_id')
            .eq('user_id', user.id);
          if (mutesData) {
            setMutedChats(new Set(mutesData.map(m => m.chat_id)));
          }
        } catch (e) {
          console.log('chat_mutes table might not exist yet');
        }

        if (chatsData) {
          const formattedChats = await Promise.all(chatsData.map(async (chat) => {
            const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
            
            // Get other user profile
            const { data: profile } = await supabase
              .from('users')
              .select('id, username, avatar_url')
              .eq('id', otherUserId)
              .single();

            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              id: chat.id,
              created_at: chat.created_at,
              other_user: profile || { id: otherUserId, username: 'مستخدم' },
              last_message: lastMessage || undefined
            };
          }));

          setChats(formattedChats);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Set up real-time subscription for new messages and new chats
    if (!channelsRef.current.presence) {
      const presenceChannel = supabase.channel('online-users');
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const onlineIds = new Set<string>();
          for (const key in state) {
            state[key].forEach((presence: any) => {
              if (presence.user_id) {
                onlineIds.add(presence.user_id);
              }
            });
          }
          setOnlineUsers(onlineIds);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              await presenceChannel.track({ user_id: session.user.id });
            }
          }
        });
      channelsRef.current.presence = presenceChannel;
    }

    if (!channelsRef.current.messages) {
      const messagesChannel = supabase
        .channel('public:messages_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            const newMessage = payload.new;
            
            setChats((prevChats) => {
              const chatIndex = prevChats.findIndex(c => c.id === newMessage.chat_id);
              
              if (chatIndex !== -1) {
                const updatedChats = [...prevChats];
                updatedChats[chatIndex] = {
                  ...updatedChats[chatIndex],
                  last_message: {
                    content: newMessage.content,
                    created_at: newMessage.created_at
                  }
                };

                // Re-sort chats by last message time
                return updatedChats.sort((a, b) => {
                  const timeA = new Date(a.last_message?.created_at || a.created_at).getTime();
                  const timeB = new Date(b.last_message?.created_at || b.created_at).getTime();
                  return timeB - timeA;
                });
              }
              return prevChats;
            });
          }
        )
        .subscribe();
      channelsRef.current.messages = messagesChannel;
    }

    if (!channelsRef.current.chats) {
      const chatsChannel = supabase
        .channel('public:chats_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chats'
          },
          async (payload) => {
            const newChat = payload.new;
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) return;

            // Check if I am part of this new chat
            if (newChat.user1_id === user.id || newChat.user2_id === user.id) {
              const otherUserId = newChat.user1_id === user.id ? newChat.user2_id : newChat.user1_id;
              
              // Get other user profile
              const { data: profile } = await supabase
                .from('users')
                .select('id, username, avatar_url')
                .eq('id', otherUserId)
                .single();

              const formattedNewChat: ChatItem = {
                id: newChat.id,
                created_at: newChat.created_at,
                other_user: profile || { id: otherUserId, username: 'مستخدم' },
              };

              setChats(prev => {
                // Avoid duplicates
                if (prev.some(c => c.id === formattedNewChat.id)) return prev;
                return [formattedNewChat, ...prev];
              });
            }
          }
        )
        .subscribe();
      channelsRef.current.chats = chatsChannel;
    }

    return () => {
      const channels = channelsRef.current;
      if (channels.presence) supabase.removeChannel(channels.presence);
      if (channels.messages) supabase.removeChannel(channels.messages);
      if (channels.chats) supabase.removeChannel(channels.chats);
      channelsRef.current = {};
    };
  }, []);

  const handleMuteChat = async (chatId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const isMuted = mutedChats.has(chatId);
    try {
      if (isMuted) {
        await supabase.from('chat_mutes').delete().match({ chat_id: chatId, user_id: session.user.id });
        setMutedChats(prev => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });
      } else {
        await supabase.from('chat_mutes').insert({ chat_id: chatId, user_id: session.user.id });
        setMutedChats(prev => new Set([...prev, chatId]));
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      // Fallback: just toggle locally if table missing
      setMutedChats(prev => {
        const next = new Set(prev);
        if (isMuted) next.delete(chatId);
        else next.add(chatId);
        return next;
      });
    }
    setActiveMenuChatId(null);
  };

  const handleBlockUser = async (otherUserId: string, chatId: string) => {
    if (!window.confirm('هل أنت متأكد من حظر هذا المستخدم؟ لن تتمكن من مراسلته مرة أخرى.')) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: session.user.id,
        blocked_id: otherUserId
      });
      if (error) throw error;

      // Optionally delete the chat or just hide it
      setChats(prev => prev.filter(c => c.id !== chatId));
      alert('تم حظر المستخدم بنجاح');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('حدث خطأ أثناء حظر المستخدم');
    }
    setActiveMenuChatId(null);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col items-center max-w-[390px] mx-auto relative overflow-hidden">
      {/* Top Bar */}
      <header className="w-full max-w-[390px] z-50 flex items-center justify-between px-6 py-6 border-b border-outline-variant bg-background/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight">المحادثات</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
        </div>
      </header>

      <main className="w-full px-4 py-6 flex-grow overflow-y-auto custom-scrollbar pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
            <p className="text-on-surface-variant text-sm font-medium animate-pulse">جاري تحميل المحادثات...</p>
          </div>
        ) : chats.length > 0 ? (
          <div className="flex flex-col gap-2">
            {chats.map((chat, idx) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChatSelect(chat.id)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant active:bg-surface-container-highest"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                    {chat.other_user.avatar_url ? (
                      <img src={chat.other_user.avatar_url} alt={chat.other_user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-2xl">person</span>
                    )}
                  </div>
                  {onlineUsers.has(chat.other_user.id) && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-surface"></div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-on-surface font-bold text-base truncate tracking-tight">
                      {chat.other_user.username}
                      {mutedChats.has(chat.id) && (
                        <span className="material-symbols-outlined text-xs text-on-surface-variant ms-1 align-middle">notifications_off</span>
                      )}
                    </h3>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {new Date(chat.last_message?.created_at || chat.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-on-surface-variant truncate">
                      {chat.last_message?.content || 'ابدأ المحادثة الآن...'}
                    </p>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                        }}
                        className="p-1 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                      </button>

                      <AnimatePresence>
                        {activeMenuChatId === chat.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute left-0 bottom-full mb-2 w-48 bg-surface-container-highest border border-outline-variant rounded-2xl shadow-2xl z-[60] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              onClick={() => handleMuteChat(chat.id)}
                              className="w-full px-4 py-3 text-right text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-3"
                            >
                              <span className="material-symbols-outlined text-lg">
                                {mutedChats.has(chat.id) ? 'notifications_active' : 'notifications_off'}
                              </span>
                              {mutedChats.has(chat.id) ? 'إلغاء كتم التنبيهات' : 'كتم التنبيهات'}
                            </button>
                            <button 
                              onClick={() => handleBlockUser(chat.other_user.id, chat.id)}
                              className="w-full px-4 py-3 text-right text-sm font-medium hover:bg-error/10 text-error transition-colors flex items-center gap-3 border-t border-outline-variant"
                            >
                              <span className="material-symbols-outlined text-lg">block</span>
                              حظر المستخدم
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-on-surface-variant text-4xl">chat_bubble</span>
            </div>
            <h3 className="text-on-surface font-bold text-lg mb-2 tracking-tight">لا توجد محادثات</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">ابدأ بالبحث عن أشخاص جدد لتظهر محادثاتهم هنا وتبدأ التواصل</p>
            <button 
              onClick={() => onNav('home')}
              className="mt-8 px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
            >
              ابحث الآن
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 bg-surface/90 backdrop-blur-md px-4 py-3 flex justify-around items-center border-t border-outline-variant">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('home')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center justify-center text-primary px-5 py-2 relative"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
          <span className="text-[10px] mt-1 font-bold">المحادثات</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('profile')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] mt-1 font-medium">الملف الشخصي</span>
        </motion.button>
      </nav>
    </div>
  );
}
