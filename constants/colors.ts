// Palette 1:1 con le CSS custom properties del riferimento CORRIO (index.html :root)
export const colors = {
  bg: '#f1f0f3',
  card: '#ffffff',
  brand: '#E31C4D',
  brandLight: '#fbe1e8',
  brandInk: '#7a0e28',
  accent2: '#1f8a82',
  accent2Bg: '#cfeeeb',
  pos: '#2563eb',
  posBg: '#dbeafe',
  cash: '#16a34a',
  cashBg: '#dcfce7',
  paid: '#6b7280',
  paidBg: '#e5e7eb',
  danger: '#dc2626',
  dangerBg: '#fdeaea',
  noticeBg: '#eaf4ff',
  noticeInk: '#1d4ed8',
  ink: '#1f2933',
  muted: '#6b7280',
  border: '#e6e5ea',
  white: '#ffffff',
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 20,
  card: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

// Ombra morbida di .card / .order-card nel riferimento CORRIO (0 2px 10px rgba(15,23,42,.05)).
export const cardShadow = {
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
} as const;
