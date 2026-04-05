import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../constants';

interface Interest {
  id: string;
  name: string;
  icon: string;
}

const DEFAULT_INTERESTS = [
  { name: 'كرة القدم', icon: '⚽' },
  { name: 'ألعاب', icon: '🎮' },
  { name: 'موسيقى', icon: '🎵' },
  { name: 'كتب', icon: '📚' },
  { name: 'أفلام', icon: '🎬' },
  { name: 'تقنية', icon: '💻' },
  { name: 'سفر', icon: '✈️' },
  { name: 'طبخ', icon: '🍳' },
  { name: 'تصوير', icon: '📸' },
  { name: 'فن', icon: '🎨' },
  { name: 'أنمي', icon: '🎌' },
  { name: 'برمجة', icon: '👨‍💻' },
  { name: 'قهوة', icon: '☕' },
  { name: 'سيارات', icon: '🚗' },
  { name: 'لياقة بدنية', icon: '💪' },
  { name: 'حيوانات أليفة', icon: '🐈' },
  { name: 'تطوير الذات', icon: '🌱' },
  { name: 'ريادة أعمال', icon: '💼' },
  { name: 'تاريخ', icon: '🏛️' },
  { name: 'لغات', icon: '🗣️' },
  { name: 'شعر وأدب', icon: '✒️' },
  { name: 'علوم', icon: '🔬' },
];

export default function InterestsScreen({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      // 1. Fetch existing interests
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name');
      
      if (error) throw error;

      // 2. If empty, seed the database with defaults
      if (!data || data.length === 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('interests')
          .insert(DEFAULT_INTERESTS)
          .select();
          
        if (insertError) throw insertError;
        if (insertedData) {
          setInterests(insertedData);
        }
      } else {
        setInterests(data);
      }
    } catch (error) {
      console.error('Error fetching/seeding interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < APP_CONSTANTS.MAX_INTERESTS) {
      setSelected([...selected, id]);
    }
  };

  const handleSaveInterests = async () => {
    if (selected.length < APP_CONSTANTS.MIN_INTERESTS) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const userInterests = selected.map(interestId => ({
          user_id: user.id,
          interest_id: interestId
        }));

        // Delete old interests
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id);

        // Insert new interests
        const { error } = await supabase
          .from('user_interests')
          .insert(userInterests);

        if (error) {
          alert("حدث خطأ في قاعدة البيانات: " + error.message);
          throw error;
        }
      }
      
      onNext();
    } catch (error: any) {
      console.error('Error saving interests:', error);
      alert("لم يتم حفظ الاهتمامات: " + (error.message || "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
      {/* Top Navigation */}
      <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6 shrink-0 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <motion.button 
          aria-label="العودة"
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="flex items-center justify-center text-white/70 hover:text-white transition-colors p-2 -mr-2"
        >
          <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
        </motion.button>
        <div className="text-lg font-black text-white tracking-tighter flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-white rotate-45"></div>
          </div>
          <span>واصل</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pt-10 pb-32 overflow-y-auto no-scrollbar">
        {/* Progress Indicator */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden flex" dir="ltr">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "66%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
            />
          </div>
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">الخطوة 2/3</span>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-black text-white mb-3 leading-tight">ما الذي <span className="text-primary">يهمك؟</span></h1>
          <p className="text-white/40 text-xs leading-relaxed font-medium">اختر من {APP_CONSTANTS.MIN_INTERESTS} إلى {APP_CONSTANTS.MAX_INTERESTS} اهتمامات لنجد لك أشخاصاً يشاركونك نفس الشغف</p>
        </motion.div>

        {/* Interests Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
            <p className="text-white/30 text-xs font-bold animate-pulse">جاري تحميل الاهتمامات...</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 mb-12">
            {interests.map((interest, idx) => {
              const isSelected = selected.includes(interest.id);
              return (
                <motion.div 
                  key={interest.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => toggleInterest(interest.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-2xl py-3 px-5 flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 border ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-primary to-secondary text-white border-transparent shadow-lg shadow-primary/20 scale-105' 
                      : 'bg-surface-container-high text-white/60 hover:text-white border-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{interest.icon}</span>
                  <span className="text-xs font-bold whitespace-nowrap">{interest.name}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Counter Indicator */}
        <div className="flex flex-col items-center justify-center gap-4 py-6 rounded-3xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest">تم اختيار</span>
            <span className={`text-lg font-black ${selected.length >= APP_CONSTANTS.MIN_INTERESTS ? 'text-primary' : 'text-white'}`}>
              {selected.length}
            </span>
            <span className="text-white/20 font-bold text-[10px] uppercase tracking-widest">من {APP_CONSTANTS.MAX_INTERESTS}</span>
          </div>
          <div className="flex gap-1.5" dir="ltr">
            {[...Array(APP_CONSTANTS.MAX_INTERESTS)].map((_, i) => (
              <motion.div 
                key={i} 
                animate={{ 
                  scale: i < selected.length ? 1.2 : 1,
                  backgroundColor: i < selected.length ? "#7c3aed" : "rgba(255,255,255,0.1)"
                }}
                className="w-2 h-2 rounded-full transition-colors duration-300"
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Shell */}
      <footer className="fixed bottom-0 w-full max-w-[390px] z-50 bg-background/80 backdrop-blur-xl pt-6 pb-10 px-6 border-t border-white/5">
        <motion.button 
          whileHover={selected.length >= APP_CONSTANTS.MIN_INTERESTS ? { scale: 1.02, y: -2 } : {}}
          whileTap={selected.length >= APP_CONSTANTS.MIN_INTERESTS ? { scale: 0.98 } : {}}
          onClick={selected.length >= APP_CONSTANTS.MIN_INTERESTS && !saving ? handleSaveInterests : undefined}
          className={`w-full flex items-center justify-center rounded-2xl py-4.5 transition-all duration-300 group shadow-xl ${
            selected.length >= APP_CONSTANTS.MIN_INTERESTS 
              ? 'bg-white text-black cursor-pointer shadow-white/10' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}>
          <div className="flex items-center gap-3">
            {saving ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <>
                <span className="font-black text-sm tracking-tight">حفظ والمتابعة</span>
                <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
              </>
            )}
          </div>
        </motion.button>
      </footer>

      {/* Background Decorative Elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-40 -left-20 w-80 h-80 bg-secondary-container/5 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}
