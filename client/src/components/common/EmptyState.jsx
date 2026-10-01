export default function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
