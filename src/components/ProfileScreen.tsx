import { useState, useEffect, useRef } from 'react';
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
    <div className="flex flex-col items-center justify-start min-h-screen pb-24 overflow-x-hidden max-w-[390px] mx-auto relative bg-background">
      <main className="w-full pt-16 px-6 space-y-10 flex-1">
        {/* Avatar Section */}
        <section className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center border-4 border-background shadow-xl">
              {uploadingAvatar ? (
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
              ) : profile?.avatar_url ? (
                <img alt="User Profile" className="w-full h-full object-cover" src={profile.avatar_url} />
              ) : (
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
              )}
            </div>
            
            {/* Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
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
              <div className="space-y-3 w-full">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="الاسم المستعار"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-center focus:outline-none focus:border-primary transition-colors"
                />
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="نبذة قصيرة عنك تظهر للآخرين..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-center text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
                <div className="flex gap-2 justify-center pt-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-white/50 hover:text-white text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isSaving ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : 'حفظ'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-headline font-bold text-white">{profile?.display_name || 'مستخدم مجهول'}</h2>
                <p className="text-white/60 text-sm mt-2 max-w-[280px] mx-auto leading-relaxed">
                  {profile?.bio || 'لا توجد نبذة شخصية حتى الآن.'}
                </p>
                <p className="text-white/30 text-[10px] mt-3">
                  {profile?.created_at ? `انضم في ${new Date(profile.created_at).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}` : ''}
                </p>
              </>
            )}
          </div>
        </section>

        {/* Interests Section */}
        <section className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-white/90">الاهتمامات</h3>
            <button onClick={() => onNav('interests')} className="text-primary text-xs font-medium hover:text-primary-container transition-colors">
              تعديل
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? (
              interests.map((interest, idx) => (
                <div key={idx} className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="text-sm">{interest.icon}</span>
                  <span className="text-xs text-white/80">{interest.name}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40 px-1">لم تقم بإضافة اهتمامات بعد.</p>
            )}
          </div>
        </section>

        {/* Actions Section */}
        <section className="space-y-2">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center gap-4 py-4 px-4 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
            >
              <span className="material-symbols-outlined text-xl text-primary">edit_note</span>
              <span className="font-medium text-sm">تعديل النبذة والاسم</span>
            </button>
          )}
          <button 
            onClick={() => onNav('security')}
            className="w-full flex items-center gap-4 py-4 px-4 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined text-xl text-primary">lock_outline</span>
            <span className="font-medium text-sm">الأمان والخصوصية</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 py-4 px-4 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-2xl transition-all mt-4">
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-medium text-sm">تسجيل الخروج</span>
          </button>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#10141a]/90 backdrop-blur-xl rounded-t-[32px] border-t border-white/5">
        <a href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }} className="flex flex-col items-center justify-center text-white/40 px-4 py-1.5 hover:text-white/90 transition-all active:scale-90 duration-200">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-1">الرئيسية</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-white/40 px-4 py-1.5 hover:text-white/90 transition-all active:scale-90 duration-200">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-[10px] font-medium mt-1">المحادثات</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-2xl px-4 py-1.5 active:scale-90 duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[10px] font-medium mt-1">الملف الشخصي</span>
        </a>
      </nav>
    </div>
  );
}
