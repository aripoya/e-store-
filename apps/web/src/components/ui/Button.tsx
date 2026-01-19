import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({ 
  variant = 'primary', 
  children, 
  fullWidth = false,
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'px-8 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out';
  
  const variants = {
    primary: 'bg-gold hover:bg-gold-hover text-navy-dark shadow-lg hover:shadow-xl',
    secondary: 'bg-navy-primary hover:bg-navy-secondary text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-white text-white hover:bg-white hover:text-navy-primary',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
