import { Link } from 'react-router-dom';
import NoxLogo from '../UI/NoxLogo';

export default function Footer() {
  return (
    <footer className="relative bg-[#030303] border-t border-white/[0.06] pt-20 pb-10 overflow-hidden">
      {/* Top hairline accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-px bg-gradient-to-r from-transparent via-nox-red/40 to-transparent" />
      {/* Deep ambient bloom */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[220px] rounded-full bg-nox-red/[0.05] blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 mb-16">
          {/* Brand block */}
          <div className="md:col-span-5">
            <div className="mb-5">
              <NoxLogo size="md" />
            </div>
            <p className="text-sm text-nox-white-muted/85 max-w-sm leading-[1.7]">
              High-end AI systems for lead generation, qualification, workflow automation, and scalable business infrastructure.
            </p>
            <div className="mt-8 flex items-center gap-3 text-[10px] font-mono tracking-[0.32em] text-white/30 uppercase">
              <span className="w-8 h-px bg-white/15" />
              <span>Systems · Not Consulting</span>
            </div>
          </div>

          {/* Nav block */}
          <div className="md:col-span-4 md:col-start-7">
            <p className="text-[10px] font-mono tracking-[0.32em] text-nox-red/70 uppercase mb-5">Navigation</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
              <Link to="/" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors duration-300 w-fit">Home</Link>
              <Link to="/systems" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors duration-300 w-fit">Systems</Link>
              <Link to="/configurator" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors duration-300 w-fit">Solution Finder</Link>
              <Link to="/roadmap" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors duration-300 w-fit">Roadmap</Link>
              <Link to="/contact" className="text-sm text-nox-white-muted hover:text-nox-white transition-colors duration-300 w-fit">Contact</Link>
            </div>
          </div>

          {/* Entry layer block */}
          <div className="md:col-span-3">
            <p className="text-[10px] font-mono tracking-[0.32em] text-nox-red/70 uppercase mb-5">Entry Layer</p>
            <p className="text-sm text-nox-white mb-1.5 font-medium">GetVoidra</p>
            <p className="text-xs text-nox-white-muted/70 max-w-[200px] leading-relaxed">
              Produktisierter NOX-Layer. Ready-to-deploy Systeme.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <div className="text-[11px] font-mono tracking-[0.18em] text-white/35 uppercase">
            © 2025 NOX Labs · All rights reserved
          </div>
          <div className="flex items-center gap-7 text-[11px] font-mono tracking-[0.18em] text-white/35 uppercase">
            <Link to="/impressum" className="hover:text-white/70 transition-colors duration-300">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-white/70 transition-colors duration-300">Datenschutz</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
