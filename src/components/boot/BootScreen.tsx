import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';
import { supabase } from '@/lib/supabaseClient';

const loadingMessages = [
  'Establishing dreamlink...',
  'Synchronizing stardust...',
  'Mounting virtual diaries...',
  'Decoding crystal memories...',
  'Loading Y2K aesthetics...',
  'Waking up sleeping butterflies...',
  'Welcome to our digital universe.'
];

// SVG Pixel Icons
const PixelIcons = {
  Heart: () => (
    <svg width="32" height="32" viewBox="0 0 16 16" className="fill-[#8ec8f5] drop-shadow-[0_0_8px_rgba(100,180,255,0.65)]">
      <path d="M4,2 C2.895,2 2,2.895 2,4 C2,6 4,9 8,13 C12,9 14,6 14,4 C14,2.895 13.105,2 12,2 C10.895,2 10,2.895 8,4 C6,2.895 5.105,2 4,2 Z" />
    </svg>
  ),
  Star: () => (
    <svg width="32" height="32" viewBox="0 0 16 16" className="fill-[#dceeff] drop-shadow-[0_0_8px_rgba(200,230,255,0.7)]">
      <path d="M8,1 L10,6 L15,6 L11,9 L12,14 L8,11 L4,14 L5,9 L1,6 L6,6 Z" />
    </svg>
  ),
  Sparkle: () => (
    <svg width="32" height="32" viewBox="0 0 16 16" className="fill-cyan-300 drop-shadow-[0_0_8px_rgba(100,255,255,0.6)]">
      <path d="M8,1 C8,4 10,6 13,6 C10,6 8,8 8,11 C8,8 6,6 3,6 C6,6 8,4 8,1 Z" />
    </svg>
  ),
  Floppy: () => (
    <svg width="32" height="32" viewBox="0 0 16 16" className="fill-blue-400 drop-shadow-[0_0_8px_rgba(100,100,255,0.6)]">
      <path d="M2,2 L2,14 L14,14 L14,4 L12,2 Z M4,4 L10,4 L10,7 L4,7 Z M4,10 L12,10 L12,12 L4,12 Z" />
    </svg>
  )
};

export const BootScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const setBooting = useDesktopStore(s => s.setBooting);
  const [showPassword, setShowPassword] = useState(false);
  const [identity, setIdentity] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowPassword(true), 800);
          return 100;
        }
        return Math.min(p + (Math.random() * 10 + 2), 100);
      });
    }, 120);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMsgIdx(Math.floor((progress / 100) * (loadingMessages.length - 1)));
  }, [progress]);

  const handleEnter = async () => {
    if (!identity.trim() || !passcode.trim() || isSubmitting || isExiting) return;

    setErrorText('');
    setIsSubmitting(true);
    const key = identity.trim().toLowerCase();
    const email =
      key === 'ybb'
        ? 'ybb@webisland.com'
        : key === 'zyn'
          ? 'zyn@webisland.com'
          : `${key}@webisland.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passcode,
    });

    if (error) {
      setErrorText('[ SYSTEM ERR: Soul Match Failed ]');
      new Audio('/audio/Windows Error.mp3').play().catch(() => {});
      setIsSubmitting(false);
      return;
    }

    new Audio('/audio/logon.mp3').play().catch(() => {});
    setIsExiting(true);
    window.setTimeout(() => setBooting(false), 620);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#6b5a9e] via-[#4f7eb8] to-[#7ec9ea] flex flex-col items-center justify-center z-[9999] overflow-hidden">
      
      {/* Dreamy floating elements */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 40 - 20, 0],
              rotate: [0, 360],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 8 + Math.random() * 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {i % 3 === 0 ? <PixelIcons.Sparkle /> : i % 3 === 1 ? <PixelIcons.Star /> : <PixelIcons.Heart />}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="w-96 space-y-8 bg-white/10 backdrop-blur-md p-8 win-bevel-out relative z-10 border border-white/20 origin-center"
        animate={
          isExiting
            ? { scaleY: [1, 0.03, 0.02], opacity: [1, 1, 0] }
            : { scaleY: 1, opacity: 1 }
        }
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        
        <div className="absolute top-1 left-1 right-1 h-6 u-dream-title flex items-center px-2 border border-white/35 shadow-sm">
          <PixelIcons.Floppy />
          <span className="ml-2 font-vt323 text-[10px] tracking-widest text-white/80">MEMORY_LOADER.EXE</span>
        </div>

        <div className="pt-6 flex justify-between items-center font-vt323 text-3xl tracking-widest text-white drop-shadow-[0_0_10px_rgba(200,230,255,0.5)]">
          <span>PRIVATE_SYS _</span>
          <span>{Math.floor(progress)}%</span>
        </div>
        
        <div className="win-bevel-in bg-[#000040]/60 p-1 h-6 relative overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#8ec8f5] via-[#4f8fd9] to-[#dceeff]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'tween', ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
        </div>

        <div className="text-white/90 font-vt323 text-lg h-6 italic drop-shadow-[0_0_6px_rgba(180,220,255,0.45)]">
          &gt; {loadingMessages[msgIdx]}
        </div>

        <AnimatePresence>
          {showPassword && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 flex flex-col gap-4 items-center border-t border-white/10 pt-6"
            >
              <div className="text-white/85 font-yuyuan text-sm">请输入密钥以解密关系档案</div>
              <input
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleEnter()}
                className="bg-[#0d1b3d]/45 border border-white/35 text-white font-vt323 text-center text-2xl p-2 outline-none w-48 shadow-[0_0_14px_rgba(140,190,255,0.25)] focus:shadow-[0_0_20px_rgba(180,220,255,0.45)] transition-shadow"
                placeholder="[ IDENTITY ]"
              />
              <input 
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleEnter()}
                className="bg-[#0d1b3d]/45 border border-white/35 text-white font-vt323 text-center text-2xl p-2 outline-none w-48 shadow-[0_0_14px_rgba(140,190,255,0.25)] focus:shadow-[0_0_20px_rgba(180,220,255,0.45)] transition-shadow"
                placeholder="[ PASSCODE ]"
              />
              {errorText && (
                <div className="text-[#ff6b6b] font-vt323 text-base">{errorText}</div>
              )}
              <button
                onClick={() => void handleEnter()}
                disabled={isSubmitting || isExiting}
                className="w-32 py-2 win-bevel-out bg-gradient-to-r from-[var(--win-gray)] to-[#f0f5fc] text-[var(--dream-accent)] font-vt323 text-xl tracking-[4px] hover:brightness-110 active:win-bevel-in transition-all relative group"
              >
                ENTER <span className="text-[#4f8fd9] group-hover:animate-pulse">♡</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Retro Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,255,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,4px_100%] z-[10000]" />
    </div>
  );
};