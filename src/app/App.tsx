import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';
import { BootScreen } from '@/components/boot/BootScreen';
import { Desktop } from '@/components/desktop/Desktop';
import { DesktopPet } from '@/components/desktop/DesktopPet';
import { DesktopMonitor } from '@/components/desktop/DesktopMonitor';
import { FMRadio } from '@/components/desktop/FMRadio';
import { TaskManager } from '@/components/desktop/TaskManager';
import { DialUpConnection } from '@/components/desktop/DialUpConnection';
import { RetroBrowser } from '@/components/desktop/RetroBrowser';
import { MemoryMap } from '@/components/map/MemoryMap';
import { MemoryWindow } from '@/components/windows/MemoryWindow';
import { ChatApp } from '@/components/windows/ChatApp';
import { OurPhotos } from '@/components/windows/OurPhotos';
import { Stars, DreamyDecor, MouseTrail } from '@/components/effects';
import { memorySpots } from '@/data/memorySpots';

export const App: React.FC = () => {
  const booting = useDesktopStore(s => s.booting);
  const appOpen = useDesktopStore(s => s.appOpen);
  const windowOrder = useDesktopStore(s => s.windowOrder);
  const ambientColor = useDesktopStore(s => s.ambientColor);
  const closeWindow = useDesktopStore(s => s.closeWindow);
  const closeApp = useDesktopStore(s => s.closeApp);
  const mapOnlyMode = appOpen === 'memories';
  const handleDesktopFeed = (e: React.MouseEvent<HTMLDivElement>) => {
    if (booting || mapOnlyMode) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('desktop-pet-feed', {
      detail: { x: e.clientX, y: e.clientY, source: 'context-menu' },
    }));
  };

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden ${mapOnlyMode ? 'bg-transparent' : 'bg-[#6f9fd8]'}`}
      onContextMenu={handleDesktopFeed}
    >
      {/* Background Effects */}
      {!mapOnlyMode && (
        <>
          <Stars />
          <DreamyDecor />
          <MouseTrail />
        </>
      )}
      
      {/* Ambient Light based on current memory */}
      {!mapOnlyMode && (
        <motion.div 
          className="fixed inset-0 pointer-events-none z-0"
          animate={{ 
            background: `radial-gradient(ellipse at 60% 40%, ${ambientColor}15 0%, transparent 50%)`
          }}
          transition={{ duration: 2 }}
        />
      )}

      <AnimatePresence mode="wait">
        {booting ? (
          <BootScreen key="boot" />
        ) : (
          <motion.div 
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="relative w-full h-full"
          >
            {/* Memory Map (exclusive full-screen mode) */}
            {appOpen === 'memories' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.35 }}
                className="fixed inset-0 z-20"
              >
                <MemoryMap />
                <motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  onClick={closeApp}
                  className="fixed top-4 right-4 z-[100] win-bevel-out active:win-bevel-in font-vt323 text-xl px-4 py-2 flex items-center gap-2 shadow-lg bg-[var(--win-gray)] text-[var(--dream-accent)] hover:brightness-105"
                >
                  ✕ 关闭地图
                </motion.button>
              </motion.div>
            ) : (
              <>
            <AnimatePresence>
              {appOpen === 'photos' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="fixed inset-0 z-20"
                >
                  <OurPhotos />

                  <motion.button
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={closeApp}
                    className="fixed top-4 right-4 z-[100] win-bevel-out active:win-bevel-in font-vt323 text-xl px-4 py-2 flex items-center gap-2 shadow-lg bg-[var(--win-gray)] text-[var(--dream-accent)] hover:brightness-105"
                  >
                    ✕ 关闭相册
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Room */}
            <ChatApp />

            {/* Desktop */}
            <Desktop />

            {/* Desktop Monitor Sidebar */}
            <DesktopMonitor />

            {/* FM Radio */}
            <FMRadio />

            {/* Task Manager */}
            <TaskManager />

            {/* Dial-up Connection */}
            <DialUpConnection />

            {/* Retro Browser */}
            <RetroBrowser />

            {/* Memory Windows (floating on top of desktop) */}
            <AnimatePresence>
              {windowOrder.map((id, index) => {
                const memory = memorySpots.find(m => m.id === id);
                if (!memory) return null;
                return (
                  <MemoryWindow 
                    key={id}
                    memory={memory}
                    index={index}
                    onClose={() => closeWindow(id)}
                  />
                );
              })}
            </AnimatePresence>

            {/* Desktop Pet - Always on top */}
            <DesktopPet />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};