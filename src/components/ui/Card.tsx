import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isGlass?: boolean;
  noPadding?: boolean;
  hoverEffect?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  isGlass = false, 
  noPadding = false,
  hoverEffect = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : undefined}
      className={`
        relative rounded-2xl overflow-hidden
        ${isGlass ? 'glass' : 'bg-card border border-primary/20'}
        ${hoverEffect ? 'hover:shadow-xl hover:border-primary/20 transition-all duration-300' : ''}
        ${noPadding ? '' : 'p-6'}
        premium-shadow
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Card;
