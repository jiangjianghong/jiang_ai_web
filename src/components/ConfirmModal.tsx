import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  type = 'warning',
}: ConfirmModalProps) {
  // ESC键关闭模态框，Enter键确认
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        // 确保不是在输入框中按Enter
        const activeElement = document.activeElement;
        const isInput = activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA';
        if (!isInput) {
          e.preventDefault();
          onConfirm();
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'fa-solid fa-triangle-exclamation text-red-500',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      case 'warning':
        return {
          icon: 'fa-solid fa-exclamation-triangle text-orange-500',
          confirmButton: 'bg-orange-500 hover:bg-orange-600 text-white',
          borderColor: 'border-orange-200 dark:border-orange-800',
        };
      case 'info':
        return {
          icon: 'fa-solid fa-info-circle text-blue-500',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 border-2 ${styles.borderColor}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <i className={`${styles.icon} text-2xl`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{message}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 rounded-lg transition-colors ${styles.confirmButton}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
