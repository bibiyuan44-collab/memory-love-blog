import React, { useEffect, useRef } from 'react';
import { useDesktopStore } from '@/store/useDesktopStore';

export const AudioManager: React.FC = () => {
  const audioMuted = useDesktopStore(s => s.audioMuted);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ambient sound - Low-fi ambience / CRT hum
    // Note: Since I don't have actual mp3 files, I'll use placeholders or oscillators if possible,
    // but typically we'd expect external assets. I'll provide the logic.
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Creating a very low-volume CRT hum using an oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, ctx.currentTime); // Low hum
    
    gain.gain.setValueAtTime(0.01, ctx.currentTime); // Very quiet
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (!audioMuted) {
      osc.start();
    }

    return () => {
      osc.stop();
      ctx.close();
    };
  }, [audioMuted]);

  return null; // This component doesn't render anything
};