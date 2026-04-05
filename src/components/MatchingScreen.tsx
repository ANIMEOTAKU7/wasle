import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_CONSTANTS } from '../constants';
import { supabase } from '../lib/supabase';

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
        const { data: { user } } = await supabase.auth.getUser();
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
    <div className="bg-background flex justify-center items-center min-h-screen overflow-hidden">
      <main className="w-full max-w-[390px] h-[100dvh] relative flex flex-col bg-background overflow-hidden">
        {/* TopAppBar */}
        <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6 border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">إلغاء</button>
          <div className="flex flex-col items-center">
            <h1 className="text-white font-black text-sm tracking-tight">جاري البحث</h1>
            <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">Matching</span>
          </div>
          <div className="w-10 flex justify-end">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"
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

            {/* Rotating Radar Sweep */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute w-72 h-72 rounded-full border border-primary/5 bg-gradient-to-tr from-primary/20 to-transparent"
              style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}
            />

            {/* User Avatar (Center) */}
            <div className="relative z-10">
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse"></div>
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary relative z-10 shadow-[0_0_50px_rgba(124,58,237,0.4)]"
              >
                <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-white/20">person</span>
                </div>
              </motion.div>
            </div>

            {/* Floating "Potential Matches" dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                  x: Math.sin(i * 45 * (Math.PI / 180)) * 140,
                  y: Math.cos(i * 45 * (Math.PI / 180)) * 140
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
                className="absolute w-2.5 h-2.5 bg-primary rounded-full blur-[1px] shadow-[0_0_10px_#7c3aed]"
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
              <h2 className="text-2xl font-black text-white tracking-tight">نبحث عن <span className="text-primary">شريكك</span> المثالي</h2>
              <p className="text-white/40 text-xs font-bold leading-relaxed">نقوم الآن بتحليل اهتماماتك للعثور على شخص يشاركك نفس الشغف</p>
            </motion.div>
            
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Controls */}
        <footer className="p-8 pb-12 space-y-6 z-10 border-t border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">وقت الانتظار</span>
            <div className="font-mono text-xl font-black text-white tracking-widest" dir="ltr">
              {formatTime(seconds)}
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="w-full py-5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 active:scale-95"
          >
            إلغاء البحث والعودة
          </button>
        </footer>
      </main>
    </div>
  );
}


