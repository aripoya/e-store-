import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  const hoverEffect = hover ? 'hover:-translate-y-2 hover:shadow-xl' : '';
  
  return (
    <div className={`bg-white rounded-2xl shadow-lg transition-all duration-300 ${hoverEffect} ${className}`}>
      {children}
    </div>
  );
}
