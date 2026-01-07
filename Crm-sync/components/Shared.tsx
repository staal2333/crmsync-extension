import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Logo Component ---
export const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="CRMSYNC Logo"
  >
    <path 
      d="M4 12V9C4 6.5 6.5 4 9 4H15C17.5 4 20 6.5 20 9V11" 
      stroke="#2563EB" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <path 
      d="M20 12V15C20 17.5 17.5 20 15 20H9C6.5 20 4 17.5 4 15V13" 
      stroke="#0D9488" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    />
    <path 
      d="M17 8L20 11L23 8" 
      stroke="#2563EB" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M7 16L4 13L1 16" 
      stroke="#0D9488" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// --- Animation Wrappers ---
export const FadeInUp: React.FC<{ children: React.ReactNode; delay?: number, className?: string }> = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// --- UI Components ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'dark' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-dark text-white focus:ring-primary shadow-lg shadow-primary/30",
    secondary: "bg-white text-primary border border-primary hover:bg-gray-50 focus:ring-primary",
    outline: "bg-transparent border border-gray-300 text-dark hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-400",
    dark: "bg-dark text-white hover:bg-dark-lighter focus:ring-dark shadow-lg shadow-dark/20",
    ghost: "bg-transparent text-gray-600 hover:text-dark hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
};

export const SectionHeader: React.FC<{ title: string; subtitle?: string; align?: 'left' | 'center' }> = ({ title, subtitle, align = 'center' }) => (
  <FadeInUp className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'} max-w-3xl mx-auto px-4`}>
    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{title}</h2>
    {subtitle && <p className="text-lg text-gray-600 leading-relaxed">{subtitle}</p>}
  </FadeInUp>
);

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.span 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.2 }}
    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary border border-blue-100 mb-4"
  >
    {children}
  </motion.span>
);