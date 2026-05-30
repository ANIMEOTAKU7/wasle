import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

import { sendNotification } from '../lib/notifications';
import { Post, Comment } from '../types/post';
import { SnippetCard } from './SnippetCard';
import { CreateSnippetForm } from './CreateSnippetForm';
import { DeletePostModal } from './DeletePostModal';

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

    // Set up realtime subscriptions
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        (payload) => {
          fetchPosts(); // re-fetch to get accurate likes count. You could also do optimistic updates.
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        (payload) => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        <CreateSnippetForm 
          currentUser={currentUser}
          inputText={inputText}
          setInputText={setInputText}
          showImageInput={showImageInput}
          setShowImageInput={setShowImageInput}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          imageFile={imageFile}
          setImageFile={setImageFile}
          isUploading={isUploading}
          onPost={handlePost}
          MAX_CHARS={MAX_CHARS}
        />

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
                  <SnippetCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    followingIds={followingIds}
                    isEditing={editingPostId === post.id}
                    editPostText={editPostText}
                    editPostImage={editPostImage}
                    isExpanded={!!expandedPosts[post.id]}
                    commentInput={commentInputs[post.id] || ''}
                    index={i}
                    onFollow={handleFollow}
                    onEditClick={handleEditClick}
                    onDeleteClick={handleDeleteClick}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    setEditPostText={setEditPostText}
                    setEditPostImage={setEditPostImage}
                    onToggleLike={toggleLike}
                    onToggleComments={toggleComments}
                    onCommentChange={handleCommentChange}
                    onAddComment={handleAddComment}
                    formatRelativeTime={formatRelativeTime}
                  />
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
      <DeletePostModal 
        isOpen={!!postToDelete}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
