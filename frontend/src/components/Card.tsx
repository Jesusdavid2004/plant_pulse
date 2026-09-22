import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card = ({ children, className = '', onClick }: CardProps) => {
  return (
    <div
      className={`bg-[var(--color-surface)] rounded-2xl shadow-lg border border-[var(--color-border)] overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => (
  <div className={`px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] ${className}`}>
    {children}
  </div>
);

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody = ({ children, className = '' }: CardBodyProps) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => (
  <div className={`px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-hover)] ${className}`}>
    {children}
  </div>
);

export default Card;
