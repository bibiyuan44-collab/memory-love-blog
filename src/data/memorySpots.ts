/** Y2K 地球图钉样式（HTML 标记层） */
export type MemoryMarkerStyle = 'star' | 'orb' | 'smile';

export interface MemorySpot {
  id: string;
  name: string;
  /** WGS84 纬度 */
  lat: number;
  /** WGS84 经度 */
  lng: number;
  date: string;
  story: string;
  photos: string[];
  emoji: string;
  /** 主题色（霓虹强调，用于弧光与标记描边） */
  color: string;
  markerStyle: MemoryMarkerStyle;
}

/** 经纬度在真实城市基础上做了适度「展布」，避免东亚点挤成一团，仍保持相对方位 */
export const memorySpots: MemorySpot[] = [
  {
    id: 'hangzhou',
    name: '杭州',
    lat: 31.12,
    lng: 119.42,
    date: '2025.11.19',
    story: '暂无',
    photos: ['/placeholder-hz.jpg'],
    emoji: '🌊',
    color: '#ff1493',
    markerStyle: 'star',
  },
  {
    id: 'lanzhou',
    name: '兰州',
    lat: 36.0611,
    lng: 103.8343,
    date: '2026.03.25',
    story: '暂无',
    photos: ['/placeholder-lz.jpg'],
    emoji: '🌉',
    color: '#00ffff',
    markerStyle: 'orb',
  },
  {
    id: 'huzhou',
    name: '湖州 ',
    lat: 29.28,
    lng: 121.38,
    date: '2026.01.15',
    story: '暂无',
    photos: ['/placeholder-huz.jpg'],
    emoji: '🌙',
    color: '#bf00ff',
    markerStyle: 'smile',
  },
  {
    id: 'tokyo',
    name: '东京 ',
    lat: 37.05,
    lng: 141.52,
    date: '2025.11.17',
    story: '暂无',
    photos: ['/placeholder-tk.jpg'],
    emoji: '🗼',
    color: '#39ff14',
    markerStyle: 'star',
  },
  {
    id: 'osaka',
    name: '大阪 ',
    lat: 32.72,
    lng: 132.85,
    date: '不详',
    story: '希望下次可以一起逛kk',
    photos: ['/placeholder-os.jpg'],
    emoji: '🏯',
    color: '#ff69b4',
    markerStyle: 'orb',
  },
];
