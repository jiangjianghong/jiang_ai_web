import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SuccessFeedbackProps {
  message: string;
  isVisible: boolean;
  onComplete?: () => void;
  type?: 'success' | 'error' | 'info' | 'warning';
  position?: 'top' | 'center' | 'bottom';
}

export function SuccessFeedback({ 
  message, 
  isVisible, 
  onComplete, 
  type = 'success',
  position = 'top'
}: SuccessFeedbackProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-500/90 text-white';
      case 'error': return 'bg-red-500/90 text-white';
      case 'info': return 'bg-blue-500/90 text-white';
      case 'warning': return 'bg-yellow-500/90 text-white';
      default: return 'bg-green-500/90 text-white';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'top-20 left-1/2 transform -translate-x-1/2';
      case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'bottom': return 'bottom-20 left-1/2 transform -translate-x-1/2';
      default: return 'top-20 left-1/2 transform -translate-x-1/2';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${getPositionClasses()} z-50 ${getColors()} rounded-lg px-6 py-3 shadow-lg backdrop-blur-sm`}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getIcon()}</span>
            <span className="font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', color = 'text-white', text }: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-6 h-6';
      case 'lg': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <motion.div
        className={`${getSizeClasses()} border-2 border-current border-t-transparent rounded-full ${color}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <span className={`${color} text-sm font-medium`}>{text}</span>
      )}
    </div>
  );
}

interface PulseLoaderProps {
  count?: number;
  size?: number;
  color?: string;
  delay?: number;
}

export function PulseLoader({ count = 3, size = 8, color = 'bg-white/70', delay = 0.2 }: PulseLoaderProps) {
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`${color} rounded-full`}
          style={{ width: size, height: size }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  progress, 
  height = 4, 
  color = 'bg-blue-500', 
  backgroundColor = 'bg-gray-200',
  animated = true,
  showPercentage = false
}: ProgressBarProps) {
  return (
    <div className="w-full">
      <div 
        className={`w-full ${backgroundColor} rounded-full overflow-hidden`}
        style={{ height }}
      >
        <motion.div
          className={`h-full ${color} ${animated ? 'transition-all duration-300 ease-out' : ''}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showPercentage && (
        <div className="mt-1 text-xs text-gray-600 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

interface RippleEffectProps {
  x: number;
  y: number;
  color?: string;
  size?: number;
  duration?: number;
  onComplete?: () => void;
}

export function RippleEffect({ 
  x, 
  y, 
  color = 'rgba(255, 255, 255, 0.6)', 
  size = 100,
  duration = 0.6,
  onComplete 
}: RippleEffectProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration * 1000);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        backgroundColor: color,
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1, opacity: 0 }}
      transition={{ duration, ease: 'easeOut' }}
    />
  );
}

interface FloatingActionButtonProps {
  icon: string;
  onClick: () => void;
  tooltip?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FloatingActionButton({
  icon,
  onClick,
  tooltip,
  position = 'bottom-right',
  color = 'bg-blue-500 hover:bg-blue-600',
  size = 'md'
}: FloatingActionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      default: return 'bottom-4 right-4';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-10 h-10 text-sm';
      case 'md': return 'w-12 h-12 text-base';
      case 'lg': return 'w-14 h-14 text-lg';
      default: return 'w-12 h-12 text-base';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <motion.button
        className={`${getSizeClasses()} ${color} rounded-full shadow-lg text-white flex items-center justify-center transition-all duration-200`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <i className={icon}></i>
      </motion.button>
      
      {tooltip && showTooltip && (
        <motion.div
          className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {tooltip}
        </motion.div>
      )}
    </div>
  );
}
