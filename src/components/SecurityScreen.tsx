import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface BlockedUser {
  blocked_id: string;
  users: {
    username: string;
    avatar_url: string | null;
  };
}

export default function SecurityScreen({ onBack, onPrivacyPolicy }: { onBack: () => void, onPrivacyPolicy?: () => void }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Check MFA status
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!mfaError && mfaData) {
        setIs2FAEnabled(mfaData.currentLevel === 'aal2' || mfaData.nextLevel === 'aal2');
      }

      // Fetch blocked users
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          users!blocked_users_blocked_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('blocker_id', user.id);

      if (!blockedError && blockedData) {
        // @ts-ignore - Supabase join typing workaround
        setBlockedUsers(blockedData as BlockedUser[]);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    // In a real app, this would initiate the Supabase MFA enrollment flow
    // requiring a QR code scanner. For this prototype, we'll show an alert.
    alert(is2FAEnabled 
      ? 'لإلغاء تفعيل المصادقة الثنائية، يرجى التواصل مع الدعم الفني.' 
      : 'لتفعيل المصادقة الثنائية، سيتم إرسال رمز إلى بريدك الإلكتروني أو تطبيق المصادقة (قريباً).'
    );
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .match({ blocker_id: user.id, blocked_id: blockedId });

      if (!error) {
        setBlockedUsers(prev => prev.filter(u => u.blocked_id !== blockedId));
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      alert('جاري تجميع بياناتك... قد يستغرق هذا بضع ثوانٍ.');

      // Fetch all user data
      const [profileRes, postsRes, commentsRes, interestsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('posts').select('*').eq('author_id', user.id),
        supabase.from('post_comments').select('*').eq('user_id', user.id),
        supabase.from('user_interests').select('interest_id').eq('user_id', user.id)
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        userInfo: {
          email: user.email,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        },
        profile: profileRes.data,
        posts: postsRes.data,
        comments: commentsRes.data,
        interests: interestsRes.data
      };

      // Create and download JSON file
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "wasel_data_export.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

    } catch (error) {
      console.error('Error exporting data:', error);
      alert('حدث خطأ أثناء تصدير البيانات.');
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-[390px] mx-auto w-full relative bg-background overflow-hidden text-on-surface">
      {/* Top AppBar */}
      <header className="w-full top-0 sticky flex items-center justify-between px-6 h-20 bg-background/90 backdrop-blur-md z-50 border-b border-outline-variant">
        <div className="flex items-center">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-all active:scale-95 border border-outline-variant text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-sm text-on-surface tracking-tight">الأمان والخصوصية</h1>
          <span className="text-[9px] text-primary font-bold uppercase tracking-[0.2em]">Privacy Center</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-8 py-10 w-full flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
            />
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">جاري التحميل</span>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Two-Factor Authentication Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-lg">shield_lock</span>
                </div>
                <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">حماية الحساب</h2>
              </div>
              
              <div className="space-y-3">
                <div className="bg-surface border border-outline-variant rounded-2xl p-5 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-on-surface tracking-tight">المصادقة الثنائية (2FA)</h3>
                    <p className="text-on-surface-variant text-[10px] font-medium leading-relaxed">أضف طبقة حماية إضافية لحسابك</p>
                  </div>
                  <button 
                    onClick={handleToggle2FA}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${is2FAEnabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
                  >
                    <motion.span 
                      animate={{ x: is2FAEnabled ? -24 : -4 }}
                      className="inline-block h-5 w-5 rounded-full bg-white shadow-sm" 
                    />
                  </button>
                </div>
                
                <button className="w-full bg-surface border border-outline-variant rounded-2xl p-5 flex items-center justify-between hover:bg-surface-container-high transition-all group active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-xl">key</span>
                    </div>
                    <span className="font-bold text-xs text-on-surface uppercase tracking-widest">تغيير كلمة المرور</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg rtl:rotate-180 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              </div>
            </section>

            {/* Blocked Users Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center border border-error/20">
                  <span className="material-symbols-outlined text-error text-lg">block</span>
                </div>
                <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">المستخدمون المحظورون</h2>
              </div>
              
              <div className="min-h-[200px]">
                {blockedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 bg-surface-container-low border border-dashed border-outline-variant rounded-3xl opacity-50">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_off</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">لا يوجد مستخدمين محظورين</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((user) => (
                      <motion.div 
                        key={user.blocked_id} 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-surface border border-outline-variant rounded-2xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                            {user.users.avatar_url ? (
                              <img src={user.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant text-2xl">person</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-on-surface tracking-tight">{user.users.username}</span>
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Blocked User</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleUnblock(user.blocked_id)}
                          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-primary/20 active:scale-95"
                        >
                          إلغاء الحظر
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Data & Privacy Section */}
            <section className="space-y-6 pt-6 border-t border-outline-variant">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-lg">database</span>
                </div>
                <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">بياناتك</h2>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleExportData}
                  className="w-full bg-surface border border-outline-variant rounded-2xl p-5 flex items-center justify-between hover:bg-surface-container-high transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">download</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-bold text-xs text-on-surface uppercase tracking-widest">تصدير بياناتي</span>
                      <span className="text-[9px] font-medium text-on-surface-variant mt-1">تحميل نسخة من كافة معلوماتك</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg rtl:rotate-180 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              </div>
            </section>

            {/* Danger Zone Section */}
            <section className="space-y-6 pt-6 border-t border-error/20">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center border border-error/20">
                  <span className="material-symbols-outlined text-error text-lg">warning</span>
                </div>
                <h2 className="text-[10px] font-bold text-error uppercase tracking-[0.2em]">منطقة الخطر</h2>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    if (window.confirm('هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيتم مسح كافة بياناتك.')) {
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const user = session?.user;
                        if (!user) return;

                        // 1. Delete user from profiles table (this should cascade delete other data if foreign keys are set up correctly)
                        const { error: profileError } = await supabase
                          .from('profiles')
                          .delete()
                          .eq('id', user.id);

                        if (profileError) {
                          console.error('Error deleting profile:', profileError);
                          alert('حدث خطأ أثناء محاولة حذف بياناتك. يرجى المحاولة مرة أخرى.');
                          return;
                        }

                        // 2. Sign out the user
                        await supabase.auth.signOut();
                        
                        // 3. Navigate back to landing screen
                        // Note: To fully delete the user from Supabase Auth, you typically need an Edge Function
                        // or admin privileges. For this prototype, deleting the profile and signing out is a good start.
                        alert('تم حذف بيانات ملفك الشخصي وتسجيل خروجك بنجاح.');
                        window.location.reload(); // Quick way to reset app state and go to landing
                      } catch (error) {
                        console.error('Error during account deletion:', error);
                        alert('حدث خطأ غير متوقع.');
                      }
                    }
                  }}
                  className="w-full bg-error/5 border border-error/20 rounded-2xl p-5 flex items-center justify-between hover:bg-error/10 transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error group-hover:bg-error/20 transition-colors">
                      <span className="material-symbols-outlined text-xl">delete_forever</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-bold text-xs text-error uppercase tracking-widest">حذف الحساب نهائياً</span>
                      <span className="text-[9px] font-medium text-error/70 mt-1">سيتم مسح كافة بياناتك بشكل دائم</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-error/50 text-lg rtl:rotate-180 group-hover:text-error transition-colors">chevron_right</span>
                </button>
              </div>
            </section>

            {/* Legal Section */}
            <section className="space-y-6 pt-6 border-t border-outline-variant">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">gavel</span>
                </div>
                <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">قانوني</h2>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={onPrivacyPolicy}
                  className="w-full bg-surface border border-outline-variant rounded-2xl p-5 flex items-center justify-between hover:bg-surface-container-high transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-xl">policy</span>
                    </div>
                    <span className="font-bold text-xs text-on-surface uppercase tracking-widest">سياسة الخصوصية</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg rtl:rotate-180 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
