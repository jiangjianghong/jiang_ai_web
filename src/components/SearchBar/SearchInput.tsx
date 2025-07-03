import React from 'react';
import { motion } from 'framer-motion';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  isExpanded?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder = "搜索或输入网址...",
  disabled = false,
  isExpanded = false
}: SearchInputProps) {
  return (
    <motion.input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder:text-white/50 text-base"
      style={{
        caretColor: 'white',
      }}
      initial={false}
      animate={{
        scale: isExpanded ? 1.02 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
    />
  );
}

interface SearchButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SearchButton({ 
  onClick, 
  disabled = false, 
  isLoading = false 
}: SearchButtonProps) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex items-center justify-center w-12 h-12 text-white/80 hover:text-white transition-colors disabled:opacity-50"
      title="搜索"
    >
      {isLoading ? (
        <i className="fa-solid fa-spinner animate-spin text-lg"></i>
      ) : (
        <i className="fa-solid fa-magnifying-glass text-lg"></i>
      )}
    </button>
  );
}
