import { motion } from 'framer-motion';
import {
  Clock, ShieldCheck, Target, Radar, Cpu, Zap
} from 'lucide-react';

const benefits = [
  {
    id: 'time',
    number: '01',
    eyebrow: 'Efficiency',
    title: 'Reclaim Your Time',
    headline: 'From 40 hours to 4 minutes.',
    description:
      'Forget manual planning, crew coordination, and post-flight processing. Our AI handles the entire mission lifecycle — so your team focuses on decisions, not drudgery.',
    icon: Clock,
    metric: { value: '10×', unit: 'faster', label: 'Mission turnaround' },
    proof: [
      'Instant mission planning from a prompt',
      'Zero flight prep or crew overhead',
      'Automated reporting & deliverables',
    ],
  },
  {
    id: 'risk',
    number: '02',
    eyebrow: 'Safety',
    title: 'Remove Human Risk',
    headline: 'Dangerous sites, zero exposure.',
    description:
      'Pipeline corridors, chemical facilities, confined spaces — the environments that cost lives now cost nothing but compute. Autonomous agents go where humans shouldn\'t.',
    icon: ShieldCheck,
    metric: { value: '100%', unit: 'coverage', label: 'Zero incidents' },
    proof: [
      'No personnel in hazardous zones',
      'Audit-ready compliance logs',
      'Predictable, repeatable outcomes',
    ],
  },
  {
    id: 'results',
    number: '03',
    eyebrow: 'Performance',
    title: 'Engineer Excellence',
    headline: 'Precision that never clocks out.',
    description:
      'No fatigue. No off-days. No drift. Every flight executes to the exact same standard — week one or week one thousand — with the consistency that only machines deliver.',
    icon: Target,
    metric: { value: '99.9%', unit: 'uptime', label: 'Always working' },
    proof: [
      'Sub-centimeter flight precision',
      '24/7 autonomous operation',
      'Guaranteed data consistency',
    ],
  },
];

const intelligence = [
  {
    icon: Radar,
    title: 'Real-Time Sensing',
    description: 'Weather, airspace, and site conditions ingested live — every second of every mission.',
  },
  {
    icon: Cpu,
    title: 'Autonomous Decisioning',
    description: 'Agents replan, reroute, and adapt mid-flight without waiting for a human in the loop.',
  },
  {
    icon: Zap,
    title: 'Predictive Operations',
    description: 'Forecast battery life, weather windows, and optimal flight paths before takeoff.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function AIAgentsSection() {
  return (
    <section
      id="ai-agents"
      className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950"
    >
      {/* Refined ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ──────────────── EDITORIAL HEADER ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mb-20 lg:mb-28"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.h2
                variants={itemVariants}
                className="text-[44px] sm:text-5xl lg:text-[72px] xl:text-[84px] font-black leading-[0.95] tracking-[-0.03em] text-gray-900 dark:text-white"
              >
                Three outcomes.{' '}
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
                We didn't build another drone tool. We built the autonomous layer that gives time back, removes risk, and delivers results — mission after mission.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ──────────────── 3-COLUMN OUTCOMES ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="mb-24 lg:mb-32"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <motion.article
                  key={b.id}
                  variants={itemVariants}
                  className="group relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl p-8 lg:p-10 overflow-hidden flex flex-col hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-colors duration-500"
                >
                  {/* Decorative gradient */}
                  <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-blue-500/[0.15] via-cyan-500/[0.08] to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Top row — icon + number */}
                  <div className="relative flex items-start justify-between mb-8">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <div className="absolute inset-0 bg-blue-500/10 rounded-2xl rotate-6" />
                      <div className="absolute inset-0 bg-blue-500/5 rounded-2xl -rotate-3" />
                      <div className="relative w-full h-full bg-white dark:bg-slate-950 border border-blue-500/30 rounded-2xl flex items-center justify-center">
                        <Icon size={22} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold tracking-wider text-gray-300 dark:text-white/15">
                      {b.number}
                    </span>
                  </div>

                  {/* Eyebrow */}
                  <div className="relative text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 mb-3">
                    {b.eyebrow}
                  </div>

                  {/* Headline */}
                  <h3 className="relative text-2xl lg:text-[28px] font-black leading-[1.1] tracking-tight text-gray-900 dark:text-white mb-5">
                    {b.headline}
                  </h3>

                  {/* Description */}
                  <p className="relative text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                    {b.description}
                  </p>

                  {/* Divider */}
                  <div className="relative h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent mb-6" />

                  {/* Proof points */}
                  <div className="relative mb-8 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-500 mb-4">
                      What it means
                    </div>
                    <ul className="space-y-2.5">
                      {b.proof.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-3"
                        >
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Metric — footer of card */}
                  <div className="relative bg-white dark:bg-slate-950/50 border border-gray-200 dark:border-white/10 rounded-2xl p-5 mt-auto">
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-500 mb-2">
                      Measured impact
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl lg:text-[44px] font-black tracking-tight text-gray-900 dark:text-white tabular-nums leading-none">
                          {b.metric.value}
                        </span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {b.metric.unit}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-right max-w-[110px] leading-tight">
                        {b.metric.label}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        {/* ──────────────── INTELLIGENCE FOOTER ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          {/* Centered "Powered by" */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-12"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-500">
              Powered by
            </span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 dark:bg-white/10 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
            {intelligence.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  className="group relative bg-white dark:bg-slate-950 p-8 lg:p-10 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-500"
                >
                  <span className="absolute top-6 right-6 text-xs font-mono text-gray-300 dark:text-white/10 font-bold">
                    0{i + 1}
                  </span>

                  <div className="mb-6">
                    <ItemIcon
                      size={24}
                      className="text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                    {item.title}
                  </h4>

                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="absolute bottom-0 left-0 h-px w-0 bg-blue-500 group-hover:w-full transition-all duration-500" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}