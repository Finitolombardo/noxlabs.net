import { Link } from 'react-router-dom';
import NoxLogo from '../UI/NoxLogo';

export default function Footer() {
  return (
    <footer className="relative bg-[#030303] border-t border-white/[0.06] py-16 overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[200px] rounded-full bg-nox-red/[0.04] blur-[120px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
          <div>
            <div className="mb-4">
              <NoxLogo size="md" />
            </div>
            <p className="text-sm text-nox-white-muted max-w-xs leading-relaxed">
              High-end AI systems for lead generation, qualification, workflow automation, and scalable business infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-xs font-mono tracking-[0.2em] text-nox-red/60 uppercase mb-4">Navigation</p>
              <div className="flex flex-col gap-3">
                <Link to="/" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors">Home</Link>
                <Link to="/systems" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors">Systems</Link>
                <Link to="/configurator" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors">Solution Finder</Link>
                <Link to="/roadmap" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors">Roadmap</Link>
                <Link to="/contact" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-mono tracking-[0.2em] text-nox-red/60 uppercase mb-4">Entry Layer</p>
              <div className="flex flex-col gap-3">
                <span className="text-sm text-nox-white-muted">GetVoidra</span>
                <p className="text-xs text-nox-white-muted/60 max-w-[160px] leading-relaxed">
                  Ready-to-deploy systems and entry-level automations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <div className="text-xs text-gray-600">
            © 2025 NOX Labs. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <Link to="/impressum" className="hover:text-nox-white-muted transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-nox-white-muted transition-colors">Datenschutz</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
