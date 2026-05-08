import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesktopStore } from '@/store/useDesktopStore';

interface Process {
  id: string;
  name: string;
  status: 'Running' | 'Not Responding';
  cpu: number;
  type: 'core' | 'normal' | 'negative';
}

const INITIAL_PROCESSES: Process[] = [
  { id: 'core', name: 'CORE_HEARTBEAT.SYS', status: 'Running', cpu: 99.2, type: 'core' },
  { id: 'memory', name: 'LONG_TERM_MEMORY.EXE', status: 'Running', cpu: 12.5, type: 'normal' },
  { id: 'quarrel', name: 'QUARREL_BUFFER_01.DLL', status: 'Not Responding', cpu: 73.8, type: 'negative' },
  { id: 'anxiety', name: 'ANXIETY_SERVICE.EXE', status: 'Not Responding', cpu: 45.2, type: 'negative' },
  { id: 'smile', name: 'SMILE_RENDERER.DRV', status: 'Running', cpu: 8.1, type: 'normal' },
];

const ContextMenu: React.FC<{
  x: number;
  y: number;
  process: Process;
  onClose: () => void;
  onProperties: (process: Process) => void;
}> = ({ x, y, process, onClose, onProperties }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="fixed win-bevel-out bg-[var(--win-gray)] p-[2px] z-[200]"
    style={{ left: x, top: y, fontFamily: 'Tahoma, MS Sans Serif', fontSize: 11 }}
  >
    <div className="bg-[var(--win-gray)] border border-[var(--win-dark-gray)] border-t-white border-l-white">
      <div
        className="px-4 py-1 u-dream-hover cursor-default"
        onClick={() => { onProperties(process); onClose(); }}
      >
        Properties
      </div>
      <div
        className="px-4 py-1 u-dream-hover cursor-default"
        onClick={onClose}
      >
        Go to Process
      </div>
    </div>
  </motion.div>
);

const PropertiesDialog: React.FC<{
  process: Process;
  onClose: () => void;
}> = ({ process, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--dream-accent)]/20"
    onClick={onClose}
  >
    <div
      className="win-bevel-out bg-[var(--win-gray)] p-[2px] w-[380px] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-[22px] u-dream-title flex items-center px-2 mb-[2px]">
        <span className="text-white text-xs font-bold">Process Properties</span>
        <button onClick={onClose} className="win-btn win-title-btn ml-auto pb-[1px]">
          <span className="mt-[1px] ml-[1px]">✕</span>
        </button>
      </div>
      <div className="win-bevel-in bg-[var(--win-gray)] p-3">
        <div className="text-sm font-bold mb-2">{process.name}</div>
        <div className="h-[1px] bg-[var(--win-dark-gray)] mb-2" />
        <div className="text-xs space-y-1">
          <div><span className="text-[var(--win-dark-gray)]">Status:</span> {process.status}</div>
          <div><span className="text-[var(--win-dark-gray)]">CPU Usage:</span> {process.cpu.toFixed(1)}%</div>
          <div><span className="text-[var(--win-dark-gray)]">Type:</span> {
            process.type === 'core' ? 'System Critical' :
            process.type === 'negative' ? 'Negative Buffer' : 'Normal'
          }</div>
          {process.type === 'negative' && process.id === 'quarrel' && (
            <>
              <div className="h-[1px] bg-[var(--win-dark-gray)] my-2" />
              <div className="text-[#4a3d6e] font-bold mt-2">ERROR LOG:</div>
              <div className="text-[10px] text-[var(--win-dark-gray)] mt-1">
                Created: 2024-12-08 14:32:07<br/>
                Last crash: 2024-12-08 14:35:22<br/>
                Buffer overflow detected.
              </div>
            </>
          )}
          {process.type === 'negative' && process.id === 'anxiety' && (
            <>
              <div className="h-[1px] bg-[var(--win-dark-gray)] my-2" />
              <div className="text-[#4a3d6e] font-bold mt-2">MEMORY DUMP:</div>
              <div className="text-[10px] text-[var(--win-dark-gray)] mt-1">
                Accumulated since: 2024-11-15<br/>
                Threat level: MODERATE<br/>
                Recommended action: TERMINATE
              </div>
            </>
          )}
        </div>
        <div className="flex justify-center mt-4">
          <button onClick={onClose} className="win-bevel-out px-6 py-1 text-xs">OK</button>
        </div>
      </div>
    </div>
  </motion.div>
);

const ConfirmDialog: React.FC<{
  process: Process;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ process, onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--dream-accent)]/20"
  >
    <div className="win-bevel-out bg-[var(--win-gray)] p-[2px] w-[360px] shadow-2xl">
      <div className="h-[22px] u-dream-title flex items-center px-2 mb-[2px]">
        <span className="text-white text-xs font-bold">Task Manager</span>
      </div>
      <div className="win-bevel-in bg-[var(--win-gray)] p-4">
        <div className="flex gap-3 mb-3">
          <div className="text-4xl">⚠️</div>
          <div className="text-xs flex-1">
            <div className="font-bold mb-2">WARNING:</div>
            <div className="leading-relaxed">
              Terminating <span className="font-bold">{process.name}</span> will clear all temporary negative buffers.
              System stability will increase. Joy index will rise by 23.7%.
            </div>
            <div className="mt-2 font-bold">Are you sure?</div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button onClick={onConfirm} className="win-bevel-out px-6 py-1 text-xs font-bold">Yes</button>
          <button onClick={onCancel} className="win-bevel-out px-6 py-1 text-xs">No</button>
        </div>
      </div>
    </div>
  </motion.div>
);

const CriticalErrorDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--dream-accent)]/20"
  >
    <div className="win-bevel-out bg-[var(--win-gray)] p-[2px] w-[380px] shadow-2xl">
      <div className="h-[22px] u-dream-title-warn flex items-center px-2 mb-[2px]">
        <span className="text-white text-xs font-bold">CRITICAL ERROR</span>
        <button onClick={onClose} className="win-btn win-title-btn ml-auto pb-[1px]">
          <span className="mt-[1px] ml-[1px]">✕</span>
        </button>
      </div>
      <div className="win-bevel-in bg-[var(--win-gray)] p-4">
        <div className="flex gap-3 mb-3">
          <div className="text-4xl">🛡️</div>
          <div className="text-xs flex-1">
            <div className="font-bold text-[#4a3d6e] mb-2">ACCESS DENIED:</div>
            <div className="leading-relaxed">
              <span className="font-bold">CORE_HEARTBEAT.SYS</span> is vital to system integrity.
              This process cannot be terminated under any circumstances.
            </div>
            <div className="mt-2 font-bold text-[#4a3d6e]">
              ♥ You are the core of this system. ♥
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button onClick={onClose} className="win-bevel-out px-6 py-1 text-xs font-bold">I Understand</button>
        </div>
      </div>
    </div>
  </motion.div>
);

const TaskNotification: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, x: 0 }}
    animate={{ opacity: 1, y: 0, x: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="fixed bottom-10 right-4 win-bevel-out bg-[var(--win-gray)] p-2 z-[150] max-w-[220px]"
    style={{ fontFamily: 'Tahoma, MS Sans Serif' }}
  >
    <div className="text-[10px] font-bold mb-1 text-[var(--dream-accent)]">[System]</div>
    <div className="text-xs">{message}</div>
  </motion.div>
);

export const TaskManager: React.FC = () => {
  const appOpen = useDesktopStore(s => s.appOpen);
  const [processes, setProcesses] = useState<Process[]>(INITIAL_PROCESSES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; process: Process } | null>(null);
  const [confirmProcess, setConfirmProcess] = useState<Process | null>(null);
  const [showCriticalError, setShowCriticalError] = useState(false);
  const [showProperties, setShowProperties] = useState<Process | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [starFlicker, setStarFlicker] = useState(false);

  const closeApp = useDesktopStore(s => s.closeApp);
  const isHidden = appOpen !== 'taskmanager';

  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses(prev => prev.map(p => ({
        ...p,
        cpu: p.type === 'core' ? 95 + Math.random() * 4 :
             p.type === 'negative' ? 30 + Math.random() * 50 :
             5 + Math.random() * 15
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleEndTask = () => {
    if (!selectedId) return;
    const process = processes.find(p => p.id === selectedId);
    if (!process) return;

    if (process.type === 'core') {
      setShowCriticalError(true);
      return;
    }

    setConfirmProcess(process);
  };

  const handleConfirmEnd = () => {
    if (!confirmProcess) return;
    setProcesses(prev => prev.filter(p => p.id !== confirmProcess.id));
    setSelectedId(null);
    setConfirmProcess(null);
    setStarFlicker(true);
    setTimeout(() => {
      setStarFlicker(false);
      setNotification('Harmony restored. System stability: 100%');
    }, 200);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleContextMenu = (e: React.MouseEvent, process: Process) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, process });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const avgCpu = processes.reduce((sum, p) => sum + p.cpu, 0) / processes.length;
  const negativeCount = processes.filter(p => p.type === 'negative').length;

  return (
    <AnimatePresence>
      {!isHidden && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="win-bevel-out bg-[var(--win-gray)] p-[2px] w-[420px] shadow-2xl pointer-events-auto">
              <div className="h-[22px] u-dream-title flex items-center px-2 mb-[2px] cursor-grab active:cursor-grabbing">
                <span className="text-white text-xs font-bold">Task Manager</span>
                <div className="ml-auto flex gap-[2px]">
                  <button className="win-btn win-title-btn text-white text-xs">?</button>
                  <button
                    onClick={closeApp}
                    className="win-btn win-title-btn text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="win-bevel-in bg-[var(--win-gray)] p-2">
                <div className="flex gap-2 mb-2 text-[10px] text-[var(--dream-accent)]">
                  <span className="font-bold">Processes:</span>
                  <span>{processes.length}</span>
                  <span className="mx-2 opacity-60">|</span>
                  <span className="text-[var(--win-dark-gray)]">CPU:</span>
                  <span className={avgCpu > 60 ? 'text-[#5a4a78] font-bold' : ''}>{avgCpu.toFixed(1)}%</span>
                  <span className="mx-2 opacity-60">|</span>
                  <span className="text-[var(--win-dark-gray)]">Negative buffers:</span>
                  <span className={negativeCount > 0 ? 'text-[#5a4a78] font-bold' : 'text-[#2d6a5a]'}>{negativeCount}</span>
                </div>

                <div className="win-bevel-in bg-[var(--win-white)] border-2 border-[var(--win-dark-gray)] border-top-[#f0f5fc] border-l-[#f0f5fc] p-[2px] mb-2">
                  <div className="u-dream-title text-white text-[10px] font-bold px-2 py-1 flex">
                    <span className="flex-1">Task</span>
                    <span className="w-24 text-center">Status</span>
                    <span className="w-16 text-right">CPU</span>
                  </div>
                  <div className="h-[140px] overflow-y-auto">
                    {processes.map((process) => (
                      <div
                        key={process.id}
                        onClick={() => setSelectedId(process.id)}
                        onContextMenu={(e) => handleContextMenu(e, process)}
                        className={`px-2 py-1 text-[11px] flex items-center cursor-pointer ${
                          selectedId === process.id
                            ? 'bg-[var(--win-blue)] text-white'
                            : process.type === 'negative'
                            ? 'text-[#5a4a78]'
                            : process.type === 'core'
                            ? 'text-[var(--dream-accent)] font-bold'
                            : 'text-[var(--dream-accent)]'
                        }`}
                      >
                        <span className="flex-1 truncate">{process.name}</span>
                        <span className={`w-24 text-center text-[10px] ${
                          process.status === 'Not Responding' ? 'text-[#5a4a78]' : 'text-[#2d6a5a]'
                        }`}>
                          {process.status}
                        </span>
                        <span className="w-16 text-right font-mono">{process.cpu.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--dream-deep-bg)] p-2 border border-[var(--win-dark-gray)] mb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="text-[#8ec8f5] text-[9px] mb-1 font-bold tracking-wide drop-shadow-[0_0_6px_rgba(140,200,255,0.35)]">
                    CPU USAGE [SYSTEM HEALTH]
                  </div>
                  <div className="h-8 relative overflow-hidden rounded-[1px]">
                    <div className="absolute inset-0 opacity-40">
                      {[...Array(50)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute bottom-0 w-[2px] bg-[#6badec]"
                          style={{
                            left: `${i * 2}%`,
                            height: `${20 + Math.sin(i * 0.5 + Date.now() * 0.001) * 15 + Math.random() * 10}%`,
                            opacity: negativeCount > 0 ? 0.25 + Math.random() * 0.35 : 0.45 + Math.random() * 0.45
                          }}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-end justify-around px-1">
                      {processes.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          className={`w-6 text-[8px] text-center font-mono ${
                            p.type === 'negative' ? 'text-[#c4a8d8]' :
                            p.type === 'core' ? 'text-[#dceeff]' : 'text-[#8ec8f5]'
                          }`}
                        >
                          {p.cpu.toFixed(0)}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleEndTask}
                    disabled={!selectedId}
                    className="win-bevel-out px-4 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 active:win-bevel-in"
                  >
                    End Task
                  </button>
                  <button className="win-bevel-out px-4 py-1 text-xs hover:brightness-105 active:win-bevel-in">
                    Switch To
                  </button>
                  <button className="win-bevel-out px-4 py-1 text-xs hover:brightness-105 active:win-bevel-in">
                    New Task
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              process={contextMenu.process}
              onClose={() => setContextMenu(null)}
              onProperties={setShowProperties}
            />
          )}

          {confirmProcess && (
            <ConfirmDialog
              process={confirmProcess}
              onConfirm={handleConfirmEnd}
              onCancel={() => setConfirmProcess(null)}
            />
          )}

          {showCriticalError && (
            <CriticalErrorDialog onClose={() => setShowCriticalError(false)} />
          )}

          {showProperties && (
            <PropertiesDialog
              process={showProperties}
              onClose={() => setShowProperties(null)}
            />
          )}

          <AnimatePresence>
            {notification && (
              <TaskNotification message={notification} />
            )}
          </AnimatePresence>

          {starFlicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[rgba(200,220,255,0.35)] pointer-events-none z-[1000]"
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};
