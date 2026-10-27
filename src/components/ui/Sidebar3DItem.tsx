import React, { useRef, useState, useCallback } from 'react';
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
  const itemRef = useRef<HTMLButtonElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (shouldReduceMotion || !itemRef.current) return;
      const rect = itemRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 3D tilt calculation (max 6 degrees)
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      setRotation({ x: rotateX, y: rotateY });
      setGlarePos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
    },
    [shouldReduceMotion]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  }, []);

  return (
    <div style={{ perspective: 800 }} className="w-full my-0.5">
      <motion.button
        ref={itemRef}
        type="button"
        data-active={isActive ? 'true' : 'false'}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={
          shouldReduceMotion
            ? {}
            : {
                rotateX: rotation.x,
                rotateY: rotation.y,
                scale: isHovered ? 1.025 : 1,
                z: isHovered ? 8 : 0,
              }
        }
        whileTap={{ scale: 0.98, rotateX: 0, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`w-full relative overflow-hidden flex items-center justify-between p-2.5 text-left rounded-xl transition-colors duration-150 group cursor-pointer select-none ${
          isActive
            ? 'active-nav-item font-bold shadow-md shadow-sky-600/25 ring-1 ring-sky-400/30'
            : isHovered
            ? 'bg-slate-100/90 text-slate-900 shadow-md shadow-slate-300/30 border border-slate-200/80'
            : 'text-slate-700 hover:bg-slate-100/70 border border-transparent'
        }`}
      >
        {/* Dynamic Specular 3D Glare on Hover */}
        {!shouldReduceMotion && isHovered && (
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-40 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, transparent 60%)`,
            }}
          />
        )}

        <div className="flex items-center gap-3 min-w-0 relative z-10" style={{ transform: 'translateZ(10px)' }}>
          {/* 3D Elevated Icon Container */}
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: isHovered ? 1.12 : 1,
                    rotateZ: isHovered ? (isActive ? 3 : -3) : 0,
                  }
            }
            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            className={`p-2 rounded-lg transition-colors shadow-2xs ${
              isActive
                ? 'bg-white/20 text-white shadow-sm shadow-black/10'
                : isHovered
                ? 'bg-sky-100 text-sky-700 shadow-sm'
                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </motion.div>

          <div className="truncate">
            <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
              <span>{label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs animate-pulse" />
              )}
            </div>
            <div
              className={`text-[10px] truncate mt-0.5 ${
                isActive ? 'text-white/90 font-medium' : 'text-slate-400 font-normal'
              }`}
            >
              {desc}
            </div>
          </div>
        </div>

        {badge !== undefined && (
          <div style={{ transform: 'translateZ(14px)' }} className="relative z-10">
            <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 shadow-2xs ${badgeColorClass}`}>
              {badge}
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
};
