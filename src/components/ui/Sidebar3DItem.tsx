import React, { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface Sidebar3DItemProps {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: string | number;
  badgeColorClass?: string;
  onClick: () => void;
}

export const Sidebar3DItem: React.FC<Sidebar3DItemProps> = ({
  id,
  label,
  desc,
  icon: Icon,
  isActive,
  badge,
  badgeColorClass = 'bg-amber-500 text-slate-900',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div className="w-full my-0.5">
      <motion.button
        type="button"
        data-active={isActive ? 'true' : 'false'}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: isHovered && !isActive ? 2 : 0,
              }
        }
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`w-full relative overflow-hidden flex items-center justify-between p-2.5 text-left rounded-xl transition-all duration-200 group cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
          isActive
            ? 'active-nav-item font-black bg-gradient-to-r from-indigo-50/90 via-violet-50/60 to-white border border-indigo-200/90 text-indigo-950 shadow-[0_4px_16px_rgba(99,102,241,0.12)]'
            : isHovered
            ? 'bg-slate-50/90 text-slate-900 border border-slate-200/90 shadow-2xs'
            : 'text-slate-600 hover:bg-slate-50/60 border border-transparent'
        }`}
      >
        {/* Subtle active left accent pill */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 via-indigo-600 to-violet-600 shadow-xs" />
        )}

        <div className="flex items-center gap-3 min-w-0 relative z-10 pl-1">
          {/* Vibrant, high-contrast icon container */}
          <div
            className={`p-2 rounded-xl transition-all duration-200 shrink-0 ${
              isActive
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                : isHovered
                ? 'bg-indigo-50 text-indigo-600 shadow-2xs group-hover:scale-105'
                : 'bg-slate-100/90 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </div>

          <div className="truncate">
            <div className="text-xs font-black leading-tight truncate flex items-center gap-1.5">
              <span className={isActive ? 'text-indigo-950 font-black' : 'text-slate-800 font-bold group-hover:text-slate-950'}>
                {label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-xs shrink-0 animate-pulse" />
              )}
            </div>
            <div
              className={`text-[10px] truncate mt-0.5 ${
                isActive ? 'text-indigo-600/80 font-bold' : 'text-slate-400 font-medium group-hover:text-slate-500'
              }`}
            >
              {desc}
            </div>
          </div>
        </div>

        {badge !== undefined && (
          <div className="relative z-10">
            <span className={`ml-2 px-2 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 shadow-2xs ${badgeColorClass}`}>
              {badge}
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
};
