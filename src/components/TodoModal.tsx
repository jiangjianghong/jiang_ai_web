import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 简单的图标组件
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

const TrashIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"></polyline>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
  </svg>
);

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  order: number;
}

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'time-display-todos';
const MAX_TODOS = 30;
const MAX_HISTORY = 1000;

// Todo项组件 - 移除拖拽功能
interface TodoItemProps {
  todo: TodoItem;
  onToggle: (id: string, event?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string, text: string, event?: React.MouseEvent) => void;
}

function TodoItemComponent({ todo, onToggle, onDelete, onStartEdit }: TodoItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-3 h-12 rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 shadow-md hover:shadow-xl transition-all duration-200 group hover:scale-105 hover:-translate-y-1`}
    >
      <motion.button
        onClick={(e) => onToggle(todo.id, e)}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {todo.completed && <CheckIcon size={12} />}
      </motion.button>

      <span
        onClick={(e) => onStartEdit(todo.id, todo.text, e)}
        className={`flex-1 text-sm font-medium cursor-pointer transition-colors truncate ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'
          }`}
        title={todo.text}
      >
        {todo.text}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-all"
      >
        <TrashIcon />
      </button>
    </motion.div>
  );
}

export function TodoModal({ isOpen, onClose }: TodoModalProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [editingTodo, setEditingTodo] = useState<{ id: string; text: string; originRect?: DOMRect } | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 加载本地存储的todos
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // 为旧数据添加order字段
        const dataWithOrder = data.map((todo: TodoItem, index: number) => ({
          ...todo,
          order: todo.order ?? index
        }));
        // 按创建时间排序，最新的在前面，但只对未完成的进行排序
        const activeTodos = dataWithOrder
          .filter((todo: TodoItem) => !todo.completed)
          .sort((a: TodoItem, b: TodoItem) => (a.order || 0) - (b.order || 0));
        const completedTodos = dataWithOrder
          .filter((todo: TodoItem) => todo.completed)
          .sort((a: TodoItem, b: TodoItem) => b.createdAt - a.createdAt);

        const allTodos = [...activeTodos, ...completedTodos].slice(0, MAX_HISTORY);
        setTodos(allTodos);
      } catch {
        setTodos([]);
      }
    }
  }, []);

  // 键盘事件处理和页面滚动控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
      // 阻止页面滚动
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 保存到本地存储
  const saveTodos = (newTodos: TodoItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos));
    setTodos(newTodos);
  };

  // 开始添加新Todo - 直接进入编辑模式
  const startAddNewTodo = () => {
    const activeTodos = todos.filter(todo => !todo.completed);
    if (activeTodos.length >= MAX_TODOS) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      createdAt: Date.now(),
      order: Math.max(0, ...todos.map(todo => todo.order || 0)) + 1,
    };

    // 添加到状态但不保存到localStorage（编辑时再保存）
    setTodos([newTodo, ...todos]);
    // 进入编辑模式
    setEditingTodo({ id: newTodo.id, text: '' });
  };

  // 创建完成庆祝动画效果
  const createCelebrationEffect = useCallback((centerX: number, centerY: number) => {
    // 彩色小星星和粒子
    const colors = ['#10B981', '#06D6A0', '#FFD166', '#F72585', '#4CC9F0'];

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.width = Math.random() * 6 + 3 + 'px';
      particle.style.height = particle.style.width;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';

      document.body.appendChild(particle);

      const angle = (Math.PI * 2 * i) / 20;
      const velocity = Math.random() * 100 + 50;
      let vx = Math.cos(angle) * velocity;
      let vy = Math.sin(angle) * velocity;
      let x = centerX;
      let y = centerY;
      const gravity = 300;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        vy += gravity * (1 / 60);
        vx *= 0.99;
        x += vx * (1 / 60);
        y += vy * (1 / 60);

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = Math.max(0, 1 - elapsed / 2).toString();

        if (elapsed < 2 && y < window.innerHeight + 100) {
          requestAnimationFrame(animate);
        } else {
          if (document.body.contains(particle)) {
            document.body.removeChild(particle);
          }
        }
      };

      requestAnimationFrame(animate);
    }
  }, []);

  // 切换Todo完成状态
  const toggleTodo = (id: string, event?: React.MouseEvent) => {
    const todo = todos.find(t => t.id === id);

    // 如果是标记为完成，触发庆祝动画
    if (todo && !todo.completed && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      createCelebrationEffect(centerX, centerY);
    }

    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(updatedTodos);
  };

  // 删除Todo
  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    saveTodos(updatedTodos);
  };

  // 编辑Todo
  const editTodo = (id: string, newText: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    );
    saveTodos(updatedTodos);
    setEditingTodo(null);
  };

  // 开始编辑Todo
  const startEditTodo = (id: string, text: string, event?: React.MouseEvent) => {
    let originRect: DOMRect | undefined;

    if (event) {
      // 获取点击元素的位置信息
      const target = event.currentTarget as HTMLElement;
      originRect = target.getBoundingClientRect();
    }

    setEditingTodo({ id, text, originRect });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingTodo(null);
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingTodo) {
      const trimmedText = editingTodo.text.trim();

      if (trimmedText) {
        // 如果有内容，保存编辑
        editTodo(editingTodo.id, trimmedText);
      } else {
        // 如果没有内容，删除这个TODO（特别是新建的空TODO）
        const updatedTodos = todos.filter(todo => todo.id !== editingTodo.id);
        saveTodos(updatedTodos);
        setEditingTodo(null);
      }
    }
  };

  // 自动聚焦编辑输入框
  useEffect(() => {
    if (editingTodo && editInputRef.current) {
      editInputRef.current.focus();
      // 将光标移到文本末尾，而不是全选
      const length = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(length, length);
    }
  }, [editingTodo]);

  // 点击外部关闭 - 简化逻辑
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // 延迟添加事件监听，避免立即触发
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const activeTodos = todos
    .filter(todo => !todo.completed)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* 背景遮罩 - 点击关闭 */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />

          {/* Todo弹窗容器 */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => {
              // 如果点击的是容器本身（不是弹窗内容），关闭弹窗
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }
            }}
            style={{ pointerEvents: 'auto' }}
          >
            <motion.div
              ref={modalRef}
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                width: '520px',
                maxHeight: '800px',
                maxWidth: '90vw',
              }}
              initial={{
                opacity: 0,
                scale: 0.9,
                y: -20
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: -20
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.4
              }}
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d="M9 12l2 2 4-4" />
                      <path d="M21 12c0-1.657-1.343-3-3-3H6c-1.657 0-3 1.343-3 3s1.343 3 3 3h12c1.657 0 3-1.343 3-3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">TODO</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activeTodos.length} 条代办</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClose();
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-300"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* 内容区域 */}
              <div className="max-h-[600px] overflow-y-auto">
                {/* 添加新Todo区域 */}
                <div className="px-6 pt-5 pb-2">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const activeTodos = todos.filter(todo => !todo.completed);
                      if (activeTodos.length < MAX_TODOS) {
                        startAddNewTodo();
                      }
                    }}
                    disabled={activeTodos.length >= MAX_TODOS}
                    className={`w-full flex items-center gap-3 p-3 h-12 rounded-2xl transition-all duration-200 group cursor-pointer ${activeTodos.length >= MAX_TODOS
                        ? 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-sm'
                        : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-100/50 hover:to-indigo-100/50 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 text-blue-700 dark:text-blue-300 shadow-md hover:shadow-xl border border-blue-200/40 dark:border-blue-800/40'
                      }`}
                    whileHover={activeTodos.length < MAX_TODOS ? { scale: 1.02, y: -2 } : {}}
                    whileTap={activeTodos.length < MAX_TODOS ? { scale: 0.98 } : {}}
                  >
                    <PlusIcon />
                    <span className="font-medium">
                      {activeTodos.length >= MAX_TODOS
                        ? `已达上限 (${MAX_TODOS})`
                        : 'NEW TODO'
                      }
                    </span>
                  </motion.button>
                </div>

                {/* Todo列表 */}
                <div className="px-6 pb-4 pt-0">
                  {/* 未完成的Todo */}
                  <div className="space-y-2">
                    {activeTodos.map((todo) => (
                      <TodoItemComponent
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onStartEdit={startEditTodo}
                      />
                    ))}
                  </div>

                  {/* 已完成的Todo */}
                  {completedTodos.length > 0 && (
                    <>
                      <div className="pt-6 border-t border-gray-200/30 dark:border-gray-700/30 mt-6">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">已完成</p>
                        {completedTodos.map((todo, index) => (
                          <div key={todo.id}>
                            <motion.div
                              layout
                              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 transition-all group opacity-60 mb-2"
                            >
                              <motion.button
                                onClick={(e) => toggleTodo(todo.id, e)}
                                className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <CheckIcon size={10} />
                              </motion.button>
                              <span className="flex-1 text-sm line-through text-green-600">
                                {todo.text}
                              </span>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-red-400 transition-all"
                              >
                                <TrashIcon size={12} />
                              </button>
                            </motion.div>
                            {index < completedTodos.length - 1 && (
                              <div className="mx-2 h-px bg-gray-300/50 my-2"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* 空状态 */}
                  {todos.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">还没有TODO呢</p>
                      <p className="text-xs mt-1">点击上方按钮添加新的TODO</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 全屏编辑覆盖层 */}
              <AnimatePresence>
                {editingTodo && (() => {
                  // 计算动画的起始位置
                  let initialOrigin = 'center center';

                  if (editingTodo.originRect && modalRef.current) {
                    const modalRect = modalRef.current.getBoundingClientRect();
                    const originX = ((editingTodo.originRect.left + editingTodo.originRect.width / 2 - modalRect.left) / modalRect.width) * 100;
                    const originY = ((editingTodo.originRect.top + editingTodo.originRect.height / 2 - modalRect.top) / modalRect.height) * 100;
                    initialOrigin = `${Math.max(0, Math.min(100, originX))}% ${Math.max(0, Math.min(100, originY))}%`;
                  }

                  return (
                    <motion.div
                      className="absolute inset-0 bg-white dark:bg-gray-900 rounded-2xl flex flex-col overflow-hidden"
                      initial={{ scale: 0.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.1, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{
                        transformOrigin: initialOrigin,
                        zIndex: 100
                      }}
                      onClick={(e) => {
                        // 点击编辑区域外的地方自动保存
                        if (e.target === e.currentTarget) {
                          saveEdit();
                        }
                      }}
                    >
                      {/* 编辑标题栏 */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">编辑TODO</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">按 Enter 保存，Escape 取消</p>
                          </div>
                        </div>
                        <button
                          onClick={saveEdit}
                          className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-300"
                        >
                          <CloseIcon />
                        </button>
                      </div>

                      {/* 编辑内容区域 - 记事本风格 */}
                      <div className="flex-1 flex flex-col p-6">
                        {/* 记事本写作区域 */}
                        <div
                          className="flex-1 relative"
                          style={{
                            // 横线背景 - 每32px一条线，文字写在线条之间
                            backgroundImage: `linear-gradient(
                            to bottom,
                            transparent 0px,
                            transparent 30px,
                            rgba(156, 163, 175, 0.25) 30px,
                            rgba(156, 163, 175, 0.25) 32px,
                            transparent 32px
                          )`,
                            backgroundSize: '100% 32px',
                            backgroundRepeat: 'repeat-y'
                          }}
                        >
                          <textarea
                            ref={editInputRef}
                            value={editingTodo.text}
                            onChange={(e) => setEditingTodo({ ...editingTodo, text: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveEdit();
                              } else if (e.key === 'Escape') {
                                cancelEdit();
                              }
                            }}
                            placeholder="写下你的TODO..."
                            className="w-full h-full bg-transparent border-none focus:outline-none resize-none relative z-10"
                            style={{
                              // 行高32px与背景线条间距完全匹配
                              lineHeight: '32px',
                              fontSize: '18px',
                              fontFamily: '"STXingkai", "KaiTi", "楷体", "FangSong", "仿宋", cursive, serif',
                              color: '#6b7280',
                              // 让文字稍微离线条有一点距离，不要紧贴
                              paddingTop: '3px',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingBottom: '9px',
                              minHeight: '300px'
                            }}
                            maxLength={400}
                          />
                        </div>

                        {/* 字符计数 */}
                        <div className="flex justify-center mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {editingTodo.text.length}/400 字符
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}