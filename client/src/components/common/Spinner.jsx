export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-ink-soft" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" aria-hidden="true" />
      <span className="text-sm">{label}...</span>
    </div>
  );
}
