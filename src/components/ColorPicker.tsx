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
      <label className="text-sm font-medium text-gray-700 select-none">
        {label}
      </label>
      <div className="flex gap-2 flex-wrap">
        {colorOptions.map((color: ColorOption) => (
          <motion.button
            key={color.name}
            type="button"
            onClick={() => onChange(color.rgb)}
            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
              selectedColor === color.rgb 
                ? 'border-blue-500 shadow-lg' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color.preview }}
            title={color.name}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {selectedColor === color.rgb && (
              <motion.div
                className="w-full h-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <i className={`fa-solid fa-check text-sm ${
                  color.name === '白色' || color.name === '黄色' 
                    ? 'text-gray-700' 
                    : 'text-white'
                }`}></i>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
