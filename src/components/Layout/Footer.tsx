import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-nox-yellow" />
            <span className="text-lg font-bold text-nox-white">NOX</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-nox-white-muted">
            <Link to="/" className="hover:text-nox-yellow transition-colors">
              Start
            </Link>
            <Link to="/systems" className="hover:text-nox-yellow transition-colors">
              Systeme
            </Link>
            <Link to="/roadmap" className="hover:text-nox-yellow transition-colors">
              Roadmap
            </Link>
            <Link to="/contact" className="hover:text-nox-yellow transition-colors">
              Kontakt
            </Link>
            <span className="text-gray-600">|</span>
            <Link to="/impressum" className="hover:text-nox-yellow transition-colors">
              Impressum
            </Link>
            <Link to="/datenschutz" className="hover:text-nox-yellow transition-colors">
              Datenschutz
            </Link>
          </div>

          <div className="text-sm text-gray-500">
            © 2025 NOX. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </footer>
  );
}
