import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'match' | 'system';
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    username: string;
    avatar_url: string;
  };
}

export default function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    fetchNotifications();
    
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      if (channelRef.current) return;

      const channelName = `notifications-${Math.random().toString(36).substring(2, 9)}`;
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        }, async (payload) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();
            
          const newNotification = {
            ...payload.new,
            sender: senderData
          } as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
        });
      
      channel.subscribe();
      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id (
            username,
            avatar_url
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setNotifications(data as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false);

      if (error) throw error;
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'like': return <span className="material-symbols-outlined text-error text-sm">favorite</span>;
      case 'comment': return <span className="material-symbols-outlined text-primary text-sm">chat_bubble</span>;
      case 'match': return <span className="material-symbols-outlined text-purple-500 text-sm">handshake</span>;
      default: return <span className="material-symbols-outlined text-on-surface-variant text-sm">notifications</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-[390px] mx-auto w-full relative bg-background overflow-hidden text-on-surface">
      {/* Top AppBar */}
      <header className="w-full top-0 sticky flex items-center justify-between px-6 h-20 bg-background/90 backdrop-blur-md z-50 border-b border-outline-variant shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-all active:scale-95 border border-outline-variant text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-xl rtl:rotate-180">arrow_back</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-sm text-on-surface tracking-tight">الإشعارات</h1>
        </div>
        <div className="w-10 flex justify-end">
          {notifications.some(n => !n.read) && (
            <button onClick={markAllAsRead} className="text-[10px] font-bold text-primary hover:underline">
              تحديد كمقروء
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 w-full flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">notifications_off</span>
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">لا توجد إشعارات</span>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, idx) => (
              <motion.div 
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex gap-4 p-4 rounded-2xl border ${notification.read ? 'bg-surface border-outline-variant' : 'bg-primary/5 border-primary/20'}`}
              >
                <div className="relative shrink-0">
                  {notification.sender ? (
                    <img src={notification.sender.avatar_url} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-outline-variant" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                      <span className="material-symbols-outlined text-on-surface-variant">campaign</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border-2 border-background flex items-center justify-center shadow-sm">
                    {getIconForType(notification.type)}
                  </div>
                </div>
                
                <div className="flex flex-col justify-center flex-1">
                  <p className={`text-sm leading-snug ${notification.read ? 'text-on-surface-variant' : 'text-on-surface font-bold'}`}>
                    {notification.content}
                  </p>
                  <span className="text-[10px] text-on-surface-variant mt-1 font-medium">
                    {new Date(notification.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {!notification.read && (
                  <div className="shrink-0 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
