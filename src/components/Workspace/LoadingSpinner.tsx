import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = '正在加载...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* 外圈 */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
        </motion.div>

        {/* 内圈 */}
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-purple-200 dark:border-purple-800"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full" />
        </motion.div>

        {/* 中心点 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
        </motion.div>
      </div>

      {/* 文字提示 */}
      <motion.p
        className="text-gray-600 dark:text-gray-400 text-sm mt-6 font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
}