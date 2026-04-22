import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const footerLinks = {
  'Technology & Use Cases': [
    { label: 'AI Agents', href: '#ai-agents' },
    { label: 'Voice Control', href: '#technology' },
    { label: 'Autonomous Flight', href: '#technology' },
    { label: 'LiDAR Technology', href: '#technology' },
  ],
  Industries: [
    { label: 'Mining', href: '#industries' },
    { label: 'Energy & Utilities', href: '#industries' },
    { label: 'Infrastructure', href: '#industries' },
    { label: 'Industrial', href: '#industries' },
  ],
  Company: [
    { label: 'About Farness', href: '#about' },
    { label: 'Team', href: '#about' },
    { label: 'Careers', href: '#about' },
    { label: 'Blog', href: '#' },
    { label: 'Case Studies', href: '#' },
    { label: 'Contact', href: '#demo' },
  ],
};

export default function Footer() {
  const { t } = useTranslation();

  const scrollTo = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="relative bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-white/5 overflow-hidden">
      {/* Newsletter bar */}
      <div className="relative border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('footer.newsletter')}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t('footer.newsletterDesc')}</p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 lg:w-72 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-colors"
              />
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                {t('footer.subscribe')} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <button onClick={() => scrollTo('#hero')} className="flex items-center mb-6">
              <div className="overflow-hidden" style={{ height: '54px', width: '162px' }}>
                <img
                  src="/images/Logo-png.png"
                  alt="Farness"
                  className="logo-img block"
                  style={{ height: '162px', width: 'auto', marginTop: '-53px', marginLeft: '0px' }}
                />
              </div>
            </button>

            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              Founded between Tunisia and Paris, Farness transforms commercial drones into autonomous, intelligent fleets for the world's most critical operations.
            </p>

            <div className="space-y-3 mb-6">
              <a href="mailto:Mohamed-Wassim.Mnaouar@farness-ai.com" className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Mail size={14} className="text-blue-500 dark:text-blue-400" />
                Mohamed-Wassim.Mnaouar@farness-ai.com
              </a>
              <a href="tel:+33754325716" className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Phone size={14} className="text-blue-500 dark:text-blue-400" />
                +33 7 54 32 57 16
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={14} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                Farness 📍 Paris – Tunis
              </div>
            </div>

            <div className="flex gap-3">
              {[
                { label: 'in', href: 'https://www.linkedin.com/company/farness/' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all text-sm font-bold"
                  aria-label={link.label}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-5">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollTo(link.href)}
                      className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} Farness Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            {[
              { key: 'privacyPolicy', label: t('footer.privacyPolicy') },
              { key: 'termsOfService', label: t('footer.termsOfService') },
              { key: 'cookiePolicy', label: t('footer.cookiePolicy') },
            ].map((item) => (
              <button key={item.key} className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </footer>
  );
}
