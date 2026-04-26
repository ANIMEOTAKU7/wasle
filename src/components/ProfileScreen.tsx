import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileScreen({ onNav }: { onNav: (screen: string, params?: any) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, likes: 0, matches: 0, followers: 0, following: 0 });
  
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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
        setEditName(profileData?.display_name || '');
        setEditBio(profileData?.bio || '');

        // Fetch stats including follows
        const [postsRes, likesRes, chatsRes, followersRes, followingRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
          supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('chats').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
          supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', user.id),
          supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', user.id)
        ]);

        setStats({
          posts: postsRes.count || 0,
          likes: likesRes.count || 0,
          matches: chatsRes.count || 0,
          followers: followersRes.count || 0,
          following: followingRes.count || 0
        });

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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
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
    <div className="flex flex-col items-center justify-start min-h-screen pb-32 overflow-x-hidden max-w-[390px] mx-auto relative bg-background text-on-surface">
      {/* Top Bar */}
      <header className="w-full max-w-[390px] z-50 flex items-center justify-between px-6 py-6 border-b border-outline-variant bg-background/90 backdrop-blur-md shrink-0">
        <h1 className="text-xl font-bold tracking-tight">الملف الشخصي</h1>
        <button 
          onClick={() => onNav('security')}
          aria-label="الإعدادات"
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>
      </header>

      <main className="w-full pt-8 px-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
        {/* Avatar Section */}
        <section className="flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border-4 border-background shadow-sm">
              {uploadingAvatar ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : profile?.avatar_url ? (
                <img alt="User Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={profile.avatar_url} referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
              )}
            </div>
            
            {/* Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all border-4 border-background"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
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
                className="space-y-4 w-full bg-surface p-6 rounded-3xl border border-outline-variant"
              >
                <div className="space-y-1 text-right">
                  <label className="text-xs font-medium text-on-surface-variant px-1">الاسم المستعار</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="الاسم المستعار"
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary transition-all font-medium"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-xs font-medium text-on-surface-variant px-1">النبذة الشخصية</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="نبذة قصيرة عنك تظهر للآخرين..."
                    rows={3}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary transition-all resize-none font-medium leading-relaxed"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 rounded-xl text-on-surface-variant hover:text-on-surface text-sm font-bold transition-all bg-surface-container-high"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-[2] py-3 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : 'حفظ التغييرات'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-on-surface tracking-tight">{profile?.display_name || 'مستخدم مجهول'}</h2>
                <p className="text-on-surface-variant text-sm font-medium max-w-[280px] mx-auto leading-relaxed">
                  {profile?.bio || 'لا توجد نبذة شخصية حتى الآن. أضف شيئاً عن نفسك!'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant border border-outline-variant">
                    {profile?.created_at ? `عضو منذ ${new Date(profile.created_at).getFullYear()}` : 'عضو جديد'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        {!isEditing && (
          <div className="w-full space-y-4">
            <section className="grid grid-cols-3 gap-3">
              <div className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                <span className="text-xl font-bold text-primary">{stats.posts}</span>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">مقتطفات</span>
              </div>
              <div className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                <span className="text-xl font-bold text-error">{stats.likes}</span>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">إعجابات</span>
              </div>
              <div className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                <span className="text-xl font-bold text-purple-500">{stats.matches}</span>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">تطابقات</span>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => onNav('follows', { userId: profile?.id, type: 'followers' })}
                className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-surface-container-high transition-colors"
              >
                <span className="text-xl font-bold text-on-surface">{stats.followers}</span>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">متابع</span>
              </div>
              <div 
                onClick={() => onNav('follows', { userId: profile?.id, type: 'following' })}
                className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-surface-container-high transition-colors"
              >
                <span className="text-xl font-bold text-on-surface">{stats.following}</span>
                <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">أتابع</span>
              </div>
            </section>
          </div>
        )}

        {/* Interests Section */}
        <section className="space-y-4 bg-surface p-6 rounded-3xl border border-outline-variant">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">favorite</span>
              <h3 className="text-sm font-bold text-on-surface">الاهتمامات</h3>
            </div>
            <button 
              onClick={() => onNav('interests')} 
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary/10 transition-all"
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
                  className="bg-surface-container-high border border-outline-variant px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-surface-container-highest transition-all"
                >
                  <span className="text-base">{interest.icon}</span>
                  <span className="text-xs font-medium text-on-surface">{interest.name}</span>
                </motion.div>
              ))
            ) : (
              <div className="w-full py-4 text-center">
                <p className="text-sm text-on-surface-variant font-medium italic">لم تقم بإضافة اهتمامات بعد.</p>
              </div>
            )}
          </div>
        </section>

        {/* Actions Section */}
        <section className="space-y-3 pb-10">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-between py-4 px-5 text-on-surface-variant hover:text-on-surface bg-surface hover:bg-surface-container-high rounded-2xl transition-all border border-outline-variant group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">edit_note</span>
                </div>
                <span className="font-bold text-sm">تعديل الملف الشخصي</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-[-4px] transition-transform rtl:rotate-180">chevron_left</span>
            </button>
          )}
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-between py-4 px-5 text-error hover:text-error/80 bg-error/5 hover:bg-error/10 rounded-2xl transition-all border border-error/10 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl">logout</span>
              </div>
              <span className="font-bold text-sm">تسجيل الخروج</span>
            </div>
            <span className="material-symbols-outlined text-error/50 group-hover:translate-x-[-4px] transition-transform rtl:rotate-180">chevron_left</span>
          </button>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 flex justify-around items-center px-2 py-3 bg-surface/90 backdrop-blur-md border-t border-outline-variant">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('home')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('snippets')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">dynamic_feed</span>
          <span className="text-[10px] mt-1 font-medium">المقتطفات</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('chats')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          <span className="text-[10px] mt-1 font-medium">المحادثات</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center justify-center text-primary px-3 py-2 relative"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[10px] mt-1 font-bold">الملف الشخصي</span>
        </motion.button>
      </nav>
    </div>
  );
}
