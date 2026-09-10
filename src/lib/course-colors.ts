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
    cardBg: 'bg-indigo-50/90',
    cardBorder: 'border-indigo-200/90 hover:border-indigo-400',
    leftBorder: 'border-l-indigo-500',
    badgeBg: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    titleText: 'text-indigo-950',
    accentText: 'text-indigo-700',
    pillBg: 'bg-indigo-100/75 text-indigo-800',
    subtleBorder: 'border-indigo-100',
    shadowHover: 'hover:shadow-indigo-100/80',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    cardBg: 'bg-emerald-50/90',
    cardBorder: 'border-emerald-200/90 hover:border-emerald-400',
    leftBorder: 'border-l-emerald-500',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    titleText: 'text-emerald-950',
    accentText: 'text-emerald-700',
    pillBg: 'bg-emerald-100/75 text-emerald-800',
    subtleBorder: 'border-emerald-100',
    shadowHover: 'hover:shadow-emerald-100/80',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    cardBg: 'bg-sky-50/90',
    cardBorder: 'border-sky-200/90 hover:border-sky-400',
    leftBorder: 'border-l-sky-500',
    badgeBg: 'bg-sky-100 text-sky-800 border border-sky-200',
    titleText: 'text-sky-950',
    accentText: 'text-sky-700',
    pillBg: 'bg-sky-100/75 text-sky-800',
    subtleBorder: 'border-sky-100',
    shadowHover: 'hover:shadow-sky-100/80',
  },
  {
    id: 'purple',
    name: 'Purple',
    cardBg: 'bg-purple-50/90',
    cardBorder: 'border-purple-200/90 hover:border-purple-400',
    leftBorder: 'border-l-purple-500',
    badgeBg: 'bg-purple-100 text-purple-800 border border-purple-200',
    titleText: 'text-purple-950',
    accentText: 'text-purple-700',
    pillBg: 'bg-purple-100/75 text-purple-800',
    subtleBorder: 'border-purple-100',
    shadowHover: 'hover:shadow-purple-100/80',
  },
  {
    id: 'amber',
    name: 'Amber',
    cardBg: 'bg-amber-50/90',
    cardBorder: 'border-amber-200/90 hover:border-amber-400',
    leftBorder: 'border-l-amber-500',
    badgeBg: 'bg-amber-100 text-amber-800 border border-amber-200',
    titleText: 'text-amber-950',
    accentText: 'text-amber-700',
    pillBg: 'bg-amber-100/75 text-amber-800',
    subtleBorder: 'border-amber-100',
    shadowHover: 'hover:shadow-amber-100/80',
  },
  {
    id: 'rose',
    name: 'Rose',
    cardBg: 'bg-rose-50/90',
    cardBorder: 'border-rose-200/90 hover:border-rose-400',
    leftBorder: 'border-l-rose-500',
    badgeBg: 'bg-rose-100 text-rose-800 border border-rose-200',
    titleText: 'text-rose-950',
    accentText: 'text-rose-700',
    pillBg: 'bg-rose-100/75 text-rose-800',
    subtleBorder: 'border-rose-100',
    shadowHover: 'hover:shadow-rose-100/80',
  },
  {
    id: 'teal',
    name: 'Teal',
    cardBg: 'bg-teal-50/90',
    cardBorder: 'border-teal-200/90 hover:border-teal-400',
    leftBorder: 'border-l-teal-500',
    badgeBg: 'bg-teal-100 text-teal-800 border border-teal-200',
    titleText: 'text-teal-950',
    accentText: 'text-teal-700',
    pillBg: 'bg-teal-100/75 text-teal-800',
    subtleBorder: 'border-teal-100',
    shadowHover: 'hover:shadow-teal-100/80',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    cardBg: 'bg-cyan-50/90',
    cardBorder: 'border-cyan-200/90 hover:border-cyan-400',
    leftBorder: 'border-l-cyan-500',
    badgeBg: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    titleText: 'text-cyan-950',
    accentText: 'text-cyan-700',
    pillBg: 'bg-cyan-100/75 text-cyan-800',
    subtleBorder: 'border-cyan-100',
    shadowHover: 'hover:shadow-cyan-100/80',
  },
  {
    id: 'orange',
    name: 'Orange',
    cardBg: 'bg-orange-50/90',
    cardBorder: 'border-orange-200/90 hover:border-orange-400',
    leftBorder: 'border-l-orange-500',
    badgeBg: 'bg-orange-100 text-orange-800 border border-orange-200',
    titleText: 'text-orange-950',
    accentText: 'text-orange-700',
    pillBg: 'bg-orange-100/75 text-orange-800',
    subtleBorder: 'border-orange-100',
    shadowHover: 'hover:shadow-orange-100/80',
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    cardBg: 'bg-fuchsia-50/90',
    cardBorder: 'border-fuchsia-200/90 hover:border-fuchsia-400',
    leftBorder: 'border-l-fuchsia-500',
    badgeBg: 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200',
    titleText: 'text-fuchsia-950',
    accentText: 'text-fuchsia-700',
    pillBg: 'bg-fuchsia-100/75 text-fuchsia-800',
    subtleBorder: 'border-fuchsia-100',
    shadowHover: 'hover:shadow-fuchsia-100/80',
  },
  {
    id: 'lime',
    name: 'Lime',
    cardBg: 'bg-lime-50/90',
    cardBorder: 'border-lime-200/90 hover:border-lime-400',
    leftBorder: 'border-l-lime-500',
    badgeBg: 'bg-lime-100 text-lime-800 border border-lime-200',
    titleText: 'text-lime-950',
    accentText: 'text-lime-700',
    pillBg: 'bg-lime-100/75 text-lime-800',
    subtleBorder: 'border-lime-100',
    shadowHover: 'hover:shadow-lime-100/80',
  },
  {
    id: 'blue',
    name: 'Blue',
    cardBg: 'bg-blue-50/90',
    cardBorder: 'border-blue-200/90 hover:border-blue-400',
    leftBorder: 'border-l-blue-500',
    badgeBg: 'bg-blue-100 text-blue-800 border border-blue-200',
    titleText: 'text-blue-950',
    accentText: 'text-blue-700',
    pillBg: 'bg-blue-100/75 text-blue-800',
    subtleBorder: 'border-blue-100',
    shadowHover: 'hover:shadow-blue-100/80',
  },
  {
    id: 'pink',
    name: 'Pink',
    cardBg: 'bg-pink-50/90',
    cardBorder: 'border-pink-200/90 hover:border-pink-400',
    leftBorder: 'border-l-pink-500',
    badgeBg: 'bg-pink-100 text-pink-800 border border-pink-200',
    titleText: 'text-pink-950',
    accentText: 'text-pink-700',
    pillBg: 'bg-pink-100/75 text-pink-800',
    subtleBorder: 'border-pink-100',
    shadowHover: 'hover:shadow-pink-100/80',
  },
  {
    id: 'violet',
    name: 'Violet',
    cardBg: 'bg-violet-50/90',
    cardBorder: 'border-violet-200/90 hover:border-violet-400',
    leftBorder: 'border-l-violet-500',
    badgeBg: 'bg-violet-100 text-violet-800 border border-violet-200',
    titleText: 'text-violet-950',
    accentText: 'text-violet-700',
    pillBg: 'bg-violet-100/75 text-violet-800',
    subtleBorder: 'border-violet-100',
    shadowHover: 'hover:shadow-violet-100/80',
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
