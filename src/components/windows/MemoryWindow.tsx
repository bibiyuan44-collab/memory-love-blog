import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MemorySpot } from '@/store/useDesktopStore';
import { WindowFrame } from './WindowFrame';
import { useDesktopStore } from '@/store/useDesktopStore';

const AI_THOUGHTS = [
  "kk",
  "kk",
  "kk",
  "kk",
  "kk",
  "kk"
];

export const MemoryWindow: React.FC<{
  memory: MemorySpot;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  zIndex: number;
}> = ({ memory, onClose, onFocus, onMinimize, isMinimized, zIndex }) => {
  const setEditingPointId = useDesktopStore(s => s.setEditingPointId);
  
  const handleEdit = () => {
    onClose();
    setEditingPointId(memory.id);
  };
  const aiThought = useMemo(() => AI_THOUGHTS[Math.floor(Math.random() * AI_THOUGHTS.length)], []);
  const randomRot = useMemo(() => (Math.random() - 0.5) * 6, []);
  
  // Calculate days together (assuming starting point for demo)
  const daysTogether = useMemo(() => {
    const start = new Date('2025-11-21').getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  }, []);

  return (
    <WindowFrame 
      id={memory.id} 
      title={`RECORD.JPG - 图画`} 
      icon={memory.emoji} 
      onClose={onClose} 
      onFocus={onFocus}
      onMinimize={onMinimize}
      onEdit={handleEdit}
      isMinimized={isMinimized}
      zIndex={zIndex}
      width="min(800px, 90vw)"
      height="min(600px, 80vh)"
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

      <div className="flex flex-col md:flex-row h-full p-4 gap-6 relative z-10 overflow-auto">
        
        {/* Left: Photos */}
        <div className="w-full md:w-5/12 flex-shrink-0 flex flex-col items-center gap-6">
          <motion.div 
            initial={{ rotate: randomRot - 10, y: 20, opacity: 0 }}
            animate={{ rotate: randomRot, y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-3 pb-12 shadow-[4px_4px_10px_rgba(0,0,0,0.3)] border border-gray-200 relative w-full max-w-[280px]"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-200/50 rotate-3 shadow-sm border border-yellow-300/30" />
            
            <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex items-center justify-center border border-gray-300">
               {/* Placeholder for actual image */}
               <div className="absolute inset-0 bg-gradient-to-br from-[#c8d8e8] to-[#d0c8e0]" />
               <span className="text-4xl filter blur-[1px] opacity-80 mix-blend-overlay">{memory.emoji}</span>
               <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-50" />
            </div>

            <div className="absolute bottom-3 right-4 font-vt323 text-lg text-orange-500 transform -rotate-2 opacity-80">
              {memory.date.replace(/\./g, ' ')}
            </div>
            
            <div className="absolute -bottom-6 -right-6 font-comic text-xs text-blue-800 rotate-12 opacity-60 max-w-[100px]">
              * -
            </div>
          </motion.div>
        </div>

        {/* Right: Text */}
        <div className="flex-1 flex flex-col pt-4">
          <div className="border-b-2 border-win-darkerGray pb-2 mb-6 flex justify-between items-end">
            <h2 className="font-vt323 text-3xl tracking-wider text-win-blue">
              {memory.name}
            </h2>
            <span className="font-vt323 text-gray-500">
              神秘日子已经 {daysTogether} 天了
            </span>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="font-yuyuan text-lg text-gray-800 leading-relaxed tracking-wide mb-8"
          >
            {memory.story}
          </motion.div>

          <div className="mt-auto pt-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="font-comic text-sm text-gray-400 italic text-right border-t border-dashed border-gray-300 pt-4 mb-4"
            >
              "{aiThought}"
            </motion.div>
            
            {/* Windows Media Player 7.0 Style Bar */}
            <div className="win-bevel-in bg-[#000] p-1.5 flex items-center gap-3">
              {/* Album Art Mini */}
              <div className="w-12 h-12 win-bevel-out bg-gray-600 flex-shrink-0 overflow-hidden relative">
                {/* Fallback pattern if no album art */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4f8fd9] to-[#8ec8f5] opacity-55" />
                {memory.photos && memory.photos[0] ? (
                   <img src={memory.photos[0]} className="w-full h-full object-cover filter contrast-[0.8] sepia-[0.5]" alt="album art" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs text-center font-vt323 leading-none">
                    CD<br/>AUDIO
                  </div>
                )}
              </div>

              {/* Display Panel */}
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <div className="font-vt323 text-[#00ff41] text-[15px] tracking-widest leading-none truncate overflow-hidden text-ellipsis whitespace-nowrap drop-shadow-[0_0_3px_rgba(0,255,65,0.4)]">
                  ▶ Now Playing: [相思河畔] - [蔡琴]
                </div>
                <div className="font-vt323 text-[#00ff41]/80 text-[13px] mt-[6px] tracking-widest leading-none">
                  01:46 / 03:15
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-1 pr-1 pl-4 border-l border-white/20">
                {['⏮', '⏸', '⏭'].map((btn, i) => (
                  <button 
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('trigger-window-flash', { detail: memory.id }));
                    }}
                    className="win-bevel-out w-[26px] h-[26px] flex items-center justify-center text-[10px] text-black active:win-bevel-in active:pt-[2px] active:pl-[2px] cursor-pointer"
                  >
                    <span className="opacity-80">{btn}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </WindowFrame>
  );
};