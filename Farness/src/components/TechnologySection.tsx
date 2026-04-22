import { motion } from 'framer-motion';
import {
  Brain, Camera, Radio, Database, Layers, Zap,
  Sparkles
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

// Core technology capabilities
const coreTech = [
  {
    icon: Brain,
    title: 'AI Mission Planning',
    subtitle: 'Autonomous Intelligence',
    description: 'Transform natural language into complete autonomous missions. Our AI agents handle planning, execution, and adaptation—turning any industrial site into a fully autonomous operation.',
    features: [
      'Voice-to-mission translation',
      'Real-time path optimization',
      'Obstacle avoidance & replanning',
      'Multi-drone coordination',
    ],
    badge: 'Core Platform',
    gradient: 'from-blue-600 to-blue-500',
  },
  {
    icon: Camera,
    title: 'Computer Vision',
    subtitle: 'AI-Powered Detection',
    description: 'Deep learning models trained for industrial environments. Detect anomalies, classify defects, and survey infrastructure with precision that exceeds human inspection.',
    features: [
      'Anomaly detection',
      'Defect classification',
      'Infrastructure surveying',
      'Real-time visual analysis',
    ],
    badge: 'Detection Engine',
    gradient: 'from-cyan-600 to-blue-500',
  },
  {
    icon: Radio,
    title: 'LiDAR Mapping',
    subtitle: 'Precision 3D Capture',
    description: 'High-resolution LiDAR sensors for specialized missions requiring centimeter-level accuracy. Available for terrain modeling, asset inspection, and volumetric analysis.',
    features: [
      '±2cm accuracy',
      '3D point cloud processing',
      'Terrain modeling',
      'Asset digitization',
    ],
    badge: 'Optional Add-on',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Layers,
    title: 'Photogrammetry',
    subtitle: 'Stockpile & Volume Analysis',
    description: 'Advanced photogrammetry for accurate volume calculations and stockpile management. Generate orthophotos, DEMs, and precise measurements for inventory tracking.',
    features: [
      'Volume calculations',
      'Stockpile analysis',
      'Orthophoto generation',
      'Digital elevation models',
    ],
    badge: 'Surveying',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    icon: Database,
    title: 'Data Management',
    subtitle: 'Unified Intelligence',
    description: 'Centralized platform for all mission data, analytics, and reporting. Seamlessly integrate with your existing workflows and export in industry-standard formats.',
    features: [
      'Mission history & analytics',
      'Automated reporting',
      'API integrations',
      'Multi-format export',
    ],
    badge: 'Platform',
    gradient: 'from-cyan-600 to-blue-500',
  },
  {
    icon: Zap,
    title: 'Edge Processing',
    subtitle: 'Real-Time Intelligence',
    description: 'On-board processing delivers instant results without cloud dependency. Make critical decisions at the speed of flight, even in remote locations.',
    features: [
      'Zero latency analysis',
      'Offline capability',
      'Instant alerts',
      'Local data processing',
    ],
    badge: 'Performance',
    gradient: 'from-blue-600 to-cyan-500',
  },
];

const drones = [
  { 
    name: 'Parrot ANAFI AI', 
    role: 'Primary inspection platform', 
    badge: 'Most Used', 
    logo: '/drones_logo/annafi.png',
    specs: [
      { label: '4K HDR', value: '48MP' },
      { label: 'Flight Time', value: '32min' },
      { label: 'AI Capable', value: 'Native' },
    ]
  },
  { 
    name: 'DJI Matrice 350 RTK', 
    role: 'Heavy payload & LiDAR missions', 
    badge: 'LiDAR Ready', 
    logo: '/drones_logo/dji.png',
    specs: [
      { label: 'Payload', value: '2.7kg' },
      { label: 'Flight Time', value: '55min' },
      { label: 'Precision', value: '±2cm' },
    ]
  },
];

export default function TechnologySection() {
  return (
    <section
      id="capabilities"
      className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ──────────────── SECTION 1: MAIN HEADER ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mb-28 lg:mb-36"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 mb-6"
              >
                <span className="w-8 h-px bg-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  Platform Capabilities
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-[44px] sm:text-5xl lg:text-[72px] xl:text-[84px] font-black leading-[0.95] tracking-[-0.03em] text-gray-900 dark:text-white"
              >
                AI-first.{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  Hardware-agnostic.
                </span>
              </motion.h2>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-4 lg:pb-4"
            >
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Our platform transforms any industrial drone into an autonomous intelligent agent. AI does the heavy lifting—hardware just follows orders.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ──────────────── SECTION 2: CORE TECHNOLOGY GRID ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="mb-28 lg:mb-36"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {coreTech.map((tech) => {
              const Icon = tech.icon;
              return (
                <motion.article
                  key={tech.title}
                  variants={itemVariants}
                  className="group relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl p-8 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-500 overflow-hidden"
                >
                  {/* Ambient glow on hover */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Badge */}
                  <div className="relative inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                      {tech.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="relative w-14 h-14 mb-6">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                    <div className={`relative w-full h-full bg-gradient-to-br ${tech.gradient} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow duration-500`}>
                      <Icon size={26} className="text-white" strokeWidth={2} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="relative text-2xl lg:text-[28px] font-black text-gray-900 dark:text-white mb-2 tracking-tight leading-tight">
                    {tech.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="relative text-sm italic font-serif text-blue-600 dark:text-blue-400 mb-5">
                    {tech.subtitle}
                  </p>

                  {/* Description */}
                  <p className="relative text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {tech.description}
                  </p>

                  {/* Divider */}
                  <div className="relative h-px bg-gradient-to-r from-gray-200 via-blue-200 to-gray-200 dark:from-white/10 dark:via-blue-500/20 dark:to-white/10 mb-6" />

                  {/* Features list */}
                  <ul className="relative space-y-2.5">
                    {tech.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Hover accent line */}
                  <div className={`absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r ${tech.gradient} group-hover:w-full transition-all duration-700`} />
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        {/* Use Cases section moved to UseCasesSection.tsx */}


        {/* ──────────────── SECTION 4: DRONE PLATFORMS ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mb-20"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                Hardware Integration
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <h3 className="lg:col-span-7 text-4xl lg:text-5xl xl:text-[56px] font-black leading-[0.95] tracking-tight text-gray-900 dark:text-white">
                Enterprise{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  drone platforms.
                </span>
              </h3>
              <p className="lg:col-span-5 text-base text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Industry-leading hardware, unified by intelligent software. Your missions deserve the best.
              </p>
            </div>
          </motion.div>

          {/* Drones Grid */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
              {drones.map((drone) => (
                <motion.article
                  key={drone.name}
                  variants={itemVariants}
                  className="group relative"
                >
                  <div className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-500">
                    
                    {/* Badge */}
                    <div className="absolute top-6 right-6 z-20">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <Sparkles size={14} className="animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {drone.badge}
                        </span>
                      </div>
                    </div>

                    {/* Drone Image */}
                    <div className="relative h-80 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 dark:from-slate-800 dark:via-blue-900/10 dark:to-slate-800/60 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
                      
                      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                        backgroundImage: `
                          linear-gradient(to right, currentColor 1px, transparent 1px),
                          linear-gradient(to bottom, currentColor 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px'
                      }} />

                      <motion.div
                        animate={{ y: [0, -16, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 px-12"
                      >
                        <img
                          src={drone.logo}
                          alt={drone.name}
                          className="w-full h-auto object-contain filter drop-shadow-2xl"
                          style={{ maxHeight: '320px', minHeight: '180px' }}
                        />
                      </motion.div>

                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.15, 0.25] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-12 w-40 h-10 bg-gradient-to-r from-blue-900/30 via-gray-900/40 to-blue-900/30 dark:from-black/50 dark:via-black/60 dark:to-black/50 rounded-full blur-2xl"
                      />

                      <motion.div
                        animate={{ y: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-8 lg:p-10">
                      <h4 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        {drone.name}
                      </h4>
                      
                      <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-8 border-l-2 border-blue-500/30 pl-4">
                        {drone.role}
                      </p>

                      <div className="grid grid-cols-3 gap-4">
                        {drone.specs.map((spec) => (
                          <div key={spec.label} className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-white/5 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1 tabular-nums">
                              {spec.value}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                              {spec.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 group-hover:w-full transition-all duration-700" />
                  </div>

                  <div className="absolute -inset-px bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 -z-10" />
                </motion.article>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ──────────────── SECTION 5: STATS BAR ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-10 lg:p-14 overflow-hidden"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.2, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"
            />

            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {[
                { value: '< 5min', label: 'Setup Time' },
                { value: '24/7', label: 'Autonomous'},
                { value: '99.9%', label: 'Uptime'},
                { value: 'Zero', label: ' Dependency'},
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl mb-2">{stat.icon}</div>
                  <div className="text-4xl lg:text-5xl font-black text-white mb-3 tabular-nums drop-shadow-lg">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-50">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}