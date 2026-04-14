import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch reports and join with sender and receiver profiles
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          sender:profiles!reports_sender_id_fkey(id, username, email),
          reporter:profiles!reports_receiver_id_fkey(id, username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, reportId: string) => {
    if (!window.confirm('هل أنت متأكد من حظر هذا المستخدم نهائياً؟')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      // Insert into banned_users
      const { error: banError } = await supabase.from('banned_users').insert({
        user_id: userId,
        banned_by: user?.id,
        reason: 'تم الحظر بناءً على بلاغ'
      });
      
      if (banError && banError.code !== '23505') throw banError; // Ignore if already banned

      // Update report status
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
      
      alert('تم حظر المستخدم بنجاح');
      fetchReports();
    } catch (error: any) {
      console.error("Error banning user:", error);
      alert('حدث خطأ أثناء الحظر: ' + error.message);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
      fetchReports();
    } catch (error) {
      console.error("Error dismissing report:", error);
    }
  };

  return (
    <div className="bg-background min-h-[100dvh] flex flex-col items-center max-w-[390px] mx-auto relative overflow-hidden text-on-surface">
      <header className="w-full z-50 flex justify-between items-center px-6 h-20 bg-background/90 backdrop-blur-md border-b border-outline-variant">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-all active:scale-95 border border-outline-variant text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-xl rtl:rotate-180">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-sm text-error tracking-tight">لوحة الإدارة</h1>
          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">Security Center</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="w-full px-6 py-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-on-surface font-bold text-lg tracking-tight">البلاغات الأخيرة</h2>
          <div className="px-3 py-1 bg-error/10 border border-error/20 rounded-full">
            <span className="text-[10px] font-bold text-error uppercase tracking-widest">{reports.filter(r => r.status === 'pending').length} معلق</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
            />
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">جاري التحميل</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">verified_user</span>
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">لا توجد بلاغات حالياً</span>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-surface border ${report.status === 'pending' ? 'border-error/30' : 'border-outline-variant'} rounded-2xl p-5 flex flex-col gap-4`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">تاريخ البلاغ</span>
                    <span className="text-xs text-on-surface font-medium">{new Date(report.created_at).toLocaleString('ar-SA')}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                    report.status === 'pending' ? 'bg-error/10 text-error border border-error/20' : 
                    report.status === 'resolved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                  }`}>
                    {report.status === 'pending' ? 'قيد المراجعة' : report.status === 'resolved' ? 'تم الحظر' : 'مرفوض'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-surface-container-high rounded-xl border border-outline-variant">
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">سبب البلاغ</span>
                    <p className="text-sm text-on-surface font-medium leading-relaxed">{report.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {report.sender && (
                      <div className="p-3 bg-surface-container-high rounded-xl border border-outline-variant">
                        <span className="text-[9px] font-bold text-error/70 uppercase tracking-widest block mb-1">المُبلَّغ عنه</span>
                        <p className="text-xs text-on-surface font-bold truncate">{report.sender.username || report.sender_id}</p>
                      </div>
                    )}
                    {report.reporter && (
                      <div className="p-3 bg-surface-container-high rounded-xl border border-outline-variant">
                        <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest block mb-1">المُبلِّغ</span>
                        <p className="text-xs text-on-surface font-bold truncate">{report.reporter.username || report.receiver_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {report.status === 'pending' && report.sender_id && (
                  <div className="flex gap-3 mt-2 pt-4 border-t border-outline-variant">
                    <button 
                      onClick={() => handleBanUser(report.sender_id, report.id)}
                      className="flex-1 bg-error/10 hover:bg-error/20 text-error py-3 rounded-xl text-xs font-bold transition-all border border-error/20 active:scale-95"
                    >
                      حظر المستخدم
                    </button>
                    <button 
                      onClick={() => handleDismissReport(report.id)}
                      className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface py-3 rounded-xl text-xs font-bold transition-all border border-outline-variant active:scale-95"
                    >
                      تجاهل
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
