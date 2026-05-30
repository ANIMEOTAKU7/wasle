import React from 'react';

interface ProfilePostGridProps {
  posts: any[];
}

export const ProfilePostGrid: React.FC<ProfilePostGridProps> = ({ posts }) => {
  return (
    <div className="grid grid-cols-3 gap-0.5 pb-24">
      {posts.map(post => (
        <div 
          key={post.id} 
          className="aspect-square bg-surface-container-highest relative group cursor-pointer overflow-hidden"
        >
          {post.image_url ? (
            <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full p-2 flex items-center justify-center text-[10px] sm:text-xs text-center break-words overflow-hidden leading-tight bg-gradient-to-br from-surface to-surface-container-highest group-hover:bg-surface transition-colors">
              <span className="line-clamp-4">{post.content}</span>
            </div>
          )}
          {/* Overlay icon */}
          {post.image_url && <span className="material-symbols-outlined absolute top-1 right-1 text-white drop-shadow-md text-[14px]">imagesmode</span>}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
        </div>
      ))}
      {posts.length === 0 && (
        <div className="col-span-3 py-16 flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">post_add</span>
          <p className="text-sm font-medium">لا توجد مقتطفات بعد</p>
        </div>
      )}
    </div>
  );
};
