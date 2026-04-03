export default function ChatScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-on-surface antialiased flex justify-center items-start min-h-screen bg-background">
      <main className="w-full max-w-[390px] h-[844px] flex flex-col relative overflow-hidden bg-background">
        {/* TopAppBar */}
        <header className="fixed top-0 w-full max-w-[390px] z-50 bg-[#10141a]/60 backdrop-blur-xl flex justify-between items-center px-6 h-16">
          <div className="flex items-center gap-3">
            <div onClick={onBack} className="p-2 hover:bg-white/10 transition-colors scale-95 active:duration-150 rounded-full cursor-pointer">
              <span className="material-symbols-outlined text-on-surface">arrow_forward</span>
            </div>
            <h1 className="text-on-surface text-lg font-bold">محادثة مجهولة</h1>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="bg-primary-container text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg shadow-primary-container/20">
              <span className="material-symbols-outlined text-[14px]">interests</span>
              <span>اهتمام مشترك</span>
            </div>
          </div>
          <div className="p-2 hover:bg-white/10 transition-colors scale-95 active:duration-150 rounded-full cursor-pointer">
            <span className="material-symbols-outlined text-on-surface">flag</span>
          </div>
        </header>

        {/* Main Content Canvas */}
        <section className="flex-1 mt-16 px-4 pt-4 pb-32 overflow-y-auto chat-scroll flex flex-col gap-6">
          {/* Ice Breaker Card */}
          <div className="w-full rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] p-4 relative overflow-hidden group shadow-xl">
            <div className="absolute -left-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <span className="text-7xl">🧊</span>
            </div>
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧊</span>
                <h2 className="text-background font-bold text-base">كاسر الجليد</h2>
              </div>
              <p className="text-background font-bold text-lg leading-snug">ما هو أفضل شيء حدث لك اليوم؟</p>
              <p className="text-background/70 text-xs mt-1">سؤال للبدء في التعارف</p>
            </div>
          </div>

          {/* Messages Timeline */}
          <div className="flex flex-col gap-4">
            {/* Date/System Divider */}
            <div className="flex justify-center my-2">
              <span className="text-[10px] text-on-surface-variant/40 tracking-widest font-headline">TODAY</span>
            </div>

            <div className="flex flex-col items-center justify-center h-40 opacity-50">
              <span className="material-symbols-outlined text-4xl mb-2">chat</span>
              <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
            </div>
          </div>
        </section>

        {/* Bottom Action Layer */}
        <footer className="fixed bottom-0 w-full max-w-[390px] p-4 pb-8 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center gap-3">
          <button className="bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-all duration-200 border border-outline-variant/10 shadow-lg">
            <span>محادثة جديدة</span>
            <span className="material-symbols-outlined text-sm">shuffle</span>
          </button>

          <div className="w-full flex items-center gap-2">
            <button className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-lg shadow-primary-container/30 active:scale-95 transition-transform">
              <span className="material-symbols-outlined -rotate-180">send</span>
            </button>
            <div className="flex-1 relative">
              <input className="w-full bg-surface-container-low border-none rounded-full px-6 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary-container transition-all" placeholder="اكتب رسالة..." type="text" />
            </div>
          </div>
        </footer>

        {/* Signature Visual Pulse */}
        <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-container/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-primary-container/5 blur-[80px] rounded-full"></div>
        </div>
      </main>
    </div>
  );
}
