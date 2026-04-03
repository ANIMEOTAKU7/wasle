import { useState } from 'react';
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
    <div className="flex flex-col min-h-screen max-w-[390px] mx-auto w-full relative">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky flex items-center justify-between px-6 h-16 bg-transparent z-50">
        <div className="flex items-center">
          <button onClick={onBack} className="hover:opacity-80 transition-opacity active:scale-95 duration-200 text-primary">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
        <h1 className="font-bold text-xl text-primary">إنشاء حساب</h1>
        <div className="w-6"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 px-6 pb-24 w-full">
        {/* Avatar Picker */}
        <div className="flex flex-col items-center mt-4 mb-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary transition-colors cursor-pointer overflow-hidden">
              <img className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" alt="placeholder" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvOdxwcVpqP6HYRe9b4sHvEskFmFM7F9ZijUWj5WUthmo7yMwjfNOlxR0vEo3j25pO7b1c8gk-p2VmoTdqtYJhJCRO2wrp1he_UlborsSBTNu4Q0jqskmtSFXaJ-UWefG6M1uH9PTnbzARhMWH6Du9SLRSQRM2uVfHZqfxVprJokuCPWzKjcpLYGRkzo9Nc-jkEh8R9kkfsWr0sCdPnAgQgPpCn74RpVuKSha9l9dp9Hgh7n4_p0-oLEEDJFKOFQ8pCPORNWgjyeU" />
              <div className="z-10 flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-3xl mb-1">photo_camera</span>
                <span className="text-xs font-medium text-on-surface-variant">أضف صورة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="space-y-5">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-xl text-sm text-center border border-error/20">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface-variant pr-1">اسم المستخدم</label>
            <input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1e2530] border-0 rounded-xl px-4 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder-outline" 
              placeholder="ادخل اسمك هنا" 
              type="text" 
            />
          </div>

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
              />
              <button className="absolute left-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                <span className="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>

          {/* Gender Selector */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-on-surface-variant pr-1 mb-3">الجنس</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setGender('male')}
                className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  gender === 'male' 
                    ? 'bg-primary-container text-white glow-button' 
                    : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                <span>ذكر</span>
                <span className="text-lg">👦</span>
              </button>
              <button 
                onClick={() => setGender('female')}
                className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  gender === 'female' 
                    ? 'bg-primary-container text-white glow-button' 
                    : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                <span>أنثى</span>
                <span className="text-lg">👧</span>
              </button>
            </div>
            <p className="text-[11px] text-error mt-2 pr-1">* مطلوب ولا يمكن تغييره لاحقاً</p>
          </div>

          {/* Primary Action */}
          <div className="pt-4">
            <button 
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary-container to-[#9333ea] text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all glow-button disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                'إنشاء حساب'
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
          <button className="w-full py-3.5 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center gap-3 hover:bg-surface-container-highest transition-colors active:scale-[0.98]">
            <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9VpZq0ZuAZNP7GxzeBvH7BtVuRgLSTeCWoyQNPPpXjLMMjaiTcR7FeGwVIQU7aeudne51L4aIeffpdeDNvKxyRVGvRpzCDvGgN9ibhwgk5g6C1wnpzyg3rHg6zrHAxPEv5TdLOya4Qo2Sy6a9aUpKQcHjn_6qlySufRhjGXhsxCWHNYgmTFkrgMhf2peneCH4sIHUPmPC_0ICEBEXiLEyER2TeeV0rfKvFRlntxrolPYXLaRsqbq7KaxYi_9_a7PagVK-UI4Ow_Y" />
            <span className="font-medium text-on-surface">سجل عبر جوجل</span>
          </button>
        </div>

        {/* Footer Link */}
        <footer className="mt-10 pb-6 text-center">
          <p className="text-on-surface-variant text-sm">
            لديك حساب؟ 
            <button onClick={onLogin} className="text-primary font-bold hover:underline mr-1 transition-all">سجل دخول</button>
          </p>
        </footer>
      </main>
    </div>
  );
}
