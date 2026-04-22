import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge, Box, AlertTriangle, Map, Shield, Scan,
  ArrowRight, Check
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

// Use case applications
const useCases = [
  {
    id: 'pipeline',
    icon: Gauge,
    title: 'Pipeline Inspection',
    industry: 'Oil & Gas',
    description: 'Autonomous inspection of pipelines across vast distances. Detect cracks, corrosion, leaks, and structural anomalies.',
    capabilities: ['Thermal imaging', 'Corrosion mapping', 'GPS-tagged defects', 'Automated alerts'],
    color: 'from-blue-600 to-blue-500',
    image: '/operation/pipeline.png',
  },
  {
    id: 'stockpile',
    icon: Box,
    title: 'Stockpile Analysis',
    industry: 'Mining',
    description: 'Precise volume calculations for material stockpiles. Automated inventory tracking and reporting.',
    capabilities: ['Volume computation', 'Material classification', 'Trend tracking', 'ERP integration'],
    color: 'from-cyan-600 to-blue-500',
    image: '/operation/stockpile.png',
  },
  {
    id: 'anomaly',
    icon: AlertTriangle,
    title: 'Anomaly Detection',
    industry: 'Industrial',
    description: 'Identify equipment failures and safety hazards before they cause downtime.',
    capabilities: ['Equipment monitoring', 'Hotspot detection', 'Crack mapping', 'Predictive maintenance'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'survey',
    icon: Map,
    title: 'Site Surveying',
    industry: 'Construction',
    description: 'High-resolution mapping for construction sites and industrial zones. Generate orthophotos and 3D models.',
    capabilities: ['Orthophoto generation', 'Change detection', 'GIS integration', 'Progress tracking'],
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Perimeter Security',
    industry: 'Security',
    description: 'Autonomous perimeter monitoring with intruder detection and tracking.',
    capabilities: ['Autonomous patrols', 'Intruder classification', 'Night vision', 'Real-time alerts'],
    color: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'lidar',
    icon: Scan,
    title: 'LiDAR Operations',
    industry: 'Infrastructure',
    description: 'High-precision 3D mapping with point cloud processing and volumetric analysis.',
    capabilities: ['Point cloud capture', 'Precision mapping', 'Volumetric analysis', 'Data export'],
    color: 'from-cyan-500 to-cyan-400',
  },
];

export default function UseCasesSection() {
  const [activeUseCase, setActiveUseCase] = useState(0);
  const selectedUseCase = useCases[activeUseCase];

  return (
    <section
      id="operations"
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
          className="mb-16"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 mb-6"
          >
            <span className="w-8 h-px bg-blue-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
              Industrial Applications
            </span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-4xl lg:text-5xl xl:text-[64px] font-black leading-[0.95] tracking-tight text-gray-900 dark:text-white mb-6"
          >
            Built for{' '}
            <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
              real operations.
            </span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl"
          >
            Six proven workflows engineered for the most demanding industrial environments.
          </motion.p>
        </motion.div>

        {/* Use Cases */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Horizontal Switch Buttons */}
          <div className="mb-12 flex flex-wrap gap-3 items-center">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon;
              const isActive = activeUseCase === i;
              return (
                <motion.button
                  key={useCase.id}
                  variants={itemVariants}
                  onClick={() => setActiveUseCase(i)}
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r ${useCase.color} text-white shadow-lg`
                      : 'bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <Icon size={16} strokeWidth={2} />
                  {useCase.title}
                </motion.button>
              );
            })}
          </div>

          {/* Content Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedUseCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden"
            >
              {/* Image Container */}
              {selectedUseCase.image && (
                <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700">
                  <div className="aspect-video flex items-center justify-center overflow-hidden">
                    <motion.img
                      key={`img-${selectedUseCase.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      src={selectedUseCase.image}
                      alt={selectedUseCase.title}
                      className="w-full h-full object-contain p-8 lg:p-12"
                    />
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="p-10 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left: Main Info */}
                  <div>
                    <div className={`inline-flex items-center gap-2.5 bg-gradient-to-r ${selectedUseCase.color} px-4 py-2 rounded-full mb-6`}>
                      {(() => {
                        const Icon = selectedUseCase.icon;
                        return <Icon size={16} className="text-white" />;
                      })()}
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {selectedUseCase.industry}
                      </span>
                    </div>

                    <h3 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-5 tracking-tight leading-tight">
                      {selectedUseCase.title}
                    </h3>

                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                      {selectedUseCase.description}
                    </p>

                    <button
                      onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
                      className={`inline-flex items-center gap-2 bg-gradient-to-r ${selectedUseCase.color} text-white font-bold px-7 py-3 rounded-xl hover:shadow-lg transition-all`}
                    >
                      <span>See How It Works</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Right: Capabilities */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500 mb-6">
                      Core Capabilities
                    </div>
                    <div className="space-y-4">
                      {selectedUseCase.capabilities.map((capability) => (
                        <div key={capability} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0">
                            <Check size={14} className="text-white" strokeWidth={3} />
                          </div>
                          <span className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                            {capability}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
