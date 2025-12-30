import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { System } from '../../data/systems';

interface SystemCardProps {
  system: System;
  showActions?: boolean;
}

export default function SystemCard({ system, showActions = true }: SystemCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-6 hover:border-[#d6a400]/30 transition-all hover:shadow-xl hover:shadow-[#d6a400]/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#d6a400]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white group-hover:text-[#f5c542] transition-colors">
            {system.name}
          </h3>
          {system.isCustom && (
            <div className="flex items-center gap-1 text-xs text-[#f5c542] bg-[#f5c542]/10 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {system.deliveryTime}
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          {system.oneLiner}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {system.category.map((cat) => (
            <span
              key={cat}
              className="text-xs px-3 py-1 bg-white/5 text-gray-300 rounded-full border border-white/10"
            >
              {cat}
            </span>
          ))}
          {system.channel.slice(0, 2).map((ch) => (
            <span
              key={ch}
              className="text-xs px-3 py-1 bg-[#d6a400]/10 text-[#f5c542] rounded-full border border-[#d6a400]/20"
            >
              {ch}
            </span>
          ))}
        </div>

        {showActions && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/systems/${system.slug}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-[#d6a400]/30 transition-all text-sm font-medium group/btn"
            >
              Details
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/configurator"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#d6a400] to-[#f5c542] text-black rounded-lg hover:shadow-lg hover:shadow-[#d6a400]/20 transition-all text-sm font-semibold"
            >
              Konfigurieren
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
