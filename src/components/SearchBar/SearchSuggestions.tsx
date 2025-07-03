import React from 'react';

export interface Suggestion {
  text: string;
  type?: 'search' | 'url' | 'history';
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  show: boolean;
  selectedIndex: number;
  onSuggestionClick: (suggestion: Suggestion) => void;
  onMouseEnter: (index: number) => void;
  searchBarRef: React.RefObject<HTMLFormElement>;
}

export function SearchSuggestions({
  suggestions,
  show,
  selectedIndex,
  onSuggestionClick,
  onMouseEnter,
  searchBarRef
}: SearchSuggestionsProps) {
  if (!show || suggestions.length === 0) return null;

  const getIconForSuggestion = (suggestion: Suggestion) => {
    switch (suggestion.type) {
      case 'url':
        return <i className="fa-solid fa-link text-blue-400"></i>;
      case 'history':
        return <i className="fa-solid fa-clock-rotate-left text-green-400"></i>;
      default:
        return <i className="fa-solid fa-magnifying-glass text-gray-400"></i>;
    }
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 z-50 max-h-80 overflow-y-auto"
      style={{
        width: searchBarRef.current?.offsetWidth || 'auto',
      }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          onMouseEnter={() => onMouseEnter(index)}
          className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg flex items-center space-x-3 ${
            index === selectedIndex ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex-shrink-0">
            {getIconForSuggestion(suggestion)}
          </div>
          <span className="text-gray-700 text-sm flex-1 truncate">
            {suggestion.text}
          </span>
          {suggestion.type && (
            <span className="text-xs text-gray-400 capitalize flex-shrink-0">
              {suggestion.type}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * 获取搜索建议的工具函数
 * @param query 搜索查询
 * @param engine 搜索引擎
 * @returns Promise<Suggestion[]>
 */
export async function fetchSearchSuggestions(
  query: string,
  _engine: 'bing' | 'google'
): Promise<Suggestion[]> {
  if (!query.trim()) return [];

  try {
    // 模拟API调用 - 实际项目中应该调用真实的建议API
    await new Promise(resolve => setTimeout(resolve, 100));

    // 返回模拟的建议数据
    const suggestions: Suggestion[] = [
      { text: `${query} 是什么`, type: 'search' },
      { text: `${query} 怎么用`, type: 'search' },
      { text: `${query} 教程`, type: 'search' },
    ];

    // 如果查询看起来像URL，添加URL建议
    if (query.includes('.') || query.startsWith('http')) {
      suggestions.unshift({ text: query, type: 'url' });
    }

    return suggestions.slice(0, 8); // 最多返回8个建议
  } catch (error) {
    console.warn('获取搜索建议失败:', error);
    return [];
  }
}
