import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Brain, Cpu, Factory, Command, Check, BookOpen
} from 'lucide-react';

const panels = [
  {
    id: 'ai-agents',
    path: '/ai-agents',
    number: '01',
    label: 'Intelligent Platform',
    title: 'AI Agents',
    tagline: 'Think. Decide. Execute.',
    description:
      'Autonomous agents that plan missions, adapt mid-flight, and deliver results without human intervention.',
    highlight: '24/7 Autonomous',
    icon: Brain,
    featured: true,
  },
  {
    id: 'technology',
    path: '/technology',
    number: '02',
    label: 'Solutions & Hardware',
    title: 'Technology & Use Cases',
    tagline: 'Precision meets purpose.',
    description:
      'Industry-proven workflows paired with advanced aerial platforms and custom AI. From pipeline inspections to stockpile analysis—engineered for reliability and precision at scale.',
    highlight: '±2cm Accuracy',
    icon: Cpu,
    featured: false,
  },
  {
    id: 'industries',
    path: '/industries',
    number: '03',
    label: 'Verticals',
    title: 'Industries',
    tagline: 'Where stakes are highest.',
    description:
      'Mining, energy & utilities, infrastructure, and industrial facilities — heavy industries where autonomous precision becomes mission-critical.',
    highlight: 'Four Core Sectors',
    icon: Factory,
    featured: false,
  },
  {
    id: 'platform',
    path: '/platform',
    number: '04',
    label: 'Command Center',
    title: 'Platform',
    tagline: 'One pane of glass.',
    description:
      'Mission control, live monitoring, and compliance reporting — unified in a single interface your team already understands.',
    highlight: 'Enterprise-Grade',
    icon: Command,
    featured: false,
  },
  {
    id: 'blog',
    path: '/blog',
    number: '05',
    label: 'Insights & Stories',
    title: 'Blog',
    tagline: 'Knowledge shared.',
    description:
      'Deep dives into autonomous systems, drone technology, and industrial AI. Expert insights and real-world case studies.',
    highlight: 'Expert Insights',
    icon: BookOpen,
    featured: false,
  },
];

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

export default function FeaturePanels() {
  const featured = panels.find((p) => p.featured)!;
  const rest = panels.filter((p) => !p.featured);

  return (
    <section className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ──────────────── HEADER ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mb-20 lg:mb-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 mb-6"
              >
                <span className="w-8 h-px bg-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  The Ecosystem
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-[44px] sm:text-5xl lg:text-[72px] xl:text-[84px] font-black leading-[0.95] tracking-[-0.03em] text-gray-900 dark:text-white"
              >
                Every capability.{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  One platform.
                </span>
              </motion.h2>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-4 lg:pb-4"
            >
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Each component is engineered to stand alone — and designed to work together. Explore what Farness unlocks for your operations.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ──────────────── FEATURED PANEL (hero card) ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="mb-8 lg:mb-10"
        >
          <motion.div variants={itemVariants}>
            <Link to={featured.path} className="group block">
              <article className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-500">

                {/* Decorative gradient */}
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.15] via-cyan-500/[0.08] to-transparent rounded-full blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 p-8 lg:p-12 items-center">

                  {/* ─── LEFT — Content (6 cols) ─── */}
                  <div className="lg:col-span-6">
                    {/* Top meta row */}
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-xs font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400">
                        {featured.number}
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-blue-500/40 to-transparent max-w-[80px]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                        {featured.label}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live Now
                      </span>
                    </div>

                    <h3 className="text-4xl lg:text-5xl xl:text-[64px] font-black leading-[1] tracking-[-0.02em] text-gray-900 dark:text-white mb-4">
                      {featured.title}
                    </h3>

                    <p className="text-xl lg:text-2xl italic font-serif font-normal text-blue-600 dark:text-blue-400 mb-6">
                      {featured.tagline}
                    </p>

                    <p className="text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-10 max-w-xl">
                      {featured.description}
                    </p>

                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="inline-flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/25 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                          {featured.highlight}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <span>Explore the agents</span>
                        <ArrowUpRight
                          size={18}
                          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ─── RIGHT — Realistic product panel (6 cols) ─── */}
                  <div className="lg:col-span-6 relative">
                    <div className="relative">
                      {/* Shadow under the panel */}
                      <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-3xl opacity-50" />

                      {/* Terminal/Agent interface mockup */}
                      <div className="relative bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/50">

                        {/* Terminal chrome */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                          </div>
                          <span className="text-[10px] font-mono text-white/40">
                            agent · farness.ai
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVE
                          </span>
                        </div>

                        {/* Terminal content */}
                        <div className="p-5 lg:p-6 font-mono text-[13px] leading-relaxed space-y-3">
                          {/* Prompt */}
                          <div className="flex items-start gap-2">
                            <span className="text-blue-400 shrink-0">{'>'}</span>
                            <span className="text-white/90">
                              Inspect pipeline segment 7-A at 0600
                            </span>
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-white/5" />

                          {/* Agent thinking */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="flex items-start gap-2"
                          >
                            <Brain size={14} className="text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-white/70">
                              <span className="text-blue-400">Planning</span>
                              <span className="text-white/30"> · Analyzing flight corridor...</span>
                            </div>
                          </motion.div>

                          {/* Task list */}
                          <div className="space-y-2 pl-6 pt-1">
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 }}
                              className="flex items-center gap-2.5 text-[12px]"
                            >
                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                                <Check size={9} className="text-emerald-400" strokeWidth={3} />
                              </div>
                              <span className="text-white/70">Weather check</span>
                              <span className="text-emerald-400/60 ml-auto text-[11px]">OK</span>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.9 }}
                              className="flex items-center gap-2.5 text-[12px]"
                            >
                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                                <Check size={9} className="text-emerald-400" strokeWidth={3} />
                              </div>
                              <span className="text-white/70">Airspace cleared</span>
                              <span className="text-emerald-400/60 ml-auto text-[11px]">OK</span>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.2 }}
                              className="flex items-center gap-2.5 text-[12px]"
                            >
                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                                <Check size={9} className="text-emerald-400" strokeWidth={3} />
                              </div>
                              <span className="text-white/70">Flight path optimized</span>
                              <span className="text-emerald-400/60 ml-auto text-[11px]">4.2 km</span>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.5 }}
                              className="flex items-center gap-2.5 text-[12px]"
                            >
                              <div className="w-4 h-4 rounded-full border-2 border-blue-400 flex items-center justify-center flex-shrink-0">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                  className="w-2 h-2 rounded-full border border-blue-400 border-t-transparent"
                                />
                              </div>
                              <span className="text-white">Executing mission</span>
                              <span className="text-blue-400 ml-auto text-[11px]">23%</span>
                            </motion.div>
                          </div>

                          {/* Live stats */}
                          <div className="pt-3 mt-2 border-t border-white/5 grid grid-cols-3 gap-3 text-[11px]">
                            <div>
                              <div className="text-white/30 text-[9px] uppercase tracking-wider mb-1">Altitude</div>
                              <div className="text-white font-bold">47m</div>
                            </div>
                            <div>
                              <div className="text-white/30 text-[9px] uppercase tracking-wider mb-1">Speed</div>
                              <div className="text-white font-bold">8.2 m/s</div>
                            </div>
                            <div>
                              <div className="text-white/30 text-[9px] uppercase tracking-wider mb-1">Battery</div>
                              <div className="text-emerald-400 font-bold">94%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Floating accent badge */}
                      <div className="absolute -top-3 -right-3 bg-gradient-to-br from-blue-600 to-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/40 rotate-3">
                        Autonomous
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-700" />
              </article>
            </Link>
          </motion.div>
        </motion.div>

        {/* ──────────────── PANELS GRID (2x2) ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          {rest.map((panel) => {
            const Icon = panel.icon;
            return (
              <motion.div key={panel.id} variants={itemVariants}>
                <Link to={panel.path} className="group h-full block">
                  <article className="relative h-full overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-500 p-8 lg:p-10 flex flex-col">

                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-blue-500/[0.12] via-cyan-500/[0.06] to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* Top row */}
                    <div className="relative flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold tracking-wider text-gray-300 dark:text-white/15">
                          {panel.number}
                        </span>
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <div className="absolute inset-0 bg-blue-500/10 rounded-xl rotate-6" />
                          <div className="relative w-full h-full bg-white dark:bg-slate-950 border border-blue-500/30 rounded-xl flex items-center justify-center">
                            <Icon size={20} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
                          </div>
                        </div>
                      </div>

                      <ArrowUpRight
                        size={20}
                        className="text-gray-300 dark:text-white/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                      />
                    </div>

                    <div className="relative text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 mb-3">
                      {panel.label}
                    </div>

                    <h3 className="relative text-3xl lg:text-[36px] font-black text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">
                      {panel.title}
                    </h3>

                    <p className="relative text-lg italic font-serif font-normal text-blue-600 dark:text-blue-400 mb-5">
                      {panel.tagline}
                    </p>

                    <p className="relative text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed mb-8 flex-1">
                      {panel.description}
                    </p>

                    <div className="relative h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent mb-6" />

                    <div className="relative flex items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-2 bg-blue-500/8 border border-blue-500/20 px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                          {panel.highlight}
                        </span>
                      </div>

                      <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Explore →
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-500" />
                  </article>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}