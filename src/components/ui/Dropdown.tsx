import React from 'react';
import { cn } from '@/lib/utils';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, 
  children, 
  align = 'left',
  className 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} onKeyDown={handleKeyDown}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] rounded-lg bg-white border border-gray-200 shadow-lg py-1",
            alignmentClasses[align],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  destructive?: boolean;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  className, 
  destructive = false,
  ...props 
}) => {
  return (
    <button
      className={cn(
        "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
        destructive ? "text-red-600 hover:bg-red-50 focus:bg-red-50" : "text-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const DropdownSeparator: React.FC = () => (
  <hr className="my-1 border-gray-200" />
);

export { Dropdown, DropdownItem, DropdownSeparator };
