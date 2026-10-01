import { monthLabel } from '../../utils/format.js';
import DrawBalls from '../common/DrawBalls.jsx';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export default function ParticipationCard({ participation }) {
  const p = participation;
  const last = p.lastResult;
  const matched = last ? last.scores.filter((s) => last.numbers.includes(s)) : [];

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold">Draw participation</h2>
        <Badge tone={p.eligible ? 'green' : 'amber'}>{p.eligible ? 'Ready for the next draw' : 'Not yet eligible'}</Badge>
      </div>
      {!p.eligible && <p className="mt-2 text-sm text-ink-soft">To enter you need an active subscription and all five scores logged.</p>}

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-mist p-4">
          <dt className="text-sm text-ink-soft">Draws entered</dt>
          <dd className="font-display text-3xl font-extrabold">{p.drawsEntered}</dd>
        </div>
        <div className="rounded-2xl bg-mist p-4">
          <dt className="text-sm text-ink-soft">Upcoming draw</dt>
          <dd className="font-semibold">{p.upcomingDraw ? `${p.upcomingDraw.title}` : 'Not scheduled yet'}</dd>
          {p.upcomingDraw && <dd className="text-sm text-ink-soft">{monthLabel(p.upcomingDraw.draw_month)}</dd>}
        </div>
      </dl>

      {last && (
        <div className="mt-5">
          <h3 className="font-bold">Last draw: {last.title}</h3>
          <div className="mt-2"><DrawBalls numbers={last.numbers} matched={matched} /></div>
          <p className="mt-2 text-sm text-ink-soft">You matched {last.matches} {last.matches === 1 ? 'number' : 'numbers'}{last.matches >= 3 ? ' and won a prize.' : '. You need three to win.'}</p>
        </div>
      )}
    </Card>
  );
}
