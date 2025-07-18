import { motion } from 'framer-motion';

export interface Suggestion {
  text: string;
  type: 'search' | 'website';
  icon?: string;
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  onSelect: (suggestion: Suggestion, index: number) => void;
  onHover: (index: number) => void;
}

export function SearchSuggestions({ 
  suggestions, 
  selectedIndex, 
  onSelect, 
  onHover 
}: SearchSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm rounded-b-2xl shadow-lg border border-white/20 z-50 max-h-64 overflow-y-auto"
    >
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          className={`px-4 py-2 cursor-pointer transition-colors ${
            selectedIndex === index 
              ? 'bg-blue-100/80' 
              : 'hover:bg-gray-100/50'
          }`}
          onClick={() => onSelect(suggestion, index)}
          onMouseEnter={() => onHover(index)}
          whileHover={{ x: 4 }}
        >
          <div className="flex items-center space-x-3">
            {suggestion.icon && (
              <span className="text-sm">{suggestion.icon}</span>
            )}
            <span className="text-gray-700 text-sm">{suggestion.text}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {suggestion.type === 'search' ? '搜索' : '网站'}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// 获取搜索建议的功能
export async function fetchSearchSuggestions(query: string): Promise<Suggestion[]> {
  if (!query.trim()) return [];
  
  try {
    // 模拟搜索建议（在实际应用中这里会调用API）
    const searchSuggestions: Suggestion[] = [
      { text: `${query} 是什么`, type: 'search', icon: '🔍' },
      { text: `${query} 怎么用`, type: 'search', icon: '🔍' },
      { text: `${query} 教程`, type: 'search', icon: '🔍' },
    ];
    
    return searchSuggestions;
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return [];
  }
}
