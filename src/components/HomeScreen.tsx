import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

interface Story {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  imageUrl: string;
  timestamp: string;
  viewed: boolean;
}

const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    userId: 'u1',
    username: 'أحمد',
    avatar: 'https://picsum.photos/seed/user1/50/50',
    imageUrl: 'https://picsum.photos/seed/story1/400/800',
    timestamp: new Date().toISOString(),
    viewed: false
  },
  {
    id: 's2',
    userId: 'u2',
    username: 'سارة',
    avatar: 'https://picsum.photos/seed/user2/50/50',
    imageUrl: 'https://picsum.photos/seed/story2/400/800',
    timestamp: new Date().toISOString(),
    viewed: false
  },
  {
    id: 's3',
    userId: 'u3',
    username: 'محمد',
    avatar: 'https://picsum.photos/seed/user3/50/50',
    imageUrl: 'https://picsum.photos/seed/story3/400/800',
    timestamp: new Date().toISOString(),
    viewed: true
  }
];

export default function HomeScreen({ onSearch, onNav }: { onSearch: () => void, onNav: (screen: string) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const channelRef = useRef<any>(null);

  // Stories State
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [newStoryUrl, setNewStoryUrl] = useState('');
  const [storyProgress, setStoryProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        const user = session?.user;
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

          // Fetch unread notifications count
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);
          
          if (isMounted) setUnreadCount(count || 0);

          // Subscribe to notifications for real-time badge
          if (!channelRef.current) {
            const channelName = `unread-notifications-${Math.random().toString(36).substring(2, 9)}`;
            const channel = supabase
              .channel(channelName)
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
              }, () => {
                // Re-fetch count on any change
                supabase
                  .from('notifications')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user.id)
                  .eq('read', false)
                  .then(({ count }) => {
                    if (isMounted) setUnreadCount(count || 0);
                  });
              });
            
            channel.subscribe();
            channelRef.current = channel;
          }

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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Story Progress Effect
  useEffect(() => {
    let timer: any;
    if (activeStoryIndex !== null) {
      setStoryProgress(0);
      timer = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            handleNextStory();
            return 100;
          }
          return prev + 2; // 5 seconds total (100 / 2 = 50 steps of 100ms)
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [activeStoryIndex]);

  const handleNextStory = () => {
    if (activeStoryIndex !== null) {
      if (activeStoryIndex < stories.length - 1) {
        setActiveStoryIndex(activeStoryIndex + 1);
      } else {
        setActiveStoryIndex(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null) {
      if (activeStoryIndex > 0) {
        setActiveStoryIndex(activeStoryIndex - 1);
      } else {
        setStoryProgress(0);
      }
    }
  };

  const handleOpenStory = (index: number) => {
    const updatedStories = [...stories];
    updatedStories[index].viewed = true;
    setStories(updatedStories);
    setActiveStoryIndex(index);
  };

  const handleAddStory = () => {
    if (!newStoryUrl.trim()) return;
    const newStory: Story = {
      id: Date.now().toString(),
      userId: profile?.id || 'me',
      username: profile?.username || 'قصتي',
      avatar: profile?.avatar_url || '',
      imageUrl: newStoryUrl,
      timestamp: new Date().toISOString(),
      viewed: true
    };
    setStories([newStory, ...stories]);
    setNewStoryUrl('');
    setShowStoryCreator(false);
  };

  if (isBanned) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center max-w-[390px] mx-auto px-6 text-center">
        <span className="material-symbols-outlined text-error text-6xl mb-4">block</span>
        <h1 className="text-on-surface font-bold text-xl mb-2">تم حظر حسابك</h1>
        <p className="text-on-surface-variant text-sm">لقد تم حظر حسابك نهائياً بسبب انتهاك شروط الاستخدام أو بناءً على بلاغات من مستخدمين آخرين.</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col items-center max-w-[390px] mx-auto relative overflow-x-hidden">
      {/* Top Bar Component */}
      <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6 border-b border-outline-variant bg-background/90 backdrop-blur-md shrink-0">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img className="w-full h-full object-cover" alt="User" src={profile.avatar_url} />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-surface">{profile?.username || 'مستخدم'}</span>
            <span className="text-[10px] text-primary font-medium">نشط الآن</span>
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => onNav('admin')}
              aria-label="لوحة الإدارة" 
              className="relative w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            </button>
          )}
          <button 
            onClick={() => onNav('notifications')}
            aria-label="الإشعارات" 
            className="relative w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg">notifications_none</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-bold rounded-full border-2 border-background flex items-center justify-center animate-in zoom-in duration-300">
                {unreadCount > 9 ? '+٩' : unreadCount.toLocaleString('ar-EG')}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="w-full pb-32 flex flex-grow flex-col">
        {/* Stories Section */}
        <div className="w-full px-6 mb-6 mt-4">
          <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2">
            <div 
              onClick={() => setShowStoryCreator(true)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center bg-surface hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">add</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-medium">قصتي</span>
            </div>
            {stories.map((story, i) => (
              <div 
                key={story.id} 
                onClick={() => handleOpenStory(i)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full p-[2px] ${story.viewed ? 'bg-outline-variant' : 'bg-primary'}`}>
                  <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                    <img src={story.avatar} alt="Story" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-medium truncate w-16 text-center">{story.username}</span>
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
            className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-outline-variant"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-bold text-on-surface">اكتشف العالم</span>
              </div>
              <p className="text-xs text-on-surface-variant">هناك أكثر من ٥٠٠ شخص متصل الآن</p>
            </div>
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/50/50`} alt="Online" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Center Search Area */}
          <div className="flex-grow flex flex-col items-center justify-center py-6 relative">
            {/* The Big Search Button */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative cursor-pointer" 
              onClick={onSearch}
            >
              <div className="w-48 h-48 rounded-full bg-primary flex flex-col items-center justify-center gap-3 shadow-lg hover:bg-primary/90 transition-colors">
                <motion.span 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="material-symbols-outlined text-white text-5xl" 
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  rocket_launch
                </motion.span>
                <span className="text-white font-bold text-lg tracking-wide">ابدأ البحث</span>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center max-w-[260px]"
            >
              <p className="text-on-surface-variant text-sm leading-relaxed font-medium">اضغط للبحث عن صديق يشاركك اهتماماتك المفضلة</p>
            </motion.div>
          </div>

          {/* Interests Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">اهتماماتي المفضلة</h3>
              <button onClick={() => onNav('interests')} className="text-xs text-primary font-bold px-3 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">تعديل</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {interests.length > 0 ? (
                interests.map((interest, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex-shrink-0 bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-xl text-sm flex items-center gap-2 whitespace-nowrap hover:bg-surface-container-high transition-colors"
                  >
                    <span className="text-lg">{interest.icon}</span>
                    <span className="font-medium">{interest.name}</span>
                  </motion.div>
                ))
              ) : (
                <div className="w-full p-6 rounded-2xl bg-surface border border-dashed border-outline-variant flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant">auto_awesome</span>
                  <p className="text-xs text-on-surface-variant font-medium">أضف اهتماماتك للحصول على نتائج أفضل</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav Bar Component */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 bg-surface/90 backdrop-blur-md px-2 py-3 flex justify-around items-center border-t border-outline-variant">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center justify-center text-primary px-3 py-2 relative"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] mt-1 font-bold">الرئيسية</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('snippets')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">dynamic_feed</span>
          <span className="text-[10px] mt-1 font-medium">المقتطفات</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('chats')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          <span className="text-[10px] mt-1 font-medium">المحادثات</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('profile')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] mt-1 font-medium">الملف الشخصي</span>
        </motion.button>
      </nav>

      {/* Story Viewer Overlay */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col max-w-[390px] mx-auto"
          >
            {/* Progress Bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {stories.map((_, i) => (
                <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{ 
                      width: i === activeStoryIndex ? `${storyProgress}%` : i < activeStoryIndex ? '100%' : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <img src={stories[activeStoryIndex].avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-white/50" />
                <span className="text-white font-medium text-sm drop-shadow-md">{stories[activeStoryIndex].username}</span>
              </div>
              <button onClick={() => setActiveStoryIndex(null)} className="text-white p-1">
                <span className="material-symbols-outlined text-2xl drop-shadow-md">close</span>
              </button>
            </div>

            {/* Story Image */}
            <div className="flex-1 relative bg-surface-container-highest">
              <img 
                src={stories[activeStoryIndex].imageUrl} 
                alt="Story content" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Tap Zones */}
              <div className="absolute inset-0 flex">
                <div className="w-1/3 h-full" onClick={handlePrevStory} />
                <div className="w-2/3 h-full" onClick={handleNextStory} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Creator Modal */}
      <AnimatePresence>
        {showStoryCreator && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 max-w-[390px] mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-on-surface">إضافة قصة جديدة</h3>
                <button onClick={() => setShowStoryCreator(false)} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-on-surface-variant">رابط الصورة</label>
                <input 
                  type="url" 
                  value={newStoryUrl}
                  onChange={(e) => setNewStoryUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-on-surface"
                  dir="ltr"
                />
              </div>

              {newStoryUrl && (
                <div className="w-full h-48 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-highest">
                  <img src={newStoryUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}

              <button 
                onClick={handleAddStory}
                disabled={!newStoryUrl.trim()}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                نشر القصة
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

