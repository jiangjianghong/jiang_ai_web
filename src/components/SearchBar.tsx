import { useState, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [engine, setEngine] = useState<'bing' | 'google'>('bing');
  const [isExpandDone, setIsExpandDone] = useState(false);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const [fixedPos, setFixedPos] = useState<{ left: number; top: number } | null>(null);
  const [hoveredEmojiIdx, setHoveredEmojiIdx] = useState<number | null>(null);
  const engineList = [
    { key: 'bing', label: 'Bing', icon: <i className="fa-brands fa-microsoft text-blue-400"></i> },
    { key: 'google', label: 'Google', icon: <i className="fa-brands fa-google text-blue-500"></i> },
  ];

  // 表情名称和图标
  const emojiNames = ['chatGPT', 'Gemini', 'Deepseek', 'Kimi'];
  const emojiLinks = [
    'https://chatgpt.com/',
    'https://gemini.google.com/',
    'https://chat.deepseek.com/',
    'https://www.kimi.com/',
  ];
  const emojiList = [
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/chatgpt.svg"} alt="chatGPT" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/gemini.svg"} alt="Gemini" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/deepseek.svg"} alt="Deepseek" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/kimi.svg"} alt="Kimi" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
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

  const shrinkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 只在动画完成时获取一次绝对位置
  useLayoutEffect(() => {
    if (isExpandDone && searchBtnRef.current) {
      const rect = searchBtnRef.current.getBoundingClientRect();
      setFixedPos({
        left: rect.left + rect.width / 2,
        top: rect.top, // 直接用top，修正视觉中心
      });
    } else {
      setFixedPos(null);
    }
  }, [isExpandDone, engine]);

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
          onMouseEnter={() => {
            if (shrinkTimeout.current) {
              clearTimeout(shrinkTimeout.current);
              shrinkTimeout.current = null;
            }
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            if (shrinkTimeout.current) clearTimeout(shrinkTimeout.current);
            shrinkTimeout.current = setTimeout(() => {
              setIsHovered(false);
              setIsExpandDone(false);
            }, 200);
          }}
        >
          <motion.div
            animate={{ width: isHovered ? 520 : 340 }}
            initial={{ width: 340 }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }}
            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
            onAnimationComplete={() => { if (isHovered) setIsExpandDone(true); }}
          >
            {/* 搜索引擎切换按钮和“搜索”字样 */}
            <div className="relative flex items-center">
              <button
                type="button"
                className="flex items-center gap-2 px-1.5 py-1 text-white/80 hover:text-white bg-transparent border-none outline-none text-lg select-none relative z-20"
                style={{ pointerEvents: 'auto', height: 36, minWidth: 36, minHeight: 36, justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                tabIndex={-1}
                onClick={() => {
                  const idx = engineList.findIndex(e => e.key === engine);
                  setEngine(engineList[(idx + 1) % engineList.length].key as any);
                }}
                title={`切换搜索引擎：${engineList.find(e => e.key === engine)?.label}`}
              >
                {engineList.find(e => e.key === engine)?.icon}
                <span className="hidden sm:inline text-base font-semibold">{engineList.find(e => e.key === engine)?.label}</span>
              </button>
            </div>
            {/* 分隔符 */}
            <span className="mx-2 text-white/30 select-none font-normal text-base z-10">|</span>
            <span className="text-white/60 select-none font-normal text-base z-10"></span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入内容..."
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-white/30 text-base transition-all duration-200 pr-12 w-full ml-3"
              style={{ minWidth: '4rem', maxWidth: '100%' }}
              onKeyDown={e => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  const idx = engineList.findIndex(en => en.key === engine);
                  setEngine(engineList[(idx + 1) % engineList.length].key as any);
                }
              }}
            />
            <button
              ref={searchBtnRef}
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors bg-transparent border-none outline-none group"
              style={{ pointerEvents: 'auto' }}
            >
              <motion.i
                className="fa-solid fa-magnifying-glass text-sm"
                whileHover={{ scale: 1.22, rotate: 18, color: '#fff' }}
                whileTap={{ scale: 0.95, rotate: 0 }}
                animate={{ color: isHovered ? '#fff' : undefined }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                style={{ display: 'inline-block' }}
              />
            </button>
            {/* 悬停时显示的表情（fixed定位，圆心为放大镜按钮绝对中心） */}
            {isHovered && isExpandDone && fixedPos && (
              <div
                className="fixed z-30"
                style={{
                  left: fixedPos.left,
                  top: fixedPos.top,
                  width: 0,
                  height: 0,
                  pointerEvents: 'auto',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0 }}>
                  {emojiList.map((emoji, i, arr) => {
                    // -60°到60°，右上半圆分布，半径增大为44
                    const N = arr.length;
                    const angle = (-60 + (120 / (N - 1)) * i) * (Math.PI / 180);
                    const r = 44;
                    const x = r * Math.cos(angle);
                    const y = r * Math.sin(angle);
                    const rectHeight = 19; // 更小的高度
                    const rectWidth = rectHeight * 3.6; // 更紧凑的宽度
                    return (
                      <motion.span
                        key={i}
                        role="img"
                        aria-label={emojiNames[i]}
                        initial={{ x: 0, y: 0, scale: 0.3, opacity: 0, filter: 'none' }}
                        animate={{ x, y, scale: 1.18, opacity: 1, filter: 'none' }}
                        whileHover={{ scale: 1.38, filter: 'drop-shadow(0 0 4px #fff) drop-shadow(0 0 8px #fff)' }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 22,
                          delay: 0.08 * i,
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          fontSize: 22,
                          cursor: 'pointer',
                          userSelect: 'none',
                          zIndex: 2,
                          willChange: 'filter, transform',
                        }}
                        onClick={() => window.open(emojiLinks[i], '_blank')}
                        onMouseEnter={() => setHoveredEmojiIdx(i)}
                        onMouseLeave={() => setHoveredEmojiIdx(null)}
                      >
                        {emoji}
                        {hoveredEmojiIdx === i && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 28,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              height: rectHeight,
                              width: rectWidth,
                              background: 'rgba(255,255,255,0.98)', // 浅色背景
                              color: '#222', // 深色字体
                              borderRadius: rectHeight / 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 12px #0003',
                              fontSize: 14,
                              fontWeight: 500,
                              pointerEvents: 'auto',
                              zIndex: 10,
                              padding: '0 10px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span>{emojiNames[i]}</span>
                          </div>
                        )}
                      </motion.span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}