import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag, useDrop } from 'react-dnd';

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
  position?: { x: number; y: number };
}

const STORAGE_KEY = 'time-display-todos';
const MAX_TODOS = 30;
const MAX_HISTORY = 1000;

// 拖拽项目类型
const ItemTypes = {
  TODO: 'todo',
};

// 可拖拽的Todo项组件
interface DraggableTodoItemProps {
  todo: TodoItem;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onStartEdit: (id: string, text: string, event?: React.MouseEvent) => void;
}

function DraggableTodoItem({ todo, index, onToggle, onDelete, onMove, onStartEdit }: DraggableTodoItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TODO,
    item: { id: todo.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.TODO,
    hover: (item: { id: string; index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-4 h-16 rounded-2xl bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/40 shadow-md hover:shadow-xl transition-all duration-200 group cursor-move hover:scale-105 hover:-translate-y-1 ${
        isDragging ? 'opacity-50 shadow-2xl scale-110' : ''
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <button
        onClick={() => onToggle(todo.id)}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
      >
        {todo.completed && <CheckIcon size={12} />}
      </button>

      <span
        onClick={(e) => onStartEdit(todo.id, todo.text, e)}
        className={`flex-1 text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors truncate ${
          todo.completed ? 'line-through text-gray-500' : 'text-gray-700'
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

export function TodoModal({ isOpen, onClose, position }: TodoModalProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<{ id: string; text: string; originRect?: DOMRect } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
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

  // 保存到本地存储
  const saveTodos = (newTodos: TodoItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos));
    setTodos(newTodos);
  };

  // 添加新Todo
  const addTodo = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const text = newTodoText.trim();
    if (!text) return;

    const activeTodos = todos.filter(todo => !todo.completed);
    if (activeTodos.length >= MAX_TODOS) {
      return; // 达到最大数量限制
    }

    // 获取当前最大order值
    const maxOrder = Math.max(0, ...todos.map(todo => todo.order || 0));

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now(),
      order: maxOrder + 1,
    };

    const updatedTodos = [newTodo, ...todos].slice(0, MAX_HISTORY);
    saveTodos(updatedTodos);
    setNewTodoText('');
    setIsAddingTodo(false);
  };

  // 移动Todo项
  const moveTodo = (dragIndex: number, hoverIndex: number) => {
    const activeTodos = todos.filter(todo => !todo.completed);
    const dragTodo = activeTodos[dragIndex];
    const newActiveTodos = [...activeTodos];
    
    // 移动项目
    newActiveTodos.splice(dragIndex, 1);
    newActiveTodos.splice(hoverIndex, 0, dragTodo);
    
    // 重新分配order
    const reorderedActiveTodos = newActiveTodos.map((todo, index) => ({
      ...todo,
      order: index
    }));
    
    // 合并已完成的todos
    const completedTodos = todos.filter(todo => todo.completed);
    const allTodos = [...reorderedActiveTodos, ...completedTodos];
    
    setTodos(allTodos);
    saveTodos(allTodos);
  };

  // 切换Todo完成状态
  const toggleTodo = (id: string) => {
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
    if (editingTodo && editingTodo.text.trim()) {
      editTodo(editingTodo.id, editingTodo.text.trim());
    } else {
      setEditingTodo(null);
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

  // 自动聚焦输入框
  useEffect(() => {
    if (isAddingTodo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTodo]);

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
            onClick={onClose}
          />

          {/* Todo弹窗容器 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden pointer-events-auto"
              onClick={(e) => {
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c0-1.657-1.343-3-3-3H6c-1.657 0-3 1.343-3 3s1.343 3 3 3h12c1.657 0 3-1.343 3-3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">TODO</h2>
                  <p className="text-xs text-gray-500">{activeTodos.length} 条代办</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClose();
                }}
                className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="max-h-[600px] overflow-y-auto">
              {/* 添加新Todo区域 */}
              <div className="px-6 py-5">
                {!isAddingTodo ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsAddingTodo(true);
                    }}
                    disabled={activeTodos.length >= MAX_TODOS}
                    className={`w-full flex items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
                      activeTodos.length >= MAX_TODOS
                        ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed shadow-sm'
                        : 'bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-1'
                    }`}
                  >
                    <PlusIcon />
                    <span className="font-medium">
                      {activeTodos.length >= MAX_TODOS 
                        ? `Maximum limit reached (${MAX_TODOS})` 
                        : 'NEW'
                      }
                    </span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addTodo();
                        } else if (e.key === 'Escape') {
                          setIsAddingTodo(false);
                          setNewTodoText('');
                        }
                      }}
                      placeholder="Enter your TODO..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/50 bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      maxLength={100}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => addTodo(e)}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <CheckIcon />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsAddingTodo(false);
                          setNewTodoText('');
                        }}
                        className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <CloseIcon />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Todo列表 */}
              <div className="px-6 py-4">
                {/* 未完成的Todo - 可拖拽 */}
                <div className="space-y-3">
                  {activeTodos.map((todo, index) => (
                    <DraggableTodoItem
                      key={todo.id}
                      todo={todo}
                      index={index}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onMove={moveTodo}
                      onStartEdit={startEditTodo}
                    />
                  ))}
                </div>

                {/* 已完成的Todo */}
                {completedTodos.length > 0 && (
                  <>
                    <div className="pt-2 border-t border-gray-200/30">
                      <p className="text-xs text-gray-500 font-medium mb-2">Completed</p>
                      {completedTodos.map((todo) => (
                        <motion.div
                          key={todo.id}
                          layout
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 transition-all group opacity-60"
                        >
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                          >
                            <CheckIcon size={10} />
                          </button>
                          <span className="flex-1 text-sm line-through text-gray-500">
                            {todo.text}
                          </span>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-red-400 transition-all"
                          >
                            <TrashIcon size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {/* 空状态 */}
                {todos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No TODOs yet</p>
                    <p className="text-xs mt-1">Click the button above to add a new TODO</p>
                  </div>
                )}
              </div>
            </div>

            {/* 底部信息 - 只显示未完成的待办 */}
            <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-200/30">
              <p className="text-xs text-gray-500 text-center">
                {activeTodos.length}/{MAX_TODOS} Active TODOs
              </p>
            </div>

            {/* 全屏编辑覆盖层 */}
            <AnimatePresence>
              {editingTodo && (() => {
                // 计算动画的起始位置
                let initialTransform = 'scale(0.1)';
                let initialOrigin = 'center center';
                
                if (editingTodo.originRect && modalRef.current) {
                  const modalRect = modalRef.current.getBoundingClientRect();
                  const originX = ((editingTodo.originRect.left + editingTodo.originRect.width / 2 - modalRect.left) / modalRect.width) * 100;
                  const originY = ((editingTodo.originRect.top + editingTodo.originRect.height / 2 - modalRect.top) / modalRect.height) * 100;
                  initialOrigin = `${Math.max(0, Math.min(100, originX))}% ${Math.max(0, Math.min(100, originY))}%`;
                  initialTransform = 'scale(0.1)';
                }
                
                return (
                  <motion.div
                    className="absolute inset-0 bg-white rounded-2xl flex flex-col overflow-hidden"
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
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/30 flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800">编辑TODO</h2>
                          <p className="text-xs text-gray-500">按 Enter 保存，Escape 取消</p>
                        </div>
                      </div>
                      <button
                        onClick={saveEdit}
                        className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
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
                        <span className="text-xs text-gray-500">
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