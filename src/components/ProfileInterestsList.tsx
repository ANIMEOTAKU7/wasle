import React from 'react';
import { motion } from 'motion/react';

interface ProfileInterestsListProps {
  interests: any[];
  onEditClick: () => void;
}

export const ProfileInterestsList: React.FC<ProfileInterestsListProps> = ({ interests, onEditClick }) => {
  return (
    <div className="px-4 py-6 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface">الاهتمامات</h3>
        <button 
          onClick={onEditClick} 
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
              className="bg-surface-container-high px-4 py-2 rounded-full flex items-center gap-2"
            >
              <span className="text-base">{interest.icon}</span>
              <span className="text-xs font-medium text-on-surface">{interest.name}</span>
            </motion.div>
          ))
        ) : (
          <div className="w-full pt-4 text-center">
            <p className="text-sm text-on-surface-variant font-medium italic">لم تقم بإضافة اهتمامات بعد.</p>
          </div>
        )}
      </div>
    </div>
  );
};
