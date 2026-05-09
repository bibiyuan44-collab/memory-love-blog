import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';

interface WindowFrameProps {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onEdit?: () => void;
  isMinimized: boolean;
  zIndex: number;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ 
  id, title, icon = '📁', children, width = '600px', height = '450px', onClose, onFocus, onMinimize, onEdit, isMinimized, zIndex
}) => {
  const focusedWindowId = useDesktopStore(s => s.focusedWindowId);
  const targetPoint = useDesktopStore((s) => s.taskbarButtonCenters[id]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const handleFlash = (e: CustomEvent) => {
      if (e.detail === id) {
        setFlash(true);
        setTimeout(() => setFlash(false), 150); // Quick flash
      }
    };
    window.addEventListener('trigger-window-flash', handleFlash as EventListener);
    return () => window.removeEventListener('trigger-window-flash', handleFlash as EventListener);
  }, [id]);

  const isActive = id === focusedWindowId && !isMinimized;
  const targetX = targetPoint ? `calc(-50% + ${targetPoint.x - window.innerWidth / 2}px)` : '-135%';
  const targetY = targetPoint ? `calc(-50% + ${targetPoint.y - window.innerHeight / 2}px)` : '72vh';

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
      animate={{
        scale: isMinimized ? 0.25 : 1,
        opacity: isMinimized ? 0 : 1,
        x: isMinimized ? targetX : '-50%',
        y: isMinimized ? targetY : '-50%',
      }}
      exit={{ 
        scale: 1.05, 
        opacity: 0, 
        transition: { duration: 0.2 }
      }}
      drag={!isMinimized}
      dragMomentum={false}
      onPointerDown={() => {
        if (isMinimized) return;
        onFocus();
      }}
      transition={{ duration: 0.24, ease: [0.2, 0.78, 0.2, 1] }}
      className="fixed top-1/2 left-1/2 flex flex-col p-[3px] z-50 select-none win-bevel-out"
      style={{ 
        width, height, 
        zIndex,
        filter: flash ? 'brightness(1.2)' : 'none',
        boxShadow: isActive ? '2px 2px 10px rgba(0,0,0,0.5)' : 'none',
        pointerEvents: isMinimized ? 'none' : 'auto',
      }}
    >
      {/* Win98 Classic Title Bar */}
      <div 
        className={`win-title-bar flex-shrink-0 flex items-center gap-1 cursor-grab active:cursor-grabbing px-1 ${isActive ? 'u-dream-title' : 'u-dream-title-muted'}`}
      >
        <span className="text-[14px] ml-1 grayscale drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">{icon}</span>
        <span className="flex-1 truncate tracking-normal font-bold text-white text-[12px] ml-1 pt-[1px]">
          {title}
        </span>
        <div className="flex gap-[2px] flex-shrink-0 mr-[1px]">
          <button
            className="win-btn win-title-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            _
          </button>
          <button className="win-btn win-title-btn">□</button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="win-btn win-title-btn"
          >
            <span className="mt-[1px] ml-[1px]">✕</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-[2px] border-b border-[#808080] flex-shrink-0 text-xs text-black" style={{ fontFamily: 'MS Sans Serif' }}>
        <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">文件(F)</span>
        <span 
          className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2"
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
        >编辑(E)</span>
        <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">查看(V)</span>
        <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">帮助(H)</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white win-bevel-in m-1 relative overflow-hidden flex flex-col">
        {children}
      </div>

      {/* Win98 Status Bar */}
      <div className="h-5 flex items-center px-1 gap-1 flex-shrink-0 text-[11px] text-black border-t border-white bg-[var(--win-gray)]" style={{ fontFamily: 'MS Sans Serif' }}>
        <div className="win-bevel-in px-2 flex-1 truncate h-4 flex items-center">
          <span className="mt-[1px]">就绪</span>
        </div>
        <div className="win-bevel-in px-2 w-24 flex justify-between h-4 items-center">
          <span className="mt-[1px]">我的电脑</span>
        </div>
      </div>
    </motion.div>
  );
};