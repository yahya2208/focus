import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: '#6366f1', color: 'white' },
    secondary: { background: '#1e1e2e', color: '#e0e0e0', border: '1px solid #333' },
    danger: { background: '#ef4444', color: 'white' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    lg: { padding: '1rem 2rem', fontSize: '1.125rem' },
  };

  return (
    <button
      aria-label={typeof children === 'string' ? children : undefined}
      disabled={disabled || loading}
      style={{
        borderRadius: '8px',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.2s, transform 0.1s',
        fontFamily: 'system-ui, sans-serif',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...rest}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
