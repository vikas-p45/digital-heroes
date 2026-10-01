const TONES = {
  green: 'bg-sea-soft text-sea',
  amber: 'bg-sun/25 text-[#8A5A00]',
  rose: 'bg-heart-soft text-[#C2324A]',
  gray: 'bg-mist text-ink-soft',
  indigo: 'bg-ink text-white',
};

export default function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}
