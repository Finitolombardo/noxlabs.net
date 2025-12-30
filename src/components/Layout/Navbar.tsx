import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Start', href: '/' },
    { label: 'Systeme', href: '/systems' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Kontakt', href: '/contact' }
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/dein_abschnittstext_(2).png"
              alt="Obsidian Nexus"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-[#FFF1F4] hidden sm:block">
              Obsidian Nexus
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive(link.href)
                    ? 'text-[#FFF1F4] bg-white/10'
                    : 'text-[#E8DDE1] hover:text-[#FFF1F4] hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <Link
              to="/systems"
              className="px-6 py-2.5 bg-[#F2C94C] text-black font-semibold rounded-lg hover:bg-[#F5D76E] hover:shadow-lg hover:shadow-[#F2C94C]/20 hover:scale-105 transition-all"
            >
              Systeme ansehen
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-all ${
                    isActive(link.href)
                      ? 'text-[#FFF1F4] bg-white/10'
                      : 'text-[#E8DDE1] hover:text-[#FFF1F4] hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/systems"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-4 py-3 bg-[#F2C94C] text-black font-semibold rounded-lg text-center mt-4 hover:bg-[#F5D76E] transition-colors"
              >
                Systeme ansehen
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
