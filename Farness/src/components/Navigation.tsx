import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ExternalLink, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const navItems = [
  {
    label: 'Technology & Use Cases',
    path: '/technology',
    children: [
      { label: 'AI Agents', path: '/ai-agents', desc: 'Multi-agent autonomous system' },
      { label: 'Voice Control', path: '/technology', desc: 'Natural language missions' },
      { label: 'Autonomous Flight', path: '/technology', desc: 'Self-piloting drones' },
      { label: 'LiDAR & Mapping', path: '/technology', desc: '3D point cloud capture' },
    ],
  },
  {
    label: 'Industries',
    path: '/industries',
    children: [
      { label: 'Mining', path: '/industries', desc: 'Open pit & underground' },
      { label: 'Energy & Utilities', path: '/industries', desc: 'Pipeline & grid inspection' },
      { label: 'Infrastructure', path: '/industries', desc: 'Bridges & structures' },
      { label: 'Industrial', path: '/industries', desc: 'Facilities & plants' },
    ],
  },
  { label: 'Platform', path: '/platform' },
  { label: 'About', path: '/#about' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { i18n, t } = useTranslation();
  const location = useLocation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' },
  ];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangDropdownOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setLangDropdownOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg ${
          isScrolled
            ? 'bg-white/95 dark:bg-slate-900/95 border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-xl dark:shadow-black/20'
            : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="overflow-hidden" style={{ height: '54px', width: '162px' }}>
                <img
                  src="/images/Logo-png.png"
                  alt="Farness"
                  className="logo-img block"
                  style={{ height: '162px', width: 'auto', marginTop: '-53px', marginLeft: '0px' }}
                />
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.label === 'About' ? (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        setActiveDropdown(null);
                        if (location.pathname === '/') {
                          scrollTo('#about');
                        } else {
                          window.location.href = '/#about';
                        }
                      }}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                      {item.label}
                      {item.children && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                        />
                      )}
                    </Link>
                  )}

                  {item.children && (
                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/40 overflow-hidden p-2"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              to={child.path}
                              className="w-full flex flex-col items-start px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-left group"
                              onClick={() => {
                                setActiveDropdown(null);
                                setMobileOpen(false);
                              }}
                            >
                              <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {child.label}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{child.desc}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  aria-label="Change language"
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center gap-1"
                >
                  <Globe size={18} />
                  <span className="text-xs font-semibold">{i18n.language.toUpperCase()}</span>
                </button>

                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/40 overflow-hidden p-2"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            i18n.language === lang.code
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="https://platform.farness.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('nav.platformLink')} <ExternalLink size={12} />
              </a>
              <button
                onClick={() => {
                  if (location.pathname === '/') {
                    scrollTo('#demo');
                  } else {
                    window.location.href = '/#demo';
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
              >
                {t('nav.bookDemo')}
              </button>
            </div>

            {/* Mobile right: theme toggle + language + menu */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  aria-label="Change language"
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all flex items-center gap-1"
                >
                  <Globe size={18} />
                </button>

                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/40 overflow-hidden p-2"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            i18n.language === lang.code
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-white/98 dark:bg-slate-900/95 backdrop-blur-xl">
              <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <div key={item.label}>
                      {item.label === 'About' ? (
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            if (location.pathname === '/') {
                              scrollTo('#about');
                            } else {
                              window.location.href = '/#about';
                            }
                          }}
                          className="w-full text-left px-4 py-3 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <Link
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className="w-full text-left px-4 py-3 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                        >
                          {item.label}
                        </Link>
                      )}
                      {item.children && (
                        <div className="ml-4 space-y-1 mb-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              to={child.path}
                              onClick={() => setMobileOpen(false)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors block"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => {
                      if (location.pathname === '/') {
                        scrollTo('#demo');
                      } else {
                        window.location.href = '/#demo';
                      }
                      setMobileOpen(false);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl"
                  >
                    {t('nav.bookDemo')}
                  </button>
                  <a
                    href="https://platform.farness.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-semibold rounded-xl"
                  >
                    {t('nav.platformLink')} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
