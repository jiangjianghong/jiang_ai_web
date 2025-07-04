import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

interface EnhancedHoverCardProps {
  children: React.ReactNode;
  hoverContent?: React.ReactNode;
  disabled?: boolean;
  hoverDelay?: number;
  className?: string;
}

export function EnhancedHoverCard({ 
  children, 
  hoverContent, 
  disabled = false,
  hoverDelay = 0,
  className = ''
}: EnhancedHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || disabled) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setTimeout(() => setIsHovered(true), hoverDelay);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={disabled ? {} : { 
        scale: 1.02,
        y: -4,
        rotateX: 5,
        rotateY: (mousePosition.x - 100) * 0.1,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.3
      }}
    >
      {children}
      
      {/* 悬停光效 */}
      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute w-32 h-32 bg-white/10 rounded-full blur-xl"
            style={{
              left: mousePosition.x - 64,
              top: mousePosition.y - 64,
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
            }}
          />
        </motion.div>
      )}
      
      {/* 悬停边框效果 */}
      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-lg ring-2 ring-white/30 pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* 悬停内容 */}
      {hoverContent && isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {hoverContent}
        </motion.div>
      )}
    </motion.div>
  );
}

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}: GlowButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/50',
      secondary: 'bg-gray-500 hover:bg-gray-600 shadow-gray-500/50',
      success: 'bg-green-500 hover:bg-green-600 shadow-green-500/50',
      warning: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/50',
      danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/50'
    };
    return variants[variant];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    return sizes[size];
  };

  return (
    <motion.button
      className={`
        relative overflow-hidden rounded-lg text-white font-medium
        ${getVariantClasses()} ${getSizeClasses()} ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-300 ease-out
        ${!disabled ? 'hover:shadow-lg hover:shadow-current/50' : ''}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <span className={`relative z-10 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      
      {/* 发光效果 */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-white/20"
          initial={{ x: '-100%' }}
          animate={isPressed ? { x: '100%' } : { x: '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}
      
      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
    </motion.button>
  );
}

interface ParticleEffectProps {
  trigger: boolean;
  onComplete?: () => void;
  particleCount?: number;
  colors?: string[];
}

export function ParticleEffect({ 
  trigger, 
  onComplete, 
  particleCount = 20,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
}: ParticleEffectProps) {
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: (Math.PI * 2 * i) / particleCount,
    speed: Math.random() * 100 + 50,
    size: Math.random() * 4 + 2
  }));

  if (!trigger) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            left: '50%',
            top: '50%'
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(particle.angle) * particle.speed,
            y: Math.sin(particle.angle) * particle.speed,
            opacity: 0,
            scale: 0
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
          onAnimationComplete={() => {
            if (particle.id === particles.length - 1) {
              onComplete?.();
            }
          }}
        />
      ))}
    </div>
  );
}
