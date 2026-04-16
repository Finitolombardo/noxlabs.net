import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface CheckboxOptionProps {
  title: string;
  description: string;
  benefit: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function CheckboxOption({
  title,
  description,
  benefit,
  checked,
  onChange
}: CheckboxOptionProps) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="group cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div
        className={`border rounded-xl p-6 transition-all ${
          checked
            ? 'border-[#E84040] bg-[#E84040]/5'
            : 'border-white/10 bg-gradient-to-br from-gray-900/30 to-gray-800/20 hover:border-white/20'
        }`}
      >
        <div className="flex items-start gap-4">
          <motion.div
            animate={{
              scale: checked ? [1, 1.2, 1] : 1,
              backgroundColor: checked ? '#E84040' : 'transparent'
            }}
            transition={{ duration: 0.3 }}
            className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${
              checked ? 'border-[#E84040]' : 'border-white/30'
            }`}
          >
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.div>

          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2">{title}</h4>
            <p className="text-gray-400 text-sm mb-3">{description}</p>
            <p className="text-[#E84040] text-sm font-medium">{benefit}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
