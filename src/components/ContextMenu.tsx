import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
    icon: string;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleScroll = () => {
            onClose();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // 延迟添加事件监听，避免立即触发
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', handleScroll, true);
            document.addEventListener('keydown', handleKeyDown);
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // 计算菜单位置，确保不超出屏幕
    const adjustPosition = () => {
        const menuWidth = 180;
        const menuHeight = items.length * 44 + 16; // 每个项目约44px高度 + padding
        const padding = 8;

        let adjustedX = x;
        let adjustedY = y;

        // 检查右边界
        if (x + menuWidth > window.innerWidth - padding) {
            adjustedX = window.innerWidth - menuWidth - padding;
        }

        // 检查下边界
        if (y + menuHeight > window.innerHeight - padding) {
            adjustedY = window.innerHeight - menuHeight - padding;
        }

        // 确保不会出现负值
        adjustedX = Math.max(padding, adjustedX);
        adjustedY = Math.max(padding, adjustedY);

        return { x: adjustedX, y: adjustedY };
    };

    const position = adjustPosition();

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                className="fixed z-[99999] min-w-[180px] py-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                style={{
                    left: position.x,
                    top: position.y,
                }}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{
                    duration: 0.15,
                    ease: [0.4, 0, 0.2, 1]
                }}
            >
                {items.map((item, index) => (
                    <motion.button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            item.onClick();
                            onClose();
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors duration-150
              ${item.danger
                                ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50'
                            }`}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.1 }}
                    >
                        <i className={`${item.icon} w-4 text-center opacity-70`}></i>
                        <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}

// 阻止默认右键菜单的 Hook
export function usePreventDefaultContextMenu(targetRef?: React.RefObject<HTMLElement>) {
    useEffect(() => {
        const target = targetRef?.current || document;

        const handleContextMenu = (e: Event) => {
            e.preventDefault();
        };

        target.addEventListener('contextmenu', handleContextMenu);
        return () => {
            target.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [targetRef]);
}
