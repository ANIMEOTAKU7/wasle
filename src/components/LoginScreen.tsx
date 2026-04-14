import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ onNext, onBack, onSignUp }: { onNext: () => void, onBack: () => void, onSignUp: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        onNext();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message === 'Invalid login credentials' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-[390px] mx-auto w-full bg-background">
      {/* TopAppBar */}
      <header className="w-full flex items-center justify-between px-6 h-20 shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95 border border-outline-variant text-on-surface">
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
        <h1 className="font-headline text-lg font-bold text-on-surface tracking-tight">تسجيل الدخول</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-8 py-8 w-full flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-on-surface mb-2">مرحباً بعودتك 👋</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">سجل دخولك للمتابعة واستكشاف ما فاتك من محادثات</p>
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5 flex-1 flex flex-col">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-error/10 text-error p-4 rounded-xl text-sm font-medium text-center border border-error/20"
            >
              {error}
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface-variant px-1">البريد الإلكتروني</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">alternate_email</span>
              </div>
              <input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-4 pr-12 py-4 text-on-surface font-medium text-base focus:bg-surface-container-high focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                placeholder="example@wasel.com" 
                type="email" 
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface-variant px-1">كلمة المرور</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">lock</span>
              </div>
              <input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-12 pr-12 py-4 text-on-surface font-medium text-base focus:bg-surface-container-high focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                placeholder="••••••••" 
                type="password" 
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Primary Action */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-4">
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
            <span className="text-xs font-medium text-on-surface-variant">أو عبر</span>
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
          </div>

          {/* Google Login */}
          <button type="button" className="w-full py-4 rounded-xl bg-surface border border-outline-variant flex items-center justify-center gap-3 hover:bg-surface-container-high transition-all active:scale-[0.98]">
            <img alt="Google" className="w-5 h-5" src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" />
            <span className="font-medium text-on-surface text-sm">المتابعة باستخدام جوجل</span>
          </button>
        </form>

        {/* Footer Link */}
        <footer className="mt-auto pt-8 pb-4 text-center">
          <p className="text-on-surface-variant text-sm">
            ليس لديك حساب؟ 
            <button onClick={onSignUp} className="text-primary font-bold hover:underline mr-2 transition-all">إنشاء حساب جديد</button>
          </p>
        </footer>
      </main>
    </div>
  );
}
