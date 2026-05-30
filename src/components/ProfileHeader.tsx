import React, { useRef } from 'react';
import { motion } from 'motion/react';

interface ProfileHeaderProps {
  profile: any;
  stats: { posts: number; likes: number; matches: number; followers: number; following: number };
  isEditing: boolean;
  editName: string;
  editBio: string;
  isSaving: boolean;
  uploadingAvatar: boolean;
  onEditNameChange: (val: string) => void;
  onEditBioChange: (val: string) => void;
  onSaveProfile: () => void;
  onCancelEdit: () => void;
  onToggleEdit: () => void;
  onLogout: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNav: (screen: string, params?: any) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  stats,
  isEditing,
  editName,
  editBio,
  isSaving,
  uploadingAvatar,
  onEditNameChange,
  onEditBioChange,
  onSaveProfile,
  onCancelEdit,
  onToggleEdit,
  onLogout,
  onAvatarUpload,
  onNav
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="px-4 pb-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant shadow-sm relative z-10">
            {uploadingAvatar ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : profile?.avatar_url ? (
              <img alt="User Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={profile.avatar_url} referrerPolicy="no-referrer" />
            ) : (
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
            )}
          </div>
          
          {/* Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all border-2 border-background z-20"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onAvatarUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        {!isEditing && (
          <div className="flex-1 flex justify-around items-center pt-2">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-on-surface">{stats.posts}</span>
              <span className="text-[11px] text-on-surface-variant">المنشورات</span>
            </div>
            <div 
              onClick={() => onNav('follows', { userId: profile?.id, type: 'followers' })}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-lg font-bold text-on-surface">{stats.followers}</span>
              <span className="text-[11px] text-on-surface-variant">المتابعون</span>
            </div>
            <div 
              onClick={() => onNav('follows', { userId: profile?.id, type: 'following' })}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-lg font-bold text-on-surface">{stats.following}</span>
              <span className="text-[11px] text-on-surface-variant">يتابع</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="w-full">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 w-full bg-surface p-4 rounded-xl border border-outline-variant mt-2"
          >
            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-on-surface-variant px-1">الاسم المستعار</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                placeholder="الاسم المستعار"
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-on-surface-variant px-1">النبذة الشخصية</label>
              <textarea 
                value={editBio}
                onChange={(e) => onEditBioChange(e.target.value)}
                placeholder="نبذة قصيرة عنك تظهر للآخرين..."
                rows={3}
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={onCancelEdit}
                className="flex-1 py-2 rounded-lg text-on-surface-variant hover:text-on-surface text-sm font-bold bg-surface-container-high"
              >
                إلغاء
              </button>
              <button 
                onClick={onSaveProfile}
                disabled={isSaving}
                className="flex-[2] py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                {isSaving ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : 'حفظ'}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-1 mb-4">
            <h2 className="text-sm font-bold text-on-surface">{profile?.display_name || 'مستخدم مجهول'}</h2>
            {profile?.bio && (
              <p className="text-sm text-on-surface whitespace-pre-wrap leading-tight">{profile.bio}</p>
            )}
            <span className="text-[10px] text-on-surface-variant mt-1">
              {profile?.created_at ? `عضو منذ ${new Date(profile.created_at).getFullYear()}` : 'عضو جديد'}
            </span>
          </div>
        )}
      </div>
      
      {!isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <button 
            onClick={onToggleEdit}
            className="flex-1 py-1.5 px-3 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-sm font-bold text-on-surface transition-colors border border-outline-variant/30"
          >
            تعديل الملف الشخصي
          </button>
          <button 
            onClick={onLogout} 
            className="py-1.5 px-3 bg-surface-container-high hover:bg-error/10 text-on-surface hover:text-error rounded-lg text-sm font-bold transition-colors border border-outline-variant/30 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      )}
    </section>
  );
};
