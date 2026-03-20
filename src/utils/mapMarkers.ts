const CATEGORY_COLORS = [
  '#2563eb', // blue
  '#0f766e', // teal
  '#ea580c', // orange
  '#7c3aed', // violet
  '#be123c', // rose
  '#0891b2', // cyan
  '#65a30d', // lime
  '#b45309', // amber
];

const CATEGORY_GLYPHS: Record<string, string> = {
  home: '🏠',
  users: '👥',
  wrench: '🔧',
  hammer: '🔨',
  trees: '🌳',
  truck: '🚚',
  settings: '⚙️',
  'paw-print': '🐾',
  'chef-hat': '👨‍🍳',
  sparkles: '✨',
  shirt: '👕',
  baby: '👶',
  stethoscope: '🩺',
  zap: '⚡',
  fan: '🌀',
  flame: '🔥',
  leaf: '🍃',
  tv: '📺',
  laptop: '💻',
  camera: '📷',
  utensils: '🍽️',
  construction: '🏗️',
};

export function getCategoryMarkerColor(categoryId?: string | null): string {
  if (!categoryId) return '#64748b'; // slate

  let hash = 0;
  for (let index = 0; index < categoryId.length; index += 1) {
    hash = (hash << 5) - hash + categoryId.charCodeAt(index);
    hash |= 0;
  }

  const paletteIndex = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[paletteIndex];
}

export function getCategoryMarkerGlyph(categoryIcon?: string | null, categoryName?: string | null): string {
  if (categoryIcon) {
    const glyph = CATEGORY_GLYPHS[categoryIcon.toLowerCase()];
    if (glyph) return glyph;
  }

  if (categoryName && categoryName.trim().length > 0) {
    return categoryName.trim().charAt(0).toUpperCase();
  }

  return '📍';
}