import { useState } from 'react';
import { motion } from 'framer-motion';

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [engine, setEngine] = useState<'bing' | 'google'>('bing');
  const engineList = [
    { key: 'bing', label: 'Bing', icon: <i className="fa-brands fa-microsoft text-blue-400"></i> },
    { key: 'google', label: 'Google', icon: <i className="fa-brands fa-google text-red-500"></i> },
  ];

  const getSearchUrl = (engine: string, query: string) => {
    switch (engine) {
      case 'google':
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      default:
        return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(getSearchUrl(engine, searchQuery), '_blank');
    }
  };

  return (
    <div className="relative left-0 right-0 z-50 flex justify-center px-4">
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form
          onSubmit={handleSearch}
          className="relative flex items-center justify-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            animate={{ width: isHovered ? 420 : 240 }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }}
            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
          >
            {/* 搜索引擎切换按钮和“搜索”字样 */}
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-0.8 py-1 text-white/70 hover:text-white bg-transparent border-none outline-none text-xs select-none"
              style={{ pointerEvents: 'auto', zIndex: 2 }}
              tabIndex={-1}
              onClick={() => {
                const idx = engineList.findIndex(e => e.key === engine);
                setEngine(engineList[(idx + 1) % engineList.length].key as any);
              }}
              title={`切换搜索引擎：${engineList.find(e => e.key === engine)?.label}`}
            >
              {engineList.find(e => e.key === engine)?.icon}
              <span className="hidden sm:inline">{engineList.find(e => e.key === engine)?.label}</span>
            </button>
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 select-none font-normal">搜索</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入内容..."
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-20 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-white/30 text-base transition-all duration-200 pr-12 w-full"
              style={{ minWidth: '4rem', maxWidth: '100%' }}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors bg-transparent border-none outline-none"
              style={{ pointerEvents: 'auto' }}
            >
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}