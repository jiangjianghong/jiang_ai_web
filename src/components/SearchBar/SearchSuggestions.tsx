import { motion } from 'framer-motion';
import { useState } from 'react';

export interface Suggestion {
  text: string;
  type: 'search' | 'website' | 'workspace';
  icon?: string;
  url?: string;
  username?: string;
  password?: string;
  workspaceId?: string;
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (suggestions.length === 0) return null;

  // 复制文本到剪贴板
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 获取类型显示文本
  const getTypeText = (type: string) => {
    switch (type) {
      case 'search': return '搜索';
      case 'website': return '网站';
      case 'workspace': return '工作空间';
      default: return type;
    }
  };

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
            <div className="flex-1 min-w-0">
              <span className="text-gray-700 text-sm block truncate">{suggestion.text}</span>
              {suggestion.type === 'workspace' && suggestion.url && (
                <span className="text-xs text-gray-500 block truncate">{suggestion.url}</span>
              )}
            </div>
            
            {/* 工作空间项目的账号密码复制按钮 */}
            {suggestion.type === 'workspace' && (suggestion.username || suggestion.password) && (
              <div className="flex items-center space-x-1">
                {suggestion.username && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(suggestion.username!, `${suggestion.workspaceId}-username`);
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                    title="复制账号"
                  >
                    {copiedField === `${suggestion.workspaceId}-username` ? '已复制' : '账号'}
                  </button>
                )}
                {suggestion.password && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(suggestion.password!, `${suggestion.workspaceId}-password`);
                    }}
                    className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
                    title="复制密码"
                  >
                    {copiedField === `${suggestion.workspaceId}-password` ? '已复制' : '密码'}
                  </button>
                )}
              </div>
            )}
            
            <span className="text-xs text-gray-400 ml-auto">
              {getTypeText(suggestion.type)}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// 获取搜索建议的功能
export async function fetchSearchSuggestions(query: string, workspaceItems?: any[]): Promise<Suggestion[]> {
  if (!query.trim()) return [];
  
  try {
    const suggestions: Suggestion[] = [];
    
    // 调试：打印工作空间数据
    console.log('🔍 搜索建议 - 查询:', query);
    console.log('🔍 搜索建议 - 工作空间数据:', workspaceItems);
    
    // 搜索工作空间内容
    if (workspaceItems && workspaceItems.length > 0) {
      console.log('🔍 开始搜索工作空间项目...');
      
      const workspaceSuggestions = workspaceItems
        .filter(item => {
          const matchTitle = item.title?.toLowerCase().includes(query.toLowerCase());
          const matchDescription = item.description?.toLowerCase().includes(query.toLowerCase());
          const matchUrl = item.url?.toLowerCase().includes(query.toLowerCase());
          const isMatch = matchTitle || matchDescription || matchUrl;
          
          console.log(`🔍 检查项目: ${item.title}, 匹配: ${isMatch}`, {
            title: item.title,
            matchTitle,
            matchDescription,
            matchUrl
          });
          
          return isMatch;
        })
        .slice(0, 3) // 限制工作空间建议数量
        .map(item => ({
          text: item.title || item.url,
          type: 'workspace' as const,
          icon: item.icon || '🏢',
          url: item.url,
          username: item.username,
          password: item.password,
          workspaceId: item.id
        }));
      
      console.log('🔍 工作空间建议结果:', workspaceSuggestions);
      suggestions.push(...workspaceSuggestions);
    } else {
      console.log('🔍 无工作空间数据或数据为空');
    }
    
    // 添加搜索建议（限制数量，为工作空间建议留出空间）
    const maxSearchSuggestions = Math.max(0, 3 - suggestions.length);
    if (maxSearchSuggestions > 0) {
      const searchSuggestions: Suggestion[] = [
        { text: `${query} 是什么`, type: 'search', icon: '🔍' },
        { text: `${query} 怎么用`, type: 'search', icon: '🔍' },
        { text: `${query} 教程`, type: 'search', icon: '🔍' },
      ].slice(0, maxSearchSuggestions);
      
      suggestions.push(...searchSuggestions);
    }
    
    return suggestions;
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return [];
  }
}
