import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileScreen({ onNav }: { onNav: (screen: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
        setEditName(profileData?.display_name || '');
        setEditBio(profileData?.bio || '');

        const { data: interestsData, error: interestsError } = await supabase
          .from('user_interests')
          .select(`
            interests (
              id,
              name,
              icon
            )
          `)
          .eq('user_id', user.id);
          
        if (interestsError) {
          console.error('Error fetching user interests:', interestsError);
        }
          
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNav('landing');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: editName,
            bio: editBio
          })
          .eq('id', user.id);

        if (error) throw error;
        
        // Update local state
        setProfile({ ...profile, display_name: editName, bio: editBio });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // Upload to Supabase Storage (assuming a bucket named 'avatars' exists)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // If the bucket doesn't exist, we'll catch it and alert the user.
        console.error("Upload error details:", uploadError);
        throw new Error('فشل رفع الصورة. تأكد من إعداد Storage Bucket باسم "avatars" في Supabase.');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pb-32 overflow-x-hidden max-w-[390px] mx-auto relative bg-background">
      {/* Top Bar */}
      <header className="w-full max-w-[390px] z-50 flex items-center justify-between px-6 py-6 border-b border-white/5 bg-background/80 backdrop-blur-xl shrink-0">
        <h1 className="text-xl font-black text-white tracking-tight">الملف الشخصي</h1>
        <button 
          onClick={() => onNav('security')}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>
      </header>

      <main className="w-full pt-8 px-6 space-y-8 flex-1 overflow-y-auto no-scrollbar">
        {/* Avatar Section */}
        <section className="flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary shadow-2xl shadow-primary/20">
              <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-surface-container-highest flex items-center justify-center">
                {uploadingAvatar ? (
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : profile?.avatar_url ? (
                  <img alt="User Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={profile.avatar_url} referrerPolicy="no-referrer" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-white/20">person</span>
                )}
              </div>
            </div>
            
            {/* Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-1 right-1 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all border-4 border-background"
            >
              <span className="material-symbols-outlined text-[18px] font-bold">photo_camera</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="text-center w-full">
            {isEditing ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 w-full bg-white/5 p-6 rounded-[2.5rem] border border-white/5"
              >
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest px-2">الاسم المستعار</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="الاسم المستعار"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest px-2">النبذة الشخصية</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="نبذة قصيرة عنك تظهر للآخرين..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none focus:border-primary transition-all resize-none font-medium leading-relaxed"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3.5 rounded-2xl text-white/40 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-[2] py-3.5 bg-white text-black hover:bg-white/90 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : 'حفظ التغييرات'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{profile?.display_name || 'مستخدم مجهول'}</h2>
                <p className="text-white/40 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">
                  {profile?.bio || 'لا توجد نبذة شخصية حتى الآن. أضف شيئاً عن نفسك!'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest border border-white/5">
                    {profile?.created_at ? `عضو منذ ${new Date(profile.created_at).getFullYear()}` : 'عضو جديد'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Interests Section */}
        <section className="space-y-5 bg-surface-container-high p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">favorite</span>
              <h3 className="text-xs font-black text-white/90 uppercase tracking-widest">الاهتمامات</h3>
            </div>
            <button 
              onClick={() => onNav('interests')} 
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? (
              interests.map((interest, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all"
                >
                  <span className="text-base">{interest.icon}</span>
                  <span className="text-[11px] font-bold text-white/70">{interest.name}</span>
                </motion.div>
              ))
            ) : (
              <div className="w-full py-4 text-center">
                <p className="text-xs text-white/20 font-bold italic">لم تقم بإضافة اهتمامات بعد.</p>
              </div>
            )}
          </div>
        </section>

        {/* Actions Section */}
        <section className="space-y-3 pb-10">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-between py-5 px-6 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-[2rem] transition-all border border-white/5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">edit_note</span>
                </div>
                <span className="font-black text-xs uppercase tracking-widest">تعديل الملف الشخصي</span>
              </div>
              <span className="material-symbols-outlined text-white/20 group-hover:translate-x-[-4px] transition-transform rtl:rotate-180">chevron_left</span>
            </button>
          )}
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-between py-5 px-6 text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-[2rem] transition-all border border-red-500/10 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">logout</span>
              </div>
              <span className="font-black text-xs uppercase tracking-widest">تسجيل الخروج</span>
            </div>
            <span className="material-symbols-outlined text-red-500/20 group-hover:translate-x-[-4px] transition-transform rtl:rotate-180">chevron_left</span>
          </button>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 flex justify-around items-center px-4 py-4 bg-background/80 backdrop-blur-xl border-t border-white/5">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('home')}
          className="flex flex-col items-center justify-center text-white/40 px-5 py-2 hover:text-white transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] mt-1 font-bold tracking-widest uppercase">الرئيسية</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('chats')}
          className="flex flex-col items-center justify-center text-white/40 px-5 py-2 hover:text-white transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          <span className="text-[10px] mt-1 font-bold tracking-widest uppercase">المحادثات</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center justify-center text-primary px-5 py-2 relative"
        >
          <div className="absolute -top-1 w-1 h-1 rounded-full bg-primary"></div>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[10px] mt-1 font-black tracking-widest uppercase">الملف الشخصي</span>
        </motion.button>
      </nav>
    </div>
  );
}
