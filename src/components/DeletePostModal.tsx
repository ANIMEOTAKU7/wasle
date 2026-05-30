import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DeletePostModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeletePostModal: React.FC<DeletePostModalProps> = ({ isOpen, onCancel, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
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
                onClick={onCancel}
                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 py-3 bg-error text-white rounded-xl font-bold hover:bg-error/90 transition-colors"
              >
                حذف
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
