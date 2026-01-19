import type { ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  highlight?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionTitle({ 
  children, 
  highlight, 
  centered = true,
  light = false 
}: SectionTitleProps) {
  const textColor = light ? 'text-white' : 'text-navy-dark';
  const alignment = centered ? 'text-center' : 'text-left';
  
  if (highlight) {
    const parts = children?.toString().split(highlight);
    return (
      <h2 className={`text-3xl md:text-4xl font-heading font-bold mb-12 ${textColor} ${alignment}`}>
        {parts?.[0]}
        <span className="text-gold">{highlight}</span>
        {parts?.[1]}
      </h2>
    );
  }
  
  return (
    <h2 className={`text-3xl md:text-4xl font-heading font-bold mb-12 ${textColor} ${alignment}`}>
      {children}
    </h2>
  );
}
