import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ onNav }: { onNav: (screen: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single();
          setProfile(profileData);

          const { data: interestsData } = await supabase
            .from('user_interests')
            .select(`
              interests (
                id,
                name,
                icon
              )
            `)
            .eq('user_id', user.id);
            
          if (interestsData) {
            // @ts-ignore
            setInterests(interestsData.map((item: any) => item.interests));
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNav('landing');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pb-24 overflow-x-hidden max-w-[390px] mx-auto relative bg-background">
      <main className="w-full pt-16 px-6 space-y-10 flex-1">
        {/* Avatar Section */}
        <section className="flex flex-col items-center space-y-3">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
            {profile?.avatar_url ? (
              <img alt="User Profile" className="w-full h-full object-cover" src={profile.avatar_url} />
            ) : (
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-headline font-bold text-white">{profile?.username || 'مستخدم'}</h2>
            <p className="text-on-surface-variant text-xs mt-1">
              {profile?.created_at ? `انضم في ${new Date(profile.created_at).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}` : 'عضو جديد'}
            </p>
          </div>
        </section>

        {/* Interests Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-on-surface-variant">الاهتمامات</h3>
            <button onClick={() => onNav('interests')} className="text-primary text-xs font-medium hover:text-primary-container transition-colors">
              تعديل
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? (
              interests.map((interest, idx) => (
                <div key={idx} className="bg-white/5 px-4 py-2 rounded-full flex items-center gap-2">
                  <span className="text-sm">{interest.icon}</span>
                  <span className="text-sm text-white/80">{interest.name}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant px-1">لم تقم بإضافة اهتمامات بعد.</p>
            )}
          </div>
        </section>

        {/* Actions Section */}
        <section className="space-y-1">
          <button className="w-full flex items-center gap-4 py-4 px-2 text-white/80 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
            <span className="material-symbols-outlined text-xl">person_outline</span>
            <span className="font-medium text-sm">تعديل الحساب</span>
          </button>
          <button 
            onClick={() => onNav('security')}
            className="w-full flex items-center gap-4 py-4 px-2 text-white/80 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined text-xl">lock_outline</span>
            <span className="font-medium text-sm">الأمان والخصوصية</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 py-4 px-2 text-error/80 hover:text-error hover:bg-error/10 rounded-2xl transition-all">
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-medium text-sm">تسجيل الخروج</span>
          </button>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#10141a]/60 backdrop-blur-xl rounded-t-[32px] shadow-[0_-4px_40px_rgba(124,58,237,0.05)]">
        <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }} className="flex flex-col items-center justify-center text-white/40 px-4 py-1.5 hover:text-white/90 transition-all active:scale-90 duration-200">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-1">الرئيسية</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-white/40 px-4 py-1.5 hover:text-white/90 transition-all active:scale-90 duration-200">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-[10px] font-medium mt-1">المحادثات</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-[#d2bbff] bg-[#7c3aed]/20 rounded-2xl px-4 py-1.5 active:scale-90 duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[10px] font-medium mt-1">الملف الشخصي</span>
        </a>
      </nav>
    </div>
  );
}
