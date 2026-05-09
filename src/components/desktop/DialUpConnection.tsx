import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';

const CONNECTION_STEPS = [
  '正在拨打 529811...',
  '正在检测线路...',
  '正在验证用户名和密码...',
  '正在注册网络上的计算机...',
  '正在获取 IP 地址...',
  '连接成功！',
];

type ConnectionPhase = 'form' | 'connecting' | 'success';

export const DialUpConnection: React.FC = () => {
  const openWindow = useDesktopStore(s => s.openWindow);
  const closeWindow = useDesktopStore(s => s.closeWindow);
  const focusWindow = useDesktopStore(s => s.focusWindow);
  const minimizeWindow = useDesktopStore(s => s.minimizeWindow);
  const activeWindow = useDesktopStore(s => s.activeWindows['dialup']);
  const focusedWindowId = useDesktopStore(s => s.focusedWindowId);
  const targetPoint = useDesktopStore((s) => s.taskbarButtonCenters.dialup);
  const setBbsConnected = useDesktopStore(s => s.setBbsConnected);

  const [phase, setPhase] = useState<ConnectionPhase>('form');
  const [username, setUsername] = useState('guest');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('529811');
  const [currentStep, setCurrentStep] = useState(0);
  const [showDialProperties, setShowDialProperties] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasHiddenRef = useRef(true);

  const isHidden = !activeWindow;
  const isMinimized = Boolean(activeWindow?.isMinimized);
  const isActive = focusedWindowId === 'dialup' && !isMinimized;
  const targetX = targetPoint ? `calc(-50% + ${targetPoint.x - window.innerWidth / 2}px)` : '-130%';
  const targetY = targetPoint ? `calc(-50% + ${targetPoint.y - window.innerHeight / 2}px)` : '72vh';

  useEffect(() => {
    if (!isHidden && wasHiddenRef.current) {
      setPhase('form');
      setCurrentStep(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    wasHiddenRef.current = isHidden;
  }, [isHidden]);

  const handleConnect = () => {
    setPhase('connecting');
    setCurrentStep(0);

    audioRef.current = new Audio('/audio/modem.mp3');
    audioRef.current.volume = 0.6;
    audioRef.current.play().catch(() => {});

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= CONNECTION_STEPS.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          setPhase('success');
          setBbsConnected(true);
          setTimeout(() => {
            openWindow('browser', 'Netscape Navigator');
          }, 500);
        }, 1000);
      }
    }, 1500);
  };

  const handleCancel = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    closeWindow('dialup');
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
          animate={{
            opacity: isMinimized ? 0 : 1,
            scale: isMinimized ? 0.25 : 1,
            x: isMinimized ? targetX : '-50%',
            y: isMinimized ? targetY : '-50%',
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="fixed left-1/2 top-1/2 z-[100] flex items-center justify-center bg-black/40 pointer-events-none"
          style={{
            zIndex: activeWindow?.zIndex ?? 100,
            pointerEvents: isMinimized ? 'none' : 'auto',
          }}
          onPointerDown={() => {
            if (isMinimized) return;
            focusWindow('dialup');
          }}
        >
          <div className={`win-bevel-out bg-[#c0c0c0] p-[2px] w-[380px] shadow-2xl pointer-events-auto ${isActive ? '' : 'opacity-[0.96]'}`}>
            <div className={`h-[24px] flex items-center px-2 mb-[2px] ${isActive ? 'bg-gradient-to-r from-[#000080] to-[#1084d0]' : 'bg-gradient-to-r from-[#5a5a86] to-[#7a8ca5]'}`}>
              <span className="text-white text-xs font-bold">连接到 - 秘密岛屿 BBS</span>
              <button
                onClick={() => minimizeWindow('dialup')}
                className="win-btn win-title-btn text-white text-xs ml-auto pb-[1px]"
              >
                _
              </button>
              <button
                onClick={handleCancel}
                className="win-btn win-title-btn text-white text-xs pb-[1px]"
              >
                ✕
              </button>
            </div>

            <div className="win-bevel-in bg-[#c0c0c0] p-3">
              {phase === 'form' && (
                <>
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-12 h-12 bg-[#000080] rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl">📞</span>
                      </div>
                      <div className="text-xs">
                        <div className="font-bold">Secret Island BBS</div>
                        <div className="text-[#808080]">电话: 529811</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="text-xs font-bold block mb-1">用户名 (U):</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="win-bevel-in w-full px-2 py-1 text-sm bg-white outline-none"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="text-xs font-bold block mb-1">密码 (P):</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="win-bevel-in w-full px-2 py-1 text-sm bg-white outline-none"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-xs font-bold block mb-1">电话号码 (N):</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="win-bevel-in w-full px-2 py-1 text-sm bg-white outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-[10px] text-[#808080]">
                    <input type="checkbox" id="savePassword" />
                    <label htmlFor="savePassword">保存密码</label>
                    <span className="mx-2">|</span>
                    <input type="checkbox" id="dialDefault" defaultChecked />
                    <label htmlFor="dialDefault">拨打默认号码</label>
                  </div>

                  <div className="border-t border-[#808080] pt-2 mt-2">
                    <button
                      onClick={() => setShowDialProperties(true)}
                      className="text-[10px] text-[#000080] underline"
                    >
                      拨号属性...
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={handleCancel}
                      className="win-bevel-out px-4 py-1 text-xs"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConnect}
                      className="win-bevel-out px-4 py-1 text-xs font-bold"
                    >
                      连接(C)
                    </button>
                  </div>
                </>
              )}

              {phase === 'connecting' && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#000080] border-t-transparent rounded-full animate-spin" />
                  <div className="text-sm font-bold mb-2">正在连接...</div>
                  <div className="text-xs text-[#808080] animate-pulse">
                    {CONNECTION_STEPS[currentStep]}
                  </div>
                  <div className="mt-4 text-[10px] text-[#808080]">
                    请勿关闭电源或拔掉电话线
                  </div>
                  <button
                    onClick={handleCancel}
                    className="win-bevel-out px-4 py-1 text-xs mt-4"
                  >
                    取消
                  </button>
                </div>
              )}

              {phase === 'success' && (
                <div className="py-8 text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <div className="text-sm font-bold text-[#008000] mb-2">
                    连接成功！
                  </div>
                  <div className="text-xs text-[#808080]">
                    正在启动浏览器...
                  </div>
                </div>
              )}
            </div>

            {showDialProperties && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
                <div className="win-bevel-out bg-[#c0c0c0] p-[2px] w-[320px]">
                  <div className="h-[22px] bg-gradient-to-r from-[#000080] to-[#1084d0] flex items-center px-2 mb-[2px]">
                    <span className="text-white text-xs font-bold">拨号属性</span>
                    <button
                      onClick={() => setShowDialProperties(false)}
                      className="win-btn win-title-btn text-white text-xs ml-auto"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="win-bevel-in bg-[#c0c0c0] p-3">
                    <div className="mb-2">
                      <label className="text-xs font-bold block mb-1">我的位置:</label>
                      <input
                        type="text"
                        defaultValue="秘密岛屿"
                        className="win-bevel-in w-full px-2 py-1 text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="text-xs font-bold block mb-1">国家/地区代码:</label>
                      <input
                        type="text"
                        defaultValue="86"
                        className="win-bevel-in w-full px-2 py-1 text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="text-xs font-bold block mb-1">区号:</label>
                      <input
                        type="text"
                        defaultValue="0571"
                        className="win-bevel-in w-full px-2 py-1 text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="text-[10px] text-[#808080] mb-2">
                      * 使用本地号码可获得更快连接速度
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setShowDialProperties(false)}
                        className="win-bevel-out px-6 py-1 text-xs"
                      >
                        确定
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
