import { motion } from 'framer-motion';
import { colorOptions, ColorOption } from '@/contexts/TransparencyContext';

interface ColorPickerProps {
  label: string;
  selectedColor: string; // RGB字符串
  onChange: (color: string) => void;
}

export function ColorPicker({ label, selectedColor, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3 select-none">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200 select-none">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {colorOptions.map((color: ColorOption) => (
          <motion.button
            key={color.name}
            type="button"
            onClick={() => onChange(color.rgb)}
            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${selectedColor === color.rgb
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            style={{ backgroundColor: color.preview }}
            title={color.name}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {selectedColor === color.rgb && (
              <motion.div
                className="w-full h-full flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
              >
                <svg
                  className={`w-3.5 h-3.5 ${color.name === '白色' || color.name === '黄色' ? 'text-gray-700' : 'text-white'
                    }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
