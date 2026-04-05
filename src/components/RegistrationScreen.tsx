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
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create user profile in the 'profiles' table
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
          // We don't throw here so the user can still proceed even if profile creation fails,
          // but ideally we should handle it.
        }
        
        // Success! Move to next screen
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
    <div className="flex flex-col min-h-[100dvh] max-w-[390px] mx-auto w-full relative bg-background overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* TopAppBar */}
      <header className="w-full top-0 sticky flex items-center justify-between px-6 h-20 bg-background/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex items-center">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 border border-white/5 text-white">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="font-black text-sm text-white tracking-tight">إنشاء حساب</h1>
          <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">Join Us</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-8 py-10 w-full flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight leading-tight">ابدأ <br /><span className="text-primary">رحلتك</span> معنا 🚀</h2>
          <p className="text-white/40 text-sm font-bold leading-relaxed">انضم إلى مجتمعنا وتواصل مع أشخاص يشاركونك نفس الاهتمامات</p>
        </motion.div>

        {/* Registration Form */}
        <div className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs font-bold text-center border border-red-500/20 backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          {/* Username */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-1">اسم المستخدم</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-12 py-4 text-white font-bold text-sm focus:bg-white/[0.05] focus:border-primary/50 outline-none transition-all placeholder:text-white/10" 
                placeholder="ادخل اسمك هنا" 
                type="text" 
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-1">البريد الإلكتروني</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">alternate_email</span>
              </div>
              <input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-12 py-4 text-white font-bold text-sm focus:bg-white/[0.05] focus:border-primary/50 outline-none transition-all placeholder:text-white/10" 
                placeholder="example@wasel.com" 
                type="email" 
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-1">كلمة المرور</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">lock</span>
              </div>
              <input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-white font-bold text-sm focus:bg-white/[0.05] focus:border-primary/50 outline-none transition-all placeholder:text-white/10" 
                placeholder="••••••••" 
                type="password" 
                dir="ltr"
                required
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">visibility</span>
              </button>
            </div>
          </div>

          {/* Gender Selector */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-1 mb-3">الجنس</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setGender('male')}
                className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all border ${
                  gender === 'male' 
                    ? 'bg-primary border-primary text-white shadow-[0_10px_20px_rgba(124,58,237,0.3)]' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                }`}>
                <span>ذكر</span>
                <span className="text-lg">👦</span>
              </button>
              <button 
                onClick={() => setGender('female')}
                className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all border ${
                  gender === 'female' 
                    ? 'bg-secondary border-secondary text-white shadow-[0_10px_20px_rgba(236,72,153,0.3)]' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                }`}>
                <span>أنثى</span>
                <span className="text-lg">👧</span>
              </button>
            </div>
            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mt-2 pr-1">* مطلوب ولا يمكن تغييره لاحقاً</p>
          </div>

          {/* Primary Action */}
          <div className="pt-6">
            <button 
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                'إنشاء حساب جديد'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-6 py-4">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">أو عبر</span>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          {/* Google Login */}
          <button type="button" className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98]">
            <img alt="Google" className="w-5 h-5" src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" />
            <span className="font-bold text-white text-xs uppercase tracking-widest">المتابعة باستخدام جوجل</span>
          </button>
        </div>

        {/* Footer Link */}
        <footer className="mt-12 pb-6 text-center">
          <p className="text-white/40 text-xs font-bold">
            لديك حساب بالفعل؟ 
            <button onClick={onLogin} className="text-primary font-black hover:text-secondary mr-2 transition-all uppercase tracking-wider">سجل دخولك</button>
          </p>
        </footer>
      </main>
    </div>
  );
}
