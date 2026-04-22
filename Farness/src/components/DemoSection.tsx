import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Type definition for Calendly
declare global {
  interface Window {
    Calendly: {
      initPopupWidget: (options: { url: string }) => void;
      // You don't use initInlineWidgets, but it's good to keep if you might in the future
      initInlineWidgets: () => void;
    };
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const useCaseOptions = [
  'Pipeline Inspection',
  'Stockpile Analysis',
  'Anomaly Detection',
  'Site Surveying',
  'Perimeter Security',
  'LiDAR Operations',
];

const companySizes = ['1–50', '51–200', '201–1000', '1000+'];
const industries = ['Mining', 'Energy & Utilities', 'Infrastructure', 'Industrial', 'Other'];

export default function DemoSection() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    industry: '',
    companySize: '',
    phone: '',
    message: '',
    selectedUseCases: [] as string[],
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  const toggleUseCase = (uc: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedUseCases: prev.selectedUseCases.includes(uc)
        ? prev.selectedUseCases.filter((u) => u !== uc)
        : [...prev.selectedUseCases, uc],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // In a real app, you'd make an API call here to save the form data.
    // e.g., await fetch('/api/demo-request', { method: 'POST', body: JSON.stringify(formData) });
    await new Promise((r) => setTimeout(r, 800)); // Simulating network latency
    setSubmitting(false);
    setSubmitted(true);
  };
  
  const openCalendly = () => {
    setShowCalendlyModal(true);
  };

  const closeCalendly = () => {
    setShowCalendlyModal(false);
  };

  // *** CHANGED: Improved useEffect for script loading ***
  // Listen for Calendly booking completion
  useEffect(() => {
    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.data.event === 'calendly.event_scheduled') {
        setBookingComplete(true);
        // Auto-close modal after 1 second
        setTimeout(() => {
          setShowCalendlyModal(false);
          setBookingComplete(false);
        }, 1000);
      }
    };

    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, []);

  useEffect(() => {
    const calendlyScriptSrc = 'https://assets.calendly.com/assets/external/widget.js';

    // 1. Check if the script is already on the page to avoid duplicates
    const existingScript = document.querySelector(`script[src="${calendlyScriptSrc}"]`);

    // 2. Set a state or flag when the script is loaded and ready
    const handleScriptLoad = () => {
      // You can set a state here if needed, e.g., setCalendlyLoaded(true)
      // For this use case, the script being loaded is enough.
      console.log('Calendly script loaded successfully.');
    };

    if (existingScript) {
        // If the script is already there, check if it has loaded.
        // If it's already loaded, window.Calendly will exist.
        // If not, we can add a load listener to the existing script.
        if (!window.Calendly) {
            existingScript.addEventListener('load', handleScriptLoad);
        }
    } else {
        // 3. If it's not there, create it and add the 'load' event listener
        const script = document.createElement('script');
        script.src = calendlyScriptSrc;
        script.async = true;

        script.addEventListener('load', handleScriptLoad);

        document.body.appendChild(script);
    }

    // 4. Cleanup function to remove the event listener when the component unmounts
    return () => {
      const script = document.querySelector(`script[src="${calendlyScriptSrc}"]`);
      if (script) {
        script.removeEventListener('load', handleScriptLoad);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount.


  const benefits = [
    'Personalized product walkthrough',
    'Industry-specific use case demo',
    'ROI calculation for your operation',
    'Q&A with solutions engineer',
    'Free pilot program discussion',
  ];

  return (
    <section
      id="demo"
      className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950"
    >
      {/* ... Rest of your JSX is perfectly fine and does not need to be changed ... */}
      
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ──────────────── EDITORIAL HEADER & FORM ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start"
        >
          {/* Left: Info — 5 cols */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-5"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                {t('demo.badge')}
              </span>
            </div>

            <h2 className="text-[44px] sm:text-5xl lg:text-[56px] xl:text-[64px] font-black leading-[0.95] tracking-[-0.03em] text-gray-900 dark:text-white mb-6">
              {t('demo.title')}
              <br />
              <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                {t('demo.subtitle')}
              </span>
            </h2>

            <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-10 max-w-md">
              {t('demo.description')}
            </p>

            <div className="space-y-4 mb-10">
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit}
                  variants={itemVariants}
                  className="flex items-center gap-3"
                >
                  <CheckCircle size={18} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Proof points — editorial stats */}
            <div className="grid grid-cols-3 border-t border-gray-200 dark:border-white/10">
              {[
                { value: '< 48h', label: 'AI Integration Time' },
                { value: '40%', label: 'Cost Gain' },
                { value: '100%', label: 'Risk Free' },
              ].map((item, j) => (
                <div
                  key={item.label}
                  className={`py-6 ${
                    j !== 0 ? 'border-l border-gray-200 dark:border-white/10 pl-6' : 'pr-6'
                  }`}
                >
                  <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums mb-1">
                    {item.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Form or Calendly — 7 cols */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-7"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 dark:border-blue-500/30 rounded-3xl p-12 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle size={36} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                  Great! Let's Schedule
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-10 max-w-md mx-auto">
                  Click below to open the calendar and select your preferred demo time. You'll receive a confirmation email immediately.
                </p>

                <button
                  onClick={openCalendly}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-base mb-8"
                >
                  <Calendar size={18} />
                  Open Calendar
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your information has been saved. Calendar will open in an overlay.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl p-8 lg:p-10"
              >
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
                  {t('demo.formTitle')}
                </h3>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2">
                      {t('demo.fullName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Mitchell"
                      className="w-full bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2">
                      {t('demo.workEmail')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2">
                      {t('demo.company')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Apex Mining Corp"
                      className="w-full bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2">
                      {t('demo.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Industry */}
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-3">
                    Industry *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setFormData({ ...formData, industry: ind })}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          formData.industry === ind
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-blue-500/40 dark:hover:border-blue-500/40'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company size */}
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-3">
                    Company Size *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {companySizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormData({ ...formData, companySize: size })}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          formData.companySize === size
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-blue-500/40 dark:hover:border-blue-500/40'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Use cases */}
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-3">
                    Use Cases
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {useCaseOptions.map((uc) => (
                      <button
                        key={uc}
                        type="button"
                        onClick={() => toggleUseCase(uc)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          formData.selectedUseCases.includes(uc)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-blue-500/40 dark:hover:border-blue-500/40'
                        }`}
                      >
                        {uc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-8">
                  <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2">
                    Your Challenge
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    placeholder="Describe your current challenges and what you're hoping to achieve..."
                    className="w-full bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-base"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Choose Your Time <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  No commitment. We respond within 24 hours.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Calendly Modal Popup */}
      {showCalendlyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {bookingComplete ? (
              // Success Message
              <div className="h-[90vh] flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mb-6 shadow-2xl"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                </motion.div>

                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-3 text-center">
                  Demo Scheduled! 🎉
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-8 max-w-md">
                  Your meeting with Farness has been confirmed. We'll send you a confirmation email shortly.
                </p>

                <div className="bg-white dark:bg-slate-800/60 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-6 mb-8 w-full max-w-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        <strong>Email:</strong> {formData.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        <strong>Contact:</strong> {formData.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        Confirmation sent to your inbox
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Closing in 1 second...
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Select Your Time
                  </h3>
                  <button
                    onClick={closeCalendly}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Calendly Iframe with Pre-filled Data */}
                <div className="w-full h-[calc(90vh-80px)] overflow-auto">
                  <iframe
                    title="Calendly Booking"
                    src={`https://calendly.com/mohamed-wassim-mnaouar-farness-ai/30min?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`}
                    width="100%"
                    height="100%"
                    style={{ display: 'block', border: 'none' }}
                  />
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </section>
  );
}