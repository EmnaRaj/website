import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, Zap, Building2, Factory, ArrowRight, Check, TrendingUp, Shield, Sparkles } from 'lucide-react';

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
    tagline: 'Transform your operations',
    heroStatement: 'Cut survey time from days to minutes. Increase accuracy. Eliminate risk.',
    description: 'Mining operations lose millions to inefficient surveying and compliance delays. Farness delivers real-time stockpile volumetrics, haul road monitoring, and tailings surveillance—autonomously, accurately, instantly.',
    
    painPoints: [
      { 
        problem: 'Manual surveys halt operations for 2-3 days',
        solution: 'Complete in 10 minutes with zero downtime'
      },
      { 
        problem: 'Surveyors exposed to hazardous terrain',
        solution: '100% remote operations—zero crew risk'
      },
      { 
        problem: 'Inventory discrepancies cost $2M+ annually',
        solution: '98% accuracy recovers lost revenue'
      },
    ],

    capabilities: [
      { 
        title: 'Stockpile Volumetrics', 
        value: 'Survey-grade accuracy in under 10 minutes',
        benefit: 'Know your exact inventory, every single day'
      },
      { 
        title: 'Haul Road Inspection', 
        value: 'Daily condition monitoring without traffic disruption',
        benefit: 'Prevent equipment damage before it happens'
      },
      { 
        title: 'Tailings Surveillance', 
        value: 'Continuous compliance documentation',
        benefit: 'Pass audits without the audit stress'
      },
      { 
        title: 'Environmental Monitoring', 
        value: 'Real-time dust, emissions, drainage tracking',
        benefit: 'Stay ahead of regulatory requirements'
      },
    ],

    roi: [
      { metric: '85%', label: 'Time Saved', detail: 'vs traditional surveying' },
      { metric: '$2M+', label: 'Annual Savings', detail: 'Typical mid-tier operation' },
      { metric: '100%', label: 'Risk Eliminated', detail: 'No surveyors in hazard zones' },
    ],

    testimonial: {
      quote: 'Farness paid for itself in the first quarter. The accuracy alone recovered inventory discrepancies we didn\'t even know existed.',
      author: 'Operations Director, Major Mining Corp',
      company: 'Confidential Client'
    }
  },
  {
    id: 'energy',
    icon: Zap,
    name: 'Energy & Utilities',
    tagline: 'Prevent failures before they cascade',
    heroStatement: 'Detect issues 60% faster. Cut inspection costs in half. Never put crews at risk.',
    description: 'Pipeline leaks, transmission failures, and renewable asset degradation cost utilities billions annually. Farness delivers continuous autonomous inspection—finding problems before they become outages.',
    
    painPoints: [
      { 
        problem: 'Helicopter inspections cost $15K+ per day',
        solution: 'Autonomous coverage at $500/inspection'
      },
      { 
        problem: 'Failures detected only after outages occur',
        solution: '99.2% detection rate prevents cascading failures'
      },
      { 
        problem: 'Solar efficiency losses go undetected',
        solution: 'Thermal analysis recovers 5-10% lost output'
      },
    ],

    capabilities: [
      { 
        title: 'Pipeline Integrity', 
        value: '50km of continuous monitoring per day',
        benefit: 'Catch leaks and corrosion before they escalate'
      },
      { 
        title: 'Transmission Line Inspection', 
        value: '99.2% defect detection accuracy',
        benefit: 'Prevent outages that cost millions per hour'
      },
      { 
        title: 'Solar Farm Analysis', 
        value: 'Thermal imaging of entire arrays',
        benefit: 'Recover 5-10% efficiency losses immediately'
      },
      { 
        title: 'Wind Turbine Monitoring', 
        value: 'Blade inspection without rope access',
        benefit: 'Zero crew risk, comprehensive coverage'
      },
    ],

    roi: [
      { metric: '60%', label: 'Cost Reduction', detail: 'vs helicopter patrols' },
      { metric: '99.2%', label: 'Detection Rate', detail: 'Thermal + visual AI' },
      { metric: '24/7', label: 'Coverage', detail: 'Continuous autonomous ops' },
    ],

    testimonial: {
      quote: 'We detected a transmission line failure 3 days before it would have caused a regional outage. That one catch paid for Farness for the year.',
      author: 'VP of Asset Management',
      company: 'Major Utility Provider'
    }
  },
  {
    id: 'infrastructure',
    icon: Building2,
    name: 'Infrastructure',
    tagline: 'Inspect smarter, build faster',
    heroStatement: 'Eliminate fall risks. Accelerate inspections 10x. Deliver precision documentation.',
    description: 'Bridge closures, dam inspections, and highway surveys drain budgets and endanger crews. Farness delivers comprehensive structural assessments without closures, lifts, or human risk.',
    
    painPoints: [
      { 
        problem: 'Bridge inspections require closures & $50K in lifts',
        solution: 'Full inspection with zero closures or equipment'
      },
      { 
        problem: 'Inspectors exposed to fall hazards',
        solution: '100% remote—no ropes, scaffolding, or risk'
      },
      { 
        problem: 'Manual documentation slow & inconsistent',
        solution: 'Automated reports with ±2cm precision'
      },
    ],

    capabilities: [
      { 
        title: 'Bridge Inspection', 
        value: 'Comprehensive assessment without closures',
        benefit: 'Keep traffic flowing, eliminate access risk'
      },
      { 
        title: 'Dam Safety Monitoring', 
        value: 'Continuous crack detection & tracking',
        benefit: 'Catch structural issues before they\'re critical'
      },
      { 
        title: 'Road Condition Surveys', 
        value: '10x faster than traditional methods',
        benefit: 'Survey entire highway systems in days, not months'
      },
      { 
        title: 'Construction Verification', 
        value: 'As-built documentation to ±2cm accuracy',
        benefit: 'Digital twins for every asset, instant QA'
      },
    ],

    roi: [
      { metric: '100%', label: 'Risk Eliminated', detail: 'No crew access required' },
      { metric: '10x', label: 'Speed Increase', detail: 'vs traditional methods' },
      { metric: '±2cm', label: 'Precision', detail: 'Survey-grade accuracy' },
    ],

    testimonial: {
      quote: 'We inspected 47 bridges in the time it used to take to do 5. The cost savings and safety improvements are transformational.',
      author: 'Chief Engineer',
      company: 'State DOT'
    }
  },
  {
    id: 'industrial',
    icon: Factory,
    name: 'Industrial Facilities',
    tagline: 'Inspect while running',
    heroStatement: 'Eliminate shutdowns. Reduce downtime 75%. Continuous monitoring 24/7.',
    description: 'Planned shutdowns for tank inspections cost refineries millions per day. Farness delivers comprehensive facility inspection during live operations—no shutdowns, no confined space entry, no compromise.',
    
    painPoints: [
      { 
        problem: 'Tank inspections require costly shutdowns',
        solution: 'Inspect during live operations—zero downtime'
      },
      { 
        problem: 'Flare stack monitoring puts crews in danger',
        solution: 'Complete thermal/visual inspection remotely'
      },
      { 
        problem: 'Manual rounds miss 80% of early anomalies',
        solution: 'AI detects issues in real-time, 24/7'
      },
    ],

    capabilities: [
      { 
        title: 'Tank Inspection', 
        value: 'Roof & shell monitoring during operations',
        benefit: 'Eliminate shutdown costs, maintain production'
      },
      { 
        title: 'Flare Stack Analysis', 
        value: 'Thermal imaging at full operating height',
        benefit: 'Zero rope access, complete coverage'
      },
      { 
        title: 'Pipe Rack Surveying', 
        value: 'Continuous corrosion & leak detection',
        benefit: 'Catch failures before they cause shutdowns'
      },
      { 
        title: 'Perimeter Security', 
        value: 'Autonomous patrol with intrusion detection',
        benefit: '300m coverage, real-time classification'
      },
    ],

    roi: [
      { metric: '75%', label: 'Downtime Cut', detail: 'Inspect while running' },
      { metric: '$10M+', label: 'Saved Annually', detail: 'Avoided shutdown costs' },
      { metric: '<2s', label: 'Alert Speed', detail: 'Real-time anomaly detection' },
    ],

    testimonial: {
      quote: 'We avoided a planned shutdown that would have cost $12M. Farness found the issue during live ops and we fixed it without stopping production.',
      author: 'Plant Manager',
      company: 'Major Refinery'
    }
  },
];

export default function IndustriesSection() {
  const [active, setActive] = useState(0);
  const current = industries[active];
  const Icon = current.icon;

  return (
    <section
      id="industries"
      className="relative py-28 lg:py-36 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      {/* Premium background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(148 163 184 / 0.08) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-gradient-to-br from-blue-500/[0.06] via-slate-500/[0.03] to-blue-600/[0.06] rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ──────────────── HEADER ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="mb-24 lg:mb-32"
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 rounded-full mb-10 shadow-lg shadow-blue-600/20"
            >
              <Sparkles size={16} className="text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">
                Trusted by Industry Leaders
              </span>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="text-[44px] sm:text-5xl lg:text-[72px] xl:text-[84px] font-black leading-[0.9] tracking-[-0.03em] text-slate-900 dark:text-white mb-8"
            >
              Built for the industries that{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                demand excellence.
              </span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto"
            >
              Mining, energy, infrastructure, and industrial operations trust Farness to deliver what manual methods can't: **speed**, **accuracy**, and **zero risk**.
            </motion.p>
          </div>
        </motion.div>

        {/* ──────────────── PREMIUM INDUSTRY SELECTOR ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mb-20"
        >
          {/* Horizontal tab bar - executive style */}
          <div className="relative bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl shadow-slate-900/5 dark:shadow-none">
            <div className="grid grid-cols-4 gap-2 relative">
              {industries.map((ind, i) => {
                const IndIcon = ind.icon;
                const isActive = active === i;
                return (
                  <button
                    key={ind.id}
                    onClick={() => setActive(i)}
                    className={`relative px-6 py-5 rounded-xl transition-all duration-300 text-left ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Active background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndustryTab"
                        className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 rounded-xl shadow-lg"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isActive 
                          ? 'bg-white/20 dark:bg-slate-900/20' 
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <IndIcon 
                          size={20} 
                          className={isActive ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'} 
                          strokeWidth={2} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold truncate ${
                          isActive ? 'text-white dark:text-slate-900' : ''
                        }`}>
                          {ind.name}
                        </div>
                        <div className={`text-xs truncate ${
                          isActive ? 'text-white/70 dark:text-slate-900/70' : 'text-slate-500 dark:text-slate-500'
                        }`}>
                          {ind.tagline}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ──────────────── CONTENT ──────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Hero Statement */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 rounded-3xl p-12 lg:p-16 mb-12 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-3 mb-8">
                  <Icon size={32} className="text-white dark:text-slate-900" strokeWidth={2} />
                  <span className="text-xl font-bold text-white/80 dark:text-slate-900/80 uppercase tracking-wider">
                    {current.name}
                  </span>
                </div>

                <h3 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white dark:text-slate-900 leading-[1.1] mb-8">
                  {current.heroStatement}
                </h3>

                <p className="text-xl text-white/90 dark:text-slate-900/90 leading-relaxed max-w-4xl mb-10">
                  {current.description}
                </p>

                <button
                  onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group inline-flex items-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-10 py-5 rounded-xl font-bold hover:shadow-2xl transition-all text-lg"
                >
                  <span>See {current.name} Solutions</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Pain Points vs Solutions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {current.painPoints.map((pain, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/30 border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                        The Problem
                      </div>
                      <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                        {pain.problem}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-slate-200 via-blue-200 to-slate-200 dark:from-slate-800 dark:via-blue-900/50 dark:to-slate-800 mb-6" />

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/30 border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                        Farness Solution
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                        {pain.solution}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {current.capabilities.map((cap, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="group bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 lg:p-10 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Check size={24} className="text-white" strokeWidth={3} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                      {cap.title}
                    </h4>
                  </div>

                  <div className="mb-6">
                    <div className="text-base font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {cap.value}
                    </div>
                    <div className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                      {cap.benefit}
                    </div>
                  </div>

                  <div className="h-[3px] w-0 bg-gradient-to-r from-blue-600 to-blue-400 group-hover:w-full transition-all duration-700" />
                </motion.div>
              ))}
            </div>

            {/* ROI Metrics */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-10 lg:p-14 mb-12 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <TrendingUp size={28} className="text-white" strokeWidth={2} />
                <h4 className="text-2xl font-black text-white uppercase tracking-wider">
                  Expected Return on Investment
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {current.roi.map((r, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
                    <div className="text-6xl lg:text-7xl font-black text-white mb-3 tabular-nums">
                      {r.metric}
                    </div>
                    <div className="text-xl font-bold text-white mb-2">
                      {r.label}
                    </div>
                    <div className="text-sm text-white/80">
                      {r.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-10 lg:p-14 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <Shield size={24} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Real Results
                </span>
              </div>

              <blockquote className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-relaxed mb-8 italic">
                "{current.testimonial.quote}"
              </blockquote>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-xl">
                  {current.testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {current.testimonial.author}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {current.testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 rounded-3xl p-12 lg:p-16 shadow-2xl">
            <h4 className="text-3xl lg:text-4xl font-black text-white dark:text-slate-900 mb-6">
              Ready to transform your {current.name.toLowerCase()} operations?
            </h4>
            <p className="text-xl text-white/90 dark:text-slate-900/90 mb-10 max-w-2xl mx-auto">
              Schedule a personalized demo and see exactly how Farness will deliver ROI for your specific operation.
            </p>
            <button
              onClick={() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-12 py-6 rounded-xl transition-all shadow-2xl text-xl"
            >
              <span>Book Your Demo</span>
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}