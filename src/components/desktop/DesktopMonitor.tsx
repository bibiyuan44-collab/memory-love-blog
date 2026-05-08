import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';

const START_DATE = new Date('2025-11-21T00:00:00');

const formatUptime = (diff: number) => {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `UP ${String(days).padStart(3, '0')}D ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const DesktopMonitor: React.FC = () => {
  const appOpen = useDesktopStore(s => s.appOpen);
  const openWindows = useDesktopStore(s => s.openWindows);
  const [uptime, setUptime] = useState('UP 000D 00:00:00');
  const [syncRate, setSyncRate] = useState(99.8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveDataRef = useRef<number[]>([]);
  const triggerFeed = () => {
    window.dispatchEvent(new CustomEvent('desktop-pet-feed', {
      detail: {
        x: window.innerWidth - 120,
        y: Math.max(90, window.innerHeight * 0.45),
        source: 'sidebar-feed',
      },
    }));
  };

  const isHidden = appOpen === 'memories' || appOpen === 'photos' || openWindows.length > 0;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - START_DATE.getTime();
      setUptime(formatUptime(diff));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    waveDataRef.current = Array(50).fill(height / 2);

    let animationId: number;
    let frame = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(13, 27, 61, 0.32)';
      ctx.fillRect(0, 0, width, height);

      waveDataRef.current.shift();
      const newValue = height / 2 + Math.sin(frame * 0.15) * 8 + (Math.random() - 0.5) * 6;
      waveDataRef.current.push(newValue);

      ctx.strokeStyle = '#8ec8f5';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(140, 200, 255, 0.75)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      waveDataRef.current.forEach((y, i) => {
        if (i === 0) ctx.moveTo(i * 3, y);
        else ctx.lineTo(i * 3, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      frame++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncRate(99.7 + Math.random() * 0.2);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed right-0 top-0 bottom-7 w-[180px] z-[25] pointer-events-none border-l border-[rgba(180,220,255,0.28)] shadow-[-4px_0_24px_rgba(26,53,94,0.25)]"
          style={{
            background: 'linear-gradient(180deg, rgba(26, 53, 94, 0.42) 0%, rgba(13, 27, 61, 0.48) 100%)',
            fontFamily: 'VT323, monospace',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.14]"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(140, 200, 255, 0.12) 2px, rgba(140, 200, 255, 0.12) 4px)',
            }}
          />

          <div
            className="p-3 flex flex-col gap-4 text-[#dceeff]"
            style={{ textShadow: '0 0 8px rgba(140, 200, 255, 0.45)' }}
          >
            <div className="text-[10px] text-[#8ec8f5]/70">[UPTIME]</div>
            <div className="text-sm tracking-wider">{uptime}</div>

            <div className="mt-2">
              <div className="text-[10px] text-[#8ec8f5]/70">[SYNC RATE]</div>
              <div className="text-[10px] mt-1 text-[#8ec8f5]/85">HEART_SYNC_SIGNAL</div>
              <canvas
                ref={canvasRef}
                width={150}
                height={40}
                className="mt-1 rounded-[1px] border border-[rgba(140,200,255,0.35)] bg-[rgba(13,27,61,0.35)]"
              />
              <div className="text-sm mt-1">{syncRate.toFixed(1)}%</div>
            </div>

            <div className="mt-2">
              <div className="text-[10px] text-[#8ec8f5]/70">[GEOGRAPHIC]</div>
              <div className="text-[11px] mt-1 text-[#dceeff]/90">LAT: 34.12N</div>
              <div className="text-[11px] text-[#dceeff]/90">LON: 108.90E</div>
            </div>

            <div className="mt-2">
              <div className="text-[10px] text-[#8ec8f5]/70">[KERNEL]</div>
              <div className="text-[11px] mt-1 text-[#dceeff]/90">OS: DEEP-LOVE-KERNEL</div>
              <div className="text-[11px] text-[#dceeff]/90">v2.0.4</div>
            </div>
            <button
              type="button"
              onClick={triggerFeed}
              className="pointer-events-auto mt-1 px-2 py-[2px] text-[12px] tracking-wide border border-[#8ec8f5]/50 bg-[#10284f]/75 text-[#dceeff] hover:bg-[#153460] active:translate-y-[1px]"
              style={{ textShadow: '0 0 6px rgba(140, 200, 255, 0.45)' }}
            >
              [Feed]
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
