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
      const { data: { user } } = await supabase.auth.getUser();
      
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
    <div className="bg-background min-h-[100dvh] flex flex-col items-center max-w-[390px] mx-auto relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-red-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="w-full z-50 flex justify-between items-center px-6 h-20 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 border border-white/5 text-white">
          <span className="material-symbols-outlined text-xl rtl:rotate-180">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-black text-sm text-red-400 tracking-tight">لوحة الإدارة</h1>
          <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Security Center</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="w-full px-6 py-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black text-lg tracking-tight">البلاغات الأخيرة</h2>
          <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{reports.filter(r => r.status === 'pending').length} معلق</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
            />
            <span className="text-white/20 text-xs font-black uppercase tracking-widest">جاري التحميل</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
            <span className="material-symbols-outlined text-6xl">verified_user</span>
            <span className="text-white text-xs font-black uppercase tracking-widest">لا توجد بلاغات حالياً</span>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/[0.03] border ${report.status === 'pending' ? 'border-red-500/20' : 'border-white/5'} rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-md`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">تاريخ البلاغ</span>
                    <span className="text-xs text-white/60 font-bold">{new Date(report.created_at).toLocaleString('ar-SA')}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                    report.status === 'pending' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    report.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/5'
                  }`}>
                    {report.status === 'pending' ? 'قيد المراجعة' : report.status === 'resolved' ? 'تم الحظر' : 'مرفوض'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">سبب البلاغ</span>
                    <p className="text-sm text-white font-bold leading-relaxed">{report.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {report.sender && (
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-red-400/40 uppercase tracking-widest block mb-1">المُبلَّغ عنه</span>
                        <p className="text-xs text-white font-black truncate">{report.sender.username || report.sender_id}</p>
                      </div>
                    )}
                    {report.reporter && (
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest block mb-1">المُبلِّغ</span>
                        <p className="text-xs text-white font-black truncate">{report.reporter.username || report.receiver_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {report.status === 'pending' && report.sender_id && (
                  <div className="flex gap-3 mt-2 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => handleBanUser(report.sender_id, report.id)}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95"
                    >
                      حظر المستخدم
                    </button>
                    <button 
                      onClick={() => handleDismissReport(report.id)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95"
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
