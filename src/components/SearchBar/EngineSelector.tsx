import { motion } from 'framer-motion';

export const engineList = [
  { 
    name: 'bing' as const, 
    label: 'Bing', 
    color: '#0078d4', 
    icon: '🔍',
    url: 'https://www.bing.com/search?q='
  },
  { 
    name: 'google' as const, 
    label: 'Google', 
    color: '#4285f4', 
    icon: '🌐',
    url: 'https://www.google.com/search?q='
  }
];

interface EngineButtonProps {
  engine: 'bing' | 'google';
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function EngineButton({ 
  engine, 
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}: EngineButtonProps) {
  const currentEngine = engineList.find(e => e.name === engine);
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="p-2 rounded-lg transition-colors hover:bg-white/20"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-lg">{currentEngine?.icon}</span>
    </motion.button>
  );
}

interface EngineTooltipProps {
  engine: 'bing' | 'google';
  show: boolean;
}

export function EngineTooltip({ engine, show }: EngineTooltipProps) {
  const currentEngine = engineList.find(e => e.name === engine);
  
  if (!show || !currentEngine) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full mt-2 right-0 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50"
    >
      搜索引擎: {currentEngine.label}
    </motion.div>
  );
}
