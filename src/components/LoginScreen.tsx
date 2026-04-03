import { useState, FormEvent } from 'react';
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
    <div className="flex flex-col min-h-screen max-w-[390px] mx-auto w-full relative">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky flex items-center justify-between px-6 h-16 bg-transparent z-50">
        <div className="flex items-center">
          <button onClick={onBack} className="hover:opacity-80 transition-opacity active:scale-95 duration-200 text-primary">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
        <h1 className="font-bold text-xl text-primary">تسجيل الدخول</h1>
        <div className="w-6"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 px-6 pb-24 w-full flex flex-col justify-center">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-on-surface mb-3">مرحباً بعودتك! 👋</h2>
          <p className="text-on-surface-variant">سجل دخولك للمتابعة</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-xl text-sm text-center border border-error/20">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface-variant pr-1">الإيميل</label>
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e2530] border-0 rounded-xl px-4 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder-outline" 
              placeholder="example@wasel.com" 
              type="email" 
              dir="ltr"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface-variant pr-1">كلمة المرور</label>
            <div className="relative">
              <input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e2530] border-0 rounded-xl px-4 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder-outline" 
                placeholder="••••••••" 
                type="password" 
                dir="ltr"
                required
              />
              <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                <span className="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>

          {/* Primary Action */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary-container to-[#9333ea] text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all glow-button disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-4">
            <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            <span className="text-outline text-sm">أو</span>
            <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
          </div>

          {/* Google Login */}
          <button type="button" className="w-full py-3.5 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center gap-3 hover:bg-surface-container-highest transition-colors active:scale-[0.98]">
            <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9VpZq0ZuAZNP7GxzeBvH7BtVuRgLSTeCWoyQNPPpXjLMMjaiTcR7FeGwVIQU7aeudne51L4aIeffpdeDNvKxyRVGvRpzCDvGgN9ibhwgk5g6C1wnpzyg3rHg6zrHAxPEv5TdLOya4Qo2Sy6a9aUpKQcHjn_6qlySufRhjGXhsxCWHNYgmTFkrgMhf2peneCH4sIHUPmPC_0ICEBEXiLEyER2TeeV0rfKvFRlntxrolPYXLaRsqbq7KaxYi_9_a7PagVK-UI4Ow_Y" />
            <span className="font-medium text-on-surface">سجل عبر جوجل</span>
          </button>
        </form>

        {/* Footer Link */}
        <footer className="mt-10 pb-6 text-center">
          <p className="text-on-surface-variant text-sm">
            ليس لديك حساب؟ 
            <button onClick={onSignUp} className="text-primary font-bold hover:underline mr-1 transition-all">إنشاء حساب جديد</button>
          </p>
        </footer>
      </main>
    </div>
  );
}
