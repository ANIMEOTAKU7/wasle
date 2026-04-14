import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_CONSTANTS } from '../constants';
import { supabase } from '../lib/supabase';

import { sendNotification } from '../lib/notifications';

export default function MatchingScreen({ onCancel, onMatch }: { onCancel: () => void, onMatch: (chatId: string) => void }) {
  const [seconds, setSeconds] = useState(0);
  const onMatchRef = useRef(onMatch);

  // Update ref when prop changes to avoid re-triggering the effect
  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    
    // Simulate finding a match and create a real chat in Supabase
    const findMatch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
        if (!user) {
          console.error("User not authenticated");
          return;
        }

        // 1. Get my interests
        const { data: myInterests } = await supabase
          .from('user_interests')
          .select('interest_id')
          .eq('user_id', user.id);
        
        let otherUserId = null;

        if (myInterests && myInterests.length > 0) {
          const myInterestIds = myInterests.map(i => i.interest_id);
          
          // Find another user with shared interests
          const { data: sharedUsers, error: sharedError } = await supabase
            .from('user_interests')
            .select('user_id')
            .neq('user_id', user.id)
            .in('interest_id', myInterestIds)
            .limit(1);
            
          if (sharedUsers && sharedUsers.length > 0) {
            otherUserId = sharedUsers[0].user_id;
          }
        }
        
        // Fallback: if no one with shared interests, just find anyone
        if (!otherUserId) {
           const { data: otherUsers } = await supabase
             .from('profiles')
             .select('id')
             .neq('id', user.id)
             .limit(1);
           if (otherUsers && otherUsers.length > 0) {
             otherUserId = otherUsers[0].id;
           }
        }

        if (!otherUserId) {
          console.log("No other users found to match with. Waiting...");
          return; // Will try again in the next interval
        }

        // 2. Check if a chat already exists between these two users
        const { data: existingChats, error: chatError } = await supabase
          .from('chats')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
          .order('created_at', { ascending: true })
          .limit(1);

        if (chatError) throw chatError;

        if (existingChats && existingChats.length > 0) {
          onMatchRef.current(existingChats[0].id);
        } else {
          // Prevent race condition: only the user with the smaller ID creates the chat
          const isInitiator = user.id < otherUserId;
          
          if (isInitiator) {
            // 3. Create a new chat
            const { data: newChat, error: insertError } = await supabase
              .from('chats')
              .insert({ user1_id: user.id, user2_id: otherUserId })
              .select()
              .single();

            if (insertError) throw insertError;
            if (newChat) {
              // Send notification to the other user
              const { data: myProfile } = await supabase.from('profiles').select('display_name, username').eq('id', user.id).single();
              const myName = myProfile?.display_name || myProfile?.username || 'مستخدم جديد';
              
              await sendNotification(
                otherUserId,
                'match',
                `لديك تطابق جديد مع ${myName}! ابدأ المحادثة الآن.`,
                user.id,
                { chat_id: newChat.id }
              );

              onMatchRef.current(newChat.id);
            }
          } else {
            // Wait for the initiator to create the chat. We will find it in the next polling interval.
            console.log("Waiting for initiator to create the chat...");
            return;
          }
        }
      } catch (error) {
        console.error("Error finding match:", error);
      }
    };

    // Poll every 3 seconds to find a match
    const matchInterval = setInterval(() => {
      findMatch();
    }, 3000);

    // Also try immediately once
    findMatch();

    return () => {
      clearInterval(timer);
      clearInterval(matchInterval);
    };
  }, []); // Empty dependency array prevents infinite re-renders

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const formatNum = (n: number) => n.toString().padStart(2, '0').split('').map(d => arabicNums[parseInt(d)]).join('');
    return `${formatNum(m)}:${formatNum(s)}`;
  };

  return (
    <div className="bg-background flex justify-center items-center min-h-screen overflow-hidden text-on-surface">
      <main className="w-full max-w-[390px] h-[100dvh] relative flex flex-col bg-background overflow-hidden">
        {/* TopAppBar */}
        <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6 border-b border-outline-variant bg-background/90 backdrop-blur-md">
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface transition-colors text-xs font-bold uppercase tracking-widest">إلغاء</button>
          <div className="flex flex-col items-center">
            <h1 className="text-on-surface font-bold text-sm tracking-tight">جاري البحث</h1>
            <span className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] animate-pulse">Matching</span>
          </div>
          <div className="w-10 flex justify-end">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant"
            >
              <span className="material-symbols-outlined text-primary text-lg">explore</span>
            </motion.div>
          </div>
        </header>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col items-center justify-center px-8 relative">
          {/* Radar Animation Center */}
          <div className="relative w-full aspect-square flex items-center justify-center mb-12">
            {/* Radar Rings */}
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: "easeOut"
                }}
                className="absolute w-40 h-40 border border-primary/20 rounded-full"
              />
            ))}

            {/* User Avatar (Center) */}
            <div className="relative z-10">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-28 h-28 rounded-full bg-surface-container-highest relative z-10 shadow-lg border-4 border-background overflow-hidden flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
              </motion.div>
            </div>

            {/* Floating "Potential Matches" dots */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  x: Math.sin(i * 60 * (Math.PI / 180)) * 120,
                  y: Math.cos(i * 60 * (Math.PI / 180)) * 120
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
                className="absolute w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>

          {/* Matching Status Text */}
          <div className="text-center space-y-4 mb-10 z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">نبحث عن <span className="text-primary">شريكك</span> المثالي</h2>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed">نقوم الآن بتحليل اهتماماتك للعثور على شخص يشاركك نفس الشغف</p>
            </motion.div>
            
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Controls */}
        <footer className="p-8 pb-12 space-y-6 z-10 border-t border-outline-variant bg-background/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">وقت الانتظار</span>
            <div className="font-mono text-xl font-bold text-on-surface tracking-widest" dir="ltr">
              {formatTime(seconds)}
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="w-full py-4 bg-surface hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-sm font-bold rounded-xl transition-all border border-outline-variant active:scale-95"
          >
            إلغاء البحث والعودة
          </button>
        </footer>
      </main>
    </div>
  );
}


