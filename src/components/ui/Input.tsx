import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-bold text-muted-foreground ml-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        )}
        <input
          className={`
            w-full bg-card/50 backdrop-blur-md border border-border rounded-2xl py-4 transition-all duration-300
            focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none
            ${Icon ? 'pl-12 pr-4' : 'px-4'}
            ${error ? 'border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-medium ml-1">{error}</p>}
    </div>
  );
};

export default Input;
