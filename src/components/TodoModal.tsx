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
}

function DraggableTodoItem({ todo, index, onToggle, onDelete, onMove }: DraggableTodoItemProps) {
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
      className={`flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/70 border border-gray-200/30 transition-all group cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* 拖拽手柄 */}
      <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      <button
        onClick={() => onToggle(todo.id)}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 transition-colors flex items-center justify-center"
      >
        {todo.completed && <CheckIcon size={12} />}
      </button>

      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
        {todo.text}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-red-500 transition-all"
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
  const inputRef = useRef<HTMLInputElement>(null);
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
              <h2 className="text-lg font-semibold text-gray-800">TODO List</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClose();
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100/50 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="max-h-[600px] overflow-y-auto">
              {/* 添加新Todo区域 */}
              <div className="p-4 border-b border-gray-200/30">
                {!isAddingTodo ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsAddingTodo(true);
                    }}
                    disabled={activeTodos.length >= MAX_TODOS}
                    className={`w-full flex items-center gap-2 p-3 rounded-xl transition-all ${
                      activeTodos.length >= MAX_TODOS
                        ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 hover:shadow-md'
                    }`}
                  >
                    <PlusIcon />
                    <span className="font-medium">
                      {activeTodos.length >= MAX_TODOS 
                        ? `已达最大限制 (${MAX_TODOS}条)` 
                        : 'New TODO'
                      }
                    </span>
                  </button>
                ) : (
                  <div className="flex gap-2">
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
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      maxLength={100}
                    />
                    <button
                      onClick={(e) => addTodo(e)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <CheckIcon />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsAddingTodo(false);
                        setNewTodoText('');
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                )}
              </div>

              {/* Todo列表 */}
              <div className="p-4 space-y-3">
                {/* 未完成的Todo - 可拖拽 */}
                {activeTodos.map((todo, index) => (
                  <DraggableTodoItem
                    key={todo.id}
                    todo={todo}
                    index={index}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onMove={moveTodo}
                  />
                ))}

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
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}