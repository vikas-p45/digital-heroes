// Label wraps the control, so it is associated for screen readers without manual ids.
export default function Field({ label, hint, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-[#C2324A]" role="alert">{error}</span>}
    </label>
  );
}

export const Input = (props) => <input className="input" {...props} />;
export const Select = ({ children, ...props }) => <select className="input" {...props}>{children}</select>;
export const Textarea = (props) => <textarea className="input min-h-[96px]" {...props} />;
