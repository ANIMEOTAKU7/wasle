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
    <div className="bg-background min-h-screen flex flex-col items-center max-w-[390px] mx-auto relative">
      <header className="w-full z-50 flex justify-between items-center px-6 py-6 bg-surface-container-highest">
        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors p-2 -mr-2">
          <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
        </button>
        <h1 className="text-white text-base font-bold text-red-400">لوحة تحكم الإدارة</h1>
        <div className="w-8"></div>
      </header>

      <main className="w-full px-6 py-6 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-white font-medium mb-2">البلاغات الأخيرة</h2>
        
        {loading ? (
          <div className="text-center text-white/50 py-10">جاري التحميل...</div>
        ) : reports.length === 0 ? (
          <div className="text-center text-white/50 py-10">لا توجد بلاغات حالياً</div>
        ) : (
          reports.map((report) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/5 border ${report.status === 'pending' ? 'border-red-500/30' : 'border-white/10'} rounded-2xl p-4 flex flex-col gap-3`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-white/40">{new Date(report.created_at).toLocaleString('ar-SA')}</span>
                <span className={`text-[10px] px-2 py-1 rounded-full ${
                  report.status === 'pending' ? 'bg-red-500/20 text-red-400' : 
                  report.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {report.status === 'pending' ? 'قيد المراجعة' : report.status === 'resolved' ? 'تم الحظر' : 'مرفوض'}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <p className="text-sm text-white"><span className="text-white/50">السبب:</span> {report.reason}</p>
                {report.sender && (
                  <p className="text-xs text-white/70"><span className="text-white/40">المُبلَّغ عنه:</span> {report.sender.username || report.sender_id}</p>
                )}
                {report.reporter && (
                  <p className="text-xs text-white/70"><span className="text-white/40">المُبلِّغ:</span> {report.reporter.username || report.receiver_id}</p>
                )}
              </div>

              {report.status === 'pending' && report.sender_id && (
                <div className="flex gap-2 mt-2 pt-3 border-t border-white/10">
                  <button 
                    onClick={() => handleBanUser(report.sender_id, report.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    حظر المستخدم
                  </button>
                  <button 
                    onClick={() => handleDismissReport(report.id)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    تجاهل
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
}
