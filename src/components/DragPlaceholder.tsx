import { motion } from 'framer-motion';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTransparency } from '@/contexts/TransparencyContext';

interface DragPlaceholderProps {
  isActive: boolean;
}

export function DragPlaceholder({ isActive }: DragPlaceholderProps) {
  const { getCardClasses } = useResponsiveLayout();
  const { cardOpacity, cardColor } = useTransparency();

  if (!isActive) return null;

  return (
    <motion.div
      className={`${getCardClasses()} relative rounded-lg border-2 border-dashed border-white/40`}
      style={{
        backgroundColor: `rgba(${cardColor}, ${Math.max(cardOpacity * 0.3, 0.1)})`,
        backdropFilter: 'blur(5px)',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          duration: 0.2
        }
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        transition: {
          duration: 0.15
        }
      }}
    >
      {/* 占位内容 */}
      <div className="h-full flex items-center justify-center opacity-60">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-8 h-8 rounded-full border-2 border-white/50"
        />
      </div>
    </motion.div>
  );
}