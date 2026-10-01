// Draw numbers as balls. `matched` (optional) highlights numbers a player also logged as scores.
export default function DrawBalls({ numbers = [], matched = [], size = 'md' }) {
  const dim = size === 'lg' ? 'h-14 w-14 text-xl' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-base';
  return (
    <ol className="flex flex-wrap gap-2" aria-label={`Draw numbers: ${numbers.join(', ')}`}>
      {numbers.map((n) => {
        const hit = matched.includes(n);
        return (
          <li key={n}
            className={`${dim} flex items-center justify-center rounded-full font-display font-extrabold ${
              hit ? 'bg-sea text-white ring-2 ring-sea/30 ring-offset-2' : 'bg-sun text-ink'
            }`}>
            {n}
          </li>
        );
      })}
    </ol>
  );
}
