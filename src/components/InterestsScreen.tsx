import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { APP_CONSTANTS } from '../constants';

interface Interest {
  id: string;
  name: string;
  icon: string;
}

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
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setInterests(data);
    } catch (error) {
      console.error('Error fetching interests:', error);
      // Fallback data if DB is empty or fails
      setInterests([
        { id: 'football', name: 'كرة القدم', icon: '⚽' },
        { id: 'gaming', name: 'ألعاب', icon: '🎮' },
        { id: 'music', name: 'موسيقى', icon: '🎵' },
        { id: 'books', name: 'كتب', icon: '📚' },
        { id: 'movies', name: 'أفلام', icon: '🎬' },
        { id: 'tech', name: 'تقنية', icon: '💻' },
      ]);
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

        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id);

        const { error } = await supabase
          .from('user_interests')
          .insert(userInterests);

        if (error) throw error;
      }
      
      onNext();
    } catch (error) {
      console.error('Error saving interests:', error);
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
      {/* Top Navigation */}
      <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6">
        <motion.button 
          aria-label="العودة"
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="flex items-center justify-center text-white/70 hover:text-white transition-colors p-2 -mr-2"
        >
          <span className="material-symbols-outlined">close</span>
        </motion.button>
        <div className="text-xl font-bold text-white tracking-tighter">Wasel</div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pt-8 pb-32">
        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-1 rounded-full mb-10 overflow-hidden flex" dir="ltr">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "50%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-primary h-full rounded-full"
          />
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-right"
        >
          <h1 className="text-2xl font-bold text-white mb-2">ما هي اهتماماتك؟</h1>
          <p className="text-white/50 text-xs leading-relaxed">اختر من {APP_CONSTANTS.MIN_INTERESTS} إلى {APP_CONSTANTS.MAX_INTERESTS} اهتمامات لنجد لك أشخاصاً مناسبين</p>
        </motion.div>

        {/* Interests Grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="material-symbols-outlined animate-spin text-white/30 text-3xl">progress_activity</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-10">
            {interests.map((interest, idx) => {
              const isSelected = selected.includes(interest.id);
              return (
                <motion.div 
                  key={interest.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => toggleInterest(interest.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-full py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-primary text-white' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{interest.icon}</span>
                  <span className="text-xs font-medium whitespace-nowrap">{interest.name}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Counter Indicator */}
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-white/40 font-medium text-xs">تم اختيار {selected.length}/{APP_CONSTANTS.MAX_INTERESTS}</span>
          <div className="flex gap-1.5" dir="ltr">
            {[...Array(APP_CONSTANTS.MAX_INTERESTS)].map((_, i) => (
              <motion.div 
                key={i} 
                animate={{ 
                  scale: i < selected.length ? 1 : 1,
                  backgroundColor: i < selected.length ? "#7c3aed" : "rgba(255,255,255,0.1)"
                }}
                className="w-1.5 h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Shell */}
      <footer className="fixed bottom-0 w-full max-w-[390px] z-50 bg-[#10141a]/90 backdrop-blur-xl pt-4 pb-8 px-6">
        <motion.button 
          whileHover={selected.length >= APP_CONSTANTS.MIN_INTERESTS ? { scale: 1.02 } : {}}
          whileTap={selected.length >= APP_CONSTANTS.MIN_INTERESTS ? { scale: 0.98 } : {}}
          onClick={selected.length >= APP_CONSTANTS.MIN_INTERESTS && !saving ? handleSaveInterests : undefined}
          className={`w-full flex items-center justify-center rounded-2xl py-4 transition-all duration-200 group ${
            selected.length >= APP_CONSTANTS.MIN_INTERESTS 
              ? 'bg-white text-black cursor-pointer' 
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}>
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            ) : (
              <>
                <span className="font-bold text-sm">حفظ والمتابعة</span>
                <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
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
