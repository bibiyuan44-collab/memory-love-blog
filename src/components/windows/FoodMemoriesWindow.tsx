import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useDesktopStore } from '@/store/useDesktopStore';

type FoodStatus = 'planned' | 'eaten';
type DiningType = '堂食' | '外卖';
type ModalMode = 'planned' | 'eaten' | 'complete';

interface FoodMemory {
  id: string;
  ticket_id: string;
  status: FoodStatus;
  author: string;
  dishes: string;
  restaurant_name: string | null;
  price: number | null;
  meal_type: DiningType | null;
  meal_date: string | null;
  created_at?: string | null;
}

interface FoodMemoryDbRow {
  id: string;
  ticket_id?: string | null;
  status?: FoodStatus | null;
  author?: string | null;
  dishes?: string | null;
  restaurant_name?: string | null;
  price?: number | string | null;
  meal_type?: DiningType | null;
  meal_date?: string | null;
  created_at?: string | null;
}

interface FoodMemoriesWindowProps {
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  onFocus: () => void;
  onMinimize: () => void;
  onToggleMaximize: (maximized: boolean) => void;
  onClose: () => void;
}

interface FoodMemoryModalProps {
  mode: ModalMode;
  ticket?: FoodMemory;
  isBusy: boolean;
  onClose: () => void;
  onSubmit: (payload: FoodMemoryFormPayload) => Promise<void>;
}

type FoodMemoryFormPayload =
  | { mode: 'planned'; dishName: string; storeName: string }
  | { mode: 'eaten'; storeName: string; dishName: string; price: string; diningType: DiningType; mealDate: string }
  | { mode: 'complete'; ticket: FoodMemory; price: string; mealDate: string };

const FOOD_WINDOW_ID = 'food-memories';
const steppedPrinterEase = (progress: number) => Math.floor(progress * 9) / 9;
const PRINT_REVEAL_MS = 1850;
const HERO_HOLD_MS = 1500;
const FLY_IN_MS = 700;

type PrintJobPhase = 'printing' | 'holding' | 'flying';
type PrintJobOp = 'insert' | 'complete';

interface PrintingData {
  phase: PrintJobPhase;
  op: PrintJobOp;
  previewTicket: FoodMemory;
  originalTicketId?: string;
  persistedTicket?: FoodMemory;
  persistError?: string;
  donePersist: boolean;
}

export const getIslandName = (email?: string | null) => {
  const normalizedEmail = (email ?? '').trim().toLowerCase();
  if (normalizedEmail === 'ybb@webisland.com') return '歪比比';
  if (normalizedEmail === 'zyn@webisland.com') return 'oneone';
  return '神秘访客';
};

const createTicketId = () => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `NO.${stamp}${Math.floor(Math.random() * 900 + 100)}`;
};

const normalizeFoodMemory = (row: FoodMemoryDbRow): FoodMemory => ({
  id: row.id,
  ticket_id: row.ticket_id ?? createTicketId(),
  status: row.status === 'eaten' ? 'eaten' : 'planned',
  author: row.author ?? '神秘访客',
  dishes: row.dishes ?? '',
  restaurant_name: row.restaurant_name ?? null,
  price: row.price == null ? null : Number(row.price),
  meal_type: row.meal_type ?? null,
  meal_date: row.meal_date ?? null,
  created_at: row.created_at ?? null,
});

const playPrinterAudio = () => {
  const printer = new Audio('/printer.mp3');
  printer.play().catch(() => {
    new Audio('/audio/printer.mp3').play().catch(() => {});
  });
};

const getScatterRotate = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 41) - 20) / 10;
};

const FoodWindowShell: React.FC<
  FoodMemoriesWindowProps & {
    children: React.ReactNode;
  }
> = ({
  isMinimized,
  isMaximized,
  zIndex,
  onFocus,
  onMinimize,
  onToggleMaximize,
  onClose,
  children,
}) => {
  const focusedWindowId = useDesktopStore((s) => s.focusedWindowId);
  const targetPoint = useDesktopStore((s) => s.taskbarButtonCenters[FOOD_WINDOW_ID]);
  const isActive = focusedWindowId === FOOD_WINDOW_ID && !isMinimized;
  const targetX = targetPoint ? `calc(-50% + ${targetPoint.x - window.innerWidth / 2}px)` : '-130%';
  const targetY = targetPoint ? `calc(-50% + ${targetPoint.y - window.innerHeight / 2}px)` : '72vh';

  return (
    <motion.div
      layout
      initial={{ scale: 0.6, opacity: 0, x: '-50%', y: '-50%' }}
      animate={{
        scale: isMinimized ? 0.2 : 1,
        opacity: isMinimized ? 0 : 1,
        x: isMinimized ? targetX : (isMaximized ? 0 : '-50%'),
        y: isMinimized ? targetY : (isMaximized ? 0 : '-50%'),
      }}
      transition={{
        duration: 0.22,
        ease: [0.2, 0.78, 0.2, 1],
        layout: { duration: 0.26, ease: [0.2, 0.78, 0.2, 1] },
      }}
      exit={{ scale: 0.94, opacity: 0, transition: { duration: 0.16 } }}
      drag={!isMaximized && !isMinimized}
      dragMomentum={false}
      onPointerDown={() => {
        if (isMinimized) return;
        onFocus();
      }}
      className={`fixed z-50 flex select-none flex-col bg-[#c0c0c0] p-[3px] win-bevel-out ${
        isMaximized ? 'inset-0 h-full w-full' : 'left-1/2 top-1/2 h-[640px] w-[520px]'
      }`}
      style={{
        zIndex: isMaximized ? Math.max(zIndex, 999) : zIndex,
        boxShadow: isActive ? '3px 3px 0 rgba(0,0,0,0.36), 0 0 18px rgba(0,0,0,0.32)' : '2px 2px 0 rgba(0,0,0,0.28)',
        pointerEvents: isMinimized ? 'none' : 'auto',
      }}
    >
      <div className="win-title-bar flex h-[22px] flex-shrink-0 cursor-grab items-center gap-1 bg-[linear-gradient(90deg,#000080_0%,#0b48b5_52%,#1084d0_100%)] px-1 active:cursor-grabbing">
        <span className="text-[13px]">🍜</span>
        <span className="ml-1 flex-1 truncate text-[12px] font-bold text-white">[ Meal Tracker & Wishlist ]</span>
        <div className="flex gap-[2px]">
          <button
            className="win-btn win-title-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            _
          </button>
          <button
            className="win-btn win-title-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize(!isMaximized);
            }}
          >
            {isMaximized ? '❐' : '□'}
          </button>
          <button
            className="win-btn win-title-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <span className="mt-[1px] ml-[1px]">✕</span>
          </button>
        </div>
      </div>
      {children}
    </motion.div>
  );
};

const FoodMemoryModal: React.FC<FoodMemoryModalProps> = ({ mode, ticket, isBusy, onClose, onSubmit }) => {
  const [dishName, setDishName] = useState(ticket?.dishes ?? '');
  const [storeName, setStoreName] = useState(ticket?.restaurant_name ?? '');
  const [price, setPrice] = useState('');
  const [diningType, setDiningType] = useState<DiningType>('堂食');
  const [mealDate, setMealDate] = useState(ticket?.meal_date ?? '');

  const title = mode === 'planned' ? '想吃录入' : mode === 'eaten' ? '已吃打卡' : '补录价格';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'planned') {
      void onSubmit({ mode, dishName, storeName });
      return;
    }
    if (mode === 'complete' && ticket) {
      void onSubmit({ mode, ticket, price, mealDate });
      return;
    }
    void onSubmit({ mode: 'eaten', storeName, dishName, price, diningType, mealDate });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 p-4"
    >
      <motion.form
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onSubmit={handleSubmit}
        className="w-[340px] bg-[#c0c0c0] p-[3px] shadow-[4px_4px_0_rgba(0,0,0,0.45)] win-bevel-out"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="win-title-bar mb-3 h-[21px] bg-[linear-gradient(90deg,#000080,#1084d0)] px-1">
          <span className="flex-1 text-[12px] font-bold text-white">{title} - FOOD_LOG.EXE</span>
          <button type="button" className="win-btn win-title-btn" disabled={isBusy} onClick={onClose}>✕</button>
        </div>

        <div className="space-y-3 px-3 pb-3 text-[12px] text-black" style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun' }}>
          {mode === 'planned' && (
            <>
              <label className="block">
                <span className="mb-1 block">想吃的菜(必填)</span>
                <input required value={dishName} onChange={(e) => setDishName(e.target.value)} className="h-7 w-full px-2 win98-inset-input" />
              </label>
              <label className="block">
                <span className="mb-1 block">想去的店(选填)</span>
                <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-7 w-full px-2 win98-inset-input" />
              </label>
            </>
          )}

          {mode === 'eaten' && (
            <>
              <label className="block">
                <span className="mb-1 block">店名</span>
                <input required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-7 w-full px-2 win98-inset-input" />
              </label>
              <label className="block">
                <span className="mb-1 block">
                  菜品 <span className="text-[10px] text-[#666]">(每行一道菜)</span>
                </span>
                <textarea
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  rows={5}
                  placeholder="请输入菜品，每敲一次回车代表一道新菜..."
                  className="w-full resize-none px-2 py-1 win98-inset-input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block">价格</span>
                <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="h-7 w-full px-2 win98-inset-input" />
              </label>
              <label className="block">
                <span className="mb-1 block">形式</span>
                <select value={diningType} onChange={(e) => setDiningType(e.target.value as DiningType)} className="h-7 w-full px-2 win98-inset-input">
                  <option value="堂食">堂食</option>
                  <option value="外卖">外卖</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block">时间 (Date)</span>
                <input type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} className="h-7 w-full px-2 win98-inset-input" />
              </label>
            </>
          )}

          {mode === 'complete' && ticket && (
            <>
              <div className="bg-white px-2 py-1 win98-inset-input">
                {ticket.restaurant_name || '未知店铺'} / {ticket.dishes}
              </div>
              <label className="block">
                <span className="mb-1 block">补录价格</span>
                <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="h-7 w-full px-2 win98-inset-input" />
              </label>
              <label className="block">
                <span className="mb-1 block">时间 (Date)</span>
                <input type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} className="h-7 w-full px-2 win98-inset-input" />
              </label>
            </>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#808080] pt-3">
            <span className="mr-auto text-[#404040]">{isBusy ? 'PRINT QUEUE BUSY...' : 'READY'}</span>
            <button type="button" disabled={isBusy} onClick={onClose} className="h-7 w-16 win-bevel-out active:win-bevel-in">取消</button>
            <button type="submit" disabled={isBusy} className="h-7 w-20 win-bevel-out active:win-bevel-in">
              {isBusy ? '处理中' : '提交'}
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
};

const FoodTicket: React.FC<{
  ticket: FoodMemory;
  onComplete?: (ticket: FoodMemory) => void;
  showCompleteAction?: boolean;
  variant?: 'board' | 'hero';
  rotateDeg?: number;
}> = ({ ticket, onComplete, showCompleteAction = true, variant = 'board', rotateDeg = 0 }) => {
  const createdAt = ticket.created_at ? new Date(ticket.created_at) : new Date();
  const dateLabel = Number.isNaN(createdAt.getTime()) ? 'DATE UNKNOWN' : createdAt.toLocaleString('zh-CN', { hour12: false });
  const mealDateLabel = ticket.meal_date ?? null;
  const priceLabel = ticket.price == null ? '???' : `RMB ${ticket.price.toFixed(2)}`;
  const dishLines = ticket.dishes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const isHero = variant === 'hero';

  return (
    <motion.article
      layout
      initial={false}
      animate={{ rotate: rotateDeg }}
      transition={{ duration: 0.28 }}
      className={`overflow-hidden ${isHero ? 'w-[360px]' : 'w-[225px]'}`}
    >
      <div className={`food-ticket relative text-[#202020] ${isHero ? 'my-4 px-6 py-7' : 'my-2 px-4 py-4'}`}>
        {ticket.status === 'eaten' ? (
          <div className="food-ticket-stamp">DELICIOUS</div>
        ) : (
          <div className="food-ticket-watermark">待解锁</div>
        )}

        <div className="relative z-10">
          <div className="mb-3 border-b-2 border-dashed border-[#1f1f1f] pb-2 text-center">
            <div className={`font-black tracking-[0.18em] ${isHero ? 'text-[22px]' : 'text-[13px]'}`}>FOOD MEMORIES</div>
            <div className={`${isHero ? 'text-[11px]' : 'text-[8px]'} tracking-[0.15em]`}>MEAL TRACKER & WISHLIST</div>
          </div>

          <div className={`space-y-2 leading-none ${isHero ? 'text-[13px]' : 'text-[10px]'}`}>
            {ticket.status === 'eaten' && mealDateLabel && (
              <div className="flex items-end gap-2">
                <span>DATE</span>
                <span className="min-w-0 flex-1 border-b-2 border-dotted border-[#202020]" />
                <span className="text-right">{mealDateLabel}</span>
              </div>
            )}
            <div className="flex items-end gap-2">
              <span>SHOP</span>
              <span className="min-w-0 flex-1 border-b-2 border-dotted border-[#202020]" />
              <span className="max-w-[210px] truncate text-right">{ticket.restaurant_name || 'TBD'}</span>
            </div>
            <div className={`font-black ${isHero ? 'text-[18px]' : 'text-[12px]'}`}>
              <div className="mb-1 flex items-end gap-2">
                <span>DISH</span>
                <span className="min-w-0 flex-1 border-b-2 border-dotted border-[#202020]" />
              </div>
              {dishLines.length > 0 ? (
                <div className={`space-y-1 ${isHero ? 'text-[16px]' : 'text-[11px]'}`}>
                  {dishLines.map((dish, index) => (
                    <div key={`${ticket.id}-dish-${index}`} className="flex items-end gap-2">
                      <span className="w-4 text-left">-</span>
                      <span className="min-w-0 flex-1 truncate text-left">{dish}</span>
                      <span className="w-8 border-b-2 border-dotted border-[#202020]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`flex items-end gap-2 ${isHero ? 'text-[16px]' : 'text-[11px]'}`}>
                  <span className="w-4 text-left">-</span>
                  <span className="min-w-0 flex-1 text-left">TBD</span>
                  <span className="w-8 border-b-2 border-dotted border-[#202020]" />
                </div>
              )}
            </div>
            <div className={`flex items-end gap-2 font-black ${isHero ? 'text-[18px]' : 'text-[12px]'}`}>
              <span>PRICE</span>
              <span className="min-w-0 flex-1 border-b-2 border-dotted border-[#202020]" />
              <span>{priceLabel}</span>
            </div>
          </div>

          <div className={`mt-3 grid grid-cols-2 gap-2 border-y-2 border-dashed border-[#202020] py-2 ${isHero ? 'text-[11px]' : 'text-[8px]'}`}>
            <span>TYPE: {ticket.meal_type ?? 'WISHLIST'}</span>
            <span className="text-right">BY: {ticket.author}</span>
            <span className="col-span-2">TIME: {dateLabel}</span>
          </div>

          {showCompleteAction && ticket.status === 'planned' && onComplete && (
            <button
              onClick={() => onComplete(ticket)}
              className="mt-3 w-full bg-[#c0c0c0] py-1 text-[12px] text-black win-bevel-out active:win-bevel-in"
              style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun' }}
            >
              😋 我吃到了!
            </button>
          )}

          <div className={`food-ticket-barcode ${isHero ? 'mt-5 h-12' : 'mt-3 h-8'}`} />
          <div className={`mt-1 text-center font-bold tracking-[0.18em] ${isHero ? 'text-[12px]' : 'text-[9px]'}`}>{ticket.ticket_id}</div>
        </div>
      </div>
    </motion.article>
  );
};

export const FoodMemoriesWindow: React.FC<FoodMemoriesWindowProps> = ({
  isMinimized,
  isMaximized,
  zIndex,
  onFocus,
  onMinimize,
  onToggleMaximize,
  onClose,
}) => {
  const [tickets, setTickets] = useState<FoodMemory[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [completionTicket, setCompletionTicket] = useState<FoodMemory | null>(null);
  const [printingData, setPrintingData] = useState<PrintingData | null>(null);
  const [focusedPane, setFocusedPane] = useState<'wishlist' | 'memories' | null>(null);
  const [statusText, setStatusText] = useState('READY');

  const modalTicket = modalMode === 'complete' ? completionTicket ?? undefined : undefined;

  const plannedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'planned').sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()),
    [tickets],
  );
  const eatenTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'eaten').sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()),
    [tickets],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('food_memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isMounted) return;
      if (error) {
        setStatusText(`LOAD ERR: ${error.message}`);
        return;
      }
      setTickets((data ?? []).map((row) => normalizeFoodMemory(row as FoodMemoryDbRow)));
      setStatusText('READY');
    };

    void fetchTickets();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!printingData || printingData.phase !== 'printing') return;
    const timer = window.setTimeout(() => {
      setPrintingData((current) => (current ? { ...current, phase: 'holding' } : current));
    }, PRINT_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [printingData]);

  useEffect(() => {
    if (!isMaximized && focusedPane !== null) {
      setFocusedPane(null);
    }
  }, [focusedPane, isMaximized]);

  useEffect(() => {
    if (!printingData || printingData.phase !== 'holding' || !printingData.donePersist) return;
    const timer = window.setTimeout(() => {
      setPrintingData((current) => (current ? { ...current, phase: 'flying' } : current));
    }, HERO_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [printingData]);

  useEffect(() => {
    if (!printingData || printingData.phase !== 'flying') return;
    const finalTicket = printingData.persistedTicket ?? printingData.previewTicket;
    const timer = window.setTimeout(() => {
      if (!printingData.persistError) {
        setTickets((prev) => {
          if (printingData.op === 'complete') {
            return prev.map((ticket) => (ticket.id === printingData.originalTicketId ? finalTicket : ticket));
          }
          return [finalTicket, ...prev];
        });
        setStatusText('READY');
      } else {
        setStatusText(`SYNC ERR: ${printingData.persistError}`);
      }
      setPrintingData(null);
    }, FLY_IN_MS);
    return () => window.clearTimeout(timer);
  }, [printingData]);

  const queuePrintJob = (job: PrintingData) => {
    setModalMode(null);
    setCompletionTicket(null);
    setStatusText('PRINTING...');
    setPrintingData(job);
    playPrinterAudio();
  };

  const handleSubmit = async (payload: FoodMemoryFormPayload) => {
    if (printingData) return;

    const { data: userData } = await supabase.auth.getUser();
    const author = getIslandName(userData.user?.email);
    const ticketId = createTicketId();

    if (payload.mode === 'complete') {
      const previewTicket: FoodMemory = {
        ...payload.ticket,
        status: 'eaten',
        author,
        price: Number(payload.price),
        meal_type: payload.ticket.meal_type ?? '堂食',
        meal_date: payload.mealDate || null,
        ticket_id: payload.ticket.ticket_id || ticketId,
      };

      queuePrintJob({
        phase: 'printing',
        op: 'complete',
        previewTicket,
        originalTicketId: payload.ticket.id,
        donePersist: false,
      });

      const { data, error } = await supabase
        .from('food_memories')
        .update({
          status: 'eaten',
          price: Number(payload.price),
          meal_type: previewTicket.meal_type,
          meal_date: previewTicket.meal_date,
          author,
        })
        .eq('id', payload.ticket.id)
        .select('*')
        .single();

      setPrintingData((current) => {
        if (!current) return current;
        return {
          ...current,
          donePersist: true,
          persistedTicket: data ? normalizeFoodMemory(data as FoodMemoryDbRow) : previewTicket,
          persistError: error?.message,
        };
      });
      return;
    }

    const previewTicket: FoodMemory = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      status: payload.mode === 'planned' ? 'planned' : 'eaten',
      author,
      dishes: payload.dishName.trim(),
      restaurant_name: payload.storeName.trim() || null,
      price: payload.mode === 'eaten' ? Number(payload.price) : null,
      meal_type: payload.mode === 'eaten' ? payload.diningType : null,
      meal_date: payload.mode === 'eaten' ? (payload.mealDate || null) : null,
      created_at: new Date().toISOString(),
    };

    queuePrintJob({
      phase: 'printing',
      op: 'insert',
      previewTicket,
      donePersist: false,
    });

    const { data, error } = await supabase
      .from('food_memories')
      .insert({
        ticket_id: previewTicket.ticket_id,
        status: previewTicket.status,
        author,
        dishes: previewTicket.dishes,
        restaurant_name: previewTicket.restaurant_name,
        price: previewTicket.price,
        meal_type: previewTicket.meal_type,
        meal_date: previewTicket.meal_date,
      })
      .select('*')
      .single();

    setPrintingData((current) => {
      if (!current) return current;
      return {
        ...current,
        donePersist: true,
        persistedTicket: data ? normalizeFoodMemory(data as FoodMemoryDbRow) : previewTicket,
        persistError: error?.message,
      };
    });
  };

  return (
    <FoodWindowShell
      isMinimized={isMinimized}
      isMaximized={isMaximized}
      zIndex={zIndex}
      onFocus={onFocus}
      onMinimize={onMinimize}
      onToggleMaximize={onToggleMaximize}
      onClose={onClose}
    >
      <div className="flex flex-shrink-0 gap-2 border-b border-[#808080] bg-[#c0c0c0] p-2">
        <button
          onClick={() => setModalMode('planned')}
          disabled={Boolean(printingData)}
          className="h-8 px-3 text-[12px] text-black disabled:opacity-60 win-bevel-out active:win-bevel-in"
          style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun' }}
        >
          💭 存入心愿单
        </button>
        <button
          onClick={() => setModalMode('eaten')}
          disabled={Boolean(printingData)}
          className="h-8 px-3 text-[12px] text-black disabled:opacity-60 win-bevel-out active:win-bevel-in"
          style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun' }}
        >
          🖨️ 打印打卡票
        </button>
      </div>

      <motion.div layout className="food-ticket-feed relative min-h-0 flex-1 p-3">
        <motion.div
          layout
          transition={{ layout: { duration: 0.24, ease: [0.2, 0.78, 0.2, 1] } }}
          className={`flex h-full gap-3 ${isMaximized ? 'flex-row' : 'flex-col'}`}
        >
          <motion.section
            layout
            transition={{ layout: { duration: 0.24, ease: [0.2, 0.78, 0.2, 1] } }}
            className={`food-wishlist-zone min-h-0 border border-[#8a806e] p-2 transition-all duration-500 ease-in-out ${
              isMaximized
                ? focusedPane === 'wishlist'
                  ? 'basis-3/4'
                  : focusedPane === 'memories'
                    ? 'basis-1/4'
                    : 'basis-1/2'
                : 'flex-1'
            }`}
          >
            <div
              className={`food-pane-header food-pane-header-wishlist flex items-center justify-between border-b border-[#9d917f] pb-1 text-[12px] font-bold text-[#433d34] ${
                isMaximized ? 'cursor-pointer' : ''
              }`}
              style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun' }}
              onClick={() => {
                if (!isMaximized) return;
                setFocusedPane((prev) => (prev === 'wishlist' ? null : 'wishlist'));
              }}
            >
              <span>[ 💭 Wishlist / 等待探索 ] {focusedPane === 'wishlist' ? '[-]' : '[+]'}</span>
              <span>{plannedTickets.length}</span>
            </div>
            <div className="win98-scrollbox mt-2 flex h-[calc(100%-24px)] flex-wrap content-start gap-2 overflow-x-hidden overflow-y-auto pr-1">
              {plannedTickets.map((ticket) => (
                <FoodTicket
                  key={ticket.id}
                  ticket={ticket}
                  rotateDeg={getScatterRotate(ticket.id)}
                  onComplete={(selectedTicket) => {
                    setCompletionTicket(selectedTicket);
                    setModalMode('complete');
                  }}
                />
              ))}
            </div>
          </motion.section>

          <motion.section
            layout
            transition={{ layout: { duration: 0.24, ease: [0.2, 0.78, 0.2, 1] } }}
            className={`food-memories-zone min-h-0 border border-[#55627c] p-2 transition-all duration-500 ease-in-out ${
              isMaximized
                ? focusedPane === 'memories'
                  ? 'basis-3/4'
                  : focusedPane === 'wishlist'
                    ? 'basis-1/4'
                    : 'basis-1/2'
                : 'flex-1'
            }`}
          >
            <div
              className={`food-pane-header food-pane-header-memories flex items-center justify-between border-b border-[#70819c] pb-1 text-[12px] font-bold text-[#dde9ff] ${
                isMaximized ? 'cursor-pointer' : ''
              }`}
              style={{ fontFamily: 'MS Sans Serif, Tahoma, SimSun' }}
              onClick={() => {
                if (!isMaximized) return;
                setFocusedPane((prev) => (prev === 'memories' ? null : 'memories'));
              }}
            >
              <span>[ 🍽️ Memories / 美味档案 ] {focusedPane === 'memories' ? '[-]' : '[+]'}</span>
              <span>{eatenTickets.length}</span>
            </div>
            <div className="win98-scrollbox mt-2 flex h-[calc(100%-24px)] flex-wrap content-start gap-2 overflow-x-hidden overflow-y-auto pr-1">
              {eatenTickets.map((ticket) => (
                <FoodTicket
                  key={ticket.id}
                  ticket={ticket}
                  rotateDeg={getScatterRotate(ticket.id)}
                  showCompleteAction={false}
                />
              ))}
            </div>
          </motion.section>
        </motion.div>
      </motion.div>

      <div className="flex h-5 flex-shrink-0 gap-1 border-t border-white bg-[#c0c0c0] p-[2px] text-[11px] text-black" style={{ fontFamily: 'MS Sans Serif, Tahoma' }}>
        <div className="flex-1 px-2 win-bevel-in">{statusText}</div>
        <div className="w-32 px-2 win-bevel-in">{tickets.length} TICKET(S)</div>
      </div>

      <AnimatePresence>
        {modalMode && (
          <FoodMemoryModal
            key={modalMode}
            mode={modalMode}
            ticket={modalTicket}
            isBusy={Boolean(printingData)}
            onClose={() => {
              if (!printingData) {
                setModalMode(null);
                setCompletionTicket(null);
              }
            }}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {printingData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/55"
          >
            <motion.div
              className="pointer-events-none"
              animate={{
                scale: printingData.phase === 'flying' ? 1 : 1.5,
                x: printingData.phase === 'flying' ? (printingData.previewTicket.status === 'planned' ? -170 : 170) : 0,
                y: printingData.phase === 'flying' ? -140 : 0,
                opacity: printingData.phase === 'flying' ? 0.12 : 1,
              }}
              transition={
                printingData.phase === 'flying'
                  ? { duration: FLY_IN_MS / 1000, ease: [0.2, 0.86, 0.18, 1] }
                  : { duration: 0.2 }
              }
            >
              <motion.div
                initial={{ height: 0, y: -50, opacity: 0 }}
                animate={{ height: 'auto', y: 0, opacity: 1 }}
                transition={{ duration: PRINT_REVEAL_MS / 1000, ease: steppedPrinterEase }}
                className="overflow-hidden"
              >
                <FoodTicket
                  ticket={printingData.previewTicket}
                  variant="hero"
                  rotateDeg={0}
                  showCompleteAction={false}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </FoodWindowShell>
  );
};
