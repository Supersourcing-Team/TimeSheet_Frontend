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
        className={`w-full relative overflow-hidden flex items-center justify-between p-2.5 text-left rounded-xl transition-colors duration-150 group cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isActive
            ? 'active-nav-item font-extrabold bg-primary-subtle border border-primary-subtle-border shadow-xs'
            : isHovered
            ? 'bg-slate-100 text-slate-900 shadow-2xs border border-slate-200'
            : 'text-slate-700 hover:bg-slate-100/70 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 relative z-10">
          {/* Crisp, Sharp Icon Container (No blur, high contrast) */}
          <div
            className={`p-2 rounded-lg transition-colors shrink-0 shadow-2xs ${
              isActive
                ? 'bg-primary text-white shadow-xs'
                : isHovered
                ? 'bg-primary-subtle text-primary shadow-xs'
                : 'bg-slate-100 text-slate-600 group-hover:bg-primary-subtle group-hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </div>

          <div className="truncate">
            <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
              <span className={isActive ? 'text-primary font-black' : 'text-slate-800 font-bold group-hover:text-slate-900'}>
                {label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-xs shrink-0 animate-pulse" />
              )}
            </div>
            <div
              className={`text-[10px] truncate mt-0.5 ${
                isActive ? 'text-primary/75 font-semibold' : 'text-slate-400 font-normal group-hover:text-slate-500'
              }`}
            >
              {desc}
            </div>
          </div>
        </div>

        {badge !== undefined && (
          <div className="relative z-10">
            <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 shadow-2xs ${badgeColorClass}`}>
              {badge}
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
};
