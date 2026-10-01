const VARIANTS = { primary: 'btn-primary', sun: 'btn-sun', ghost: 'btn-ghost', danger: 'btn-danger' };
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

export default function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...rest }) {
  return (
    <button
      className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}
