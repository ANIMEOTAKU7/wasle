import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface Comment {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string | null;
  };
  content: string;
  timestamp: string;
}

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string | null;
  };
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  commentsList?: Comment[];
  isLiked?: boolean;
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'الآن';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes === 1) return 'قبل دقيقة';
  if (diffInMinutes === 2) return 'قبل دقيقتين';
  if (diffInMinutes <= 10) return `قبل ${diffInMinutes} دقائق`;
  if (diffInMinutes < 60) return `قبل ${diffInMinutes} دقيقة`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return 'قبل ساعة';
  if (diffInHours === 2) return 'قبل ساعتين';
  if (diffInHours <= 10) return `قبل ${diffInHours} ساعات`;
  if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'قبل يوم';
  if (diffInDays === 2) return 'قبل يومين';
  if (diffInDays <= 10) return `قبل ${diffInDays} أيام`;
  return `قبل ${diffInDays} يوم`;
};

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: { name: 'أحمد محمد', username: 'ahmed_m', avatar: null },
    content: 'التصميم البسيط (Minimalism) ليس مجرد مساحات فارغة، بل هو إعطاء المساحة للأشياء المهمة لتبرز وتتنفس. ✨',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 12,
    comments: 1,
    commentsList: [
      {
        id: 'c1',
        author: { name: 'عمر', username: 'omar_99', avatar: null },
        content: 'أتفق معك تماماً! البساطة تصنع الجمال.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: '2',
    author: { name: 'سارة خالد', username: 'sara_k', avatar: null },
    content: 'متحمسة جداً لتجربة الميزات الجديدة في التطبيق! الواجهة أصبحت أسرع وأكثر سلاسة. 🚀',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 45,
    comments: 0,
    commentsList: []
  }
];

export default function SnippetsScreen({ onNav }: { onNav: (screen: string) => void }) {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Comments state
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostText, setEditPostText] = useState('');
  const [editPostImage, setEditPostImage] = useState('');

  // Delete state
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const MAX_CHARS = 280;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(profile);
      }
    };
    fetchUser();
  }, []);

  const handlePost = () => {
    if ((!inputText.trim() && !imageUrl.trim()) || inputText.length > MAX_CHARS) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: currentUser?.display_name || 'مستخدم',
        username: currentUser?.username || 'user',
        avatar: currentUser?.avatar_url || null
      },
      content: inputText.trim(),
      imageUrl: imageUrl.trim() || undefined,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      commentsList: []
    };

    setPosts([newPost, ...posts]);
    setInputText('');
    setImageUrl('');
    setShowImageInput(false);
  };

  const toggleLike = (id: string) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const handleEditClick = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostText(post.content || '');
    setEditPostImage(post.imageUrl || '');
  };

  const handleSaveEdit = (postId: string) => {
    if ((!editPostText.trim() && !editPostImage.trim()) || editPostText.length > MAX_CHARS) return;
    
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          content: editPostText.trim(),
          imageUrl: editPostImage.trim() || undefined
        };
      }
      return p;
    }));
    setEditingPostId(null);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      setPosts(posts.filter(p => p.id !== postToDelete));
      setPostToDelete(null);
    }
  };

  const cancelDelete = () => {
    setPostToDelete(null);
  };

  const toggleComments = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: {
        name: currentUser?.display_name || 'مستخدم',
        username: currentUser?.username || 'user',
        avatar: currentUser?.avatar_url || null
      },
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments + 1,
          commentsList: [...(p.commentsList || []), newComment]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pb-20 overflow-x-hidden max-w-[390px] mx-auto relative bg-background text-on-surface">
      {/* Header */}
      <header className="w-full z-50 flex items-center justify-center px-6 py-4 border-b border-outline-variant bg-background/90 backdrop-blur-md sticky top-0">
        <h1 className="text-lg font-bold tracking-tight">المقتطفات</h1>
      </header>

      <main className="w-full flex-1 flex flex-col">
        {/* Create Snippet Section */}
        <div className="p-4 border-b border-outline-variant bg-surface/30">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="ماذا يدور في ذهنك؟"
                className="w-full bg-transparent border-none text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:ring-0 min-h-[80px] text-sm leading-relaxed"
                maxLength={MAX_CHARS}
              />
              
              <AnimatePresence>
                {showImageInput && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="أدخل رابط الصورة هنا..."
                      className="w-full bg-surface-container-high text-on-surface text-xs rounded-xl px-3 py-2 border border-outline-variant focus:border-primary/50 focus:outline-none transition-colors mb-2"
                      dir="ltr"
                    />
                    {imageUrl && (
                      <div className="relative w-full rounded-xl overflow-hidden mb-2 border border-outline-variant">
                        <img src={imageUrl} alt="Preview" className="w-full max-h-[200px] object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <button 
                          onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowImageInput(!showImageInput)}
                    className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${showImageInput ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'}`}
                    title="إضافة صورة عبر رابط"
                  >
                    <span className="material-symbols-outlined text-[20px]">image</span>
                  </button>
                  <span className={`text-xs font-medium ${inputText.length >= MAX_CHARS ? 'text-error' : 'text-on-surface-variant'}`}>
                    {inputText.length} / {MAX_CHARS}
                  </span>
                </div>
                <button
                  onClick={handlePost}
                  disabled={(!inputText.trim() && !imageUrl.trim()) || inputText.length > MAX_CHARS}
                  className="px-5 py-1.5 bg-primary text-white text-sm font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  نشر
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Section */}
        <div className="flex flex-col">
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-b border-outline-variant hover:bg-surface/30 transition-colors flex gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                  {post.author.avatar ? (
                    <img src={post.author.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-on-surface">{post.author.name}</span>
                      <span className="text-xs text-on-surface-variant">@{post.author.username}</span>
                      <span className="text-xs text-on-surface-variant mx-1">·</span>
                      <span className="text-xs text-on-surface-variant">{formatRelativeTime(post.timestamp)}</span>
                    </div>
                    {currentUser?.username === post.author.username && editingPostId !== post.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(post)}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high"
                          title="تعديل"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(post.id)}
                          className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10"
                          title="حذف"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingPostId === post.id ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <textarea
                        value={editPostText}
                        onChange={(e) => setEditPostText(e.target.value)}
                        className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-xl p-2 text-sm resize-none focus:outline-none focus:border-primary"
                        rows={3}
                        maxLength={MAX_CHARS}
                      />
                      <input
                        type="url"
                        value={editPostImage}
                        onChange={(e) => setEditPostImage(e.target.value)}
                        placeholder="رابط الصورة (اختياري)"
                        className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-xl p-2 text-xs focus:outline-none focus:border-primary"
                        dir="ltr"
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          disabled={(!editPostText.trim() && !editPostImage.trim()) || editPostText.length > MAX_CHARS}
                          className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-full disabled:opacity-50 transition-colors"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.content && (
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap mt-1">
                          {post.content}
                        </p>
                      )}
                      {post.imageUrl && (
                        <div className="mt-2 rounded-2xl overflow-hidden border border-outline-variant">
                          <img 
                            src={post.imageUrl} 
                            alt="Post attachment" 
                            className="w-full max-h-[300px] object-cover cursor-pointer hover:brightness-110 transition-all"
                            onClick={() => window.open(post.imageUrl, '_blank')}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-6 mt-3 text-on-surface-variant">
                    <button 
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 group transition-colors ${post.isLiked ? 'text-error' : 'hover:text-error'}`}
                    >
                      <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: post.isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                      </span>
                      <span className="text-xs">{post.likes > 0 && post.likes}</span>
                    </button>
                    <button 
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 transition-colors group ${expandedPosts[post.id] ? 'text-primary' : 'hover:text-primary'}`}
                    >
                      <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: expandedPosts[post.id] ? "'FILL' 1" : "'FILL' 0" }}>chat_bubble</span>
                      <span className="text-xs">{post.comments > 0 && post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
                      <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">repeat</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-secondary transition-colors group">
                      <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">send</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {expandedPosts[post.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-outline-variant/50"
                      >
                        {/* Comments List */}
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

                        {/* Add Comment Input */}
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
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => handleCommentChange(post.id, e.target.value)}
                              placeholder="أضف تعليقاً..."
                              className="flex-1 bg-transparent border-none text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none py-1.5"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="text-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rtl:-rotate-180"
                            >
                              <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[390px] z-50 flex justify-around items-center px-2 py-3 bg-surface/90 backdrop-blur-md border-t border-outline-variant">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNav('home')} className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all">
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} className="flex flex-col items-center justify-center text-primary px-3 py-2 relative">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>dynamic_feed</span>
          <span className="text-[10px] mt-1 font-bold">المقتطفات</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNav('chats')} className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all">
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          <span className="text-[10px] mt-1 font-medium">المحادثات</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNav('profile')} className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all">
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] mt-1 font-medium">الملف الشخصي</span>
        </motion.button>
      </nav>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 max-w-[390px] mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error mb-2">
                  <span className="material-symbols-outlined text-2xl">delete</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">حذف المقتطف</h3>
                <p className="text-sm text-on-surface-variant">هل أنت متأكد أنك تريد حذف هذا المقتطف؟ لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={cancelDelete}
                  className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-error text-white rounded-xl font-bold hover:bg-error/90 transition-colors"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
