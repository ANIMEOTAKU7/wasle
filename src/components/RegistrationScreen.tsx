import { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function RegistrationScreen({ onNext, onBack, onLogin }: { onNext: () => void, onBack: () => void, onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!username || !email || !password || !gender) {
      setError('يرجى تعبئة جميع الحقول واختيار الجنس');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              display_name: username,
            }
          ]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
        
        onNext();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
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
        <h1 className="font-headline text-lg font-bold text-on-surface tracking-tight">إنشاء حساب</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-8 py-6 w-full flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-on-surface mb-2">حساب جديد ✨</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">انضم إلينا وابدأ في التعرف على أشخاص يشاركونك اهتماماتك.</p>
        </motion.div>

        {/* Registration Form */}
        <div className="space-y-5 flex-1 flex flex-col">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-error/10 text-error p-4 rounded-xl text-sm font-medium text-center border border-error/20"
            >
              {error}
            </motion.div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface-variant px-1">الاسم</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-4 pr-12 py-4 text-on-surface font-medium text-base focus:bg-surface-container-high focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                placeholder="اسمك المستعار" 
                type="text" 
                required
              />
            </div>
          </div>

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
                minLength={6}
              />
            </div>
          </div>

          {/* Gender Selector */}
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-medium text-on-surface-variant px-1">الجنس</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setGender('male')}
                className={`py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  gender === 'male' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                <span className="material-symbols-outlined text-2xl">male</span>
                <span className="font-medium text-sm">ذكر</span>
              </button>
              <button 
                onClick={() => setGender('female')}
                className={`py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  gender === 'female' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                <span className="material-symbols-outlined text-2xl">female</span>
                <span className="font-medium text-sm">أنثى</span>
              </button>
            </div>
          </div>

          {/* Primary Action */}
          <div className="pt-4">
            <button 
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                'إنشاء الحساب'
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
        </div>

        {/* Footer Link */}
        <footer className="mt-auto pt-8 pb-4 text-center">
          <p className="text-on-surface-variant text-sm">
            لديك حساب بالفعل؟ 
            <button onClick={onLogin} className="text-primary font-bold hover:underline mr-2 transition-all">سجل دخولك</button>
          </p>
        </footer>
      </main>
    </div>
  );
}
