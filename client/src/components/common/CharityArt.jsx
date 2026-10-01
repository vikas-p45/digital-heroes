import { artFor, initialsOf } from '../../utils/charityArt.js';

export default function CharityArt({ charity, className = 'h-40' }) {
  if (charity.image_url) {
    return <img src={charity.image_url} alt="" className={`w-full rounded-2xl object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`flex w-full items-end rounded-2xl p-4 ${className}`} style={{ background: artFor(charity.name) }} aria-hidden="true">
      <span className="font-display text-4xl font-extrabold text-white/90">{initialsOf(charity.name)}</span>
    </div>
  );
}
