import { motion } from 'framer-motion';

interface IntegrationChipProps {
  name: string;
}

export default function IntegrationChip({ name }: IntegrationChipProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="px-4 py-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-lg text-sm text-gray-300 hover:border-[#E84040]/30 hover:text-white transition-all cursor-default"
    >
      {name}
    </motion.div>
  );
}
