import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NoxLogo from '../UI/NoxLogo';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Start', href: '/' },
    { label: 'Systeme', href: '/systems' },
    { label: 'Lösungsfinder', href: '/configurator' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Kontakt', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#050505]/85 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_0_rgba(201,48,48,0.06)]'
          : 'bg-[#070707]/40 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center group">
            <NoxLogo size="md" />
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-nox-white bg-white/[0.08]'
                    : 'text-nox-white-muted hover:text-nox-white hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <Link
              to="/contact"
              className="relative px-5 py-2.5 bg-nox-red text-white text-sm font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 shadow-[0_0_0_1px_rgba(232,64,64,0.2),0_8px_24px_-8px_rgba(201,48,48,0.5)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.35),0_12px_32px_-8px_rgba(201,48,48,0.65)] group overflow-hidden"
            >
              <span className="relative z-10">Gespräch buchen</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-nox-white-muted hover:text-nox-white p-2 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#070707]/98 border-t border-white/[0.06]"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm rounded-lg transition-all ${
                    isActive(link.href)
                      ? 'text-nox-white bg-white/[0.08]'
                      : 'text-nox-white-muted hover:text-nox-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-4 py-3 bg-nox-red text-white text-sm font-semibold rounded-lg text-center mt-3 hover:bg-nox-red-deep transition-colors"
              >
                Gespräch buchen
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
