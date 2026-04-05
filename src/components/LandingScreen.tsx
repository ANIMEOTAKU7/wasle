import { motion } from 'motion/react';

export default function LandingScreen({ onNext, onLogin }: { onNext: () => void, onLogin: () => void }) {
  return (
    <div className="flex flex-col min-h-[100dvh] selection:bg-primary/30 w-full max-w-[390px] mx-auto relative overflow-hidden bg-background">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full filter blur-[100px] z-[-1] bg-primary w-96 h-96 top-[-20%] right-[-20%]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute rounded-full filter blur-[100px] z-[-1] bg-secondary w-80 h-80 bottom-[-10%] left-[-20%]"
        />
      </div>

      {/* Top App Bar */}
      <header className="w-full flex justify-center items-center px-6 h-24 shrink-0 z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 rotate-12">
            <span className="material-symbols-outlined text-white text-3xl -rotate-12">rocket_launch</span>
          </div>
          <h1 className="font-headline text-4xl font-black text-white tracking-tighter">هلا</h1>
        </motion.div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full px-8 flex flex-col items-center justify-center space-y-12 py-6 z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <h2 className="text-4xl font-bold leading-tight text-white">
            تواصل بعمق..<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">اكتشف أصدقاء جدد</span>
          </h2>
          <p className="text-on-surface-variant text-lg font-medium max-w-[280px] mx-auto">
            حيث تبدأ المحادثات الحقيقية بناءً على اهتماماتك المفضلة.
          </p>
        </motion.div>

        {/* Illustration Area */}
        <div className="relative w-full h-56 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-[-2rem] rtl:space-x-reverse">
            {/* Chat Bubble 1 */}
            <motion.div 
              initial={{ x: 60, opacity: 0, rotate: -10 }}
              animate={{ x: 0, opacity: 1, rotate: -5 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-28 h-28 bg-surface-container-high rounded-[40px] rounded-bl-none flex items-center justify-center shadow-2xl relative z-10 border border-white/5"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                <img src="https://picsum.photos/seed/user1/100/100" alt="User" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            
            {/* Spark Icon */}
            <motion.div 
              animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="z-20 -mb-12 bg-background p-3 rounded-2xl shadow-xl border border-white/10"
            >
              <span className="material-symbols-outlined text-primary text-4xl">favorite</span>
            </motion.div>
            
            {/* Chat Bubble 2 */}
            <motion.div 
              initial={{ x: -60, opacity: 0, rotate: 10 }}
              animate={{ x: 0, opacity: 1, rotate: 5 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="w-28 h-28 bg-primary/20 backdrop-blur-md rounded-[40px] rounded-br-none flex items-center justify-center shadow-2xl relative z-10 border border-white/10"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-secondary/20">
                <img src="https://picsum.photos/seed/user2/100/100" alt="User" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features List */}
        <div className="w-full space-y-4">
          {[
            { icon: 'temp_preferences_custom', text: 'تطابق ذكي بناءً على اهتماماتك' },
            { icon: 'lock', text: 'خصوصية تامة وأمان عالي' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + (i * 0.1) }}
              className="flex items-center space-x-4 rtl:space-x-reverse py-3 px-5 bg-white/5 rounded-2xl border border-white/5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">{feature.icon}</span>
              </div>
              <span className="text-on-surface font-bold text-sm">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Bottom Action Area */}
      <footer className="w-full p-8 space-y-6 shrink-0 z-10">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="w-full py-5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xl rounded-3xl shadow-[0_10px_40px_rgba(124,58,237,0.4)] transition-all flex items-center justify-center gap-3">
          ابدأ الرحلة الآن
          <span className="material-symbols-outlined">arrow_back</span>
        </motion.button>
        <div className="text-center">
          <button onClick={onLogin} className="text-on-surface-variant text-sm font-medium hover:text-white transition-colors">
            لديك حساب بالفعل؟ <span className="text-primary font-bold">سجل دخول</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

