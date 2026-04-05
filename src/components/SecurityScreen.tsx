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

export default function SecurityScreen({ onBack }: { onBack: () => void }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
      const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-[390px] mx-auto w-full relative bg-background overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Top AppBar */}
      <header className="w-full top-0 sticky flex items-center justify-between px-6 h-20 bg-background/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex items-center">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 border border-white/5 text-white">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="font-black text-sm text-white tracking-tight">الأمان والخصوصية</h1>
          <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">Privacy Center</span>
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
            <span className="text-white/20 text-xs font-black uppercase tracking-widest">جاري التحميل</span>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Two-Factor Authentication Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-lg">shield_lock</span>
                </div>
                <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">حماية الحساب</h2>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex justify-between items-center backdrop-blur-md">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white tracking-tight">المصادقة الثنائية (2FA)</h3>
                    <p className="text-white/40 text-[10px] font-bold leading-relaxed">أضف طبقة حماية إضافية لحسابك</p>
                  </div>
                  <button 
                    onClick={handleToggle2FA}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${is2FAEnabled ? 'bg-primary shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'bg-white/10'}`}
                  >
                    <motion.span 
                      animate={{ x: is2FAEnabled ? -24 : -4 }}
                      className="inline-block h-5 w-5 rounded-full bg-white shadow-lg" 
                    />
                  </button>
                </div>
                
                <button className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.05] transition-all group active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-xl">key</span>
                    </div>
                    <span className="font-black text-xs text-white uppercase tracking-widest">تغيير كلمة المرور</span>
                  </div>
                  <span className="material-symbols-outlined text-white/20 text-lg rtl:rotate-180 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              </div>
            </section>

            {/* Blocked Users Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <span className="material-symbols-outlined text-red-400 text-lg">block</span>
                </div>
                <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">المستخدمون المحظورون</h2>
              </div>
              
              <div className="min-h-[200px]">
                {blockedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl opacity-30">
                    <span className="material-symbols-outlined text-4xl">person_off</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">لا يوجد مستخدمين محظورين</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((user) => (
                      <motion.div 
                        key={user.blocked_id} 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 p-0.5">
                            <div className="w-full h-full rounded-[14px] bg-background overflow-hidden flex items-center justify-center border border-white/5">
                              {user.users.avatar_url ? (
                                <img src={user.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-white/10 text-2xl">person</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-white tracking-tight">{user.users.username}</span>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Blocked User</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleUnblock(user.blocked_id)}
                          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-primary/20 active:scale-95"
                        >
                          إلغاء الحظر
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
