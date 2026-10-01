export default function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="rounded-2xl bg-heart-soft px-4 py-3 text-sm text-[#9C2238]" role="alert">
      {error.message || 'Something went wrong.'}
      {onRetry && <button onClick={onRetry} className="ml-2 font-semibold underline">Try again</button>}
    </div>
  );
}
