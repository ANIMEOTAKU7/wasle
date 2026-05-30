import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Comment } from '../types/post'; // Assume types are extracted

interface SnippetCardProps {
  post: Post;
  currentUser: any;
  followingIds: Set<string>;
  isEditing: boolean;
  editPostText: string;
  editPostImage: string;
  isExpanded: boolean;
  commentInput: string;
  index: number;
  onFollow: (id: string) => void;
  onEditClick: (post: Post) => void;
  onDeleteClick: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  setEditPostText: (t: string) => void;
  setEditPostImage: (u: string) => void;
  onToggleLike: (id: string) => void;
  onToggleComments: (id: string) => void;
  onCommentChange: (id: string, text: string) => void;
  onAddComment: (id: string) => void;
  formatRelativeTime: (dateString: string) => string;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({
  post,
  currentUser,
  followingIds,
  isEditing,
  editPostText,
  editPostImage,
  isExpanded,
  commentInput,
  index,
  onFollow,
  onEditClick,
  onDeleteClick,
  onCancelEdit,
  onSaveEdit,
  setEditPostText,
  setEditPostImage,
  onToggleLike,
  onToggleComments,
  onCommentChange,
  onAddComment,
  formatRelativeTime
}) => {
  const MAX_CHARS = 280;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25, delay: (index % 10) * 0.05 }}
      className="break-inside-avoid mb-6 p-5 sm:p-6 bg-surface/80 backdrop-blur-md border border-outline-variant/50 rounded-[2rem] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-primary/30 transition-all duration-500 flex flex-col gap-3 sm:gap-4 group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      <div className="flex gap-3 sm:gap-4 relative z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/50 group-hover:border-primary/40 shadow-sm transition-colors duration-300">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant text-xl sm:text-2xl">person</span>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-on-surface truncate max-w-[120px] sm:max-w-xs">{post.author.name}</span>
              <span className="text-xs sm:text-sm text-on-surface-variant truncate max-w-[100px] sm:max-w-xs">@{post.author.username}</span>
              <span className="text-xs text-on-surface-variant mx-1 hidden sm:inline">·</span>
              <span className="text-xs text-on-surface-variant shrink-0">{formatRelativeTime(post.timestamp)}</span>
              
              {currentUser?.id !== post.author.id && (
                <>
                  <span className="text-xs text-on-surface-variant mx-1">·</span>
                  <button 
                    onClick={() => onFollow(post.author.id)}
                    className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full transition-all ${followingIds.has(post.author.id) ? 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                  >
                    {followingIds.has(post.author.id) ? 'متابع' : 'متابعة'}
                  </button>
                </>
              )}
            </div>
            {currentUser?.username === post.author.username && !isEditing ? (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-2">
                <button
                  onClick={() => onEditClick(post)}
                  className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container-high"
                  title="تعديل"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={() => onDeleteClick(post.id)}
                  className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-full hover:bg-error/10"
                  title="حذف"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ) : currentUser?.username !== post.author.username && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-2">
                <button
                  onClick={() => {
                    alert('تم إرسال بلاغ عن هذا المنشور. سيقوم فريقنا بمراجعته قريباً.');
                  }}
                  className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-full hover:bg-error/10"
                  title="إبلاغ عن محتوى مسيء"
                >
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={editPostText}
                onChange={(e) => setEditPostText(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-2xl p-3 text-sm sm:text-base resize-none focus:outline-none focus:border-primary transition-colors"
                rows={3}
                maxLength={MAX_CHARS}
              />
              <input
                type="url"
                value={editPostImage}
                onChange={(e) => setEditPostImage(e.target.value)}
                placeholder="رابط الصورة (اختياري)"
                className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-colors"
                dir="ltr"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => onSaveEdit(post.id)}
                  disabled={(!editPostText.trim() && !editPostImage.trim()) || editPostText.length > MAX_CHARS}
                  className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-sm"
                >
                  حفظ
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-3">
              {post.content && (
                <p className="text-[15px] sm:text-base text-on-surface leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              )}
              {post.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-outline-variant/50 shadow-sm relative group/image">
                  <img 
                    src={post.imageUrl} 
                    alt="Post attachment" 
                    className="w-full max-h-[450px] object-cover cursor-pointer group-hover/image:scale-[1.02] transition-transform duration-500"
                    onClick={() => window.open(post.imageUrl, '_blank')}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none"></div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between sm:justify-start sm:gap-8 mt-4 pt-4 border-t border-outline-variant/30 text-on-surface-variant">
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1.5 group transition-colors relative ${post.isLiked ? 'text-error' : 'hover:text-error'}`}
              aria-label={post.isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
              aria-pressed={post.isLiked}
            >
              <AnimatePresence>
                {post.isLiked && (
                  <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 rounded-full bg-error pointer-events-none"
                    style={{ filter: "blur(4px)" }}
                  />
                )}
              </AnimatePresence>
              <span className={`material-symbols-outlined text-[18px] transition-transform ${post.isLiked ? 'scale-110' : 'group-hover:scale-110'}`} style={{ fontVariationSettings: post.isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                favorite
              </span>
              {post.likes > 0 && <span className="text-xs">{post.likes}</span>}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggleComments(post.id)}
              className={`flex items-center gap-1.5 transition-colors group ${isExpanded ? 'text-primary' : 'hover:text-primary'}`}
              aria-label={isExpanded ? 'إخفاء التعليقات' : 'عرض التعليقات'}
              aria-expanded={!!isExpanded}
              aria-controls={`comments-section-${post.id}`}
            >
              <span className={`material-symbols-outlined text-[18px] transition-transform ${isExpanded ? 'scale-110' : 'group-hover:scale-110'}`} style={{ fontVariationSettings: isExpanded ? "'FILL' 1" : "'FILL' 0" }}>chat_bubble</span>
              {post.comments > 0 && <span className="text-xs">{post.comments}</span>}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.85 }}
              className="flex items-center gap-1.5 hover:text-green-500 transition-colors group"
              aria-label="إعادة نشر"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">repeat</span>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.85 }}
              className="flex items-center gap-1.5 hover:text-secondary transition-colors group"
              aria-label="مشاركة"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">send</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                id={`comments-section-${post.id}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3 pt-3 border-t border-outline-variant/50"
              >
                <div className="flex flex-col gap-3 mb-3">
                  {post.commentsList?.map(comment => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0">
                        {comment.author.avatar ? (
                          <img src={comment.author.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">person</span>
                        )}
                      </div>
                      <div className="flex-1 bg-surface-container-high rounded-2xl rounded-tr-sm px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-xs text-on-surface">{comment.author.name}</span>
                          <span className="text-[10px] text-on-surface-variant">@{comment.author.username}</span>
                          <span className="text-[10px] text-on-surface-variant mx-1">·</span>
                          <span className="text-[10px] text-on-surface-variant">{formatRelativeTime(comment.timestamp)}</span>
                        </div>
                        <p className="text-xs text-on-surface leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!post.commentsList || post.commentsList.length === 0) && (
                    <p className="text-xs text-on-surface-variant text-center py-2">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                    {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center bg-surface-container-high rounded-full px-3 py-1 border border-outline-variant focus-within:border-primary/50 transition-colors">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => onCommentChange(post.id, e.target.value)}
                      placeholder="أضف تعليقاً..."
                      className="flex-1 bg-transparent border-none text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none py-1.5"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onAddComment(post.id);
                      }}
                    />
                    <button
                      onClick={() => onAddComment(post.id)}
                      disabled={!commentInput?.trim()}
                      className="text-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rtl:-rotate-180"
                      aria-label="إرسال التعليق"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
