import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#040404] border-t border-white/[0.06] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold tracking-widest text-nox-white">NOX</span>
              <span className="text-xs font-mono tracking-[0.2em] text-nox-red/80 uppercase">Labs</span>
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
