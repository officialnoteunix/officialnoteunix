import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import '../../styles/components.css'; // Make sure this is imported if we add css there

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

const DROPDOWN_GAP = 6;
const DROPDOWN_MAX_HEIGHT = 250;
const VIEWPORT_MARGIN = 8;

export default function Select({ value, onChange, options, placeholder = 'Select an option', className = '', icon, disabled = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownElRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Decide open direction (up/down) based on available space so the dropdown
  // never overflows off the top or bottom of the viewport.
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !dropdownElRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(dropdownElRef.current.scrollHeight, DROPDOWN_MAX_HEIGHT);

    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = triggerRect.top - VIEWPORT_MARGIN;

    // Prefer opening down; flip up only if there isn't enough room below.
    setDropUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  }, [isOpen, options.length]);

  return (
    <div className={`custom-select-container ${className} ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        ref={triggerRef}
      >
        <div className="custom-select-value">
          {icon && <span className="custom-select-icon">{icon}</span>}
          <span style={{ color: selectedOption ? 'inherit' : 'var(--text-muted)' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={14} className="custom-select-chevron" />
      </button>

      {isOpen && (
        <div
          className={`custom-select-dropdown ${dropUp ? 'drop-up' : ''}`}
          ref={dropdownElRef}
          style={{ maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)` }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
