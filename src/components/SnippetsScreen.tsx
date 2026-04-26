import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

import { sendNotification } from '../lib/notifications';

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

export default function SnippetsScreen({ onNav }: { onNav: (screen: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Comments state
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostText, setEditPostText] = useState('');
  const [editPostImage, setEditPostImage] = useState('');

  // Delete state
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const MAX_CHARS = 280;

  const fetchFollowing = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id);
    
    if (data) {
      setFollowingIds(new Set(data.map(f => f.following_id)));
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Fetch posts with author profile
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles:user_id ( id, display_name, username, avatar_url )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch likes
      const { data: likesData } = await supabase.from('post_likes').select('post_id, user_id');
      
      // Fetch comments
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          content,
          created_at,
          profiles:user_id ( id, display_name, username, avatar_url )
        `)
        .order('created_at', { ascending: true });

      if (postsData) {
        const formattedPosts: Post[] = postsData.map((post: any) => {
          const postLikes = likesData?.filter(l => l.post_id === post.id) || [];
          const isLiked = userId ? postLikes.some(l => l.user_id === userId) : false;
          
          const postComments = commentsData?.filter(c => c.post_id === post.id) || [];
          const formattedComments: Comment[] = postComments.map((c: any) => ({
            id: c.id,
            author: {
              name: c.profiles?.display_name || 'مستخدم',
              username: c.profiles?.username || 'user',
              avatar: c.profiles?.avatar_url || null
            },
            content: c.content,
            timestamp: c.created_at
          }));

          return {
            id: post.id,
            author: {
              id: post.user_id,
              name: post.profiles?.display_name || 'مستخدم',
              username: post.profiles?.username || 'user',
              avatar: post.profiles?.avatar_url || null
            },
            content: post.content,
            imageUrl: post.image_url,
            timestamp: post.created_at,
            likes: postLikes.length,
            comments: formattedComments.length,
            commentsList: formattedComments,
            isLiked
          };
        });
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    fetchPosts();
    fetchFollowing();
  }, []);

  const handleFollow = async (targetUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const isFollowing = followingIds.has(targetUserId);
    
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: targetUserId });
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        await supabase.from('follows').insert({ follower_id: session.user.id, following_id: targetUserId });
        setFollowingIds(prev => new Set([...prev, targetUserId]));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handlePost = async () => {
    if ((!inputText.trim() && !imageUrl.trim() && !imageFile) || inputText.length > MAX_CHARS || isUploading) return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    setIsUploading(true);
    try {
      let finalImageUrl = imageUrl.trim() || null;

      // Handle file upload if a file was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: inputText.trim(),
        image_url: finalImageUrl
      });

      if (error) throw error;

      setInputText('');
      setImageUrl('');
      setImageFile(null);
      setShowImageInput(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('حدث خطأ أثناء النشر. تأكد من إعداد Storage بشكل صحيح.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));

    try {
      if (post.isLiked) {
        await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id });
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        
        // Send notification to post author
        if (post.author.id !== user.id) {
          const senderName = currentUser?.display_name || currentUser?.username || 'مستخدم';
          await sendNotification(
            post.author.id,
            'like',
            `أعجب ${senderName} بمقتطفك: ${post.content.substring(0, 20)}...`,
            user.id,
            { post_id: postId }
          );
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      fetchPosts(); // Revert on error
    }
  };

  const handleEditClick = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostText(post.content || '');
    setEditPostImage(post.imageUrl || '');
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditPostText('');
    setEditPostImage('');
  };

  const handleSaveEdit = async (postId: string) => {
    if ((!editPostText.trim() && !editPostImage.trim()) || editPostText.length > MAX_CHARS) return;
    
    try {
      const { error } = await supabase.from('posts').update({
        content: editPostText.trim(),
        image_url: editPostImage.trim() || null
      }).eq('id', postId);

      if (error) throw error;

      setEditingPostId(null);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageUrl('');
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
  };

  const confirmDelete = async () => {
    if (postToDelete) {
      try {
        const { error } = await supabase.from('posts').delete().eq('id', postToDelete);
        if (error) throw error;
        
        setPostToDelete(null);
        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
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

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    try {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: text.trim()
      });

      if (error) throw error;

      // Send notification to post author
      const post = posts.find(p => p.id === postId);
      if (post && post.author.id !== user.id) {
        const senderName = currentUser?.display_name || currentUser?.username || 'مستخدم';
        await sendNotification(
          post.author.id,
          'comment',
          `علق ${senderName} على مقتطفك: ${text.substring(0, 20)}...`,
          user.id,
          { post_id: postId }
        );
      }

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pb-20 overflow-x-hidden w-full mx-auto relative bg-background text-on-surface">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto z-50 flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-background/80 backdrop-blur-xl sticky top-0">
        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-primary to-secondary">المقتطفات</h1>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl flex-1 flex flex-col px-0 sm:px-4 md:px-8">
        {/* Create Snippet Section */}
        <div className="p-4 bg-background">
          <div className="p-4 bg-surface border border-outline-variant rounded-3xl shadow-sm focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:border-primary/50 transition-all duration-300 flex gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">person</span>
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
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                    />
                    {!imageUrl && (
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 bg-surface-container-high text-on-surface text-xs rounded-xl px-3 py-3 border border-outline-variant hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">upload_file</span>
                          اختر صورة من جهازك
                        </button>
                      </div>
                    )}
                    
                    {imageUrl && (
                      <div className="relative w-full rounded-xl overflow-hidden mb-2 border border-outline-variant">
                        <img src={imageUrl} alt="Preview" className="w-full max-h-[200px] object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <button 
                          onClick={clearImage}
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
                  disabled={(!inputText.trim() && !imageUrl.trim() && !imageFile) || inputText.length > MAX_CHARS || isUploading}
                  className="px-5 py-1.5 bg-primary text-white text-sm font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'نشر'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Section */}
        <div className="w-full mt-8 p-4 sm:p-0 pb-20">
          {isLoading ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 sm:space-y-0">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="break-inside-avoid mb-6 p-5 sm:p-6 bg-surface border border-outline-variant rounded-[2rem] animate-pulse flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest shrink-0"></div>
                    <div className="flex-1 flex flex-col gap-2 pt-1">
                      <div className="h-4 bg-surface-container-highest rounded-full w-1/3"></div>
                      <div className="h-3 bg-surface-container-highest rounded-full w-1/4"></div>
                    </div>
                  </div>
                  <div className="h-32 bg-surface-container-highest rounded-2xl w-full mt-2"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-on-surface-variant bg-surface rounded-[2rem] border border-outline-variant/50 max-w-md mx-auto mt-8">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">post_add</span>
              <p className="text-lg font-medium text-center">لا توجد مقتطفات بعد. كن أول من ينشر!</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 sm:space-y-0">
              <AnimatePresence mode="popLayout">
                {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 25, delay: (i % 10) * 0.05 }}
                  className="break-inside-avoid mb-6 p-5 sm:p-6 bg-surface/80 backdrop-blur-md border border-outline-variant/50 rounded-[2rem] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-primary/30 transition-all duration-500 flex flex-col gap-3 sm:gap-4 group relative overflow-hidden"
                >
                  {/* Subtle Hover Gradient */}
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
                            onClick={() => handleFollow(post.author.id)}
                            className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full transition-all ${followingIds.has(post.author.id) ? 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                          >
                            {followingIds.has(post.author.id) ? 'متابع' : 'متابعة'}
                          </button>
                        </>
                      )}
                    </div>
                    {currentUser?.username === post.author.username && editingPostId !== post.id ? (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-2">
                        <button
                          onClick={() => handleEditClick(post)}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container-high"
                          title="تعديل"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(post.id)}
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
                  
                  {editingPostId === post.id ? (
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
                          onClick={handleCancelEdit}
                          className="px-4 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleSaveEdit(post.id)}
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
                      onClick={() => toggleLike(post.id)}
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
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 transition-colors group ${expandedPosts[post.id] ? 'text-primary' : 'hover:text-primary'}`}
                      aria-label={expandedPosts[post.id] ? 'إخفاء التعليقات' : 'عرض التعليقات'}
                      aria-expanded={!!expandedPosts[post.id]}
                      aria-controls={`comments-section-${post.id}`}
                    >
                      <span className={`material-symbols-outlined text-[18px] transition-transform ${expandedPosts[post.id] ? 'scale-110' : 'group-hover:scale-110'}`} style={{ fontVariationSettings: expandedPosts[post.id] ? "'FILL' 1" : "'FILL' 0" }}>chat_bubble</span>
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

                  {/* Comments Section */}
                  <AnimatePresence>
                    {expandedPosts[post.id] && (
                      <motion.div
                        id={`comments-section-${post.id}`}
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
              ))}
            </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-7xl mx-auto z-50 flex justify-around items-center px-4 py-3 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNav('home')} className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-2 hover:text-on-surface transition-all group">
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
