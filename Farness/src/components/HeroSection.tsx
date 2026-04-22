import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown, Play } from 'lucide-react';

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

export default function HeroSection() {
  const { t } = useTranslation();

  const metrics = [
    { value: '10×', label: t('hero.metrics.faster', 'Faster operations') },
    { value: '87%', label: t('hero.metrics.cost', 'Cost reduction') },
    { value: '24/7', label: t('hero.metrics.always', 'Always working') },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden bg-white dark:bg-slate-950 pt-28 pb-32"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/image.png"
          alt=""
          className="w-full h-full object-cover opacity-[0.07] dark:opacity-[0.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/30 to-white/95 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.2]" />

        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-blue-500/[0.07] dark:bg-blue-600/[0.13] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-cyan-400/[0.06] dark:bg-cyan-500/[0.1] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 min-h-[calc(100vh-220px)] flex items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          {/* ─────── LEFT — Content (5 cols — tighter) ─────── */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-5 flex flex-col"
          >
            {/* Eyebrow */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 mb-7"
            >
              <span className="w-8 h-px bg-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                {t('hero.eyebrow', 'Autonomous Drone Operations')}
              </span>
            </motion.div>

            {/* Headline — reduced scale for balance */}
            <motion.h1
              variants={itemVariants}
              className="text-[40px] sm:text-5xl lg:text-[56px] xl:text-[64px] font-black leading-[1.02] tracking-[-0.03em] text-gray-900 dark:text-white mb-7"
            >
              {t('hero.title1', 'Speak your')}{' '}
              <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                {t('hero.title2', 'mission.')}
              </span>
              <br />
              {t('hero.title3', 'AI does the rest.')}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-9 max-w-xl border-l-2 border-blue-500/40 pl-5"
            >
              {t(
                'hero.description',
                'Farness transforms natural language commands into fully autonomous drone missions. Pipeline inspections, stockpile analysis, site surveys — all at the speed of speech.'
              )}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3 mb-10"
            >
              <button
                onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50"
              >
                {t('hero.bookDemo', 'Book a Demo')}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-semibold px-6 py-3.5 rounded-xl border border-gray-300 dark:border-white/15 hover:border-gray-900 dark:hover:border-white/40 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                <Play size={13} className="text-blue-600 dark:text-blue-400" fill="currentColor" />
                {t('hero.see', 'See Demo')}
              </button>
            </motion.div>

            {/* Metrics — editorial row with dividers */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 border-t border-gray-200 dark:border-white/10 pt-6"
            >
              {metrics.map((stat, i) => (
                <div
                  key={stat.value}
                  className={`${
                    i !== 0 ? 'border-l border-gray-200 dark:border-white/10 pl-5' : 'pr-5'
                  }`}
                >
                  <div className="text-3xl lg:text-[40px] font-black text-gray-900 dark:text-white tabular-nums tracking-tight leading-none mb-2">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500 leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ─────── RIGHT — Video (7 cols — more presence) ─────── */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-7 relative"
            style={{ perspective: '2000px' }}
          >
            <div className="relative py-6 lg:py-10 px-2 lg:px-4">
              {/* Outer ambient glow */}
              <div
                className="absolute inset-4 bg-gradient-to-tr from-blue-600/40 via-cyan-500/30 to-blue-500/40 rounded-[2.5rem] blur-3xl opacity-80"
                style={{ transform: 'rotateY(-12deg) rotateX(4deg) rotateZ(-2deg)' }}
              />

              {/* 3D tilted video panel */}
              <motion.div
                initial={{ opacity: 0, rotateY: -25, scale: 0.9 }}
                animate={{ opacity: 1, rotateY: -12, scale: 1 }}
                transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ rotateY: -6, rotateX: 2, scale: 1.02 }}
                className="relative group"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(-12deg) rotateX(4deg) rotateZ(-2deg)',
                  transformOrigin: 'center center',
                }}
              >
                <div className="relative p-[2px] bg-gradient-to-br from-blue-400/80 via-cyan-400/60 to-blue-600/80 rounded-2xl shadow-[0_40px_80px_-20px_rgba(8,47,120,0.6)] dark:shadow-[0_40px_80px_-20px_rgba(59,130,246,0.4)]">
                  <div className="relative bg-slate-950 rounded-[calc(1rem-2px)] overflow-hidden">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-1.5 px-5 py-3.5 bg-slate-900/90 backdrop-blur border-b border-white/5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <span className="w-3 h-3 rounded-full bg-green-500/80" />
                      <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[11px] text-white/60 font-mono tracking-wide">
                            app.farness.ai
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Glint sweep */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                      <motion.div
                        initial={{ x: '-150%' }}
                        animate={{ x: '150%' }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 4,
                          ease: 'linear',
                        }}
                        className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/[0.1] to-transparent skew-x-12"
                      />
                    </div>

                    {/* Video */}
                    <video
                      src="/videos/platform-demo.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full aspect-video object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>

                {/* Subtle reflection */}
                <div
                  className="absolute top-full left-0 right-0 h-24 bg-gradient-to-b from-blue-500/10 to-transparent blur-2xl opacity-60 pointer-events-none"
                  style={{ transform: 'scaleY(-1) translateY(-20%)' }}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll hint — positioned below, not overlapping */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={() => document.querySelector('#ai-agents')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors z-20"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold">
          {t('hero.explore', 'Explore')}
        </span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>
    </section>
  );
}