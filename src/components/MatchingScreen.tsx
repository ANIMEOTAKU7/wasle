import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_CONSTANTS } from '../constants';

export default function MatchingScreen({ onCancel, onMatch }: { onCancel: () => void, onMatch: () => void }) {
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
    
    // Simulate finding a match
    const matchTimer = setTimeout(() => {
      onMatchRef.current();
    }, APP_CONSTANTS.MATCHING_DURATION_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(matchTimer);
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
      <main className="w-full max-w-[390px] h-[844px] relative flex flex-col bg-background overflow-hidden">
        {/* TopAppBar */}
        <header className="w-full max-w-[390px] z-50 flex justify-between items-center px-6 py-6">
          <button onClick={onCancel} className="text-white/50 hover:text-white transition-colors text-sm">إلغاء</button>
          <h1 className="text-white font-medium text-sm">جاري البحث...</h1>
          <div className="w-10 flex justify-end">
            <motion.span 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="material-symbols-outlined text-primary text-sm"
            >
              language
            </motion.span>
          </div>
        </header>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col items-center justify-center px-8 relative">
          {/* Radar Animation Center */}
          <div className="relative w-full aspect-square flex items-center justify-center mb-12">
            {/* Radar Rings */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeOut"
                }}
                className="absolute w-40 h-40 border border-primary/30 rounded-full"
              />
            ))}

            {/* Rotating Radar Sweep */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute w-64 h-64 rounded-full border border-primary/5 bg-gradient-to-tr from-primary/10 to-transparent"
              style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}
            />

            {/* User Avatar (Center) */}
            <div className="relative z-10">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-full border-4 border-primary p-1 bg-surface-container-high relative z-10 overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(210,187,255,0.3)]"
              >
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
              </motion.div>
            </div>

            {/* Floating "Potential Matches" dots */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  x: Math.sin(i) * 120,
                  y: Math.cos(i) * 120
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
                className="absolute w-2 h-2 bg-primary rounded-full blur-[1px]"
              />
            ))}
          </div>

          {/* Matching Status Text */}
          <div className="text-center space-y-2 mb-10 z-10">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-white"
            >
              نبحث عن شخص يشاركك اهتماماتك
            </motion.h2>
            <p className="text-white/40 text-xs">قد يستغرق هذا بضع ثوانٍ...</p>
          </div>

          {/* Shared Interests Preview */}
          <div className="w-full text-center mb-8 z-10">
            <div className="flex flex-wrap justify-center gap-2">
              <motion.span 
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-primary text-xs font-medium"
              >
                جاري البحث عن اهتمامات مشتركة...
              </motion.span>
            </div>
          </div>
        </section>

        {/* Bottom Controls */}
        <footer className="p-8 pb-12 space-y-6 z-10">
          <div className="flex items-center justify-center gap-2">
            <div className="font-mono text-sm text-white/80" dir="ltr">
              {formatTime(seconds)}
            </div>
          </div>
          <button onClick={onCancel} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-sm rounded-2xl transition-all">
            إلغاء البحث
          </button>
        </footer>
      </main>
    </div>
  );
}

