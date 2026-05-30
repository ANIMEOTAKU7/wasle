import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { ProfileHeader } from './ProfileHeader';
import { ProfilePostGrid } from './ProfilePostGrid';
import { ProfileInterestsList } from './ProfileInterestsList';

export default function ProfileScreen({ onNav }: { onNav: (screen: string, params?: any) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, likes: 0, matches: 0, followers: 0, following: 0 });
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'interests'>('posts');
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
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
        const [postsRes, likesRes, chatsRes, followersRes, followingRes, userPostsRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('chats').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
          supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', user.id),
          supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', user.id),
          supabase.from('posts').select('id, content, image_url, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        setStats({
          posts: postsRes.count || 0,
          likes: likesRes.count || 0,
          matches: chatsRes.count || 0,
          followers: followersRes.count || 0,
          following: followingRes.count || 0
        });

        if (userPostsRes.data) {
          setUserPosts(userPostsRes.data);
        }

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error('فشل رفع الصورة. تأكد من إعداد Storage Bucket باسم "avatars" في Supabase.');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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
      <div className="flex flex-col items-center justify-start min-h-screen pb-32 overflow-x-hidden w-full mx-auto relative bg-background text-on-surface">
        <header className="w-full max-w-7xl mx-auto z-50 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-outline-variant bg-background/90 backdrop-blur-md shrink-0 sticky top-0">
          <div className="h-6 w-32 bg-surface-container-highest rounded-full animate-pulse"></div>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest animate-pulse"></div>
        </header>

        <main className="w-full max-w-3xl pt-4 space-y-0 flex-1 overflow-y-auto">
          <section className="px-4 pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-container-highest animate-pulse shrink-0"></div>
              <div className="flex-1 flex justify-around items-center pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-2 px-4">
                    <div className="w-8 h-8 bg-surface-container-highest rounded-full animate-pulse"></div>
                    <div className="w-12 h-3 bg-surface-container-highest rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="w-full flex flex-col gap-2 mb-4">
              <div className="h-4 w-1/3 bg-surface-container-highest rounded-full animate-pulse"></div>
              <div className="h-3 w-2/3 bg-surface-container-highest rounded-full animate-pulse mt-1"></div>
              <div className="h-3 w-1/2 bg-surface-container-highest rounded-full animate-pulse mt-0.5"></div>
              <div className="h-2 w-1/4 bg-surface-container-highest rounded-full animate-pulse mt-2"></div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 py-4 bg-surface-container-highest rounded-lg animate-pulse"></div>
              <div className="w-12 py-4 bg-surface-container-highest rounded-lg animate-pulse"></div>
            </div>
          </section>

          <div className="flex items-center w-full border-t border-outline-variant mt-2">
            <div className="flex-1 flex justify-center items-center py-4 border-b-2 border-transparent">
              <div className="w-6 h-6 bg-surface-container-highest rounded animate-pulse"></div>
            </div>
            <div className="flex-1 flex justify-center items-center py-4 border-b-2 border-transparent">
              <div className="w-6 h-6 bg-surface-container-highest rounded animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-0.5 pb-24 mt-0.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-surface-container-highest animate-pulse"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pb-32 overflow-x-hidden w-full mx-auto relative bg-background text-on-surface">
      {/* Top Bar */}
      <header className="w-full max-w-7xl mx-auto z-50 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-outline-variant bg-background/90 backdrop-blur-md shrink-0 sticky top-0">
        <h1 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          {profile?.username || profile?.display_name || 'الملف الشخصي'}
          <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
        </h1>
        <button 
          onClick={() => onNav('security')}
          aria-label="الإعدادات"
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>
      </header>

      <main className="w-full max-w-3xl pt-4 space-y-0 flex-1 overflow-y-auto custom-scrollbar">
        <ProfileHeader 
          profile={profile}
          stats={stats}
          isEditing={isEditing}
          editName={editName}
          editBio={editBio}
          isSaving={isSaving}
          uploadingAvatar={uploadingAvatar}
          onEditNameChange={setEditName}
          onEditBioChange={setEditBio}
          onSaveProfile={handleSaveProfile}
          onCancelEdit={() => setIsEditing(false)}
          onToggleEdit={() => setIsEditing(true)}
          onLogout={handleLogout}
          onAvatarUpload={handleAvatarUpload}
          onNav={onNav}
        />

        {/* Tabs */}
        {!isEditing && (
          <div className="flex items-center w-full border-t border-outline-variant">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 flex justify-center items-center py-3 border-b-2 transition-colors ${activeTab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[24px]">grid_on</span>
            </button>
            <button 
              onClick={() => setActiveTab('interests')}
              className={`flex-1 flex justify-center items-center py-3 border-b-2 transition-colors ${activeTab === 'interests' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[24px]">favorite</span>
            </button>
          </div>
        )}

        {/* Grid / Content */}
        {!isEditing && activeTab === 'posts' && (
          <ProfilePostGrid posts={userPosts} />
        )}

        {/* Interests Tab */}
        {!isEditing && activeTab === 'interests' && (
          <ProfileInterestsList 
            interests={interests} 
            onEditClick={() => onNav('interests')} 
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-7xl mx-auto z-50 flex justify-around items-center px-4 py-3 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onNav('home')}
          className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all cursor-pointer group"
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
