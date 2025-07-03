import React from 'react';

export interface SearchEngine {
  key: 'bing' | 'google';
  label: string;
  icon: React.ReactElement;
}

export const engineList: SearchEngine[] = [
  { key: 'bing', label: 'Bing', icon: <i className="fa-brands fa-microsoft text-blue-400"></i> },
  { key: 'google', label: 'Google', icon: <i className="fa-brands fa-google text-blue-500"></i> },
];

interface EngineTooltipProps {
  currentEngine: SearchEngine;
  onEngineChange: (engine: 'bing' | 'google') => void;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

export function EngineTooltip({ 
  currentEngine, 
  onEngineChange, 
  show, 
  onShowChange 
}: EngineTooltipProps) {
  if (!show) return null;

  return (
    <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-white/20 z-50">
      <p className="text-gray-700 text-sm font-medium mb-2">选择搜索引擎:</p>
      <div className="flex space-x-2">
        {engineList.map((eng) => (
          <button
            key={eng.key}
            onClick={() => {
              onEngineChange(eng.key);
              onShowChange(false);
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentEngine.key === eng.key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {eng.icon}
            <span className="text-sm font-medium">{eng.label}</span>
          </button>
        ))}
      </div>
      <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white/95"></div>
    </div>
  );
}

interface EngineButtonProps {
  currentEngine: SearchEngine;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  hoveredEmojiIdx?: number | null;
}

export function EngineButton({ 
  currentEngine, 
  onClick, 
  onMouseEnter, 
  onMouseLeave,
  hoveredEmojiIdx
}: EngineButtonProps) {
  const emojiList = ['🚀', '🔍', '✨', '🎯', '💫', '🌟', '⭐', '💎'];
  
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex items-center justify-center w-12 h-12 text-white/80 hover:text-white transition-colors relative"
      title={`切换到${currentEngine.key === 'bing' ? 'Google' : 'Bing'}`}
    >
      {hoveredEmojiIdx !== null ? (
        <span className="text-lg">{emojiList[hoveredEmojiIdx ?? 0]}</span>
      ) : (
        currentEngine.icon
      )}
    </button>
  );
}
