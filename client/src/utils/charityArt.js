// Every charity gets a stable gradient from its name, so cards look distinct without uploaded images.
const PALETTES = [
  ['#FF5D73', '#FFB627'], ['#1F9D8C', '#7BD3C4'], ['#6C63FF', '#FF5D73'],
  ['#FFB627', '#1F9D8C'], ['#1D1B4C', '#6C63FF'], ['#FF8A5B', '#FF5D73'],
];

export function artFor(name = '') {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [a, b] = PALETTES[h % PALETTES.length];
  const angle = 120 + (h % 90);
  return `linear-gradient(${angle}deg, ${a}, ${b})`;
}

export const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
