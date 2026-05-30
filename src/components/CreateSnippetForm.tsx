import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateSnippetFormProps {
  currentUser: any;
  inputText: string;
  setInputText: (text: string) => void;
  showImageInput: boolean;
  setShowImageInput: (val: boolean) => void;
  imageUrl: string;
  setImageUrl: (val: string) => void;
  imageFile: File | null;
  setImageFile: (val: File | null) => void;
  isUploading: boolean;
  onPost: () => void;
  MAX_CHARS: number;
}

export const CreateSnippetForm: React.FC<CreateSnippetFormProps> = ({
  currentUser,
  inputText,
  setInputText,
  showImageInput,
  setShowImageInput,
  imageUrl,
  setImageUrl,
  imageFile,
  setImageFile,
  isUploading,
  onPost,
  MAX_CHARS
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
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
              onClick={onPost}
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
  );
};
