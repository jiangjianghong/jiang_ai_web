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
    VIEW_SWITCHER: 'view-switcher',
    ITEMS: 'items'
  };

  // 获取当前焦点状态
  const getCurrentFocusState = () => {
    const activeElement = document.activeElement;
    
    if (activeElement?.closest('.category-tabs')) {
      return FOCUS_STATES.CATEGORIES;
    }
    if (activeElement?.closest('.view-switcher')) {
      return FOCUS_STATES.VIEW_SWITCHER;
    }
    if (activeElement?.closest('.search-bar') || activeElement?.tagName === 'INPUT') {
      return FOCUS_STATES.SEARCH;
    }
    if (focusedItemIndex >= 0) {
      return FOCUS_STATES.ITEMS;
    }
    
    return null;
  };

  // 聚焦到分类标签
  const focusToCategory = (categoryIndex: number) => {
    const categoryButtons = document.querySelectorAll('.category-tab-button');
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
    const width = window.innerWidth;
    let cols = 2;
    
    if (width >= 1536) cols = 6;
    else if (width >= 1280) cols = 5;
    else if (width >= 1024) cols = 4;
    else if (width >= 768) cols = 3;
    else cols = 2;
    
    const rows = Math.ceil(filteredItems.length / cols);
    return { cols, rows };
  };

  // 获取当前视图类型
  const getCurrentView = () => {
    const listView = document.querySelector('.list-view');
    if (listView) return 'list';
    return 'card';
  };

  // 列表导航：简单的上下移动
  const getListNavigationIndex = (currentIndex: number, direction: 'up' | 'down') => {
    switch (direction) {
      case 'up':
        return Math.max(0, currentIndex - 1);
      case 'down':
        return Math.min(filteredItems.length - 1, currentIndex + 1);
      default:
        return currentIndex;
    }
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
        return -1;
      
      case 'down':
        const nextRowIndex = (row + 1) * cols + col;
        if (nextRowIndex < filteredItems.length) {
          return nextRowIndex;
        }
        return currentIndex;
      
      case 'left':
        if (col > 0) {
          return currentIndex - 1;
        }
        return currentIndex;
      
      case 'right':
        if (col < cols - 1 && currentIndex + 1 < filteredItems.length) {
          return currentIndex + 1;
        }
        return currentIndex;
      
      default:
        return currentIndex;
    }
  };

  // 主键盘事件处理器
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isEnabled) return;

    const currentFocusState = getCurrentFocusState();
    const activeElement = document.activeElement;
    
    // 特殊组件自己处理左右键，这里不干预
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // 搜索框、分类标签、视图切换器自己处理左右键
      if (currentFocusState === FOCUS_STATES.SEARCH || 
          currentFocusState === FOCUS_STATES.CATEGORIES ||
          currentFocusState === FOCUS_STATES.VIEW_SWITCHER) {
        return; // 让组件自己处理
      }
      
      // 只处理内容区域的左右键
      if (currentFocusState === FOCUS_STATES.ITEMS) {
        e.preventDefault();
        const viewType = getCurrentView();
        
        if (viewType === 'card') {
          // 卡片视图中的网格导航
          if (e.key === 'ArrowLeft') {
            const newIndex = getGridNavigationIndex(focusedItemIndex, 'left');
            setFocusedItemIndex(newIndex);
          } else if (e.key === 'ArrowRight') {
            const newIndex = getGridNavigationIndex(focusedItemIndex, 'right');
            setFocusedItemIndex(newIndex);
          }
        }
        // 列表视图忽略左右键
      }
      return;
    }

    // 处理其他按键
    switch (e.key) {
      case 'ArrowDown':
        if (currentFocusState === FOCUS_STATES.CATEGORIES) {
          // 从分类标签下移到搜索框
          e.preventDefault();
          focusToSearch();
        } else if (currentFocusState === FOCUS_STATES.SEARCH || 
                   currentFocusState === FOCUS_STATES.VIEW_SWITCHER) {
          // 从搜索框或视图切换器下移到内容区域
          e.preventDefault();
          // 先让搜索框失去焦点
          if (currentFocusState === FOCUS_STATES.SEARCH) {
            const searchInput = document.querySelector('.search-bar input') as HTMLInputElement;
            searchInput?.blur();
          }
          if (filteredItems.length > 0) {
            setFocusedItemIndex(0);
          }
        } else if (currentFocusState === FOCUS_STATES.ITEMS) {
          e.preventDefault();
          const viewType = getCurrentView();
          
          if (viewType === 'list') {
            const newIndex = getListNavigationIndex(focusedItemIndex, 'down');
            setFocusedItemIndex(newIndex);
          } else {
            const newIndex = getGridNavigationIndex(focusedItemIndex, 'down');
            setFocusedItemIndex(newIndex);
          }
        }
        break;

      case 'ArrowUp':
        if (currentFocusState === FOCUS_STATES.SEARCH) {
          // 从搜索框上移到分类标签
          e.preventDefault();
          const currentCategoryIndex = categories.findIndex(cat => cat.name === selectedCategory);
          focusToCategory(currentCategoryIndex >= 0 ? currentCategoryIndex : 0);
        } else if (currentFocusState === FOCUS_STATES.ITEMS) {
          e.preventDefault();
          const viewType = getCurrentView();
          
          if (viewType === 'list') {
            const newIndex = getListNavigationIndex(focusedItemIndex, 'up');
            if (focusedItemIndex === 0) {
              focusToSearch();
              setFocusedItemIndex(-1);
            } else {
              setFocusedItemIndex(newIndex);
            }
          } else {
            const newIndex = getGridNavigationIndex(focusedItemIndex, 'up');
            if (newIndex === -1) {
              focusToSearch();
              setFocusedItemIndex(-1);
            } else {
              setFocusedItemIndex(newIndex);
            }
          }
        }
        break;

      case 'Enter':
        if (currentFocusState === FOCUS_STATES.ITEMS && focusedItemIndex >= 0) {
          e.preventDefault();
          openItem(filteredItems[focusedItemIndex]);
        }
        break;

      case ' ':
        if (currentFocusState !== FOCUS_STATES.SEARCH && !activeElement?.tagName.match(/INPUT|TEXTAREA|BUTTON/)) {
          e.preventDefault();
          focusToSearch();
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (searchQuery) {
          setSearchQuery('');
        } else if (focusedItemIndex >= 0) {
          setFocusedItemIndex(-1);
        } else if (onEscape) {
          onEscape();
        }
        break;

      default:
        // 处理数字键快速选择分类
        if (/^[0-9]$/.test(e.key) && !activeElement?.tagName.match(/INPUT|TEXTAREA/)) {
          e.preventDefault();
          const num = parseInt(e.key);
          const targetIndex = num === 0 ? 0 : num;
          
          if (targetIndex < categories.length) {
            setSelectedCategory(categories[targetIndex].name);
            // 聚焦到对应的分类按钮
            const categoryButton = document.querySelectorAll('.category-tab-button')[targetIndex];
            if (categoryButton) {
              (categoryButton as HTMLElement).focus();
            }
          }
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
    onEscape
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
        { key: '←→', description: '导航切换' },
        { key: '↑↓', description: '上下导航' },
        { key: 'Enter', description: '打开/确认' },
        { key: 'Space', description: '聚焦搜索' },
        { key: 'Esc', description: '清除/返回' }
      ],
      categories: categories.map((cat, index) => ({
        key: index.toString(),
        description: cat.name === 'all' ? '全部' : cat.name
      }))
    };
  };

  return {
    shortcuts: getShortcuts(),
    focusedItem: focusedItemIndex >= 0 ? filteredItems[focusedItemIndex] : null
  };
}