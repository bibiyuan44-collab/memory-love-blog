import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { memorySpots, type MemorySpot } from '@/data/memorySpots';
import { useDesktopStore } from '@/store/useDesktopStore';
import { supabase } from '@/lib/supabaseClient';

interface MemoryRow {
  id: string;
  title: string | null;
  content: string | null;
  lat?: number | null;
  lng?: number | null;
  created_at?: string | null;
  status?: 'visited' | 'wishlist' | null;
}

type MemoryLogRow = {
  id: string;
  memory_id: string;
  author: string;
  log_date: string;
  content: string;
};

type HtmlSpot = MemorySpot & {
  source: 'preset' | 'custom';
  linkedDbId?: string;
  dbTitle: string;
  dbContent: string;
  dbDate: string;
  status: 'visited' | 'wishlist';
  floatPhase: number;
};

type ArcRow = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  dashPhase: number;
};

type StardustPoint = {
  lat: number;
  lng: number;
  color: string;
  altitude: number;
};

type GlobePoint = StardustPoint & {
  radius?: number;
};

type ArchiveWindow = {
  memoryId: string;
  x: number;
  y: number;
  z: number;
  isEditMode: boolean;
  isSaving: boolean;
  draftTitle: string;
  draftContent: string;
  draftStatus: 'visited' | 'wishlist';
};

type CreateWindowState = {
  isOpen: boolean;
  lat: number;
  lng: number;
  x: number;
  y: number;
  draftTitle: string;
  draftContent: string;
  isSaving: boolean;
};

type HeartBurst = {
  id: string;
  x: number;
  y: number;
};

function isPointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0] ?? 0;
    const yi = ring[i]?.[1] ?? 0;
    const xj = ring[j]?.[0] ?? 0;
    const yj = ring[j]?.[1] ?? 0;
    const intersects = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function isLandCoordinate(lat: number, lng: number, features: object[]): boolean {
  for (const feature of features as Array<{ geometry?: { type?: string; coordinates?: unknown } }>) {
    const geometry = feature.geometry;
    if (!geometry?.type || !geometry.coordinates) continue;
    if (geometry.type === 'Polygon') {
      const polygon = geometry.coordinates as number[][][];
      if (!polygon.length) continue;
      if (!isPointInRing(lat, lng, polygon[0] ?? [])) continue;
      const inHole = polygon.slice(1).some((ring) => isPointInRing(lat, lng, ring));
      if (!inHole) return true;
    } else if (geometry.type === 'MultiPolygon') {
      const multi = geometry.coordinates as number[][][][];
      for (const polygon of multi) {
        if (!polygon.length) continue;
        if (!isPointInRing(lat, lng, polygon[0] ?? [])) continue;
        const inHole = polygon.slice(1).some((ring) => isPointInRing(lat, lng, ring));
        if (!inHole) return true;
      }
    }
  }
  return false;
}

type TodoRow = {
  id: string;
  content: string;
  is_completed: boolean;
};

const Y2K_PALETTE = {
  pink: '#ffb6c1',
  cyan: '#87ceeb',
  lilac: '#d8bfd8',
  silver: '#f4f7ff',
};

// Fill these with your real author strings (email or nickname).
const USER_COLOR_MAP: Record<string, 'player1' | 'player2'> = {
  'ybb@webisland.com': 'player1',
  '歪比比': 'player1',
  'zyn@webisland.com': 'player2',
  'oneone': 'player2',
};

const PLAYER_THEME = {
  player1: {
    label: '歪比比',
    bg: 'linear-gradient(180deg, rgba(192, 233, 255, 0.95) 0%, rgba(152, 212, 255, 0.94) 100%)',
    glow: '0 0 8px rgba(148, 211, 255, 0.85)',
    text: '#234c72',
  },
  player2: {
    label: 'oneone',
    bg: 'linear-gradient(180deg, rgba(255, 211, 234, 0.96) 0%, rgba(255, 181, 219, 0.95) 100%)',
    glow: '0 0 8px rgba(255, 175, 218, 0.88)',
    text: '#6f3f64',
  },
  unknown: {
    label: 'Player ?',
    bg: 'linear-gradient(180deg, #e4ebf4 0%, #ccd8e6 100%)',
    glow: '0 0 5px rgba(151, 166, 187, 0.6)',
    text: '#455a73',
  },
} as const;

function toInputDate(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return new Date().toISOString().slice(0, 10);
  return dt.toISOString().slice(0, 10);
}

/** 全息珠光磨砂气泡材质 */
function createBubbleGlobeMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xe9e3ff),
    transparent: true,
    opacity: 0.9,
    roughness: 0.24,
    metalness: 0.05,
    transmission: 0.92,
    thickness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.92,
    iridescenceIOR: 1.34,
    iridescenceThicknessRange: [120, 520],
    sheen: 0.55,
    sheenColor: new THREE.Color(0xffd7f2),
    emissive: new THREE.Color(0x211738),
    emissiveIntensity: 0.12,
  });
}

function makeStarTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return new THREE.CanvasTexture(c);
  g.clearRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath();
  g.moveTo(32, 8);
  g.lineTo(36, 28);
  g.lineTo(56, 32);
  g.lineTo(36, 36);
  g.lineTo(32, 56);
  g.lineTo(28, 36);
  g.lineTo(8, 32);
  g.lineTo(28, 28);
  g.closePath();
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeFlareTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return new THREE.CanvasTexture(c);
  const grad = g.createRadialGradient(32, 32, 3, 32, 32, 28);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.35, 'rgba(255,201,236,0.6)');
  grad.addColorStop(1, 'rgba(255,201,236,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeBubbleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return new THREE.CanvasTexture(c);
  g.clearRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(201, 244, 255, 0.8)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(32, 32, 20, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.beginPath();
  g.arc(24, 24, 5, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function randomSpherePoint(minR: number, maxR: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = minR + Math.random() * (maxR - minR);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function createParticleLayer(
  count: number,
  size: number,
  color: string,
  texture: THREE.Texture,
  minR: number,
  maxR: number,
): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = randomSpherePoint(minR, maxR);
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: texture,
    size,
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.userData = {
    baseOpacity: material.opacity,
    pulseOffset: Math.random() * Math.PI * 2,
    driftSpeed: 0.0002 + Math.random() * 0.00025,
  };
  return points;
}

function markerInnerHtml(
  title: string,
  accent: string,
  floatPhase: number,
): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  return `
    <div class="y2k-marker-root" style="--badge-accent:${accent};--float-phase:${floatPhase.toFixed(2)}s;display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;">
      <div class="y2k-memory-badge-fx" style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:36px;height:36px;border-radius:8px;
        background:linear-gradient(180deg,rgba(255,255,255,0.95) 0%, rgba(237, 232, 255, 0.85) 55%, rgba(162, 179, 230, 0.72) 100%);
        box-shadow:0 0 8px ${accent}, 0 0 16px rgba(196, 216, 255, 0.35), inset 0 0 0 1px rgba(255,255,255,0.8);
        border:1px solid rgba(166,183,224,0.85);
        image-rendering:pixelated;
        display:flex;align-items:center;justify-content:center;position:relative;">
        <span style="position:absolute;top:2px;left:3px;font-size:9px;line-height:1;color:rgba(255,255,255,0.95);">✦</span>
        <span style="font-size:14px;line-height:1;filter:drop-shadow(0 1px 0 rgba(255,255,255,0.8));">📌</span>
      </div>
      <div style="margin-top:3px;font-family:VT323,monospace;font-size:12px;color:${Y2K_PALETTE.silver};
        text-shadow:0 0 5px ${accent};max-width:110px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(title)}</div>
      </div>
    </div>`;
}

function markerWishlistHtml(
  title: string,
  floatPhase: number,
): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  return `
    <div class="y2k-marker-root wishlist-marker" style="--float-phase:${floatPhase.toFixed(2)}s;display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;">
      <div class="y2k-memory-badge-fx" style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:36px;height:36px;border-radius:8px;
        background:linear-gradient(180deg,rgba(215,241,255,0.3) 0%, rgba(168,222,248,0.22) 100%);
        box-shadow:0 0 10px rgba(149,224,255,0.5), inset 0 0 0 1px rgba(227,247,255,0.7);
        border:1px solid rgba(141,206,232,0.9);
        image-rendering:pixelated;
        display:flex;align-items:center;justify-content:center;position:relative;
        color:rgba(212,246,255,0.95);
        animation:wishlist-breath 3.8s ease-in-out infinite;">
        <span style="font-size:17px;line-height:1;filter:drop-shadow(0 0 5px rgba(170,233,255,0.65));">⚐</span>
      </div>
      <div style="margin-top:3px;font-family:VT323,monospace;font-size:12px;color:#d6ecfa;
        text-shadow:0 0 6px rgba(155,217,255,0.7);max-width:110px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(title)}</div>
      </div>
    </div>`;
}

const Win98Modal: React.FC<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/40 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-[560px] bg-[var(--win-gray)]"
            style={{
              borderTop: '2px solid #ffffff',
              borderLeft: '2px solid #ffffff',
              borderRight: '2px solid #000000',
              borderBottom: '2px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-6 px-2 flex items-center justify-between cursor-default"
              style={{
                background: 'linear-gradient(to right, #2a3f6e 0%, #4f8fd9 55%, #6badec 100%)',
              }}
            >
              <span className="text-white text-xs font-bold" style={{ fontFamily: 'MS Sans Serif, Tahoma' }}>
                {title}
              </span>
              <button
                onClick={onClose}
                className="w-5 h-5 flex items-center justify-center text-white hover:bg-[var(--dream-menu-hover)] transition-colors text-xs"
                style={{
                  background: 'var(--win-gray)',
                  borderTop: '1px solid #ffffff',
                  borderLeft: '1px solid #ffffff',
                  borderRight: '1px solid #000000',
                  borderBottom: '1px solid #000000',
                  fontFamily: 'MS Sans Serif, Tahoma',
                }}
              >
                ✕
              </button>
            </div>
            <div className="p-3" style={{ backgroundColor: '#d4d0c8' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MemoryMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const globeLightsAdded = useRef(false);
  const particleGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const globeMaterial = useMemo(() => createBubbleGlobeMaterial(), []);
  const textures = useMemo(
    () => ({
      star: makeStarTexture(),
      flare: makeFlareTexture(),
      bubble: makeBubbleTexture(),
    }),
    [],
  );

  const ambientColor = useDesktopStore((s) => s.ambientColor);
  const setAmbientColor = useDesktopStore((s) => s.setAmbientColor);

  const [dims, setDims] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 800, h: typeof window !== 'undefined' ? window.innerHeight : 600 });
  const [memoriesById, setMemoriesById] = useState<Record<string, MemoryRow>>({});
  const [spotDbIdMap, setSpotDbIdMap] = useState<Record<string, string>>({});
  const [archiveWindows, setArchiveWindows] = useState<ArchiveWindow[]>([]);
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [todoDraft, setTodoDraft] = useState('');
  const [bucketWindowVisible, setBucketWindowVisible] = useState(true);
  const [bucketPos, setBucketPos] = useState({ x: 48, y: 96 });
  const [errorText, setErrorText] = useState<string | null>(null);
  const [createWindow, setCreateWindow] = useState<CreateWindowState>({
    isOpen: false,
    lat: 0,
    lng: 0,
    x: 0,
    y: 0,
    draftTitle: '',
    draftContent: '',
    isSaving: false,
  });
  const [isAddWishMode, setIsAddWishMode] = useState(false);
  const [isHoveringLand, setIsHoveringLand] = useState(false);
  const [isHoveringMarker, setIsHoveringMarker] = useState(false);
  const [heartBursts, setHeartBursts] = useState<HeartBurst[]>([]);
  const [timeTick, setTimeTick] = useState(0);
  const [continents, setContinents] = useState<object[]>([]);
  const [currentAuthor, setCurrentAuthor] = useState<string | null>(null);
  const [logsByMemorySpotId, setLogsByMemorySpotId] = useState<Record<string, MemoryLogRow[]>>({});
  const [logsLoadingByMemorySpotId, setLogsLoadingByMemorySpotId] = useState<Record<string, boolean>>({});
  const [logDraftByMemorySpotId, setLogDraftByMemorySpotId] = useState<Record<string, { logDate: string; content: string; isSubmitting: boolean }>>({});
  const dragStateRef = useRef<{ memoryId: string; offsetX: number; offsetY: number } | null>(null);
  const bucketDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setDims({ w: Math.max(320, cr.width), h: Math.max(240, cr.height) });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setErrorText(error.message);
        return;
      }
      const meta = data.user?.user_metadata as { nickname?: string; full_name?: string; name?: string } | undefined;
      const resolvedAuthor = meta?.nickname?.trim()
        || meta?.full_name?.trim()
        || meta?.name?.trim()
        || data.user?.email?.trim()
        || data.user?.id
        || null;
      setCurrentAuthor(resolvedAuthor);
    };
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeTick((v) => v + 1);
    }, 90);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const loadContinents = async () => {
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
          { signal: ac.signal },
        );
        if (!res.ok) return;
        const geo = (await res.json()) as { features?: object[] };
        setContinents(geo.features ?? []);
      } catch {
        // Ignore remote failures gracefully.
      }
    };
    void loadContinents();
    return () => ac.abort();
  }, []);

  const fetchMemories = useCallback(async () => {
    const { data, error } = await supabase
      .from('memories')
      .select('id, title, content, lat, lng, created_at, status');

    if (error) {
      setErrorText(error.message);
      return;
    }
    const next: Record<string, MemoryRow> = {};
    const nextSpotDbIdMap: Record<string, string> = {};
    ((data as MemoryRow[] | null) ?? []).forEach((row) => {
      const lat = typeof row.lat === 'number' ? row.lat : null;
      const lng = typeof row.lng === 'number' ? row.lng : null;
      const normalized = { ...row, lat, lng };
      next[row.id] = normalized;

      if (lat !== null && lng !== null) {
        const matched = memorySpots.find(
          (spot) => Math.abs(spot.lat - lat) < 0.0001 && Math.abs(spot.lng - lng) < 0.0001,
        );
        if (matched) {
          nextSpotDbIdMap[matched.id] = row.id;
        }
      }
    });
    setMemoriesById(next);
    setSpotDbIdMap(nextSpotDbIdMap);
  }, []);

  const fetchTodos = useCallback(async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('id, content, is_completed')
      .order('id', { ascending: false });
    if (error) {
      setErrorText(error.message);
      return;
    }
    setTodos(((data as TodoRow[] | null) ?? []).filter((row) => row.content?.trim()));
  }, []);

  useEffect(() => {
    void fetchMemories();
    const channel = supabase
      .channel('memories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, () => {
        void fetchMemories();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchMemories]);

  useEffect(() => {
    void fetchTodos();
    const channel = supabase
      .channel('todos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        void fetchTodos();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchTodos]);

  const htmlElementsData: HtmlSpot[] = useMemo(() => {
    const presetSpots: HtmlSpot[] = memorySpots.map((spot, idx) => {
      const dbId = spotDbIdMap[spot.id];
      const db = dbId ? memoriesById[dbId] : undefined;
      return {
        ...spot,
        source: 'preset' as const,
        linkedDbId: dbId,
        dbTitle: db?.title?.trim() || spot.name,
        dbContent: db?.content?.trim() || spot.story,
        dbDate: db?.created_at ? new Date(db.created_at).toLocaleDateString() : spot.date,
        status: db?.status === 'wishlist' ? 'wishlist' : 'visited',
        floatPhase: (idx * 0.45) % 2.4,
      };
    });
    const linkedDbIds = new Set(Object.values(spotDbIdMap));
    const customSpots: HtmlSpot[] = Object.values(memoriesById)
      .filter((row): row is MemoryRow & { lat: number; lng: number; id: string } => (
        typeof row.lat === 'number'
        && typeof row.lng === 'number'
        && !linkedDbIds.has(row.id)
      ))
      .map((row, idx) => ({
        id: `custom-${row.id}`,
        name: row.title?.trim() || 'Untitled Dream Spot',
        lat: row.lat,
        lng: row.lng,
        color: row.status === 'wishlist' ? '#9cdfff' : Y2K_PALETTE.pink,
        story: row.content?.trim() || 'A dream waiting to happen...',
        date: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Unknown Date',
        photos: [],
        emoji: row.status === 'wishlist' ? '⚐' : '📌',
        markerStyle: row.status === 'wishlist' ? 'orb' : 'star',
        source: 'custom' as const,
        linkedDbId: row.id,
        dbTitle: row.title?.trim() || 'Untitled Dream Spot',
        dbContent: row.content?.trim() || 'A dream waiting to happen...',
        dbDate: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Unknown Date',
        status: row.status === 'wishlist' ? 'wishlist' : 'visited',
        floatPhase: ((memorySpots.length + idx) * 0.45) % 2.4,
      }));
    return [...presetSpots, ...customSpots];
  }, [memoriesById, spotDbIdMap]);

  const arcsData: ArcRow[] = useMemo(() => {
    return htmlElementsData.slice(0, -1).map((m, i) => ({
      startLat: m.lat,
      startLng: m.lng,
      endLat: htmlElementsData[i + 1]!.lat,
      endLng: htmlElementsData[i + 1]!.lng,
      dashPhase: (i * 0.237) % 1,
    }));
  }, [htmlElementsData]);

  const stardustPoints: StardustPoint[] = useMemo(() => {
    const now = timeTick * 0.0042;
    const points: StardustPoint[] = [];
    const eased = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
    arcsData.forEach((arc, i) => {
      const base = (now + arc.dashPhase + i * 0.11) % 1;
      for (let trail = 0; trail < 3; trail++) {
        const t = (base + trail * 0.16) % 1;
        const p = eased(t);
        points.push({
          lat: arc.startLat + (arc.endLat - arc.startLat) * p,
          lng: arc.startLng + (arc.endLng - arc.startLng) * p,
          altitude: 0.025 + Math.sin((p + trail) * Math.PI) * 0.02,
          color: trail === 0 ? 'rgba(245,252,255,0.95)' : 'rgba(214,240,255,0.6)',
        });
      }
    });
    return points;
  }, [arcsData, timeTick]);

  const memoryPoints: GlobePoint[] = useMemo(
    () =>
      htmlElementsData.map((m) => ({
        lat: m.lat,
        lng: m.lng,
        color: 'rgba(208, 232, 255, 0.92)',
        altitude: 0.018,
        radius: 0.42,
      })),
    [htmlElementsData],
  );

  const combinedPoints = useMemo<GlobePoint[]>(
    () => [...stardustPoints, ...memoryPoints],
    [memoryPoints, stardustPoints],
  );

  const openArchiveWindow = useCallback((spot: HtmlSpot) => {
    setArchiveWindows((prev) => {
      const topZ = prev.reduce((max, w) => Math.max(max, w.z), 100);
      const existing = prev.find((w) => w.memoryId === spot.id);
      if (existing) {
        return prev.map((w) => (w.memoryId === spot.id ? { ...w, z: topZ + 1 } : w));
      }
      const idx = prev.length;
      return [
        ...prev,
        {
          memoryId: spot.id,
          x: 24 + (idx % 4) * 30,
          y: 24 + (idx % 4) * 24,
          z: topZ + 1,
          isEditMode: false,
          isSaving: false,
          draftTitle: spot.dbTitle,
          draftContent: spot.dbContent,
          draftStatus: spot.status,
        },
      ];
    });
    setLogDraftByMemorySpotId((prev) => (
      prev[spot.id]
        ? prev
        : {
            ...prev,
            [spot.id]: {
              logDate: new Date().toISOString().slice(0, 10),
              content: '',
              isSubmitting: false,
            },
          }
    ));
  }, []);

  const focusArchiveWindow = useCallback((memoryId: string) => {
    setArchiveWindows((prev) => {
      const topZ = prev.reduce((max, w) => Math.max(max, w.z), 100);
      return prev.map((w) => (w.memoryId === memoryId ? { ...w, z: topZ + 1 } : w));
    });
  }, []);

  const closeArchiveWindow = useCallback((memoryId: string) => {
    setArchiveWindows((prev) => prev.filter((w) => w.memoryId !== memoryId));
  }, []);

  const startDraggingWindow = useCallback((e: React.MouseEvent, memoryId: string) => {
    e.preventDefault();
    const target = archiveWindows.find((w) => w.memoryId === memoryId);
    if (!target) return;
    dragStateRef.current = {
      memoryId,
      offsetX: e.clientX - target.x,
      offsetY: e.clientY - target.y,
    };
    focusArchiveWindow(memoryId);
  }, [archiveWindows, focusArchiveWindow]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const dragging = dragStateRef.current;
      if (!dragging) return;
      const maxX = Math.max(20, window.innerWidth - 380);
      const maxY = Math.max(20, window.innerHeight - 260);
      const nextX = Math.max(12, Math.min(maxX, e.clientX - dragging.offsetX));
      const nextY = Math.max(12, Math.min(maxY, e.clientY - dragging.offsetY));
      setArchiveWindows((prev) =>
        prev.map((w) => (w.memoryId === dragging.memoryId ? { ...w, x: nextX, y: nextY } : w)),
      );
    };
    const stopDrag = () => {
      dragStateRef.current = null;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const dragging = bucketDragRef.current;
      if (!dragging) return;
      const maxX = Math.max(12, window.innerWidth - 340);
      const maxY = Math.max(12, window.innerHeight - 280);
      const nextX = Math.max(12, Math.min(maxX, e.clientX - dragging.offsetX));
      const nextY = Math.max(12, Math.min(maxY, e.clientY - dragging.offsetY));
      setBucketPos({ x: nextX, y: nextY });
    };
    const stopDrag = () => {
      bucketDragRef.current = null;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, []);

  const toggleWindowEdit = useCallback((memoryId: string, enabled: boolean) => {
    const source = htmlElementsData.find((s) => s.id === memoryId);
    if (!source) return;
    setArchiveWindows((prev) =>
      prev.map((w) =>
        w.memoryId === memoryId
          ? {
              ...w,
              isEditMode: enabled,
              draftTitle: enabled ? source.dbTitle : w.draftTitle,
              draftContent: enabled ? source.dbContent : w.draftContent,
              draftStatus: enabled ? source.status : w.draftStatus,
            }
          : w,
      ),
    );
  }, [htmlElementsData]);

  const updateWindowDraft = useCallback((memoryId: string, patch: Partial<Pick<ArchiveWindow, 'draftTitle' | 'draftContent' | 'draftStatus'>>) => {
    setArchiveWindows((prev) =>
      prev.map((w) => (w.memoryId === memoryId ? { ...w, ...patch } : w)),
    );
  }, []);

  const pushHeartBurst = useCallback((x: number, y: number) => {
    const burstId = `${Date.now()}-${Math.random()}`;
    setHeartBursts((prev) => [...prev, { id: burstId, x, y }]);
    window.setTimeout(() => {
      setHeartBursts((prev) => prev.filter((item) => item.id !== burstId));
    }, 720);
  }, []);

  const playSuccessBeep = useCallback(() => {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 1020;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.start(now);
    osc.stop(now + 0.17);
    void osc.addEventListener('ended', () => {
      void ctx.close();
    });
  }, []);

  const saveWindowMemory = useCallback(async (memoryId: string) => {
    const win = archiveWindows.find((w) => w.memoryId === memoryId);
    const base = memorySpots.find((s) => s.id === memoryId);
    if (!win || !base) return;

    setArchiveWindows((prev) => prev.map((w) => (w.memoryId === memoryId ? { ...w, isSaving: true } : w)));
    try {
      const nextTitle = win.draftTitle.trim() || base.name;
      const nextContent = win.draftContent.trim() || base.story;
      let dbId = spotDbIdMap[memoryId];
      let error: Error | null = null;

      if (!dbId) {
        const { data: existingByGeo, error: lookupError } = await supabase
          .from('memories')
          .select('id')
          .eq('lat', base.lat)
          .eq('lng', base.lng)
          .limit(1)
          .maybeSingle();
        if (lookupError) {
          throw new Error(lookupError.message);
        }
        if (existingByGeo?.id) {
          dbId = existingByGeo.id as string;
          setSpotDbIdMap((prev) => ({ ...prev, [memoryId]: dbId as string }));
        }
      }

      if (dbId) {
        const { error: updateError } = await supabase
          .from('memories')
          .update({
            title: nextTitle,
            content: nextContent,
            status: win.draftStatus,
          })
          .eq('id', dbId);
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('memories')
          .insert({
            title: nextTitle,
            content: nextContent,
            lat: base.lat,
            lng: base.lng,
            status: win.draftStatus,
          })
          .select('id')
          .single();
        error = insertError;
        if (!insertError && insertData?.id) {
          const insertedId = insertData.id as string;
          dbId = insertedId;
          setSpotDbIdMap((prev) => ({ ...prev, [memoryId]: insertedId }));
        }
      }
      if (error) throw new Error(error.message);
      await fetchMemories();
      setArchiveWindows((prev) =>
        prev.map((w) => (w.memoryId === memoryId ? { ...w, isEditMode: false } : w)),
      );
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setArchiveWindows((prev) => prev.map((w) => (w.memoryId === memoryId ? { ...w, isSaving: false } : w)));
    }
  }, [archiveWindows, fetchMemories, spotDbIdMap]);

  const deleteWindowMemory = useCallback(async (memoryId: string) => {
    const spot = htmlElementsData.find((s) => s.id === memoryId);
    if (!spot) return;
    let dbId = spot.linkedDbId;
    if (!dbId && spot.source === 'preset') {
      dbId = spotDbIdMap[memoryId];
    }
    if (!dbId) {
      closeArchiveWindow(memoryId);
      return;
    }
    const { error } = await supabase.from('memories').delete().eq('id', dbId);
    if (error) {
      setErrorText(error.message);
      return;
    }
    closeArchiveWindow(memoryId);
    await fetchMemories();
  }, [closeArchiveWindow, fetchMemories, htmlElementsData, spotDbIdMap]);

  const convertWishlistToVisited = useCallback(async (memoryId: string, x: number, y: number) => {
    const spot = htmlElementsData.find((s) => s.id === memoryId);
    if (!spot) return;
    let dbId = spot.linkedDbId;
    if (!dbId && spot.source === 'preset') {
      dbId = spotDbIdMap[memoryId];
    }
    if (!dbId) return;
    setArchiveWindows((prev) =>
      prev.map((w) => (w.memoryId === memoryId ? { ...w, isSaving: true } : w)),
    );
    try {
      const { error } = await supabase
        .from('memories')
        .update({ status: 'visited' })
        .eq('id', dbId);
      if (error) throw new Error(error.message);
      pushHeartBurst(x + 190, y + 58);
      playSuccessBeep();
      await fetchMemories();
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setArchiveWindows((prev) =>
        prev.map((w) => (w.memoryId === memoryId ? { ...w, isSaving: false } : w)),
      );
    }
  }, [fetchMemories, htmlElementsData, playSuccessBeep, pushHeartBurst, spotDbIdMap]);

  const resolveMemoryDbId = useCallback(async (spot: HtmlSpot): Promise<string | null> => {
    let dbId = spot.linkedDbId;
    if (!dbId && spot.source === 'preset') dbId = spotDbIdMap[spot.id];
    if (dbId) return dbId;

    const { data: existingByGeo, error: lookupError } = await supabase
      .from('memories')
      .select('id')
      .eq('lat', spot.lat)
      .eq('lng', spot.lng)
      .limit(1)
      .maybeSingle();

    if (lookupError) throw new Error(lookupError.message);

    if (existingByGeo?.id) {
      const existingId = existingByGeo.id as string;
      setSpotDbIdMap((prev) => ({ ...prev, [spot.id]: existingId }));
      return existingId;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('memories')
      .insert({
        title: spot.dbTitle,
        content: spot.dbContent,
        lat: spot.lat,
        lng: spot.lng,
        status: spot.status,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(insertError.message);

    const insertedId = inserted.id as string;
    setSpotDbIdMap((prev) => ({ ...prev, [spot.id]: insertedId }));
    await fetchMemories();
    return insertedId;
  }, [fetchMemories, spotDbIdMap]);

  const fetchMemoryLogs = useCallback(async (memorySpotId: string) => {
    const spot = htmlElementsData.find((s) => s.id === memorySpotId);
    if (!spot) return;
    try {
      setLogsLoadingByMemorySpotId((prev) => ({ ...prev, [memorySpotId]: true }));
      const dbId = await resolveMemoryDbId(spot);
      if (!dbId) return;
      const { data, error } = await supabase
        .from('memory_logs')
        .select('id, memory_id, author, log_date, content')
        .eq('memory_id', dbId)
        .order('log_date', { ascending: true });
      if (error) throw new Error(error.message);
      setLogsByMemorySpotId((prev) => ({ ...prev, [memorySpotId]: (data as MemoryLogRow[] | null) ?? [] }));
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLogsLoadingByMemorySpotId((prev) => ({ ...prev, [memorySpotId]: false }));
    }
  }, [htmlElementsData, resolveMemoryDbId]);

  useEffect(() => {
    archiveWindows.forEach((win) => {
      if (!(win.memoryId in logsByMemorySpotId)) {
        void fetchMemoryLogs(win.memoryId);
      }
    });
  }, [archiveWindows, fetchMemoryLogs, logsByMemorySpotId]);

  const handleAddMemoryLog = useCallback(async (memorySpotId: string) => {
    const spot = htmlElementsData.find((s) => s.id === memorySpotId);
    const draft = logDraftByMemorySpotId[memorySpotId];
    if (!spot || !draft) return;
    if (!currentAuthor) {
      setErrorText('请先登录后再添加日记。');
      return;
    }
    const content = draft.content.trim();
    if (!content) return;

    try {
      setLogDraftByMemorySpotId((prev) => ({
        ...prev,
        [memorySpotId]: { ...prev[memorySpotId], isSubmitting: true },
      }));
      const dbId = await resolveMemoryDbId(spot);
      if (!dbId) throw new Error('Memory location not found');
      const { error } = await supabase.from('memory_logs').insert({
        memory_id: dbId,
        author: currentAuthor,
        log_date: draft.logDate || new Date().toISOString().slice(0, 10),
        content,
      });
      if (error) throw new Error(error.message);
      await fetchMemoryLogs(memorySpotId);
      setLogDraftByMemorySpotId((prev) => ({
        ...prev,
        [memorySpotId]: {
          ...prev[memorySpotId],
          content: '',
          isSubmitting: false,
        },
      }));
    } catch (err) {
      setLogDraftByMemorySpotId((prev) => ({
        ...prev,
        [memorySpotId]: { ...prev[memorySpotId], isSubmitting: false },
      }));
      setErrorText(err instanceof Error ? err.message : 'Failed to add record');
    }
  }, [currentAuthor, fetchMemoryLogs, htmlElementsData, logDraftByMemorySpotId, resolveMemoryDbId]);

  const getPlayerKeyFromAuthor = useCallback((author?: string | null) => {
    const normalizedAuthor = author?.trim().toLowerCase();
    if (!normalizedAuthor) return 'unknown';
    return USER_COLOR_MAP[normalizedAuthor] ?? USER_COLOR_MAP[author?.trim() ?? ''] ?? 'unknown';
  }, []);

  const openCreateWindow = useCallback((lat: number, lng: number, x: number, y: number) => {
    setCreateWindow({
      isOpen: true,
      lat,
      lng,
      x: Math.max(16, Math.min(window.innerWidth - 360, x)),
      y: Math.max(16, Math.min(window.innerHeight - 260, y)),
      draftTitle: '',
      draftContent: '',
      isSaving: false,
    });
  }, []);

  const handleAddWishLocationClick = useCallback((coords: { lat?: number; lng?: number } | null, event?: MouseEvent) => {
    if (!isAddWishMode) return;
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
    const clickedLat = coords.lat;
    const clickedLng = coords.lng;
    if (continents.length > 0 && !isLandCoordinate(clickedLat, clickedLng, continents)) {
      setErrorText('Please pick a land location (大陆区域).');
      return;
    }
    const isNearExisting = htmlElementsData.some((spot) => (
      Math.abs(spot.lat - clickedLat) < 1.2 && Math.abs(spot.lng - clickedLng) < 1.2
    ));
    if (isNearExisting) {
      setErrorText('This area already has a memory/wishlist marker. Please pick an empty map area.');
      return;
    }
    const clickX = event?.clientX ?? window.innerWidth / 2;
    const clickY = event?.clientY ?? window.innerHeight / 2;
    openCreateWindow(clickedLat, clickedLng, clickX + 12, clickY + 12);
    setIsAddWishMode(false);
  }, [continents, htmlElementsData, isAddWishMode, openCreateWindow]);

  const saveCreateWindow = useCallback(async () => {
    const title = createWindow.draftTitle.trim();
    const content = createWindow.draftContent.trim();
    if (!title) {
      setErrorText('Please enter a destination name.');
      return;
    }
    setCreateWindow((prev) => ({ ...prev, isSaving: true }));
    try {
      const { error } = await supabase.from('memories').insert({
        title,
        content,
        lat: createWindow.lat,
        lng: createWindow.lng,
        status: 'wishlist',
      });
      if (error) throw new Error(error.message);
      setCreateWindow((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      await fetchMemories();
    } catch (err) {
      setCreateWindow((prev) => ({ ...prev, isSaving: false }));
      setErrorText(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [createWindow.draftContent, createWindow.draftTitle, createWindow.lat, createWindow.lng, fetchMemories]);

  const toggleTodoCompleted = useCallback(async (todo: TodoRow) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', todo.id);
    if (error) {
      setErrorText(error.message);
      return;
    }
    setTodos((prev) =>
      prev.map((item) =>
        item.id === todo.id ? { ...item, is_completed: !item.is_completed } : item,
      ),
    );
  }, []);

  const createTodo = useCallback(async () => {
    const content = todoDraft.trim();
    if (!content) return;
    const { error } = await supabase
      .from('todos')
      .insert({ content, is_completed: false });
    if (error) {
      setErrorText(error.message);
      return;
    }
    setTodoDraft('');
    await fetchTodos();
  }, [fetchTodos, todoDraft]);

  const deleteTodo = useCallback(async (todoId: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId);
    if (error) {
      setErrorText(error.message);
      return;
    }
    setTodos((prev) => prev.filter((item) => item.id !== todoId));
  }, []);

  const startDraggingBucket = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    bucketDragRef.current = {
      offsetX: e.clientX - bucketPos.x,
      offsetY: e.clientY - bucketPos.y,
    };
  }, [bucketPos.x, bucketPos.y]);

  useEffect(() => {
    const animateParticles = () => {
      const g = particleGroupRef.current;
      if (g) {
        g.rotation.y += 0.00032;
        g.rotation.x += 0.00009;
        g.children.forEach((child) => {
          if (!(child instanceof THREE.Points)) return;
          const mat = child.material;
          if (!(mat instanceof THREE.PointsMaterial)) return;
          const t = performance.now() * 0.001;
          const pulseOffset = Number(child.userData.pulseOffset ?? 0);
          const baseOpacity = Number(child.userData.baseOpacity ?? 0.5);
          const driftSpeed = Number(child.userData.driftSpeed ?? 0.0002);
          mat.opacity = baseOpacity + Math.sin(t * 0.8 + pulseOffset) * 0.08;
          child.rotation.y += driftSpeed;
        });
      }
      animFrameRef.current = requestAnimationFrame(animateParticles);
    };
    animFrameRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'transparent',
        boxShadow: `inset 0 0 60px ${ambientColor}14`,
        cursor: isAddWishMode && isHoveringLand && !isHoveringMarker ? 'crosshair' : 'default',
      }}
    >
      <style>{`
        @keyframes wishlist-breath {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.95; }
        }
        @keyframes heart-burst {
          0% { opacity: 0; transform: translate3d(0,0,0) scale(0.25); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(var(--dx), var(--dy), 0) scale(1.3); }
        }
      `}</style>
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={null}
          bumpImageUrl={null}
          showGlobe
          showGraticules
          showAtmosphere
          atmosphereColor="rgba(255, 200, 246, 0.38)"
          atmosphereAltitude={0.2}
          globeMaterial={globeMaterial}
          globeCurvatureResolution={100}
          onGlobeReady={() => {
            const g = globeRef.current;
            if (!g) return;
            g.pointOfView({ lat: 24, lng: 116, altitude: 2.95 }, 2000);
            const ctrl = g.controls();
            ctrl.enableDamping = true;
            ctrl.dampingFactor = 0.22;
            ctrl.rotateSpeed = 0.18;
            ctrl.zoomSpeed = 0.24;
            if (globeLightsAdded.current) return;
            globeLightsAdded.current = true;
            const scene = g.scene();
            scene.add(new THREE.AmbientLight(0xd8bfd8, 0.34));
            const cyanKey = new THREE.DirectionalLight(0x87ceeb, 1.1);
            cyanKey.position.set(80, 35, 110);
            scene.add(cyanKey);
            const pinkRim = new THREE.PointLight(0xffb6c1, 1.05, 420, 1.5);
            pinkRim.position.set(-120, -42, -88);
            scene.add(pinkRim);

            const radius = g.getGlobeRadius();
            const particleGroup = new THREE.Group();
            particleGroup.add(createParticleLayer(300, 3.2, '#fbe3ff', textures.star, radius * 1.3, radius * 1.9));
            particleGroup.add(createParticleLayer(210, 6, '#ffcde9', textures.flare, radius * 1.38, radius * 2.05));
            particleGroup.add(createParticleLayer(160, 4.8, '#c9f3ff', textures.bubble, radius * 1.22, radius * 1.78));
            particleGroupRef.current = particleGroup;
            scene.add(particleGroup);
          }}
          polygonsData={continents}
          polygonAltitude={0.008}
          polygonCapColor={() => 'rgba(235, 245, 255, 0.34)'}
          polygonSideColor={() => 'rgba(255, 255, 255, 0.03)'}
          polygonStrokeColor={() => 'rgba(230, 248, 255, 0.5)'}
          polygonsTransitionDuration={1200}
          htmlElementsData={htmlElementsData}
          htmlLat={(d: object) => (d as HtmlSpot).lat}
          htmlLng={(d: object) => (d as HtmlSpot).lng}
          htmlAltitude={0.03}
          htmlElement={(d: object) => {
            const spot = d as HtmlSpot;
            const wrap = document.createElement('div');
            wrap.innerHTML = spot.status === 'wishlist'
              ? markerWishlistHtml(spot.dbTitle, spot.floatPhase)
              : markerInnerHtml(
                  spot.dbTitle,
                  spot.color,
                  spot.floatPhase,
                );
            const root = wrap.querySelector('.y2k-marker-root') as HTMLElement | null;
            const el = root ?? wrap;
            el.style.pointerEvents = 'auto';
            el.addEventListener('mouseenter', () => {
              if (isAddWishMode) setIsHoveringMarker(true);
            });
            el.addEventListener('mouseleave', () => {
              setIsHoveringMarker(false);
            });
            el.addEventListener('click', (ev) => {
              ev.stopPropagation();
              if (isAddWishMode) {
                setErrorText('Please click an empty map area (without existing visited/wishlist markers).');
                return;
              }
              openArchiveWindow(spot);
              setAmbientColor(spot.color);
            });
            return el;
          }}
          htmlTransitionDuration={750}
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) => {
            void (d as ArcRow);
            return ['rgba(234, 212, 252, 0.46)', 'rgba(189, 226, 248, 0.44)'];
          }}
          arcAltitude={0.31}
          arcStroke={0.22}
          arcDashLength={0.08}
          arcDashGap={2.35}
          arcDashInitialGap={(d: object) => (d as ArcRow).dashPhase}
          arcDashAnimateTime={17000}
          arcsTransitionDuration={1400}
          arcCircularResolution={72}
          arcCurveResolution={72}
          pointsData={combinedPoints}
          pointLat={(d: object) => (d as GlobePoint).lat}
          pointLng={(d: object) => (d as GlobePoint).lng}
          pointColor={(d: object) => (d as GlobePoint).color}
          pointAltitude={(d: object) => (d as GlobePoint).altitude}
          pointRadius={(d: object) => (d as GlobePoint).radius ?? 0.23}
          pointsMerge
          pointsTransitionDuration={0}
          onGlobeClick={(coords, event) => {
            handleAddWishLocationClick(coords as { lat?: number; lng?: number }, event as MouseEvent);
          }}
          onPolygonClick={(_, event, coords) => {
            handleAddWishLocationClick(coords as { lat?: number; lng?: number }, event as MouseEvent);
          }}
          onPolygonHover={(polygon) => {
            setIsHoveringLand(!!polygon);
          }}
        />
      </div>

      <button
        onClick={() => setIsAddWishMode((prev) => !prev)}
        className="fixed right-4 bottom-4 z-[180] h-8 px-3 text-[14px] tracking-wide"
        style={{
          fontFamily: 'VT323, monospace',
          color: isAddWishMode ? '#ffffff' : '#2f4661',
          background: isAddWishMode ? 'linear-gradient(90deg, #6f93c2 0%, #89b2db 100%)' : '#d8dee8',
          borderTop: '2px solid #ffffff',
          borderLeft: '2px solid #ffffff',
          borderRight: '2px solid #7d8da1',
          borderBottom: '2px solid #7d8da1',
          boxShadow: '1px 1px 0 0 #000000',
        }}
        title="Click and then pick a location on globe"
      >
        {isAddWishMode ? 'adding... click globe blank area' : 'add wish-location'}
      </button>

      {isAddWishMode && (
        <div
          className="fixed right-4 bottom-14 z-[180] px-2 py-1 text-[13px]"
          style={{
            fontFamily: 'VT323, monospace',
            color: '#2d4964',
            background: '#e5eff8',
            borderTop: '1px solid #ffffff',
            borderLeft: '1px solid #ffffff',
            borderRight: '1px solid #7f8e9f',
            borderBottom: '1px solid #7f8e9f',
            boxShadow: '1px 1px 0 rgba(0,0,0,0.22)',
          }}
        >
          Select mode ON: click globe to drop wishlist
        </div>
      )}

      {bucketWindowVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed w-[320px] z-[170]"
          style={{ left: bucketPos.x, top: bucketPos.y }}
        >
          <div
            className="p-[2px]"
            style={{
              background: '#d5dbe3',
              borderTop: '1px solid #ffffff',
              borderLeft: '1px solid #ffffff',
              borderRight: '1px solid #7a8998',
              borderBottom: '1px solid #7a8998',
              boxShadow: 'inset 1px 1px #f8fbff, inset -1px -1px #8a9cae, 2px 2px 0 rgba(24,34,48,0.38)',
            }}
          >
            <div
              className="h-7 px-2 flex items-center justify-between cursor-move select-none"
              style={{ background: 'linear-gradient(90deg, #5f7696 0%, #7f9cbd 52%, #adc2d8 100%)' }}
              onMouseDown={startDraggingBucket}
            >
              <span className="text-white text-[14px] tracking-wide" style={{ fontFamily: 'VT323, monospace' }}>
                BucketList.exe
              </span>
              <button
                onClick={() => setBucketWindowVisible(false)}
                className="w-5 h-5 text-[11px] leading-none text-[#2c435d] font-bold flex items-center justify-center shrink-0"
                style={{
                  background: '#dce8f2',
                  borderTop: '1px solid #ffffff',
                  borderLeft: '1px solid #ffffff',
                  borderRight: '1px solid #7f8e9f',
                  borderBottom: '1px solid #7f8e9f',
                }}
              >
                X
              </button>
            </div>

            <div className="px-3 py-2 space-y-2" style={{ background: '#E8ECEF' }}>
              <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2 text-[16px]" style={{ fontFamily: 'VT323, monospace' }}>
                    <button
                      onClick={() => void toggleTodoCompleted(todo)}
                      className="w-7 shrink-0 text-left"
                      style={{ color: '#3f5368', imageRendering: 'pixelated' }}
                    >
                      {todo.is_completed ? '[x]' : '[ ]'}
                    </button>
                    <span
                      className="flex-1 pr-1"
                      style={{
                        color: todo.is_completed ? '#7e8fa2' : '#31455c',
                        textDecoration: todo.is_completed ? 'line-through' : 'none',
                        imageRendering: 'pixelated',
                        WebkitFontSmoothing: 'none',
                      }}
                    >
                      {todo.content}
                    </span>
                    <button
                      onClick={() => void deleteTodo(todo.id)}
                      className="h-5 px-1 text-[12px] leading-none shrink-0"
                      style={{
                        color: '#39506a',
                        background: '#dbe3ea',
                        borderTop: '1px solid #ffffff',
                        borderLeft: '1px solid #ffffff',
                        borderRight: '1px solid #7f8e9f',
                        borderBottom: '1px solid #7f8e9f',
                        boxShadow: '1px 1px 0 rgba(0,0,0,0.25)',
                      }}
                      title="Delete todo"
                    >
                      DEL
                    </button>
                  </div>
                ))}
              </div>
              <input
                value={todoDraft}
                onChange={(e) => setTodoDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void createTodo();
                  }
                }}
                placeholder="Add TODO..."
                className="w-full px-2 py-1 text-[16px] outline-none"
                style={{
                  fontFamily: 'VT323, monospace',
                  color: '#31455c',
                  background: '#f4f8fb',
                  boxShadow: 'inset 1px 1px #8A9CAE, inset -1px -1px #FFF',
                  border: '1px solid #8a9cae',
                }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setBucketWindowVisible(true)}
          className="fixed right-4 top-4 z-[165] px-3 py-1 text-[14px]"
          style={{
            fontFamily: 'VT323, monospace',
            color: '#2f4661',
            background: '#d8dee8',
            borderTop: '2px solid #ffffff',
            borderLeft: '2px solid #ffffff',
            borderRight: '2px solid #7d8da1',
            borderBottom: '2px solid #7d8da1',
            boxShadow: '1px 1px 0 0 #000000',
          }}
        >
          BucketList.exe
        </button>
      )}

      <AnimatePresence>
        {archiveWindows
          .slice()
          .sort((a, b) => a.z - b.z)
          .map((win) => {
            const spot = htmlElementsData.find((s) => s.id === win.memoryId);
            if (!spot) return null;
            return (
              <motion.div
                key={win.memoryId}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="fixed w-[380px]"
                style={{ left: win.x, top: win.y, zIndex: win.z }}
                onMouseDown={() => focusArchiveWindow(win.memoryId)}
              >
                <div
                  className="p-[2px]"
                  style={{
                    background: '#cfd8e7',
                    borderTop: '1px solid #f4f8ff',
                    borderLeft: '1px solid #f4f8ff',
                    borderRight: '1px solid #7f8e9f',
                    borderBottom: '1px solid #7f8e9f',
                    boxShadow: 'inset 1px 1px #ffffff, inset -1px -1px #8e9bad, 2px 2px 0 rgba(48,58,72,0.35)',
                  }}
                >
                  <div
                    className="h-7 px-2 flex items-center justify-between cursor-move select-none"
                    style={{ background: 'linear-gradient(90deg, #6d8eb7 0%, #9ebbd8 58%, #c5dcef 100%)' }}
                    onMouseDown={(e) => startDraggingWindow(e, win.memoryId)}
                  >
                    <span className="text-white text-[12px] font-bold tracking-wide truncate pr-2" style={{ fontFamily: 'VT323, monospace' }}>
                      
                    </span>
                    <button
                      onClick={() => closeArchiveWindow(win.memoryId)}
                      className="w-5 h-5 text-[11px] leading-none text-[#2c435d] font-bold flex items-center justify-center shrink-0"
                      style={{
                        background: '#dce8f2',
                        borderTop: '1px solid #ffffff',
                        borderLeft: '1px solid #ffffff',
                        borderRight: '1px solid #7f8e9f',
                        borderBottom: '1px solid #7f8e9f',
                      }}
                    >
                      X
                    </button>
                  </div>
                  <div className="p-3 space-y-2" style={{ background: '#edf3f8', color: '#2b3f57' }}>
                    <div
                      className="inline-flex px-2 py-[2px] text-[12px] tracking-wide"
                      style={{
                        fontFamily: 'VT323, monospace',
                        color: '#28425d',
                        background: '#dbe7f1',
                        borderTop: '1px solid #ffffff',
                        borderLeft: '1px solid #ffffff',
                        borderRight: '1px solid #7f8e9f',
                        borderBottom: '1px solid #7f8e9f',
                      }}
                    >
                      {spot.status === 'wishlist' ? '[ Status: Wishlist ]' : '[ Status: Memory ]'}
                    </div>
                    <div className="text-[13px]" style={{ fontFamily: 'VT323, monospace' }}>
                      Date: {spot.dbDate}
                    </div>

                    {!win.isEditMode && (
                      <>
                        <div className="text-[18px] leading-none" style={{ fontFamily: 'VT323, monospace' }}>
                          {spot.dbTitle}
                        </div>
                        <div
                          className="win98-scrollbox h-[210px] overflow-y-auto p-2 space-y-2"
                          style={{
                            background: '#f7fbff',
                            borderTop: '1px solid #8A9CAE',
                            borderLeft: '1px solid #8A9CAE',
                            borderRight: '1px solid #FFF',
                            borderBottom: '1px solid #FFF',
                          }}
                        >
                          {logsLoadingByMemorySpotId[win.memoryId] && (
                            <div className="text-[15px]" style={{ fontFamily: 'VT323, monospace', color: '#3e5772' }}>
                              Loading timeline...
                            </div>
                          )}
                          {!logsLoadingByMemorySpotId[win.memoryId] && ((logsByMemorySpotId[win.memoryId] ?? []).length === 0) && (
                            <div className="text-[15px]" style={{ fontFamily: 'VT323, monospace', color: '#4d6580' }}>
                              暂无日记，快来写下第一条回忆吧 ~
                            </div>
                          )}
                          {(logsByMemorySpotId[win.memoryId] ?? []).map((log) => {
                            const playerKey = getPlayerKeyFromAuthor(log.author);
                            const theme = PLAYER_THEME[playerKey];
                            return (
                              <div
                                key={log.id}
                                className="px-2 py-[6px]"
                                style={{
                                  background: '#eef5fb',
                                  borderTop: '1px solid #ffffff',
                                  borderLeft: '1px solid #ffffff',
                                  borderRight: '1px solid #9caebe',
                                  borderBottom: '1px solid #9caebe',
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[13px]" style={{ fontFamily: 'VT323, monospace', color: '#37506a' }}>
                                    {toInputDate(log.log_date)}
                                  </span>
                                  <span
                                    className="px-[6px] py-[1px] text-[12px] inline-flex"
                                    style={{
                                      fontFamily: 'VT323, monospace',
                                      imageRendering: 'pixelated',
                                      background: theme.bg,
                                      color: theme.text,
                                      textShadow: '0 1px 0 rgba(255,255,255,0.72)',
                                      boxShadow: `${theme.glow}, inset 1px 1px rgba(255,255,255,0.82), inset -1px -1px rgba(128,145,162,0.42)`,
                                      borderTop: '1px solid #ffffff',
                                      borderLeft: '1px solid #ffffff',
                                      borderRight: '1px solid #7f92a6',
                                      borderBottom: '1px solid #7f92a6',
                                    }}
                                  >
                                    [ {theme.label} ]
                                  </span>
                                </div>
                                <div className="text-[16px] leading-[1.2]" style={{ fontFamily: 'VT323, monospace', color: '#304863' }}>
                                  {log.content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div
                          className="mt-2 p-2 space-y-2"
                          style={{
                            background: '#eaf1f8',
                            borderTop: '1px solid #ffffff',
                            borderLeft: '1px solid #ffffff',
                            borderRight: '1px solid #8b9caf',
                            borderBottom: '1px solid #8b9caf',
                          }}
                        >
                          <input
                            type="date"
                            value={logDraftByMemorySpotId[win.memoryId]?.logDate ?? new Date().toISOString().slice(0, 10)}
                            onChange={(e) => {
                              const next = e.target.value;
                              setLogDraftByMemorySpotId((prev) => ({
                                ...prev,
                                [win.memoryId]: {
                                  logDate: next,
                                  content: prev[win.memoryId]?.content ?? '',
                                  isSubmitting: prev[win.memoryId]?.isSubmitting ?? false,
                                },
                              }));
                            }}
                            className="w-full px-2 py-1 text-[15px] outline-none"
                            style={{
                              fontFamily: 'VT323, monospace',
                              background: '#ffffff',
                              color: '#2f4a66',
                              boxShadow: 'inset 1px 1px #8A9CAE, inset -1px -1px #FFF',
                            }}
                            disabled={logDraftByMemorySpotId[win.memoryId]?.isSubmitting}
                          />
                          <textarea
                            value={logDraftByMemorySpotId[win.memoryId]?.content ?? ''}
                            onChange={(e) => {
                              const next = e.target.value;
                              setLogDraftByMemorySpotId((prev) => ({
                                ...prev,
                                [win.memoryId]: {
                                  logDate: prev[win.memoryId]?.logDate ?? new Date().toISOString().slice(0, 10),
                                  content: next,
                                  isSubmitting: prev[win.memoryId]?.isSubmitting ?? false,
                                },
                              }));
                            }}
                            className="win98-scrollbox w-full h-24 px-2 py-1 text-[16px] leading-[1.2] outline-none resize-none"
                            style={{
                              fontFamily: 'VT323, monospace',
                              background: '#ffffff',
                              color: '#304863',
                              boxShadow: 'inset 1px 1px #8A9CAE, inset -1px -1px #FFF',
                            }}
                            disabled={logDraftByMemorySpotId[win.memoryId]?.isSubmitting}
                            placeholder="Write today's memory..."
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => void handleAddMemoryLog(win.memoryId)}
                              className="h-7 px-3 text-xs font-bold"
                              style={{
                                fontFamily: 'VT323, monospace',
                                backgroundColor: '#d8dee8',
                                borderTop: '2px solid #ffffff',
                                borderLeft: '2px solid #ffffff',
                                borderRight: '2px solid #7d8da1',
                                borderBottom: '2px solid #7d8da1',
                                boxShadow: '1px 1px 0 0 #000000',
                              }}
                              disabled={!currentAuthor || logDraftByMemorySpotId[win.memoryId]?.isSubmitting}
                            >
                              {logDraftByMemorySpotId[win.memoryId]?.isSubmitting ? 'Adding...' : 'Add Record'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {win.isEditMode && (
                      <>
                        <input
                          type="text"
                          value={win.draftTitle}
                          onChange={(e) => updateWindowDraft(win.memoryId, { draftTitle: e.target.value })}
                          className="win98-inset-input w-full px-2 py-1 text-[16px] outline-none"
                          style={{ fontFamily: 'VT323, monospace' }}
                          disabled={win.isSaving}
                        />
                        <textarea
                          value={win.draftContent}
                          onChange={(e) => updateWindowDraft(win.memoryId, { draftContent: e.target.value })}
                          className="win98-inset-input win98-scrollbox w-full h-36 px-2 py-1 text-[16px] outline-none resize-none"
                          style={{ fontFamily: 'VT323, monospace' }}
                          disabled={win.isSaving}
                        />
                        <div className="pt-1">
                          <div
                            className="text-[13px] mb-1"
                            style={{ fontFamily: 'VT323, monospace', color: '#445a74' }}
                          >
                            Marker Type
                          </div>
                          <div className="flex gap-4 text-[15px]" style={{ fontFamily: 'VT323, monospace', color: '#344a62' }}>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`memory-status-${win.memoryId}`}
                                checked={win.draftStatus === 'visited'}
                                onChange={() => updateWindowDraft(win.memoryId, { draftStatus: 'visited' })}
                                disabled={win.isSaving}
                                style={{
                                  accentColor: '#5f8bc6',
                                  boxShadow: 'inset 1px 1px #8A9CAE, inset -1px -1px #FFF',
                                }}
                              />
                              回忆 (visited)
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`memory-status-${win.memoryId}`}
                                checked={win.draftStatus === 'wishlist'}
                                onChange={() => updateWindowDraft(win.memoryId, { draftStatus: 'wishlist' })}
                                disabled={win.isSaving}
                                style={{
                                  accentColor: '#7dbfe0',
                                  boxShadow: 'inset 1px 1px #8A9CAE, inset -1px -1px #FFF',
                                }}
                              />
                              心愿 (wishlist)
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      {win.isEditMode ? (
                        <>
                          <button
                            onClick={() => toggleWindowEdit(win.memoryId, false)}
                            className="w-20 h-7 text-xs"
                            style={{
                              fontFamily: 'VT323, monospace',
                              backgroundColor: '#d8dee8',
                              borderTop: '2px solid #ffffff',
                              borderLeft: '2px solid #ffffff',
                              borderRight: '2px solid #7d8da1',
                              borderBottom: '2px solid #7d8da1',
                              boxShadow: '1px 1px 0 0 #000000',
                            }}
                            disabled={win.isSaving}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => void saveWindowMemory(win.memoryId)}
                            className="w-20 h-7 text-xs font-bold"
                            style={{
                              fontFamily: 'VT323, monospace',
                              backgroundColor: '#d8dee8',
                              borderTop: '2px solid #ffffff',
                              borderLeft: '2px solid #ffffff',
                              borderRight: '2px solid #7d8da1',
                              borderBottom: '2px solid #7d8da1',
                              boxShadow: '1px 1px 0 0 #000000',
                            }}
                            disabled={win.isSaving}
                          >
                            {win.isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </>
                      ) : (
                        <>
                          {spot.status === 'wishlist' && (
                            <button
                              onClick={() => void convertWishlistToVisited(win.memoryId, win.x, win.y)}
                              className="h-7 px-2 text-xs font-bold"
                              style={{
                                fontFamily: 'VT323, monospace',
                                backgroundColor: '#d8e6f7',
                                borderTop: '2px solid #ffffff',
                                borderLeft: '2px solid #ffffff',
                                borderRight: '2px solid #7d8da1',
                                borderBottom: '2px solid #7d8da1',
                                boxShadow: '1px 1px 0 0 #000000',
                                color: '#2c4964',
                              }}
                              disabled={win.isSaving}
                            >
                              {win.isSaving ? 'Syncing...' : 'We are here! (打卡完成)'}
                            </button>
                          )}
                          <button
                            onClick={() => toggleWindowEdit(win.memoryId, true)}
                            className="w-20 h-7 text-xs"
                            style={{
                              fontFamily: 'VT323, monospace',
                              backgroundColor: '#d8dee8',
                              borderTop: '2px solid #ffffff',
                              borderLeft: '2px solid #ffffff',
                              borderRight: '2px solid #7d8da1',
                              borderBottom: '2px solid #7d8da1',
                              boxShadow: '1px 1px 0 0 #000000',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void deleteWindowMemory(win.memoryId)}
                            className="w-20 h-7 text-xs"
                            style={{
                              fontFamily: 'VT323, monospace',
                              backgroundColor: '#d8dee8',
                              borderTop: '2px solid #ffffff',
                              borderLeft: '2px solid #ffffff',
                              borderRight: '2px solid #7d8da1',
                              borderBottom: '2px solid #7d8da1',
                              boxShadow: '1px 1px 0 0 #000000',
                            }}
                            disabled={win.isSaving}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      <AnimatePresence>
        {createWindow.isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="fixed w-[348px] z-[185]"
            style={{ left: createWindow.x, top: createWindow.y }}
          >
            <div
              className="p-[2px]"
              style={{
                background: '#cfd8e7',
                borderTop: '1px solid #f4f8ff',
                borderLeft: '1px solid #f4f8ff',
                borderRight: '1px solid #7f8e9f',
                borderBottom: '1px solid #7f8e9f',
                boxShadow: 'inset 1px 1px #ffffff, inset -1px -1px #8e9bad, 2px 2px 0 rgba(48,58,72,0.35)',
              }}
            >
              <div
                className="h-7 px-2 flex items-center justify-between select-none"
                style={{ background: 'linear-gradient(90deg, #6d8eb7 0%, #9ebbd8 58%, #c5dcef 100%)' }}
              >
                <span className="text-white text-[12px] font-bold tracking-wide" style={{ fontFamily: 'VT323, monospace' }}>
                  新增目的地
                </span>
                <button
                  onClick={() => setCreateWindow((prev) => ({ ...prev, isOpen: false }))}
                  className="w-5 h-5 text-[11px] leading-none text-[#2c435d] font-bold flex items-center justify-center shrink-0"
                  style={{
                    background: '#dce8f2',
                    borderTop: '1px solid #ffffff',
                    borderLeft: '1px solid #ffffff',
                    borderRight: '1px solid #7f8e9f',
                    borderBottom: '1px solid #7f8e9f',
                  }}
                >
                  X
                </button>
              </div>
              <div className="p-3 space-y-2" style={{ background: '#edf3f8', color: '#2b3f57' }}>
                <div
                  className="inline-flex px-2 py-[2px] text-[12px] tracking-wide"
                  style={{
                    fontFamily: 'VT323, monospace',
                    color: '#2f5a7e',
                    background: '#e0f2fd',
                    borderTop: '1px solid #ffffff',
                    borderLeft: '1px solid #ffffff',
                    borderRight: '1px solid #7f8e9f',
                    borderBottom: '1px solid #7f8e9f',
                  }}
                >
                  [ Status: Wishlist ]
                </div>
                <div className="text-[13px]" style={{ fontFamily: 'VT323, monospace' }}>
                  Lat: {createWindow.lat.toFixed(4)} / Lng: {createWindow.lng.toFixed(4)}
                </div>
                <input
                  type="text"
                  value={createWindow.draftTitle}
                  onChange={(e) => setCreateWindow((prev) => ({ ...prev, draftTitle: e.target.value }))}
                  placeholder="地点名称..."
                  className="win98-inset-input w-full px-2 py-1 text-[16px] outline-none"
                  style={{ fontFamily: 'VT323, monospace' }}
                  disabled={createWindow.isSaving}
                />
                <textarea
                  value={createWindow.draftContent}
                  onChange={(e) => setCreateWindow((prev) => ({ ...prev, draftContent: e.target.value }))}
                  placeholder="想去的原因..."
                  className="win98-inset-input win98-scrollbox w-full h-28 px-2 py-1 text-[16px] outline-none resize-none"
                  style={{ fontFamily: 'VT323, monospace' }}
                  disabled={createWindow.isSaving}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setCreateWindow((prev) => ({ ...prev, isOpen: false }))}
                    className="w-20 h-7 text-xs"
                    style={{
                      fontFamily: 'VT323, monospace',
                      backgroundColor: '#d8dee8',
                      borderTop: '2px solid #ffffff',
                      borderLeft: '2px solid #ffffff',
                      borderRight: '2px solid #7d8da1',
                      borderBottom: '2px solid #7d8da1',
                      boxShadow: '1px 1px 0 0 #000000',
                    }}
                    disabled={createWindow.isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void saveCreateWindow()}
                    className="w-20 h-7 text-xs font-bold"
                    style={{
                      fontFamily: 'VT323, monospace',
                      backgroundColor: '#d8e6f7',
                      borderTop: '2px solid #ffffff',
                      borderLeft: '2px solid #ffffff',
                      borderRight: '2px solid #7d8da1',
                      borderBottom: '2px solid #7d8da1',
                      boxShadow: '1px 1px 0 0 #000000',
                      color: '#2c4964',
                    }}
                    disabled={createWindow.isSaving}
                  >
                    {createWindow.isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {heartBursts.map((burst) => (
        <div
          key={burst.id}
          className="fixed pointer-events-none z-[190]"
          style={{ left: burst.x, top: burst.y }}
        >
          {[
            { dx: '-24px', dy: '-18px' },
            { dx: '-8px', dy: '-30px' },
            { dx: '14px', dy: '-28px' },
            { dx: '28px', dy: '-14px' },
            { dx: '6px', dy: '-8px' },
          ].map((offset, idx) => (
            <span
              key={`${burst.id}-${idx}`}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: idx % 2 === 0 ? '#ff8fbe' : '#ffd0e8',
                fontFamily: 'VT323, monospace',
                fontSize: '18px',
                textShadow: '0 0 6px rgba(255,166,210,0.6)',
                transform: 'translate3d(0,0,0)',
                animation: 'heart-burst 0.72s ease-out forwards',
                ['--dx' as string]: offset.dx,
                ['--dy' as string]: offset.dy,
              }}
            >
              ♥
            </span>
          ))}
        </div>
      ))}

      <Win98Modal
        title="Error.exe"
        isOpen={!!errorText}
        onClose={() => setErrorText(null)}
      >
        <div className="space-y-3">
          <p className="text-[16px]" style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', WebkitFontSmoothing: 'none' }}>
            Failed to save memory.
          </p>
          <div
            className="win98-inset-input p-2 text-[14px]"
            style={{ fontFamily: 'VT323, monospace', imageRendering: 'pixelated', WebkitFontSmoothing: 'none' }}
          >
            {errorText}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setErrorText(null)}
              className="w-20 h-7 text-xs"
              style={{
                fontFamily: 'VT323, monospace',
                backgroundColor: '#d8dee8',
                borderTop: '2px solid #ffffff',
                borderLeft: '2px solid #ffffff',
                borderRight: '2px solid #7d8da1',
                borderBottom: '2px solid #7d8da1',
                boxShadow: '1px 1px 0 0 #000000',
              }}
            >
              OK
            </button>
          </div>
        </div>
      </Win98Modal>
    </div>
  );
};
