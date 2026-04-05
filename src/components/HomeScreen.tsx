import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
}

interface Interest {
  id: string;
  name: string;
  icon: string;
}

export default function HomeScreen({ onSearch, onNav }: { onSearch: () => void, onNav: (screen: string) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user && isMounted) {
          // Check if banned
          const { data: banData } = await supabase.from('banned_users').select('id').eq('user_id', user.id).single();
          if (banData) {
            setIsBanned(true);
            return;
          }

          if (user.email === 'smoorahmad6@gmail.com') {
            setIsAdmin(true);
          }

          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) throw profileError;
          if (isMounted) setProfile(profileData);

          const { data: interestsData, error: interestsError } = await supabase
            .from('user_interests')
            .select(`
              interests (
                id,
                name,
                icon
              )
            `)
            .eq('user_id', user.id);
            
          if (interestsError) throw interestsError;
          
          if (interestsData && isMounted) {
            const extractedInterests = interestsData
              .map((item: any) => item.interests)
              .filter(Boolean) as Interest[];
            setInterests(extractedInterests);
          }
        }
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false; // Cleanup function to prevent memory leaks
    };
  }, []);

  if (isBanned) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center max-w-[390px] mx-auto px-6 text-center">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">block</span>
        <h1 className="text-white font-bold text-xl mb-2">تم حظر حسابك</h1>
        <p className="text-white/60 text-sm">لقد تم حظر حسابك نهائياً بسبب انتهاك شروط الاستخدام أو بناءً على بلاغات من مستخدمين آخرين.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center max-w-[390px] mx-auto relative overflow-x-hidden">
      {/* Top Bar Component */}
      <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-secondary">
            <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center border-2 border-background">
              {profile?.avatar_url ? (
                <img className="w-full h-full object-cover" alt="User" src={profile.avatar_url} />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{profile?.username || 'مستخدم'}</span>
            <span className="text-[10px] text-primary font-medium">نشط الآن</span>
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => onNav('admin')}
              aria-label="لوحة الإدارة" 
              className="relative w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            </button>
          )}
          <button aria-label="الإشعارات" className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">notifications_none</span>
          </button>
        </div>
      </header>

      <main className="w-full pb-32 flex flex-grow flex-col">
        {/* Stories Section */}
        <div className="w-full px-6 mb-8">
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary/50 to-secondary/50 border-2 border-dashed border-white/10">
                <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">add</span>
                </div>
              </div>
              <span className="text-[10px] text-white/50 font-medium">قصتي</span>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-secondary">
                  <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                    <img src={`https://picsum.photos/seed/story${i}/100/100`} alt="Story" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <span className="text-[10px] text-white/70 font-medium">مستخدم {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 flex flex-col gap-8 flex-grow">
          {/* Status Card - Simplified */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></span>
                <span className="text-sm font-bold text-white">اكتشف العالم</span>
              </div>
              <p className="text-[11px] text-white/50">هناك أكثر من ٥٠٠ شخص متصل الآن</p>
            </div>
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-background overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/50/50`} alt="Online" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Center Search Area */}
          <div className="flex-grow flex flex-col items-center justify-center py-6 relative">
            {/* Pulsing Background Elements */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] animate-pulse"></div>
              <div className="w-[200px] h-[200px] bg-secondary/10 rounded-full blur-[60px] delay-1000 animate-pulse"></div>
            </div>

            {/* The Big Search Button */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group cursor-pointer" 
              onClick={onSearch}
            >
              <div className="absolute -inset-6 bg-gradient-to-br from-primary to-secondary rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative w-[200px] h-[200px] rounded-full bg-gradient-to-br from-primary to-secondary p-1 shadow-[0_0_60px_rgba(124,58,237,0.4)] flex flex-col items-center justify-center gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-full h-full rounded-full bg-background/20 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <motion.span 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="material-symbols-outlined text-white text-[56px]" 
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    rocket_launch
                  </motion.span>
                  <span className="text-white font-bold text-xl tracking-wide">ابدأ البحث</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center max-w-[260px]"
            >
              <p className="text-white/70 text-sm leading-relaxed font-medium">اضغط للبحث عن صديق يشاركك اهتماماتك المفضلة</p>
            </motion.div>
          </div>

          {/* Interests Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">اهتماماتي المفضلة</h3>
              <button onClick={() => onNav('interests')} className="text-xs text-primary font-bold px-3 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">تعديل</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {interests.length > 0 ? (
                interests.map((interest, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex-shrink-0 bg-white/5 border border-white/5 text-white/90 px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2.5 whitespace-nowrap hover:bg-white/10 transition-colors"
                  >
                    <span className="text-lg">{interest.icon}</span>
                    <span className="font-medium">{interest.name}</span>
                  </motion.div>
                ))
              ) : (
                <div className="w-full p-6 rounded-3xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-white/20">auto_awesome</span>
                  <p className="text-xs text-white/40 font-medium">أضف اهتماماتك للحصول على نتائج أفضل</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav Bar Component */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 bg-[#10141a]/80 backdrop-blur-xl px-4 py-4 flex justify-around items-center">
        <motion.a 
          whileTap={{ scale: 0.9 }}
          href="#" 
          className="flex flex-col items-center justify-center bg-gradient-to-br from-[#7c3aed] to-[#d2bbff] text-white rounded-2xl px-5 py-2 scale-110 duration-300"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] mt-1 font-bold">الرئيسية</span>
        </motion.a>
        <motion.a 
          whileTap={{ scale: 0.9 }}
          href="#" 
          onClick={(e) => { e.preventDefault(); onNav('chats'); }}
          className="flex flex-col items-center justify-center text-white/50 px-5 py-2 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-[10px] mt-1">المحادثات</span>
        </motion.a>
        <motion.a 
          whileTap={{ scale: 0.9 }}
          href="#" 
          onClick={(e) => { e.preventDefault(); onNav('profile'); }} 
          className="flex flex-col items-center justify-center text-white/50 px-5 py-2 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] mt-1">الملف الشخصي</span>
        </motion.a>
      </nav>
    </div>
  );
}

