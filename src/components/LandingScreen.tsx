import { motion } from 'motion/react';

export default function LandingScreen({ onNext, onLogin }: { onNext: () => void, onLogin: () => void }) {
  return (
    <div className="flex flex-col min-h-[100dvh] selection:bg-primary/30 w-full max-w-[390px] mx-auto relative">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full filter blur-[60px] z-[-1] opacity-15 bg-primary w-64 h-64 top-[-10%] left-[-10%]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute rounded-full filter blur-[60px] z-[-1] opacity-15 bg-secondary w-80 h-80 bottom-[20%] right-[-20%]"
        />
      </div>

      {/* Top App Bar */}
      <header className="w-full flex justify-center items-center px-6 h-20 shrink-0 z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <h1 className="font-headline text-4xl font-black text-secondary tracking-tighter drop-shadow-[0_0_15px_rgba(210,187,255,0.4)]">وصل</h1>
        </motion.div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full px-8 flex flex-col items-center justify-center space-y-10 py-6 z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl font-bold leading-tight text-on-surface">
            تواصل بعمق..<br/>لا مجرد تمرير.
          </h2>
          <p className="text-on-surface-variant text-lg font-light">
            حيث تبدأ المحادثات الحقيقية بناءً على اهتماماتك
          </p>
        </motion.div>

        {/* Illustration Area */}
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full blur-xl"></div>
          </div>
          <div className="flex items-center space-x-[-1.5rem] rtl:space-x-reverse">
            {/* Chat Bubble 1 */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-24 h-24 bg-surface-container-high rounded-3xl rounded-bl-none flex items-center justify-center shadow-2xl relative z-10"
            >
              <span className="material-symbols-outlined text-primary text-4xl">chat_bubble</span>
            </motion.div>
            {/* Spark Icon */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="z-20 -mb-8"
            >
              <span className="material-symbols-outlined text-primary text-3xl drop-shadow-[0_0_8px_#d2bbff]">auto_awesome</span>
            </motion.div>
            {/* Chat Bubble 2 */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-24 h-24 bg-primary-container rounded-3xl rounded-br-none flex items-center justify-center shadow-2xl relative z-10"
            >
              <span className="material-symbols-outlined text-on-primary-container text-4xl">forum</span>
            </motion.div>
          </div>
        </div>

        {/* Features List */}
        <div className="w-full space-y-6">
          {[
            { icon: 'temp_preferences_custom', text: 'تطابق ذكي بناءً على اهتماماتك' },
            { icon: 'ice_skating', text: 'كاسرات جليد لبدء المحادثة' },
            { icon: 'lock', text: 'محادثات بين نفس الجنس فقط' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + (i * 0.1) }}
              className="flex items-center space-x-5 rtl:space-x-reverse py-2"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">{feature.icon}</span>
              </div>
              <span className="text-on-surface font-medium">{feature.text}</span>
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
          className="w-full py-5 bg-gradient-to-tr from-primary-container to-primary text-white font-bold text-xl rounded-full shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-transform">
          ابدأ الآن
        </motion.button>
        <div className="text-center">
          <button onClick={onLogin} className="text-on-surface-variant text-sm hover:text-primary transition-colors">
            لديك حساب؟ <span className="text-primary font-semibold">سجل دخول</span>
          </button>
        </div>
        <div className="h-2"></div>
      </footer>
    </div>
  );
}

