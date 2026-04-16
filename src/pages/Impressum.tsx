import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Impressum() {
  return (
    <div className="relative min-h-screen py-28 px-4 noise">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-nox-red/[0.05] blur-[140px] pointer-events-none" />
      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-nox-white-muted hover:text-nox-red transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-white/[0.07] rounded-2xl p-8 md:p-12 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[2px] bg-nox-red" />
            <span className="text-[15px] font-mono font-bold tracking-[0.26em] text-[#FF6B6B] uppercase">
              Rechtliches
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-nox-white mb-8 tracking-[-0.02em] text-depth-red-subtle">
            Impressum
          </h1>

          <div className="space-y-8 text-nox-white-muted leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Angaben gemäß § 5 TMG
              </h2>
              <div className="space-y-2">
                <p className="font-semibold text-nox-white">NOX</p>
                <p>Alexander Lapizky</p>
                <p>Bessererstraße 16/2</p>
                <p>89073 Ulm</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Kontakt
              </h2>
              <p>
                E-Mail:{' '}
                <a
                  href="mailto:admin@alphamindhub.com"
                  className="text-nox-red hover:underline"
                >
                  admin@alphamindhub.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Umsatzsteuer-ID
              </h2>
              <p>
                Eine Umsatzsteuer-Identifikationsnummer nach §27a Umsatzsteuergesetz liegt nicht vor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Steuernummer
              </h2>
              <p>
                Eine Steuernummer wurde noch nicht vergeben.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                EU-Streitschlichtung
              </h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nox-red hover:underline break-all"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                .<br />
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </h2>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Haftung für Inhalte
              </h2>
              <p className="mb-4">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p className="mb-4">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Haftung für Links
              </h2>
              <p className="mb-4">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              <p className="mb-4">
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-nox-white mb-4">
                Urheberrecht
              </h2>
              <p className="mb-4">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p className="mb-4">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
