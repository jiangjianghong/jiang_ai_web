import { useEffect, useCallback } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface UseKeyboardNavigationOptions {
  isEnabled?: boolean;
  onEscape?: () => void;
}

export function useKeyboardNavigation({ 
  isEnabled = true, 
  onEscape 
}: UseKeyboardNavigationOptions = {}) {
  const {
    filteredItems,
    focusedItemIndex,
    setFocusedItemIndex,
    openItem,
    selectedCategory,
    setSelectedCategory,
    categories,
    searchQuery,
    setSearchQuery,
    clearFilters
  } = useWorkspace();

  // 焦点状态枚举
  const FOCUS_STATES = {
    CATEGORIES: 'categories',
    SEARCH: 'search', 
    ITEMS: 'items'
  };

  // 获取当前焦点状态
  const getCurrentFocusState = () => {
    const activeElement = document.activeElement;
    
    if (activeElement?.closest('.category-tabs')) {
      return FOCUS_STATES.CATEGORIES;
    }
    if (activeElement?.closest('.search-bar') || activeElement?.tagName === 'INPUT') {
      return FOCUS_STATES.SEARCH;
    }
    if (focusedItemIndex >= 0) {
      return FOCUS_STATES.ITEMS;
    }
    
    return FOCUS_STATES.CATEGORIES; // 默认状态
  };

  // 聚焦到分类标签
  const focusToCategory = (categoryIndex: number) => {
    const categoryButtons = document.querySelectorAll('.category-tabs button');
    if (categoryButtons[categoryIndex]) {
      (categoryButtons[categoryIndex] as HTMLElement).focus();
    }
  };

  // 聚焦到搜索框
  const focusToSearch = () => {
    const searchInput = document.querySelector('.search-bar input') as HTMLInputElement;
    searchInput?.focus();
  };

  // 计算网格布局参数
  const getGridDimensions = () => {
    // 根据视口宽度计算列数（与CardView中的网格类一致）
    const width = window.innerWidth;
    let cols = 2; // 默认移动端
    
    if (width >= 1536) cols = 6; // 2xl
    else if (width >= 1280) cols = 5; // xl  
    else if (width >= 1024) cols = 4; // lg
    else if (width >= 768) cols = 3; // md
    else cols = 2; // sm
    
    const rows = Math.ceil(filteredItems.length / cols);
    return { cols, rows };
  };

  // 网格导航：根据当前索引和方向计算新索引
  const getGridNavigationIndex = (currentIndex: number, direction: 'up' | 'down' | 'left' | 'right') => {
    const { cols } = getGridDimensions();
    const row = Math.floor(currentIndex / cols);
    const col = currentIndex % cols;
    
    switch (direction) {
      case 'up':
        if (row > 0) {
          return (row - 1) * cols + col;
        }
        return -1; // 到顶部，退出网格导航
      
      case 'down':
        const nextRowIndex = (row + 1) * cols + col;
        if (nextRowIndex < filteredItems.length) {
          return nextRowIndex;
        }
        return currentIndex; // 保持在当前位置
      
      case 'left':
        if (col > 0) {
          return currentIndex - 1;
        }
        return currentIndex; // 保持在当前位置
      
      case 'right':
        if (col < cols - 1 && currentIndex + 1 < filteredItems.length) {
          return currentIndex + 1;
        }
        return currentIndex; // 保持在当前位置
      
      default:
        return currentIndex;
    }
  };

  // 主键盘事件处理器
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isEnabled) return;

    const currentFocusState = getCurrentFocusState();
    const activeElement = document.activeElement;
    
    // 在输入框中时的特殊处理
    if (activeElement?.tagName === 'INPUT') {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          if (searchQuery) {
            setSearchQuery('');
          } else {
            (activeElement as HTMLElement).blur();
            focusToCategory(0); // 返回到分类
          }
          return;
        case 'ArrowDown':
          e.preventDefault();
          (activeElement as HTMLElement).blur();
          if (filteredItems.length > 0) {
            setFocusedItemIndex(0);
          }
          return;
        case 'ArrowUp':
          e.preventDefault();
          (activeElement as HTMLElement).blur();
          focusToCategory(categories.findIndex(cat => cat.name === selectedCategory));
          return;
      }
      return;
    }

    // 全局按键处理
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (currentFocusState === FOCUS_STATES.CATEGORIES) {
          const currentIndex = categories.findIndex(cat => cat.name === selectedCategory);
          if (currentIndex < categories.length - 1) {
            const nextCategory = categories[currentIndex + 1];
            setSelectedCategory(nextCategory.name);
            focusToCategory(currentIndex + 1);
          }
        } else if (currentFocusState === FOCUS_STATES.ITEMS) {
          // 网格导航：右移
          const newIndex = getGridNavigationIndex(focusedItemIndex, 'right');
          setFocusedItemIndex(newIndex);
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (currentFocusState === FOCUS_STATES.CATEGORIES) {
          const currentIndex = categories.findIndex(cat => cat.name === selectedCategory);
          if (currentIndex > 0) {
            const prevCategory = categories[currentIndex - 1];
            setSelectedCategory(prevCategory.name);
            focusToCategory(currentIndex - 1);
          }
        } else if (currentFocusState === FOCUS_STATES.ITEMS) {
          // 网格导航：左移
          const newIndex = getGridNavigationIndex(focusedItemIndex, 'left');
          setFocusedItemIndex(newIndex);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (currentFocusState === FOCUS_STATES.CATEGORIES) {
          focusToSearch();
        } else if (currentFocusState === FOCUS_STATES.SEARCH) {
          if (filteredItems.length > 0) {
            setFocusedItemIndex(0);
          }
        } else if (currentFocusState === FOCUS_STATES.ITEMS) {
          // 网格导航：下移
          const newIndex = getGridNavigationIndex(focusedItemIndex, 'down');
          setFocusedItemIndex(newIndex);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (currentFocusState === FOCUS_STATES.SEARCH) {
          focusToCategory(categories.findIndex(cat => cat.name === selectedCategory));
        } else if (currentFocusState === FOCUS_STATES.ITEMS) {
          // 网格导航：上移
          const newIndex = getGridNavigationIndex(focusedItemIndex, 'up');
          if (newIndex === -1) {
            // 到达顶部，返回搜索框
            focusToSearch();
            setFocusedItemIndex(-1);
          } else {
            setFocusedItemIndex(newIndex);
          }
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (currentFocusState === FOCUS_STATES.ITEMS && focusedItemIndex >= 0) {
          openItem(filteredItems[focusedItemIndex]);
        }
        break;

      case ' ':
        e.preventDefault();
        if (currentFocusState !== FOCUS_STATES.SEARCH) {
          focusToSearch();
        }
        break;

      case 'Tab':
        e.preventDefault();
        // Tab在不同区域间循环
        if (currentFocusState === FOCUS_STATES.CATEGORIES) {
          focusToSearch();
        } else if (currentFocusState === FOCUS_STATES.SEARCH) {
          if (filteredItems.length > 0) {
            setFocusedItemIndex(0);
          } else {
            focusToCategory(0);
          }
        } else if (currentFocusState === FOCUS_STATES.ITEMS) {
          focusToCategory(0);
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (searchQuery) {
          setSearchQuery('');
        } else if (selectedCategory !== 'all') {
          setSelectedCategory('all');
          focusToCategory(0);
        } else if (onEscape) {
          onEscape();
        }
        break;

      default:
        // 处理数字键1-9选择分类
        if (/^[1-9]$/.test(e.key)) {
          e.preventDefault();
          const num = parseInt(e.key);
          if (num <= categories.length - 1) {
            const category = categories[num];
            if (category) {
              setSelectedCategory(category.name);
              focusToCategory(num);
            }
          }
        }
        // 处理数字键0选择全部
        else if (e.key === '0') {
          e.preventDefault();
          setSelectedCategory('all');
          focusToCategory(0);
        }
        break;
    }
  }, [
    isEnabled,
    filteredItems,
    focusedItemIndex,
    setFocusedItemIndex,
    openItem,
    selectedCategory,
    setSelectedCategory,
    categories,
    searchQuery,
    setSearchQuery,
    onEscape,
    clearFilters
  ]);

  // 注册全局键盘事件
  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, isEnabled]);

  // 返回快捷键信息供UI显示
  const getShortcuts = () => {
    return {
      navigation: [
        { key: '←→', description: '切换分类' },
        { key: '↑↓', description: '上下导航' },
        { key: 'Enter', description: '打开链接' },
        { key: 'Space', description: '聚焦搜索' },
        { key: 'Tab', description: '区域切换' },
        { key: 'Esc', description: '清除/返回' }
      ],
      categories: categories.map((cat, index) => ({
        key: index === 0 ? '0' : index.toString(),
        description: cat.name === 'all' ? '全部' : cat.name
      }))
    };
  };

  return {
    shortcuts: getShortcuts(),
    focusedItem: focusedItemIndex >= 0 ? filteredItems[focusedItemIndex] : null
  };
}