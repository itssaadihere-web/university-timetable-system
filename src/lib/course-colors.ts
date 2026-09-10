export interface CourseColorPalette {
  id: string;
  name: string;
  cardBg: string;
  cardBorder: string;
  leftBorder: string;
  badgeBg: string;
  titleText: string;
  accentText: string;
  pillBg: string;
  subtleBorder: string;
  shadowHover: string;
}

export const COURSE_COLOR_PALETTES: CourseColorPalette[] = [
  {
    id: 'indigo',
    name: 'Indigo',
    cardBg: 'bg-indigo-100/95',
    cardBorder: 'border-indigo-300 hover:border-indigo-500',
    leftBorder: 'border-l-indigo-600',
    badgeBg: 'bg-indigo-200/90 text-indigo-950 border border-indigo-400',
    titleText: 'text-indigo-950',
    accentText: 'text-indigo-800',
    pillBg: 'bg-white/90 text-indigo-950 border border-indigo-200',
    subtleBorder: 'border-indigo-200',
    shadowHover: 'hover:shadow-indigo-200/80',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    cardBg: 'bg-emerald-100/95',
    cardBorder: 'border-emerald-300 hover:border-emerald-500',
    leftBorder: 'border-l-emerald-600',
    badgeBg: 'bg-emerald-200/90 text-emerald-950 border border-emerald-400',
    titleText: 'text-emerald-950',
    accentText: 'text-emerald-800',
    pillBg: 'bg-white/90 text-emerald-950 border border-emerald-200',
    subtleBorder: 'border-emerald-200',
    shadowHover: 'hover:shadow-emerald-200/80',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    cardBg: 'bg-sky-100/95',
    cardBorder: 'border-sky-300 hover:border-sky-500',
    leftBorder: 'border-l-sky-600',
    badgeBg: 'bg-sky-200/90 text-sky-950 border border-sky-400',
    titleText: 'text-sky-950',
    accentText: 'text-sky-800',
    pillBg: 'bg-white/90 text-sky-950 border border-sky-200',
    subtleBorder: 'border-sky-200',
    shadowHover: 'hover:shadow-sky-200/80',
  },
  {
    id: 'purple',
    name: 'Purple',
    cardBg: 'bg-purple-100/95',
    cardBorder: 'border-purple-300 hover:border-purple-500',
    leftBorder: 'border-l-purple-600',
    badgeBg: 'bg-purple-200/90 text-purple-950 border border-purple-400',
    titleText: 'text-purple-950',
    accentText: 'text-purple-800',
    pillBg: 'bg-white/90 text-purple-950 border border-purple-200',
    subtleBorder: 'border-purple-200',
    shadowHover: 'hover:shadow-purple-200/80',
  },
  {
    id: 'amber',
    name: 'Amber',
    cardBg: 'bg-amber-100/95',
    cardBorder: 'border-amber-300 hover:border-amber-500',
    leftBorder: 'border-l-amber-600',
    badgeBg: 'bg-amber-200/90 text-amber-950 border border-amber-400',
    titleText: 'text-amber-950',
    accentText: 'text-amber-800',
    pillBg: 'bg-white/90 text-amber-950 border border-amber-200',
    subtleBorder: 'border-amber-200',
    shadowHover: 'hover:shadow-amber-200/80',
  },
  {
    id: 'rose',
    name: 'Rose',
    cardBg: 'bg-rose-100/95',
    cardBorder: 'border-rose-300 hover:border-rose-500',
    leftBorder: 'border-l-rose-600',
    badgeBg: 'bg-rose-200/90 text-rose-950 border border-rose-400',
    titleText: 'text-rose-950',
    accentText: 'text-rose-800',
    pillBg: 'bg-white/90 text-rose-950 border border-rose-200',
    subtleBorder: 'border-rose-200',
    shadowHover: 'hover:shadow-rose-200/80',
  },
  {
    id: 'teal',
    name: 'Teal',
    cardBg: 'bg-teal-100/95',
    cardBorder: 'border-teal-300 hover:border-teal-500',
    leftBorder: 'border-l-teal-600',
    badgeBg: 'bg-teal-200/90 text-teal-950 border border-teal-400',
    titleText: 'text-teal-950',
    accentText: 'text-teal-800',
    pillBg: 'bg-white/90 text-teal-950 border border-teal-200',
    subtleBorder: 'border-teal-200',
    shadowHover: 'hover:shadow-teal-200/80',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    cardBg: 'bg-cyan-100/95',
    cardBorder: 'border-cyan-300 hover:border-cyan-500',
    leftBorder: 'border-l-cyan-600',
    badgeBg: 'bg-cyan-200/90 text-cyan-950 border border-cyan-400',
    titleText: 'text-cyan-950',
    accentText: 'text-cyan-800',
    pillBg: 'bg-white/90 text-cyan-950 border border-cyan-200',
    subtleBorder: 'border-cyan-200',
    shadowHover: 'hover:shadow-cyan-200/80',
  },
  {
    id: 'orange',
    name: 'Orange',
    cardBg: 'bg-orange-100/95',
    cardBorder: 'border-orange-300 hover:border-orange-500',
    leftBorder: 'border-l-orange-600',
    badgeBg: 'bg-orange-200/90 text-orange-950 border border-orange-400',
    titleText: 'text-orange-950',
    accentText: 'text-orange-800',
    pillBg: 'bg-white/90 text-orange-950 border border-orange-200',
    subtleBorder: 'border-orange-200',
    shadowHover: 'hover:shadow-orange-200/80',
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    cardBg: 'bg-fuchsia-100/95',
    cardBorder: 'border-fuchsia-300 hover:border-fuchsia-500',
    leftBorder: 'border-l-fuchsia-600',
    badgeBg: 'bg-fuchsia-200/90 text-fuchsia-950 border border-fuchsia-400',
    titleText: 'text-fuchsia-950',
    accentText: 'text-fuchsia-800',
    pillBg: 'bg-white/90 text-fuchsia-950 border border-fuchsia-200',
    subtleBorder: 'border-fuchsia-200',
    shadowHover: 'hover:shadow-fuchsia-200/80',
  },
  {
    id: 'lime',
    name: 'Lime',
    cardBg: 'bg-lime-100/95',
    cardBorder: 'border-lime-300 hover:border-lime-500',
    leftBorder: 'border-l-lime-600',
    badgeBg: 'bg-lime-200/90 text-lime-950 border border-lime-400',
    titleText: 'text-lime-950',
    accentText: 'text-lime-800',
    pillBg: 'bg-white/90 text-lime-950 border border-lime-200',
    subtleBorder: 'border-lime-200',
    shadowHover: 'hover:shadow-lime-200/80',
  },
  {
    id: 'blue',
    name: 'Blue',
    cardBg: 'bg-blue-100/95',
    cardBorder: 'border-blue-300 hover:border-blue-500',
    leftBorder: 'border-l-blue-600',
    badgeBg: 'bg-blue-200/90 text-blue-950 border border-blue-400',
    titleText: 'text-blue-950',
    accentText: 'text-blue-800',
    pillBg: 'bg-white/90 text-blue-950 border border-blue-200',
    subtleBorder: 'border-blue-200',
    shadowHover: 'hover:shadow-blue-200/80',
  },
  {
    id: 'pink',
    name: 'Pink',
    cardBg: 'bg-pink-100/95',
    cardBorder: 'border-pink-300 hover:border-pink-500',
    leftBorder: 'border-l-pink-600',
    badgeBg: 'bg-pink-200/90 text-pink-950 border border-pink-400',
    titleText: 'text-pink-950',
    accentText: 'text-pink-800',
    pillBg: 'bg-white/90 text-pink-950 border border-pink-200',
    subtleBorder: 'border-pink-200',
    shadowHover: 'hover:shadow-pink-200/80',
  },
  {
    id: 'violet',
    name: 'Violet',
    cardBg: 'bg-violet-100/95',
    cardBorder: 'border-violet-300 hover:border-violet-500',
    leftBorder: 'border-l-violet-600',
    badgeBg: 'bg-violet-200/90 text-violet-950 border border-violet-400',
    titleText: 'text-violet-950',
    accentText: 'text-violet-800',
    pillBg: 'bg-white/90 text-violet-950 border border-violet-200',
    subtleBorder: 'border-violet-200',
    shadowHover: 'hover:shadow-violet-200/80',
  },
];

/**
 * Returns a consistent, unique, aesthetic color palette for a given course or session key.
 * Deterministic hash guarantees identical color across all screens and views.
 */
export function getCourseColor(
  courseCodeOrId?: string | null,
  fallbackSeed?: string | null
): CourseColorPalette {
  const seed = (courseCodeOrId || fallbackSeed || 'default-course').trim();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COURSE_COLOR_PALETTES.length;
  return COURSE_COLOR_PALETTES[index];
}
