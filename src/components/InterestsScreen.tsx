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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
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
    <div className="flex flex-col min-h-screen max-w-[390px] mx-auto relative overflow-hidden bg-background text-on-surface">
      {/* Top Navigation */}
      <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6 shrink-0 bg-background/90 backdrop-blur-md border-b border-outline-variant">
        <motion.button 
          aria-label="العودة"
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors p-2 -mr-2"
        >
          <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
        </motion.button>
        <div className="text-lg font-bold tracking-tighter flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-white rotate-45"></div>
          </div>
          <span>واصل</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pt-8 pb-32 overflow-y-auto custom-scrollbar">
        {/* Progress Indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden flex" dir="ltr">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "66%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-primary h-full rounded-full"
            />
          </div>
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">الخطوة 2/3</span>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold mb-2">ما الذي يهمك؟</h1>
          <p className="text-on-surface-variant text-sm font-medium">اختر من {APP_CONSTANTS.MIN_INTERESTS} إلى {APP_CONSTANTS.MAX_INTERESTS} اهتمامات لنجد لك أشخاصاً يشاركونك نفس الشغف</p>
        </motion.div>

        {/* Interests Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
            <p className="text-on-surface-variant text-xs font-bold">جاري تحميل الاهتمامات...</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-10">
            {interests.map((interest, idx) => {
              const isSelected = selected.includes(interest.id);
              return (
                <motion.button 
                  key={interest.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => toggleInterest(interest.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 transition-all duration-200 border ${
                    isSelected 
                      ? 'bg-primary text-white border-transparent shadow-sm' 
                      : 'bg-surface text-on-surface-variant hover:text-on-surface border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-base">{interest.icon}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{interest.name}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Counter Indicator */}
        <div className="flex flex-col items-center justify-center gap-3 py-5 rounded-2xl bg-surface border border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-medium text-xs">تم اختيار</span>
            <span className={`text-base font-bold ${selected.length >= APP_CONSTANTS.MIN_INTERESTS ? 'text-primary' : 'text-on-surface'}`}>
              {selected.length}
            </span>
            <span className="text-on-surface-variant font-medium text-xs">من {APP_CONSTANTS.MAX_INTERESTS}</span>
          </div>
          <div className="flex gap-1.5" dir="ltr">
            {[...Array(APP_CONSTANTS.MAX_INTERESTS)].map((_, i) => (
              <motion.div 
                key={i} 
                animate={{ 
                  scale: i < selected.length ? 1.1 : 1,
                  backgroundColor: i < selected.length ? "var(--color-primary)" : "var(--color-surface-container-highest)"
                }}
                className="w-2 h-2 rounded-full transition-colors duration-300"
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Shell */}
      <footer className="fixed bottom-0 w-full max-w-[390px] z-50 bg-background/90 backdrop-blur-md pt-4 pb-8 px-6 border-t border-outline-variant">
        <motion.button 
          whileHover={selected.length >= APP_CONSTANTS.MIN_INTERESTS ? { scale: 1.02 } : {}}
          whileTap={selected.length >= APP_CONSTANTS.MIN_INTERESTS ? { scale: 0.98 } : {}}
          onClick={selected.length >= APP_CONSTANTS.MIN_INTERESTS && !saving ? handleSaveInterests : undefined}
          className={`w-full flex items-center justify-center rounded-xl py-4 transition-all duration-200 group ${
            selected.length >= APP_CONSTANTS.MIN_INTERESTS 
              ? 'bg-primary text-white cursor-pointer shadow-md hover:bg-primary/90' 
              : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
          }`}>
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <>
                <span className="font-bold text-sm">حفظ والمتابعة</span>
                <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
              </>
            )}
          </div>
        </motion.button>
      </footer>
    </div>
  );
}
