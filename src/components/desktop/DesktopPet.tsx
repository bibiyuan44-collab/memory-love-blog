import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type PetState = 'idle' | 'run-left' | 'run-right';
type FoodType = 'pixel-fish' | 'data-packet';

interface FoodItem {
  id: number;
  x: number;
  y: number;
  type: FoodType;
  spritePath: string;
  decayStartedAt: number | null;
  decayDurationMs: number | null;
}

interface FeedFx {
  id: number;
  text: string;
}

interface PixelDust {
  id: number;
  x: number;
  y: number;
}

interface FeedBurst {
  id: number;
  x: number;
  y: number;
}

const PET_SIZE = 92;
const GROUND_OFFSET = 12;
const FOOD_SIZE = 32;
const FEED_RANGE = 116;
const MIN_FEED_DRAG_DISTANCE = 6;
const LOW_POWER_THRESHOLD = 25;
const OVERFED_COOLDOWN_MS = 30000;
const PET_SAFE_RIGHT_PADDING = 0;
const DUST_INTERVAL_MS = 45;
const FOOD_SPRITES = [
  '/food/57_icecream.png',
  '/food/77_potatochips.png',
  '/food/79_pancakes.png',
  '/food/90_strawberrycake.png',
  '/food/95_steak.png',
];

export const DesktopPet: React.FC = () => {
  const [x, setX] = useState(16);
  const [y, setY] = useState(() => Math.max(0, window.innerHeight - GROUND_OFFSET - PET_SIZE));
  const [petState, setPetState] = useState<PetState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [energy, setEnergy] = useState(100);
  const [overfedUntil, setOverfedUntil] = useState(0);
  const [feedFxList, setFeedFxList] = useState<FeedFx[]>([]);
  const [excitedUntil, setExcitedUntil] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [pixelDust, setPixelDust] = useState<PixelDust[]>([]);
  const [happySparkUntil, setHappySparkUntil] = useState(0);
  const [feedBursts, setFeedBursts] = useState<FeedBurst[]>([]);
  const [selectedFoodSprite, setSelectedFoodSprite] = useState<string>(FOOD_SPRITES[0]);

  const xRef = useRef(x);
  const yRef = useRef(y);
  const mountedRef = useRef(false);
  const roamTimeoutRef = useRef<number | null>(null);
  const roamAnimatingRef = useRef(false);
  const pauseUntilRef = useRef(0);
  const feedHistoryRef = useRef<number[]>([]);
  const idRef = useRef(0);
  const chasingFoodRef = useRef(false);
  const lastPointerRef = useRef({ x: 120, y: 120 });
  const lastDustAtRef = useRef(0);
  const overfedUntilRef = useRef(overfedUntil);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const foodDragStartRef = useRef<Record<number, { x: number; y: number }>>({});

  useEffect(() => {
    xRef.current = x;
  }, [x]);
  useEffect(() => {
    yRef.current = y;
  }, [y]);
  useEffect(() => {
    overfedUntilRef.current = overfedUntil;
  }, [overfedUntil]);

  useEffect(() => {
    if (!isDragging) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [isDragging]);

  const clampX = useCallback((nextX: number) => {
    const maxX = Math.max(0, window.innerWidth - PET_SIZE - PET_SAFE_RIGHT_PADDING);
    return Math.min(Math.max(0, nextX), maxX);
  }, []);
  const clampY = useCallback((nextY: number) => {
    const maxY = Math.max(0, window.innerHeight - PET_SIZE);
    return Math.min(Math.max(0, nextY), maxY);
  }, []);

  const clearRoamTimer = () => {
    if (roamTimeoutRef.current) {
      window.clearTimeout(roamTimeoutRef.current);
      roamTimeoutRef.current = null;
    }
  };

  const pauseRoaming = useCallback((ms: number) => {
    pauseUntilRef.current = Date.now() + ms;
  }, []);

  const showBubble = useCallback((text: string) => {
    setBubbleText(text);
    window.setTimeout(() => {
      setBubbleText((prev) => (prev === text ? null : prev));
    }, 3000);
  }, []);
  const showFeedFx = useCallback((text: string) => {
    const id = ++idRef.current;
    setFeedFxList((prev) => [...prev, { id, text }]);
    window.setTimeout(() => {
      setFeedFxList((prev) => prev.filter((item) => item.id !== id));
    }, 1300);
  }, []);
  const spawnPixelDust = useCallback((xPos: number, yPos: number) => {
    const now = Date.now();
    if (now - lastDustAtRef.current < DUST_INTERVAL_MS) return;
    lastDustAtRef.current = now;
    const id = ++idRef.current;
    setPixelDust((prev) => [...prev, { id, x: xPos, y: yPos }]);
    window.setTimeout(() => {
      setPixelDust((prev) => prev.filter((item) => item.id !== id));
    }, 360);
  }, []);
  const spawnFeedBurst = useCallback((xPos: number, yPos: number) => {
    const id = ++idRef.current;
    setFeedBursts((prev) => [...prev, { id, x: xPos, y: yPos }]);
    window.setTimeout(() => {
      setFeedBursts((prev) => prev.filter((item) => item.id !== id));
    }, 520);
  }, []);

  const scheduleNextRoam = useCallback(() => {
    clearRoamTimer();
    const delay = 4000 + Math.random() * 4000;
    roamTimeoutRef.current = window.setTimeout(() => {
      void runRoam();
    }, delay);
  }, []);

  const runRoam = useCallback(async () => {
    if (!mountedRef.current) return;
    if (chasingFoodRef.current) {
      scheduleNextRoam();
      return;
    }
    if (isDragging || roamAnimatingRef.current) {
      scheduleNextRoam();
      return;
    }
    if (Date.now() < pauseUntilRef.current) {
      scheduleNextRoam();
      return;
    }

    roamAnimatingRef.current = true;
    const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    setPetState(direction === 1 ? 'run-right' : 'run-left');

    const distance = 40 + Math.random() * 220;
    const targetX = clampX(xRef.current + distance * direction);
    const duration = Math.max(0.5, Math.abs(targetX - xRef.current) / 130);

    await new Promise<void>((resolve) => {
      const start = performance.now();
      const startX = xRef.current;
      const delta = targetX - startX;

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / (duration * 1000));
        const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
        setX(startX + delta * eased);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });

    setPetState('idle');
    roamAnimatingRef.current = false;
    scheduleNextRoam();
  }, [clampX, isDragging, scheduleNextRoam]);

  useEffect(() => {
    mountedRef.current = true;
    setX(clampX(16));
    setY(clampY(window.innerHeight - GROUND_OFFSET - PET_SIZE));
    scheduleNextRoam();

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setX((prev) => clampX(prev));
      setY((prev) => clampY(prev));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      mountedRef.current = false;
      clearRoamTimer();
      window.removeEventListener('resize', handleResize);
    };
  }, [clampX, clampY, scheduleNextRoam]);

  useEffect(() => {
    const drainTimer = window.setInterval(() => {
      setEnergy((prev) => Math.max(0, prev - 1));
    }, 2800);
    return () => window.clearInterval(drainTimer);
  }, []);

  useEffect(() => {
    const handler = (evt: Event) => {
      const customEvt = evt as CustomEvent<{ x: number; y: number }>;
      const xPos = Math.min(Math.max(8, customEvt.detail?.x ?? 120), window.innerWidth - FOOD_SIZE - 8);
      const yPos = Math.min(Math.max(8, customEvt.detail?.y ?? window.innerHeight / 2), window.innerHeight - FOOD_SIZE - 8);
      const food: FoodItem = {
        id: ++idRef.current,
        x: xPos,
        y: yPos,
        type: Math.random() > 0.5 ? 'pixel-fish' : 'data-packet',
        spritePath: selectedFoodSprite,
        decayStartedAt: null,
        decayDurationMs: null,
      };
      setFoods((prev) => [...prev, food]);
    };
    window.addEventListener('desktop-pet-feed', handler as EventListener);
    return () => window.removeEventListener('desktop-pet-feed', handler as EventListener);
  }, [selectedFoodSprite]);

  useEffect(() => {
    if (Date.now() >= overfedUntil) return;
    setFoods((prev) => prev.map((item) => (
      item.decayStartedAt
        ? item
        : { ...item, decayStartedAt: Date.now(), decayDurationMs: 4200 + Math.random() * 2400 }
    )));
    const timer = window.setInterval(() => {
      const now = Date.now();
      setFoods((prev) => prev.filter((item) => {
        if (!item.decayStartedAt || !item.decayDurationMs) return true;
        return now - item.decayStartedAt < item.decayDurationMs;
      }));
    }, 220);
    return () => window.clearInterval(timer);
  }, [overfedUntil]);

  const movePetTo = useCallback(async (targetX: number, speed: number) => {
    const startX = xRef.current;
    const clampedTarget = clampX(targetX);
    const delta = clampedTarget - startX;
    const distance = Math.abs(delta);
    if (distance < 1) {
      setX(clampedTarget);
      return;
    }
    const duration = Math.max(0.2, distance / speed);
    setPetState(delta >= 0 ? 'run-right' : 'run-left');
    roamAnimatingRef.current = true;
    await new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / (duration * 1000));
        const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
        setX(startX + delta * eased);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
    setPetState('idle');
    roamAnimatingRef.current = false;
  }, [clampX]);

  useEffect(() => {
    const now = Date.now();
    if (energy > LOW_POWER_THRESHOLD) return;
    if (foods.length === 0) return;
    if (isDragging || roamAnimatingRef.current || now < overfedUntil || chasingFoodRef.current) return;
    const nearest = foods.reduce((acc, item) => {
      const dx = item.x + FOOD_SIZE / 2 - (xRef.current + PET_SIZE / 2);
      const absDx = Math.abs(dx);
      if (!acc || absDx < acc.absDx) return { item, absDx };
      return acc;
    }, null as { item: FoodItem; absDx: number } | null);
    if (!nearest) return;
    chasingFoodRef.current = true;
    pauseRoaming(2200);
    clearRoamTimer();
    void movePetTo(nearest.item.x - PET_SIZE / 2 + FOOD_SIZE / 2, 260).then(() => {
      chasingFoodRef.current = false;
      scheduleNextRoam();
    });
  }, [energy, foods, isDragging, movePetTo, overfedUntil, pauseRoaming, scheduleNextRoam]);

  const handleSuccessfulFeed = useCallback((foodId: number, foodX: number, foodY: number) => {
    const now = Date.now();
    if (now < overfedUntil) {
      showBubble('[系统错误：过量喂食] 打嗝... 暂时拒绝进食。');
      return;
    }
    const feedHistory = [...feedHistoryRef.current.filter((t) => now - t <= 3000), now];
    feedHistoryRef.current = feedHistory;
    if (feedHistory.length > 3) {
      setOverfedUntil(now + OVERFED_COOLDOWN_MS);
      showBubble('[系统错误：过量喂食] 打嗝...');
      pauseRoaming(2600);
      setPetState('idle');
      setExcitedUntil(now);
      return;
    }
    setFoods((prev) => prev.filter((item) => item.id !== foodId));
    setEnergy(100);
    pauseRoaming(2200);
    clearRoamTimer();
    setPetState('idle');
    setExcitedUntil(now + 5000);
    setHappySparkUntil(now + 1400);
    spawnFeedBurst(foodX + FOOD_SIZE / 2, foodY + FOOD_SIZE / 2);
    showFeedFx('[甜蜜补丁已应用]');
    showBubble('[甜蜜补丁已应用]');
    scheduleNextRoam();
  }, [overfedUntil, pauseRoaming, scheduleNextRoam, showBubble, showFeedFx, spawnFeedBurst]);

  const checkFeedCollision = useCallback((food: FoodItem, nextX: number, nextY: number) => {
    const clampedX = Math.min(Math.max(8, nextX), window.innerWidth - FOOD_SIZE - 8);
    const clampedY = Math.min(Math.max(8, nextY), window.innerHeight - FOOD_SIZE - 8);
    const petCenterX = xRef.current + PET_SIZE / 2;
    const petCenterY = yRef.current + PET_SIZE / 2;
    const foodCenterX = clampedX + FOOD_SIZE / 2;
    const foodCenterY = clampedY + FOOD_SIZE / 2;
    const distance = Math.hypot(foodCenterX - petCenterX, foodCenterY - petCenterY);
    if (distance <= FEED_RANGE) {
      handleSuccessfulFeed(food.id, clampedX, clampedY);
      return true;
    }
    setFoods((prev) => prev.map((item) => (
      item.id === food.id
        ? {
            ...item,
            x: clampedX,
            y: clampedY,
          }
        : item
    )));
    return false;
  }, [handleSuccessfulFeed]);
  const getGifUrl = () => {
    switch (petState) {
      case 'run-left':
        return '/run-left.gif';
      case 'run-right':
        return '/run-right.gif';
      default:
        return '/idle.gif';
    }
  };

  const isExcited = Date.now() < excitedUntil;
  const isHappySpark = Date.now() < happySparkUntil;
  const spawnMaintenancePacket = (spritePath?: string) => {
    const food: FoodItem = {
      id: ++idRef.current,
      x: Math.min(Math.max(8, lastPointerRef.current.x - FOOD_SIZE / 2), window.innerWidth - FOOD_SIZE - 8),
      y: Math.min(Math.max(8, lastPointerRef.current.y - FOOD_SIZE / 2), window.innerHeight - FOOD_SIZE - 8),
      type: 'data-packet',
      spritePath: spritePath ?? selectedFoodSprite,
      decayStartedAt: Date.now() < overfedUntilRef.current ? Date.now() : null,
      decayDurationMs: Date.now() < overfedUntilRef.current ? 4200 + Math.random() * 2400 : null,
    };
    setFoods((prev) => [...prev, food]);
    setMenuOpen(false);
    setShowFoodMenu(false);
  };

  const getFoodLabel = (spritePath: string) => {
    const fileName = spritePath.split('/').pop() ?? spritePath;
    return fileName.replace(/\.[^.]+$/, '').replace(/^\d+_/, '').replace(/_/g, ' ');
  };

  return (
    <>
      <AnimatePresence>
        {isHappySpark && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-[99970]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0.1, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 20%, rgba(165,243,252,0.32) 0 1px, transparent 1px), radial-gradient(circle at 75% 35%, rgba(186,230,253,0.28) 0 1px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(125,211,252,0.35) 0 1px, transparent 1px)',
              backgroundSize: '34px 34px, 28px 28px, 40px 40px',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pixelDust.map((dust) => (
          <motion.div
            key={dust.id}
            className="fixed pointer-events-none z-[99995] w-[3px] h-[3px] border border-[#0f2f52] bg-[#a5f3fc]"
            style={{ left: dust.x, top: dust.y }}
            initial={{ opacity: 0.9, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.4, y: -6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {feedBursts.map((burst) => (
          <div
            key={burst.id}
            className="fixed pointer-events-none z-[99998]"
            style={{ left: burst.x, top: burst.y }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (Math.PI * 2 * i) / 8;
              const distance = 12 + (i % 3) * 3;
              return (
                <motion.div
                  key={`${burst.id}-${i}`}
                  className="absolute w-[3px] h-[3px] border border-[#0f2f52] bg-[#a5f3fc]"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance - 4,
                    opacity: 0,
                    scale: 0.5,
                  }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              );
            })}
          </div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {foods.map((food) => (
          <motion.div
            key={food.id}
            className="fixed z-[99990] cursor-grab active:cursor-grabbing"
            drag
            dragMomentum={false}
            dragElastic={0.05}
            dragConstraints={{
              left: 0,
              top: 0,
              right: window.innerWidth - FOOD_SIZE,
              bottom: window.innerHeight - FOOD_SIZE,
            }}
            onDragStart={() => {
              foodDragStartRef.current[food.id] = { x: food.x, y: food.y };
            }}
            onDragEnd={(_, info) => {
              const start = foodDragStartRef.current[food.id] ?? { x: food.x, y: food.y };
              const nextX = start.x + info.offset.x;
              const nextY = start.y + info.offset.y;
              delete foodDragStartRef.current[food.id];
              const dragDistance = Math.hypot(info.offset.x, info.offset.y);
              if (dragDistance < MIN_FEED_DRAG_DISTANCE) return;
              checkFeedCollision(food, nextX, nextY);
            }}
            whileTap={{ scale: 1.1 }}
            animate={{ y: [0, -2.5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: (food.id % 5) * 0.08 }}
            style={{
              left: food.x,
              top: food.y,
              width: FOOD_SIZE,
              height: FOOD_SIZE,
              opacity: food.decayStartedAt && food.decayDurationMs
                ? Math.max(0, 1 - (Date.now() - food.decayStartedAt) / food.decayDurationMs)
                : 1,
              filter: 'drop-shadow(0 0 5px rgba(165, 243, 252, 0.8))',
            }}
          >
            <div
              className="w-full h-full"
              style={{
                // If you switch to a sprite sheet, keep this background-image and change
                // backgroundPosition to the target cell: e.g. '-32px 0', '-64px -32px'.
                backgroundImage: `url(${food.spritePath})`,
                backgroundPosition: '0 0',
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${FOOD_SIZE}px ${FOOD_SIZE}px`,
                imageRendering: 'pixelated',
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="fixed z-[99999] select-none cursor-grab active:cursor-grabbing"
        style={{ left: x, top: y }}
        animate={{ y: petState === 'idle' ? [0, -2, 0] : 0 }}
        transition={{ duration: 3, repeat: petState === 'idle' ? Infinity : 0, ease: 'easeInOut' }}
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{
          left: 0,
          top: 0,
          right: Math.max(0, windowWidth - PET_SIZE - PET_SAFE_RIGHT_PADDING),
          bottom: Math.max(0, window.innerHeight - PET_SIZE),
        }}
        onDragStart={() => {
          setIsDragging(true);
          setPetState('idle');
          pauseRoaming(1800);
          clearRoamTimer();
          dragStartXRef.current = xRef.current;
          dragStartYRef.current = yRef.current;
        }}
        onDragEnd={(_, info) => {
          const next = clampX(info.point.x - PET_SIZE / 2);
          const nextY = clampY(info.point.y - PET_SIZE / 2);
          setIsDragging(false);
          xRef.current = next;
          yRef.current = nextY;
          setX(next);
          setY(nextY);
          scheduleNextRoam();
        }}
        onClick={(e) => {
          e.stopPropagation();
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
          setMenuOpen((prev) => !prev);
          setShowStatusPanel(false);
          setShowFoodMenu(false);
          pauseRoaming(1800);
          setPetState('idle');
        }}
        onMouseMove={(e) => {
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
          spawnPixelDust(e.clientX + (Math.random() * 5 - 2), e.clientY + (Math.random() * 5 - 2));
        }}
      >
        <motion.img
          src={getGifUrl()}
          alt="Desktop Pet"
          width={PET_SIZE}
          height={PET_SIZE}
          draggable={false}
          style={{
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45))',
            pointerEvents: 'none',
          }}
          animate={{ y: petState === 'idle' ? [0, -1.5, 0] : [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: petState === 'idle' ? (isExcited ? 0.45 : 1.4) : 0.5 }}
        />

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 20 }}
              className="absolute -top-[72px] left-1/2 -translate-x-1/2 w-[190px] p-2 rounded-[4px] border border-[#2d4a77]"
              style={{
                background: 'rgba(178, 200, 224, 0.45)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 0 12px rgba(165, 243, 252, 0.35), 0 3px 7px rgba(30, 64, 96, 0.3)',
              }}
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 px-2 py-1 text-[10px] text-[#1e3a5f] border border-[#0f2f52] bg-[rgba(221,241,255,0.78)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStatusPanel((prev) => !prev);
                  }}
                >
                  <span className="inline-block align-middle mr-1 w-[8px] h-[8px] bg-[#61c7ff] border border-[#0f2f52]" />
                  状态
                </button>
                <button
                  type="button"
                  className="flex-1 px-2 py-1 text-[10px] text-[#1e3a5f] border border-[#0f2f52] bg-[rgba(221,241,255,0.78)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFoodMenu((prev) => !prev);
                    setShowStatusPanel(false);
                  }}
                >
                  <span className="inline-block align-middle mr-1 w-[8px] h-[8px] bg-[#7dd3fc] border border-[#0f2f52]" />
                  喂食
                </button>
              </div>
            </motion.div>
          )}

          {menuOpen && showFoodMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="absolute -top-[176px] left-1/2 -translate-x-1/2 w-[220px] p-2 rounded-[4px] border border-[#2d4a77] text-[10px]"
              style={{
                background: 'rgba(180, 198, 220, 0.5)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 0 12px rgba(165, 243, 252, 0.38), 0 3px 8px rgba(30, 64, 96, 0.28)',
                color: '#1e3a5f',
              }}
            >
              <div className="font-bold mb-1">[食物选择]</div>
              <div className="grid grid-cols-2 gap-1">
                {FOOD_SPRITES.map((spritePath) => (
                  <button
                    key={spritePath}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFoodSprite(spritePath);
                      spawnMaintenancePacket(spritePath);
                      showBubble(`[已投喂] ${getFoodLabel(spritePath)}`);
                    }}
                    className="flex items-center gap-1 px-1 py-[3px] border text-left"
                    style={{
                      borderColor: selectedFoodSprite === spritePath ? '#0f2f52' : '#2d4a77',
                      background: selectedFoodSprite === spritePath ? 'rgba(191,219,254,0.7)' : 'rgba(221,241,255,0.62)',
                    }}
                  >
                    <span
                      className="inline-block w-4 h-4 shrink-0"
                      style={{
                        backgroundImage: `url(${spritePath})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '16px 16px',
                        imageRendering: 'pixelated',
                      }}
                    />
                    <span className="truncate">{getFoodLabel(spritePath)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {menuOpen && showStatusPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[220px] p-2 rounded-[4px] border border-[#2d4a77] text-[10px]"
              style={{
                background: 'rgba(180, 198, 220, 0.5)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 0 12px rgba(165, 243, 252, 0.38), 0 3px 8px rgba(30, 64, 96, 0.28)',
                color: '#1e3a5f',
              }}
            >
              <div className="font-bold mb-1">[系统状态]</div>
              <div className="mb-1">[内核：同步中...]</div>
              <div className="mb-1">[能量：{energy}%]</div>
              <div className="w-full h-[10px] rounded-[2px] border border-[#1f3048] bg-[#334155] overflow-hidden">
                <motion.div
                  className="h-full bg-[#a5f3fc]"
                  animate={{ width: `${energy}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </motion.div>
          )}

          {bubbleText && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 min-w-[130px] max-w-[190px] px-2 py-1 text-[11px] leading-tight"
              style={{
                fontFamily: 'MS Sans Serif, Tahoma',
                color: '#1e3a5f',
                background: 'rgba(194, 204, 217, 0.8)',
                borderTop: '2px solid rgba(225, 235, 247, 0.95)',
                borderLeft: '2px solid rgba(225, 235, 247, 0.95)',
                borderRight: '2px solid rgba(52, 73, 102, 0.95)',
                borderBottom: '2px solid rgba(52, 73, 102, 0.95)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 0 10px rgba(165, 243, 252, 0.35), 2px 2px 0 rgba(26, 42, 63, 0.85)',
              }}
            >
              <div className="px-1 py-[1px] mb-1 font-bold text-[10px] border border-[#23466c] bg-[rgba(122,170,218,0.5)] text-[#173454]">
                CAT.EXE {energy <= LOW_POWER_THRESHOLD ? '[低电量]' : ''}
              </div>
              {bubbleText}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {feedFxList.map((fx) => (
            <motion.div
              key={fx.id}
              initial={{ opacity: 0, y: 6, scale: 0.8 }}
              animate={{ opacity: 1, y: -16, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.95 }}
              transition={{ duration: 0.85 }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 px-[6px] py-[2px] text-[10px] font-bold text-[#d9ffe3] bg-[#1a3c25] border border-[#7bd897]"
              style={{ textShadow: '0 0 4px rgba(124, 216, 151, 0.5)' }}
            >
              {fx.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
