import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';
import { memorySpots } from '@/data/memorySpots';
import {
  PixelIconHeart,
  PixelIconPolaroid,
  PixelIconDoc,
  PixelIconDocLines,
  PixelIconDocHeart,
  PixelIconRecycle,
  PixelIconTaskmgr,
  PixelIconDialup,
  PixelIconFoodLog,
  PixelIconFolder,
  PixelIconMonitor,
  PixelIconSettings,
  PixelIconTerminal,
  PixelIconPower,
  PixelIconAlert,
  PixelIconVolume
} from '@/components/desktop/PixelDesktopIcons';

interface DesktopIconProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  onDoubleClick: () => void;
  index: number;
  drag?: boolean;
  onDragEnd?: (e: any, info: any) => void;
}

const DesktopIcon = React.forwardRef<HTMLDivElement, DesktopIconProps>(
  ({ id, name, icon, onDoubleClick, index, drag, onDragEnd }, ref) => {
    const [offset] = useState({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8
    });

    return (
      <motion.div
        ref={ref}
        drag={drag}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        whileDrag={{ scale: 1.05, zIndex: 100, opacity: 0.8 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 * index, type: 'spring', stiffness: 200 }}
        className={`absolute group select-none flex flex-col items-center justify-start w-[96px] ${drag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        onDoubleClick={onDoubleClick}
        style={{
          left: `${22 + Math.floor(index / 6) * 108}px`,
          top: `${22 + (index % 6) * 108}px`,
          x: offset.x,
          y: offset.y
        }}
      >
        <div className="mb-1.5 flex h-12 w-full items-center justify-center [image-rendering:pixelated] drop-shadow-[2px_2px_0_rgba(13,27,61,0.85)]">
          {icon}
        </div>
        <span
          className="w-full min-h-[36px] px-1.5 py-[2px] text-white text-[12px] font-semibold text-center leading-[1.18] tracking-[0.01em] transition-colors duration-150 group-hover:text-[#d8deea]"
          style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun', textShadow: '1px 1px 0 rgba(13,27,61,0.95)' }}
        >
          {name}
        </span>
      </motion.div>
    );
  }
);
DesktopIcon.displayName = 'DesktopIcon';

const RunDialog: React.FC<{ onClose: () => void; onTriggerEasterEgg: () => void }> = ({ onClose, onTriggerEasterEgg }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toUpperCase() === 'ILOVEYOU') {
      onTriggerEasterEgg();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="win-bevel-out p-1 w-80 shadow-2xl flex flex-col"
      >
        <div className="h-5 u-dream-title flex items-center px-1 mb-2">
          <PixelIconTerminal size={12} className="brightness-0 invert" />
          <span className="text-white text-xs font-bold ml-1 tracking-wide" style={{ fontFamily: 'MS Sans Serif' }}>运行</span>
          <button onClick={onClose} className="win-btn win-title-btn ml-auto pb-[1px]"><span className="mt-[1px] ml-[1px]">✕</span></button>
        </div>
        <div className="flex gap-4 p-2">
          <PixelIconTerminal size={32} className="flex-shrink-0 mt-2" />
          <div className="flex flex-col gap-2">
            <span className="text-xs" style={{ fontFamily: 'MS Sans Serif' }}>输入程序、文件夹、文档或 Internet 资源的名称，Windows 将为您打开它。</span>
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <span className="text-xs font-bold" style={{ fontFamily: 'MS Sans Serif' }}>打开(O):</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="win-bevel-in bg-white text-black font-vt323 px-1 flex-1 outline-none text-lg h-6"
                autoFocus
              />
            </form>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2 px-2 pb-2">
          <button onClick={handleSubmit} className="win-bevel-out w-16 h-6 text-xs active:win-bevel-in" style={{ fontFamily: 'MS Sans Serif' }}>确定</button>
          <button onClick={onClose} className="win-bevel-out w-16 h-6 text-xs active:win-bevel-in" style={{ fontFamily: 'MS Sans Serif' }}>取消</button>
        </div>
      </motion.div>
    </div>
  );
};

const ShutdownDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/40">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="win-bevel-out p-1 w-80 shadow-2xl flex flex-col"
      >
        <div className="h-5 u-dream-title flex items-center px-1 mb-2">
          <div className="brightness-0 invert"><PixelIconPower size={12} /></div>
          <span className="text-white text-xs font-bold ml-1 tracking-wide" style={{ fontFamily: 'MS Sans Serif' }}>关闭 Windows</span>
          <button onClick={onClose} className="win-btn win-title-btn ml-auto pb-[1px]"><span className="mt-[1px] ml-[1px]">✕</span></button>
        </div>
        <div className="flex gap-4 p-4 items-center">
          <PixelIconPower size={32} className="flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-sm font-bold mb-1" style={{ fontFamily: 'MS Sans Serif' }}>你希望计算机做什么？</span>
            <label className="flex items-center gap-2 text-xs" style={{ fontFamily: 'MS Sans Serif' }}>
              <input type="radio" name="shutdown" className="cursor-pointer" /> 待机(S)
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ fontFamily: 'MS Sans Serif' }}>
              <input type="radio" name="shutdown" className="cursor-pointer" /> 关闭(U)
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ fontFamily: 'MS Sans Serif' }}>
              <input type="radio" name="shutdown" defaultChecked className="cursor-pointer" /> 重新启动(R)
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 px-2 pb-2 border-t border-[#808080] pt-2">
          <button onClick={() => window.location.reload()} className="win-bevel-out w-16 h-6 text-xs bg-[var(--win-gray)] active:win-bevel-in font-bold" style={{ fontFamily: 'MS Sans Serif' }}>确定</button>
          <button onClick={onClose} className="win-bevel-out w-16 h-6 text-xs active:win-bevel-in" style={{ fontFamily: 'MS Sans Serif' }}>取消</button>
        </div>
      </motion.div>
    </div>
  );
};

export const Desktop: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [time, setTime] = useState(new Date());
  const openApp = useDesktopStore(s => s.openApp);
  const appOpen = useDesktopStore(s => s.appOpen);
  const activeWindows = useDesktopStore(s => s.activeWindows);
  const focusedWindowId = useDesktopStore(s => s.focusedWindowId);
  const openWindow = useDesktopStore(s => s.openWindow);
  const focusWindow = useDesktopStore(s => s.focusWindow);
  const minimizeWindow = useDesktopStore(s => s.minimizeWindow);
  const setTaskbarButtonCenter = useDesktopStore(s => s.setTaskbarButtonCenter);
  const lastOpenedMemory = useDesktopStore(s => s.lastOpenedMemory);
  const bbsConnected = useDesktopStore(s => s.bbsConnected);

  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  const trashRef = useRef<HTMLDivElement>(null);
  const [trashFull, setTrashFull] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [iconsList, setIconsList] = useState(['memories', 'photos', 'food', 'chat', 'trash', 'fight', 'taskmgr', 'dialup']);
  const [resetKey, setResetKey] = useState(0);
  const [sorryOpen, setSorryOpen] = useState(false);

  const [bsod, setBsod] = useState(false);
  const [fireworks, setFireworks] = useState(false);
  const clickCount = useRef(0);
  const clickTimeout = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    const syncTaskbarCenters = () => {
      Object.keys(activeWindows).forEach((windowId) => {
        const tab = document.querySelector<HTMLElement>(`[data-window-tab-id="${windowId}"]`);
        if (!tab) {
          setTaskbarButtonCenter(windowId, null);
          return;
        }
        const rect = tab.getBoundingClientRect();
        setTaskbarButtonCenter(windowId, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      });
    };

    syncTaskbarCenters();
    window.addEventListener('resize', syncTaskbarCenters);
    return () => window.removeEventListener('resize', syncTaskbarCenters);
  }, [activeWindows, setTaskbarButtonCenter]);

  const handleDesktopClick = () => {
    setStartMenuOpen(false);
    clickCount.current += 1;
    if (clickTimeout.current) window.clearTimeout(clickTimeout.current);
    if (clickCount.current >= 5) {
      setBsod(true);
      clickCount.current = 0;
      setTimeout(() => setBsod(false), 2000);
    } else {
      clickTimeout.current = window.setTimeout(() => {
        clickCount.current = 0;
      }, 500);
    }
  };

  const handleDragEnd = (e: any, info: any, id: string) => {
    if (id !== 'fight') return;
    if (trashRef.current) {
      const rect = trashRef.current.getBoundingClientRect();
      const pointerX = info.point.x;
      const pointerY = info.point.y;
      if (
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom
      ) {
        setTrashFull(true);
        setDeleteConfirm(true);
      } else {
        setResetKey(k => k + 1);
      }
    } else {
      setResetKey(k => k + 1);
    }
  };

  const handleDeleteYes = () => {
    setDeleteConfirm(false);
    setIconsList(prev => prev.filter(i => i !== 'fight'));
    setTimeout(() => {
      setTrashFull(false);
      setIconsList(prev => [...prev, 'sorry']);
    }, 3000);
  };

  const handleDeleteNo = () => {
    setDeleteConfirm(false);
    setTrashFull(false);
    setResetKey(k => k + 1);
  };

  const iconData: Record<string, { name: string; icon: React.ReactNode; action: () => void }> = {
    memories: { name: 'Memories.exe', icon: <PixelIconHeart size={40} />, action: () => openApp('memories') },
    photos: { name: 'Our Photos', icon: <PixelIconPolaroid size={40} />, action: () => openApp('photos') },
    chat: { name: 'Chat History.txt', icon: <PixelIconDocLines size={40} />, action: () => {} },
    food: { name: 'Food_Log', icon: <PixelIconFoodLog size={40} />, action: () => openWindow('food-memories', 'Meal Tracker') },
    trash: { name: 'Recycle Bin', icon: <PixelIconRecycle full={trashFull} size={40} />, action: () => {} },
    fight: { name: '吵架记录.txt', icon: <PixelIconDoc size={40} />, action: () => {} },
    sorry: { name: '对不起.txt', icon: <PixelIconDocHeart size={40} />, action: () => setSorryOpen(true) },
    taskmgr: { name: 'TaskMgr.exe', icon: <PixelIconTaskmgr size={40} />, action: () => openApp('taskmanager') },
    dialup: {
      name: 'Dial-Up BBS',
      icon: (
        <div className="relative flex items-center justify-center">
          <PixelIconDialup size={40} />
          {!bbsConnected && (
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-[#00ff00] ring-1 ring-[#0d1b3d]" />
          )}
        </div>
      ),
      action: () => openWindow('dialup', 'Secret Island BBS')
    }
  };

  return (
    <div
      className="fixed inset-0 z-10 select-none overflow-hidden bg-transparent"
      onClick={handleDesktopClick}
    >

      {iconsList.map((id, i) => {
        const data = iconData[id];
        if (!data) return null;
        return (
          <DesktopIcon
            key={`${id}-${resetKey}`}
            id={id}
            name={data.name}
            icon={data.icon}
            index={i}
            onDoubleClick={data.action}
            ref={id === 'trash' ? trashRef : null}
            drag={id === 'fight'}
            onDragEnd={(e, info) => handleDragEnd(e, info, id)}
          />
        );
      })}

      {/* Start Menu */}
      <AnimatePresence>
        {startMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.1 }}
            className="fixed bottom-7 left-1 z-[60] win-bevel-out p-[2px] flex flex-col shadow-2xl w-48 font-bold text-xs"
            style={{ fontFamily: 'MS Sans Serif, Tahoma' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute left-[2px] top-[2px] bottom-[2px] w-6 u-dream-title-v flex flex-col justify-end pb-2 items-center">
              <span className="text-white tracking-widest" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                <span className="font-bold text-[14px]">Windows </span>
                <span className="font-normal text-[14px]">98</span>
              </span>
            </div>
            <div className="ml-7 flex flex-col pt-1 bg-[var(--win-gray)]">
              <div
                className="px-3 py-1.5 flex items-center justify-between u-dream-hover cursor-default relative"
                onMouseEnter={() => setProgramsOpen(true)}
                onMouseLeave={() => setProgramsOpen(false)}
              >
                <div className="flex items-center gap-2"><PixelIconFolder size={16} /> 程序(P)</div>
                <span className="text-[10px]">▶</span>
                {programsOpen && (
                  <div className="absolute left-full bottom-0 win-bevel-out p-[2px] w-40 shadow-lg text-black">
                    <div className="px-2 py-1 flex items-center gap-2 u-dream-hover cursor-pointer" onClick={() => { openApp('memories'); setStartMenuOpen(false); }}>
                      <PixelIconMonitor size={14} /> 回忆地图
                    </div>
                    <div className="h-[1px] bg-white border-t border-[#808080] my-1 mx-1" />
                    {memorySpots.map(spot => (
                      <div
                        key={spot.id}
                        className="px-2 py-1 flex items-center gap-2 u-dream-hover cursor-pointer font-normal truncate"
                        onClick={() => { openWindow(spot.id, spot.name); setStartMenuOpen(false); }}
                      >
                        <span className="text-[10px]">{spot.emoji}</span> {spot.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div
                className="px-3 py-1.5 flex items-center gap-2 u-dream-hover cursor-pointer"
                onClick={() => {
                  if (lastOpenedMemory) {
                    const memory = memorySpots.find((spot) => spot.id === lastOpenedMemory);
                    if (!memory) return;
                    openWindow(lastOpenedMemory, memory.name);
                    setStartMenuOpen(false);
                  }
                }}
              >
                <PixelIconDocLines size={16} /> 文档(D)
              </div>
              <div className="px-3 py-1.5 flex items-center gap-2 u-dream-hover cursor-pointer">
                <PixelIconSettings size={16} /> 设置(S)
              </div>
              <div className="h-[1px] bg-white border-t border-[#808080] my-1 mx-1" />
              <div
                className="px-3 py-1.5 flex items-center gap-2 u-dream-hover cursor-pointer"
                onClick={() => { setRunOpen(true); setStartMenuOpen(false); }}
              >
                <PixelIconTerminal size={16} /> 运行(R)...
              </div>
              <div className="h-[1px] bg-white border-t border-[#808080] my-1 mx-1" />
              <div
                className="px-3 py-1.5 flex items-center gap-2 u-dream-hover cursor-pointer pb-2"
                onClick={() => { setShutdownOpen(true); setStartMenuOpen(false); }}
              >
                <PixelIconPower size={16} /> 关闭(U)...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-transparent">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="win-bevel-out p-1 w-72 shadow-2xl flex flex-col"
          >
            <div className="h-5 u-dream-title flex items-center px-1 mb-2">
              <span className="text-white text-xs font-bold tracking-wide" style={{ fontFamily: 'MS Sans Serif' }}>确认文件删除</span>
              <button onClick={handleDeleteNo} className="win-btn win-title-btn ml-auto pb-[1px]"><span className="mt-[1px] ml-[1px]">✕</span></button>
            </div>
            <div className="p-4 flex gap-4 items-center">
              <PixelIconAlert size={32} className="flex-shrink-0" />
              <div className="text-xs text-black" style={{ fontFamily: 'MS Sans Serif' }}>确定要把 "吵架记录.txt" 放入回收站吗？</div>
            </div>
            <div className="flex justify-center gap-4 mt-2 px-2 pb-2 border-t border-[#808080] pt-3">
              <button onClick={handleDeleteYes} className="win-bevel-out w-16 h-6 text-xs active:win-bevel-in" style={{ fontFamily: 'MS Sans Serif' }}>是(Y)</button>
              <button onClick={handleDeleteNo} className="win-bevel-out w-16 h-6 text-xs active:win-bevel-in" style={{ fontFamily: 'MS Sans Serif' }}>否(N)</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sorry Notepad */}
      {sorryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="win-bevel-out p-[2px] w-[400px] shadow-2xl flex flex-col pointer-events-auto"
          >
            <div className="h-[20px] u-dream-title flex items-center px-1 mb-[1px]">
              <div className="brightness-0 invert"><PixelIconDocHeart size={12} /></div>
              <span className="text-white text-xs font-bold ml-1 tracking-wide" style={{ fontFamily: 'MS Sans Serif' }}>对不起.txt - 记事本</span>
              <div className="ml-auto flex gap-[2px]">
                <button className="win-btn win-title-btn">_</button>
                <button className="win-btn win-title-btn">□</button>
                <button onClick={() => setSorryOpen(false)} className="win-btn win-title-btn"><span className="mt-[1px] ml-[1px]">✕</span></button>
              </div>
            </div>
            <div className="flex gap-2 p-[2px] border-b border-[#808080] text-xs text-black bg-[var(--win-gray)]" style={{ fontFamily: 'MS Sans Serif' }}>
              <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">文件(F)</span>
              <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">编辑(E)</span>
              <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">搜索(S)</span>
              <span className="px-1.5 u-dream-hover cursor-pointer underline decoration-transparent hover:decoration-white underline-offset-2">帮助(H)</span>
            </div>
            <div className="win-bevel-in bg-white h-64 p-3 overflow-auto text-[15px] leading-relaxed text-black" style={{ fontFamily: 'SimSun' }}>
              宝宝，那天是我态度不好，其实我心里一直很后悔...<br/><br/>
              (请在这里补充你想说的话)<br/><br/> 
            </div>
          </motion.div>
        </div>
      )}

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 h-7 bg-[var(--win-gray)] border-t border-white shadow-[inset_0_1px_0_#dfdfdf] flex items-center px-1 z-50 justify-between">
        <div className="flex items-center h-full gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setStartMenuOpen(!startMenuOpen); }}
            className={`win-bevel-out h-[22px] px-2 flex items-center gap-1 font-bold text-black hover:brightness-105 ${startMenuOpen ? 'win-bevel-in bg-[#dfdfdf] pt-[2px] pl-[2px]' : ''}`}
            style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun', fontSize: '11px' }}
          >
            <div className="w-4 h-4 bg-gradient-to-br from-blue-600 via-red-500 to-green-500 rounded-sm shadow-inner flex items-center justify-center border border-white/50">
              <span className="text-[10px] text-white leading-none">W</span>
            </div>
            <span className="mt-[1px]">开始</span>
          </button>
          <div className="w-[2px] h-5 border-l border-[#808080] border-r border-white ml-1 mr-1" />
          <div className="flex gap-1 h-[22px]">
            {Object.values(activeWindows)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((windowItem) => {
                const isFocused = windowItem.id === focusedWindowId && !windowItem.isMinimized;
                return (
                  <button
                    key={windowItem.id}
                    type="button"
                    data-window-tab-id={windowItem.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (windowItem.isMinimized) {
                        focusWindow(windowItem.id);
                        return;
                      }
                      if (isFocused) {
                        minimizeWindow(windowItem.id);
                        return;
                      }
                      focusWindow(windowItem.id);
                    }}
                    className={`px-2 flex items-center gap-1 w-36 cursor-pointer font-bold ${
                      isFocused
                        ? 'win-bevel-in bg-[#d3d3d3]'
                        : 'win-bevel-out bg-[var(--win-gray)] hover:brightness-105'
                    }`}
                    style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun', fontSize: '11px' }}
                  >
                    <PixelIconMonitor size={12} />
                    <span className="truncate">{windowItem.title}</span>
                  </button>
                );
              })}
            {appOpen && (
              <div
                className="win-bevel-in bg-[#dfdfdf] px-2 flex items-center gap-1 w-28 cursor-default font-bold"
                style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun', fontSize: '11px' }}
              >
                <PixelIconMonitor size={12} />
                <span className="truncate">{appOpen === 'memories' ? 'Memory Map' : appOpen}</span>
              </div>
            )}
          </div>
        </div>
        <div
          className="win-bevel-in h-[22px] px-2 flex items-center gap-2 bg-[var(--win-gray)] relative cursor-default"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <div className="w-4 h-4 border border-blue-800 bg-blue-100 text-blue-800 text-[9px] font-bold flex items-center justify-center leading-none cursor-default" style={{ fontFamily: 'MS Sans Serif' }}>
            EN
          </div>
          <PixelIconVolume size={14} />
          <span className="font-normal text-black mt-[1px]" style={{ fontFamily: 'MS Sans Serif, Tahoma', fontSize: '11px' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          {showVolume && (
            <div className="absolute bottom-[24px] right-2 bg-[#ffffe1] border border-black px-2 py-1 shadow-sm font-vt323 text-xs text-black whitespace-nowrap z-[100]">
              Volume: 80%
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {runOpen && <RunDialog onClose={() => setRunOpen(false)} onTriggerEasterEgg={() => setFireworks(true)} />}
      {shutdownOpen && <ShutdownDialog onClose={() => setShutdownOpen(false)} />}

      {/* BSOD */}
      {bsod && (
        <div className="fixed inset-0 bg-[#0000aa] z-[9999] flex flex-col items-start justify-start p-10 font-vt323 text-white text-xl">
          <div className="bg-white text-[#0000aa] px-2 mb-8">Windows</div>
          <p className="mb-4">A fatal exception 0E has occurred at 0157:BF7FF831. The current application will be terminated.</p>
          <p className="mb-8 font-bold">* Error: Too much love.</p>
          <p className="mb-4">* Press CTRL+ALT+DEL again to restart your computer.</p>
          <p className="mb-4">* You will lose any unsaved information in all applications.</p>
          <p className="mt-8 animate-pulse">Just kidding kkk. Restoring connection...</p>
        </div>
      )}

      {/* Fireworks */}
      {fireworks && (
        <div
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,105,180,0.2) 0%, transparent 100%)' }}
        >
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: '50%', top: '50%',
                boxShadow: `0 0 10px 2px ${['#ff00ff', '#00ffff', '#ffff00'][i % 3]}`,
                animation: `explode 1s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${i * 18}deg) translateY(-${50 + Math.random() * 100}px)`
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center font-vt323 text-5xl text-[#dceeff] drop-shadow-[0_0_18px_rgba(140,200,255,0.75)] animate-pulse">
            I LOVE YOU TOO
          </div>
          <style>{`
            @keyframes explode {
              0% { opacity: 1; transform: rotate(var(--rot)) translateY(0) scale(1); }
              100% { opacity: 0; transform: rotate(var(--rot)) translateY(-200px) scale(0); }
            }
          `}</style>
          {setTimeout(() => setFireworks(false), 3000) && null}
        </div>
      )}

      {children}
    </div>
  );
};