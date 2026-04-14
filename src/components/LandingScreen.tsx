import { motion } from 'motion/react';

export default function LandingScreen({ onNext, onLogin }: { onNext: () => void, onLogin: () => void }) {
  return (
    <div className="flex flex-col min-h-[100dvh] w-full max-w-[390px] mx-auto bg-background">
      {/* Top App Bar */}
      <header className="w-full flex items-center px-6 h-24 shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">chat_bubble</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">واصل</h1>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-8 flex flex-col justify-center space-y-10 py-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-4xl font-bold leading-tight text-on-surface">
            تواصل مع من <br/>يشبهك
          </h2>
          <p className="text-on-surface-variant text-base leading-relaxed max-w-[280px]">
            منصة تواصل اجتماعي تعتمد على الاهتمامات المشتركة لبناء محادثات هادفة.
          </p>
        </motion.div>

        {/* Minimal Illustration Area */}
        <div className="w-full flex justify-center py-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full aspect-square max-w-[260px] bg-surface-container-high rounded-3xl border border-outline-variant flex items-center justify-center"
          >
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-full bg-surface border border-outline-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">favorite</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-surface border border-outline-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features List */}
        <div className="w-full space-y-3">
          {[
            { icon: 'interests', text: 'تطابق ذكي بناءً على اهتماماتك' },
            { icon: 'shield_lock', text: 'خصوصية تامة وأمان عالي' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="flex items-center space-x-4 rtl:space-x-reverse py-4 px-5 bg-surface-container-high rounded-2xl border border-outline-variant"
            >
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">{feature.icon}</span>
              </div>
              <span className="text-on-surface font-medium text-sm">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Bottom Action Area */}
      <footer className="w-full p-8 space-y-4 shrink-0">
        <button 
          onClick={onNext}
          className="w-full py-4 bg-primary text-white font-bold text-base rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          ابدأ الآن
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <button 
          onClick={onLogin} 
          className="w-full py-4 bg-surface-container-high text-on-surface font-medium text-base rounded-2xl hover:bg-surface-container-highest active:scale-[0.98] transition-all border border-outline-variant"
        >
          تسجيل الدخول
        </button>
      </footer>
    </div>
  );
}

