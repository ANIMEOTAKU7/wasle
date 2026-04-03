import { useState, useEffect } from 'react';
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
    <div className="flex flex-col items-center justify-start min-h-screen pb-24 overflow-x-hidden max-w-[390px] mx-auto relative bg-background">
      {/* Top AppBar */}
      <header className="w-full max-w-[390px] z-50 flex items-center justify-between px-6 py-6">
        <button onClick={onBack} className="flex items-center justify-center text-white/70 hover:text-white transition-colors p-2 -mr-2">
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <h1 className="font-bold text-lg text-white">الأمان والخصوصية</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full px-6 space-y-10 flex-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : (
          <>
            {/* Two-Factor Authentication Section */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-white/50 px-2">حماية الحساب</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center py-3 px-2">
                  <div>
                    <h3 className="text-sm font-medium text-white/90">المصادقة الثنائية (2FA)</h3>
                    <p className="text-white/40 text-xs mt-1">أضف طبقة حماية إضافية لحسابك</p>
                  </div>
                  <button 
                    onClick={handleToggle2FA}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${is2FAEnabled ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${is2FAEnabled ? '-translate-x-6' : '-translate-x-1'}`} />
                  </button>
                </div>
                
                <button className="w-full flex items-center justify-between py-4 px-2 text-white/80 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                  <span className="font-medium text-sm">تغيير كلمة المرور</span>
                  <span className="material-symbols-outlined text-white/40 text-sm rtl:rotate-180">chevron_right</span>
                </button>
              </div>
            </section>

            {/* Blocked Users Section */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-white/50 px-2">المستخدمون المحظورون</h2>
              
              <div className="min-h-[150px]">
                {blockedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-white/30">
                    <span className="material-symbols-outlined text-3xl mb-2">no_accounts</span>
                    <p className="text-xs">لا يوجد مستخدمين محظورين</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {blockedUsers.map((user) => (
                      <div key={user.blocked_id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden flex items-center justify-center">
                            {user.users.avatar_url ? (
                              <img src={user.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-white/40">person</span>
                            )}
                          </div>
                          <span className="font-medium text-sm text-white/90">{user.users.username}</span>
                        </div>
                        <button 
                          onClick={() => handleUnblock(user.blocked_id)}
                          className="text-xs font-medium text-primary hover:text-primary-container transition-colors px-2"
                        >
                          إلغاء الحظر
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
