import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  padding?: string;
  elevated?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, padding = '1.5rem', elevated = true, style }: CardProps) {
  return (
    <div
      role="region"
      style={{
        background: '#12121a',
        borderRadius: '12px',
        padding,
        boxShadow: elevated ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
        border: '1px solid #1e1e2e',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
