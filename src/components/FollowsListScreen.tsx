import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

import { sendNotification } from '../lib/notifications';

interface FollowUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface FollowsListScreenProps {
  userId: string;
  type: 'followers' | 'following';
  onBack: () => void;
  onUserClick?: (userId: string) => void;
}

export default function FollowsListScreen({ userId, type, onBack, onUserClick }: FollowsListScreenProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserFollowing();
  }, [userId, type]);

  const fetchCurrentUserFollowing = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id);
    
    if (data) {
      setCurrentUserFollowing(new Set(data.map(f => f.following_id)));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query;
      
      if (type === 'followers') {
        query = supabase
          .from('follows')
          .select(`
            profiles:follower_id ( id, display_name, username, avatar_url, bio )
          `)
          .eq('following_id', userId);
      } else {
        query = supabase
          .from('follows')
          .select(`
            profiles:following_id ( id, display_name, username, avatar_url, bio )
          `)
          .eq('follower_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const formattedUsers = data.map((item: any) => item.profiles).filter(Boolean);
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching follows list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const isFollowing = currentUserFollowing.has(targetUserId);
    
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: targetUserId });
        setCurrentUserFollowing(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        await supabase.from('follows').insert({ follower_id: session.user.id, following_id: targetUserId });
        setCurrentUserFollowing(prev => new Set([...prev, targetUserId]));

        // Send notification
        const { data: profile } = await supabase.from('profiles').select('display_name, username').eq('id', session.user.id).single();
        const senderName = profile?.display_name || profile?.username || 'مستخدم جديد';
        
        await sendNotification(
          targetUserId,
          'follow',
          `قام ${senderName} بمتابعتك`,
          session.user.id,
          { follower_id: session.user.id }
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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
          <h1 className="font-bold text-sm text-on-surface tracking-tight">
            {type === 'followers' ? 'المتابعون' : 'أتابع'}
          </h1>
        </div>
        <div className="w-10"></div>
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">group_off</span>
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">
              {type === 'followers' ? 'لا يوجد متابعون بعد' : 'لا تتابع أحداً بعد'}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, idx) => (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 bg-surface border border-outline-variant rounded-2xl hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => onUserClick?.(user.id)}>
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">{user.display_name || user.username}</span>
                    <span className="text-[10px] text-on-surface-variant">@{user.username}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleFollowToggle(user.id)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${currentUserFollowing.has(user.id) ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant' : 'bg-primary text-white hover:bg-primary/90'}`}
                >
                  {currentUserFollowing.has(user.id) ? 'متابع' : 'متابعة'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
