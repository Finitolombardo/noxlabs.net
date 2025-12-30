import { motion } from 'framer-motion';

interface ChipFilterProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function ChipFilter({ label, active, onClick }: ChipFilterProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-[#d6a400] to-[#f5c542] text-black shadow-lg shadow-[#d6a400]/20'
          : 'bg-white/5 text-gray-300 border border-white/10 hover:border-[#d6a400]/30 hover:bg-white/10'
      }`}
    >
      {label}
    </motion.button>
  );
}
