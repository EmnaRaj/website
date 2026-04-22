import { motion } from 'framer-motion';
import { 
  Monitor, Map, Bell, BarChart3, Database, Shield, 
  ArrowRight, Check, Brain, Zap, Quote, Cloud, Server, GitBranch
} from 'lucide-react';

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

const platformCapabilities = [
  {
    icon: Brain,
    title: 'AI Mission Planning',
    description: 'Natural language to autonomous flight. Tell the system what you need—it handles the rest.',
  },
  {
    icon: Map,
    title: 'Real-Time Tracking',
    description: 'Live GPS positioning and flight path monitoring across all active drones.',
  },
  {
    icon: BarChart3,
    title: 'Automated Analysis',
    description: 'Computer vision processes imagery on-board and delivers actionable reports instantly.',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'AI-detected anomalies trigger immediate notifications to your team.',
  },
  {
    icon: Database,
    title: 'Data Management',
    description: 'Centralized storage with multi-format export (PDF, Excel, GeoTIFF, LAS).',
  },
  {
    icon: Shield,
    title: 'Secure Access',
    description: 'Role-based permissions and encrypted data storage for enterprise operations.',
  },
];

const deploymentOptions = [
  {
    id: 'cloud',
    icon: Cloud,
    name: 'Cloud',
    tagline: 'Fully managed platform',
    description: 'Access Farness from anywhere. We handle infrastructure, updates, and scaling. You focus on operations.',
    features: [
      'Instant setup—no installation required',
      'Automatic updates and improvements',
      'Access from any device, anywhere',
      'Managed infrastructure and backups',
      'Pay-as-you-grow pricing model',
    ],
    highlight: 'Perfect for getting started quickly',
    color: 'slate', // Professional slate/gray
  },
  {
    id: 'enterprise',
    icon: Server,
    name: 'Enterprise',
    tagline: 'Self-hosted deployment',
    description: 'Deploy Farness on your own infrastructure. Complete control over data, security, and compliance.',
    features: [
      'Deploy on your private cloud or servers',
      'Full data sovereignty and control',
      'Custom security configurations',
      'Integration with existing IT policies',
      'Dedicated technical support team',
    ],
    highlight: 'For organizations with strict compliance',
    color: 'blue', // Professional navy/blue
    recommended: true,
  },
  {
    id: 'hybrid',
    icon: GitBranch,
    name: 'Hybrid',
    tagline: 'Best of both worlds',
    description: 'Edge processing on-site, cloud analytics and storage. Optimal for remote operations with limited connectivity.',
    features: [
      'Local processing for offline capability',
      'Cloud sync when connectivity available',
      'Reduced bandwidth requirements',
      'Real-time on-site decisions',
      'Centralized fleet management',
    ],
    highlight: 'Ideal for remote industrial sites',
    color: 'indigo', // Professional deep indigo
  },
];

export default function PlatformSection() {
  return (
    <section
      id="platform"
      className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.08]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ──────────────── HEADER ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mb-20 lg:mb-28"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-7">
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 mb-6"
              >
                <span className="w-8 h-px bg-blue-500 dark:bg-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-600 dark:text-gray-400">
                  The Platform
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-[44px] sm:text-5xl lg:text-[64px] xl:text-[72px] font-black leading-[0.95] tracking-[-0.03em] text-gray-900 dark:text-white"
              >
                One platform.{' '}
                <span className="italic font-serif font-normal text-gray-600 dark:text-gray-400">
                  Your way.
                </span>
              </motion.h2>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-5 lg:pb-2"
            >
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Mission control, real-time monitoring, and AI-powered analytics. Deployed on your terms—cloud, on-premise, or hybrid.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ──────────────── CORE CAPABILITIES ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="mb-28 lg:mb-36"
        >
          <motion.div
            variants={itemVariants}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-blue-500 dark:bg-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-600 dark:text-gray-400">
                Core Capabilities
              </span>
            </div>
            <h3 className="text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
              What you get with{' '}
              <span className="italic font-serif font-normal text-gray-600 dark:text-gray-400">
                Farness.
              </span>
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformCapabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <motion.div
                  key={capability.title}
                  variants={itemVariants}
                  className="group relative bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-2xl p-8 hover:border-blue-400 dark:hover:border-blue-500/40 transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <Icon size={26} className="text-gray-700 dark:text-gray-300" strokeWidth={2} />
                  </div>

                  {/* Title */}
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                    {capability.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {capability.description}
                  </p>

                  {/* Hover accent */}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-slate-400 dark:bg-blue-500 group-hover:w-full transition-all duration-500" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ──────────────── DEPLOYMENT OPTIONS ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="mb-28 lg:mb-36"
        >
          <motion.div
            variants={itemVariants}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-blue-500 dark:bg-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-600 dark:text-gray-400">
                Deployment Options
              </span>
            </div>

            <h3 className="text-4xl lg:text-5xl xl:text-[64px] font-black leading-[0.95] tracking-tight text-gray-900 dark:text-white mb-6">
              Deploy{' '}
              <span className="italic font-serif font-normal text-gray-600 dark:text-gray-400">
                on your terms.
              </span>
            </h3>

            <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
              Choose the deployment model that matches your infrastructure, compliance requirements, and operational needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {deploymentOptions.map((option) => {
              const Icon = option.icon;
              const isRecommended = option.recommended;
              
              return (
                <motion.div
                  key={option.id}
                  variants={itemVariants}
                  className={`group relative bg-white dark:bg-slate-900/50 border-2 rounded-3xl p-8 lg:p-10 transition-all duration-300 ${
                    isRecommended
                      ? 'border-slate-900 dark:border-white shadow-xl'
                      : 'border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/40'
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-blue-600 dark:bg-blue-500 text-white dark:text-blue-600 px-4 py-2 rounded-full shadow-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                    isRecommended
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Icon 
                      size={32} 
                      className={isRecommended ? 'text-white dark:text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'} 
                      strokeWidth={2} 
                    />
                  </div>

                  {/* Name */}
                  <h4 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    {option.name}
                  </h4>

                  {/* Tagline */}
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">
                    {option.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                    {option.description}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-blue-200 dark:bg-blue-900/20 mb-8" />

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {option.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isRecommended
                            ? 'bg-blue-600 dark:bg-blue-500'
                            : 'bg-blue-200 dark:bg-blue-900/20'
                        }`}>
                          <Check 
                            size={12} 
                            className={isRecommended ? 'text-white dark:text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'} 
                            strokeWidth={3} 
                          />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Highlight */}
                  <div className={`p-4 rounded-xl ${
                    isRecommended
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20'
                      : 'bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-500/20'
                  }`}>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {option.highlight}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ──────────────── VOICE FROM THE FIELD ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mb-28 lg:mb-36"
        >
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden"
          >
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-blue-950/20 dark:via-slate-900/80 dark:to-slate-900 rounded-3xl p-12 lg:p-14 border border-blue-500/20 dark:border-blue-500/30 backdrop-blur-sm">
              {/* Subtle corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-blue-400/20 rounded-tr-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-blue-400/20 rounded-tl-3xl" />

              {/* Ambient glow (subtle) */}
              <div className="absolute top-1/2 -right-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

              <div className="relative space-y-8">
                {/* Eyebrow */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-px bg-blue-400/50" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300/70">
                    Customer Success
                  </span>
                </div>

                {/* Quote */}
                <blockquote className="space-y-4">
                  <Quote size={28} className="text-blue-400/40" strokeWidth={1.5} />
                  <p className="text-lg lg:text-xl xl:text-2xl font-semibold text-white leading-relaxed tracking-tight">
                    "Farness transformed how we handle data mining operations. The autonomous intelligence reduced our inspection time by 60% while improving accuracy. It's the tool we've been waiting for."
                  </p>
                </blockquote>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-blue-500/20 to-transparent" />

                {/* Attribution */}
                <div className="flex items-center gap-4 pt-2">
                  <img
                    src="/users/romain virgilio.png"
                    alt="Romain Virgilio"
                    className="w-14 h-14 rounded-full object-cover border border-blue-400/30"
                  />
                  <div>
                    <div className="text-base font-bold text-white">
                      Romain Virgilio
                    </div>
                    <div className="text-sm text-blue-200/60 font-medium">
                      Data Mining Expert
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ──────────────── FINAL CTA ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-white dark:bg-slate-900/50 border-2 border-gray-200 dark:border-white/10 rounded-3xl p-12 lg:p-16">
            <h4 className="text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Ready to discuss deployment?
            </h4>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Schedule a technical consultation to discuss which deployment model fits your infrastructure, compliance, and operational requirements.
            </p>
            <button
              onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-3 bg-blue-600 dark:bg-blue-500 text-white dark:text-blue-600 font-bold px-10 py-5 rounded-xl hover:bg-blue-700 dark:hover:bg-slate-100 transition-all text-lg shadow-lg"
            >
              <span>Schedule Consultation</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-500 mt-6">
              Custom pricing • Flexible contracts • Enterprise support
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}