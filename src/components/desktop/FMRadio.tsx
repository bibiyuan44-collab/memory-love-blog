import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';

const STATIONS = [
  { freq: 20.0, name: 'gnz.mp3', label: '20.0MHz - GNZ' },
  { freq: 40.0, name: 'xshp.mp3', label: '40.0MHz - 西湖' },
  { freq: 60.0, name: 'ybyz.aac', label: '60.0MHz - 远方' },
];

const NOISE_FILE = 'bzy.mp3';
const TUNING_THRESHOLD = 5.0;

export const FMRadio: React.FC = () => {
  const appOpen = useDesktopStore(s => s.appOpen);
  const activeWindows = useDesktopStore(s => s.activeWindows);
  const [isPowered, setIsPowered] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(50.0);
  const [tuningStatus, setTuningStatus] = useState<'tuning' | 'locked'>('tuning');
  const [size, setSize] = useState({ width: 220, height: 160 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const isHidden = appOpen === 'memories' || appOpen === 'photos' || Object.keys(activeWindows).length > 0;

  const noiseRef = useRef<HTMLAudioElement | null>(null);
  const stationsRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const currentStationRef = useRef<number | null>(null);

  const findNearestStation = (freq: number) => {
    let nearest = STATIONS[0];
    let minDist = Math.abs(freq - STATIONS[0].freq);
    for (const station of STATIONS) {
      const dist = Math.abs(freq - station.freq);
      if (dist < minDist) {
        minDist = dist;
        nearest = station;
      }
    }
    return { station: nearest, distance: minDist };
  };

  const updateVolumes = useCallback((freq: number) => {
    if (!isPowered) return;

    const { station, distance } = findNearestStation(freq);
    const noise = noiseRef.current;
    const targetStation = stationsRef.current.get(station.freq);

    if (!noise || !targetStation) return;

    if (distance > TUNING_THRESHOLD) {
      noise.volume = 1;
      STATIONS.forEach((s) => {
        const audio = stationsRef.current.get(s.freq);
        if (audio) audio.volume = 0;
      });
      setTuningStatus('tuning');
      currentStationRef.current = null;
    } else {
      const ratio = 1 - distance / TUNING_THRESHOLD;
      const noiseVol = Math.max(0.1, 1 - ratio);
      const stationVol = ratio;

      noise.volume = noiseVol;
      targetStation.volume = stationVol;

      if (currentStationRef.current !== station.freq) {
        STATIONS.forEach((s) => {
          const audio = stationsRef.current.get(s.freq);
          if (audio && s.freq !== station.freq) {
            audio.volume = 0;
          }
        });
        if (ratio > 0.1) {
          currentStationRef.current = station.freq;
        }
      }

      setTuningStatus(distance < 0.5 ? 'locked' : 'tuning');
    }
  }, [isPowered]);

  const initAudio = useCallback(() => {
    if (noiseRef.current) return;

    const noise = new Audio(`/audio/${NOISE_FILE}`);
    noise.loop = true;
    noise.volume = 1;
    noiseRef.current = noise;
    noise.play().catch(() => {});

    STATIONS.forEach((station) => {
      const audio = new Audio(`/audio/${station.name}`);
      audio.loop = true;
      audio.volume = 0;
      stationsRef.current.set(station.freq, audio);
      audio.play().catch(() => {});
    });
  }, []);

  const handlePower = () => {
    const newPowered = !isPowered;
    setIsPowered(newPowered);

    if (newPowered) {
      initAudio();
      if (noiseRef.current) {
        noiseRef.current.play().catch(() => {});
      }
      updateVolumes(currentFreq);
    } else {
      if (noiseRef.current) {
        noiseRef.current.pause();
        noiseRef.current.currentTime = 0;
      }
      stationsRef.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setTuningStatus('tuning');
      currentStationRef.current = null;
    }
  };

  useEffect(() => {
    updateVolumes(currentFreq);
  }, [currentFreq, isPowered, updateVolumes]);

  useEffect(() => {
    return () => {
      if (noiseRef.current) {
        noiseRef.current.pause();
        noiseRef.current = null;
      }
      stationsRef.current.forEach((audio) => audio.pause());
      stationsRef.current.clear();
    };
  }, []);

  const handleFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentFreq(val);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    const newWidth = Math.max(180, Math.min(400, resizeStartRef.current.width + deltaX));
    const newHeight = Math.max(120, Math.min(300, resizeStartRef.current.height + deltaY));
    setSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          className="fixed win-bevel-out p-1 z-[30] cursor-grab active:cursor-grabbing select-none"
          style={{
            fontFamily: 'VT323, monospace',
            width: size.width,
            height: size.height,
            left: 'calc(50% - 110px)',
            bottom: 40,
          }}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        >
          <div className="bg-gradient-to-b from-[#1a3050] to-[#243d5c] p-2 rounded-sm border border-[#4a6a8a] h-full flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[#00ff00] text-sm" style={{ textShadow: '0 0 6px #00ff00' }}>
                FM
              </div>
              <button
                onClick={handlePower}
                className={`px-2 py-0.5 text-xs font-bold border transition-colors ${
                  isPowered
                    ? 'bg-[#00ff00] text-black border-[#00ff00]'
                    : 'bg-[#333] text-[#666] border-[#555]'
                }`}
              >
                PWR
              </button>
            </div>

            <div className="bg-[#0a0a0f] p-2 border border-[#333] flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <div className="text-[#00ff00] text-xl font-bold" style={{ textShadow: '0 0 8px #00ff00' }}>
                  {currentFreq.toFixed(1)}
                </div>
                <div
                  className={`text-[10px] px-1 ${
                    tuningStatus === 'locked'
                      ? 'text-[#00ff00] bg-[#003300]'
                      : 'text-[#ff6600] bg-[#332200]'
                  }`}
                >
                  {isPowered ? (tuningStatus === 'locked' ? 'LOCKED' : 'TUNING') : 'OFF'}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={currentFreq}
                onChange={handleFreqChange}
                disabled={!isPowered}
                className="w-full h-1.5 bg-[#222] rounded appearance-none cursor-pointer accent-[#00ff00] disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #00ff00 ${currentFreq}%, #333 ${currentFreq}%)`,
                }}
              />

              {isPowered && tuningStatus === 'locked' && (
                <div className="text-[#00ff00] text-[10px] mt-1 text-center" style={{ textShadow: '0 0 4px #00ff00' }}>
                  {STATIONS.find((s) => Math.abs(currentFreq - s.freq) < 0.5)?.label || ''}
                </div>
              )}
            </div>

            <div className="mt-1 px-1">
              <div className="text-[#ff6600] text-[9px] opacity-70">STATIONS:</div>
              <div className="flex justify-between">
                {STATIONS.map((s) => (
                  <div
                    key={s.freq}
                    className={`text-[10px] ${Math.abs(currentFreq - s.freq) < 0.5 ? 'text-[#00ff00]' : 'text-[#666]'}`}
                  >
                    {s.freq.toFixed(0)}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-[#808080]/30 hover:bg-[#00ff00]/50"
              onPointerDown={handleResizeStart}
            >
              <div className="absolute bottom-0 right-0 text-[8px] text-[#00ff00] opacity-50">⊡</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
