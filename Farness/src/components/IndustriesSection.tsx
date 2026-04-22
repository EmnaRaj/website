import { motion } from 'framer-motion';
import { Mountain, Zap, Building2, Factory, ArrowRight } from 'lucide-react';

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

const industries = [
  {
    id: 'mining',
    icon: Mountain,
    name: 'Mining',
    description: 'Autonomous stockpile analysis, haul road monitoring, and tailings surveillance.',
    keyBenefits: [
      '10-minute full site surveys',
      '98% volume accuracy',
      'Daily monitoring vs quarterly',
    ],
    metrics: {
      time: '85% faster',
      cost: '$2M+ annual savings',
      risk: 'Zero crew exposure',
    },
  },
  {
    id: 'energy',
    icon: Zap,
    name: 'Energy & Utilities',
    description: 'Pipeline inspection, transmission line monitoring, solar efficiency analysis, and wind turbine assessment.',
    keyBenefits: [
      '99.2% defect detection rate',
      'Continuous autonomous monitoring',
      '60% cost reduction vs helicopters',
    ],
    metrics: {
      time: '60% faster detection',
      cost: '70% cost reduction',
      coverage: '24/7 operations',
    },
  },
  {
    id: 'infrastructure',
    icon: Building2,
    name: 'Infrastructure',
    description: 'Bridge inspection, dam safety monitoring, road condition surveys, and construction progress verification.',
    keyBenefits: [
      'Eliminate rope access risks',
      'Survey-grade accuracy',
      'Automated compliance documentation',
    ],
    metrics: {
      time: '10x faster inspections',
      accuracy: '±2cm precision',
      risk: 'Zero access risk',
    },
  },
  {
    id: 'industrial',
    icon: Factory,
    name: 'Industrial Facilities',
    description: 'Tank inspection, flare stack monitoring, confined space assessment, and facility maintenance tracking.',
    keyBenefits: [
      'Zero downtime operations',
      'Confined space remote access',
      'Real-time anomaly detection',
    ],
    metrics: {
      uptime: '100% operational continuity',
      risk: 'Eliminate confined space entry',
      response: 'Real-time alerts',
    },
  },
];

export default function IndustriesSection() {
  return (
    <section
      id="industries"
      className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mb-20 lg:mb-28"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 mb-6"
              >
                <span className="w-8 h-px bg-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  Verticals
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-[44px] sm:text-5xl lg:text-[72px] xl:text-[84px] font-black leading-[0.95] tracking-[-0.03em] text-gray-900 dark:text-white"
              >
                Where stakes{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  are highest.
                </span>
              </motion.h2>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-4 lg:pb-4"
            >
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Four sectors where autonomous precision becomes mission-critical.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Industries Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          {industries.map((industry) => {
            const Icon = industry.icon;
            return (
              <motion.div
                key={industry.id}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 p-8 lg:p-10 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-500"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                  <Icon size={28} className="text-white" strokeWidth={2} />
                </div>

                {/* Industry Name */}
                <h3 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                  {industry.name}
                </h3>

                {/* Description */}
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                  {industry.description}
                </p>

                {/* Key Benefits */}
                <div className="space-y-3 mb-8">
                  {industry.keyBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-200 dark:border-white/10">
                  {Object.entries(industry.metrics).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {value}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-500" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mt-20 lg:mt-28"
        >
          <motion.div
            variants={itemVariants}
            className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 p-12 lg:p-16 text-center overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="relative">
              <h3 className="text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                Ready to transform your operations?
              </h3>
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Schedule a consultation to explore how autonomous systems can eliminate inefficiency, reduce risk, and unlock new capabilities in your industry.
              </p>
              <button
                onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-5 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-lg group"
              >
                <span>Schedule Consultation</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
