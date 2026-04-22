import { motion } from 'framer-motion';
import {
  Target, Eye, ShieldCheck, Award, MapPin, ArrowUpRight
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

const values = [
  {
    icon: Target,
    number: '01',
    title: 'Mission-Driven',
    desc: 'We exist to make dangerous, inefficient inspections obsolete. Every line of code serves that mission.',
  },
  {
    icon: Eye,
    number: '02',
    title: 'Radical Transparency',
    desc: "Our AI explains every decision. No black boxes. Operators always know why the drone is doing what it's doing.",
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Safety First',
    desc: "Autonomous doesn't mean unsafe. Every system is designed with multiple redundancies and failsafes.",
  },
  {
    icon: Award,
    number: '04',
    title: 'Industrial Grade',
    desc: "We don't build toys. Our systems perform in extreme environments, 24/7, without excuses.",
  },
];

const team = [
  {
    name: 'Mourad Boussaid',
    role: 'Co-founder & Business Development Director',
    image: '/staff/Mourad Boussaid CEO.png',
    quote: "Building autonomous intelligence for the world's most critical operations.",
  },
  {
    name: 'Mohamed Wassim Mnaouar',
    role: 'Co-founder & Managing Director',
    image: '/staff/Mohamed Wassim Mnaouer CEO.png',
    quote: 'Technology that transforms industries, one mission at a time.',
  },
  {
    name: 'Atef Ahmadi',
    role: 'Co-founder & Technical Director',
    image: '/staff/atef ahmadi cto.png',
    quote: 'AI and autonomy at scale — safe, reliable, unstoppable.',
  },
];

const milestones = [
  {
    year: '2024',
    quarter: 'Q1',
    title: 'Founded',
    event: 'Farness launched between Tunisia and Paris with a vision to automate dangerous inspections.',
  },
  {
    year: '2025',
    quarter: 'Q4',
    title: 'Platform Launch',
    event: 'AI agents go live. Autonomous drone fleet orchestration enters commercial pilots.',
  },
  {
    year: '2026',
    quarter: 'Now',
    title: 'Global Expansion',
    event: 'Security, logistics, and mining sectors onboarded. International rollout underway.',
  },
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950"
    >
      {/* Ambient background */}
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
                Engineered in spirit.{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  Global by design.
                </span>
              </motion.h2>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-4 lg:pb-4"
            >
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Founded in 2024 between Tunis and Paris, Farness transforms commercial drones into autonomous, intelligent, and collaborative fleets — for the world's most critical operations.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ──────────────── MISSION BLOCK ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mb-24 lg:mb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

            {/* Image — 5 cols */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-5 relative"
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10">
                <img
                  src="/images/mining-site.jpg"
                  alt="Industrial operations at scale"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Floating tag */}
                <div className="absolute top-6 left-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-full">
                  <MapPin size={11} className="text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                    Tunis · Paris
                  </span>
                </div>

                {/* Bottom overlay text */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300 mb-2">
                    Where we operate
                  </div>
                  <div className="text-xl font-black text-white leading-tight">
                    Security. Logistics. Mining.
                  </div>
                </div>
              </div>

              {/* Decorative number in corner */}
              <div className="absolute -top-4 -right-4 text-[120px] font-black leading-none text-blue-500/10 dark:text-blue-400/10 pointer-events-none select-none font-serif">
                F
              </div>
            </motion.div>

            {/* Content — 7 cols */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  Our Mission
                </span>
              </div>

              <h3 className="text-3xl lg:text-[44px] xl:text-[52px] font-black leading-[1.05] tracking-tight text-gray-900 dark:text-white mb-8">
                Transforming commercial drones into{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  autonomous fleets
                </span>{' '}
                — where precision is non-negotiable.
              </h3>

              <div className="space-y-5 text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-10 max-w-2xl">
                <p>
                  Farness targets the world's most critical operations. We focus on security monitoring, logistics coordination, and mining inspections — environments where autonomy, precision, and reliability are non-negotiable.
                </p>
                <p>
                  Our co-founders brought together expertise in AI, robotics, and enterprise operations to build a platform that redefines how industries deploy drone fleets. From day one, we've focused on making autonomous systems that are intelligent, collaborative, and trustworthy.
                </p>
              </div>

              {/* Stats — editorial style */}
              <div className="grid grid-cols-3 border-t border-gray-200 dark:border-white/10">
                {[
                  { value: '2024', label: 'Founded' },
                  { value: '02', label: 'Countries' },
                  { value: '03', label: 'Co-founders' },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`py-6 ${
                      i !== 0 ? 'border-l border-gray-200 dark:border-white/10 pl-6' : 'pr-6'
                    }`}
                  >
                    <div className="text-3xl lg:text-4xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums mb-1">
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ──────────────── FOUNDERS ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mb-24 lg:mb-32"
        >
          {/* Section header */}
          <motion.div
            variants={itemVariants}
            className="flex items-end justify-between mb-16 flex-wrap gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  Leadership
                </span>
              </div>
              <h3 className="text-4xl lg:text-5xl xl:text-[56px] font-black leading-[0.95] tracking-tight text-gray-900 dark:text-white">
                The{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  founders.
                </span>
              </h3>
            </div>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-sm">
              Three operators. One conviction: autonomous systems should be safer, smarter, and built with uncompromising standards.
            </p>
          </motion.div>

          {/* Founder cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {team.map((member, i) => (
              <motion.article
                key={member.name}
                variants={itemVariants}
                className="group relative"
              >
                <div className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-colors duration-500">

                  {/* Photo */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                    />
                    {/* Logo mask overlay */}
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                    {/* Number in top right */}
                    <div className="absolute top-5 right-5 text-xs font-mono font-bold tracking-wider text-white/40">
                      0{i + 1}
                    </div>

                    {/* Name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300 mb-2">
                        Co-founder
                      </div>
                      <h4 className="text-xl lg:text-2xl font-black text-white leading-tight tracking-tight">
                        {member.name}
                      </h4>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 lg:p-7">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4 leading-snug">
                      {member.role}
                    </div>
                    <div className="h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed font-serif">
                      "{member.quote}"
                    </p>
                  </div>

                  {/* Hover accent line */}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-500" />
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* ──────────────── VALUES ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mb-24 lg:mb-32"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-end justify-between mb-16 flex-wrap gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  Principles
                </span>
              </div>
              <h3 className="text-4xl lg:text-5xl xl:text-[56px] font-black leading-[0.95] tracking-tight text-gray-900 dark:text-white">
                What we{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  stand for.
                </span>
              </h3>
            </div>
          </motion.div>

          {/* Values — hairline grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 dark:bg-white/10 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  variants={itemVariants}
                  className="group relative bg-white dark:bg-slate-950 p-8 lg:p-10 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-500"
                >
                  {/* Number */}
                  <span className="absolute top-6 right-6 text-xs font-mono text-gray-300 dark:text-white/10 font-bold">
                    {value.number}
                  </span>

                  {/* Icon */}
                  <div className="mb-6">
                    <Icon
                      size={24}
                      className="text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Title */}
                  <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                    {value.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {value.desc}
                  </p>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 h-px w-0 bg-blue-500 group-hover:w-full transition-all duration-500" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ──────────────── TIMELINE ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="flex items-end justify-between mb-16 flex-wrap gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  Milestones
                </span>
              </div>
              <h3 className="text-4xl lg:text-5xl xl:text-[56px] font-black leading-[0.95] tracking-tight text-gray-900 dark:text-white">
                The{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  journey.
                </span>
              </h3>
            </div>
          </motion.div>

          {/* Editorial timeline — horizontal */}
          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-5 left-0 right-0 h-px bg-gray-200 dark:bg-white/10 hidden lg:block" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8 relative">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="relative"
                >
                  {/* Dot on line */}
                  <div className="hidden lg:flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-px w-full bg-gray-200 dark:bg-white/10" />
                    </div>
                    <div className="relative w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-950" />
                  </div>

                  {/* Mobile dot */}
                  <div className="flex items-center gap-3 mb-4 lg:hidden">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">
                        {m.year}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                        {m.quarter}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                        {m.title}
                      </h4>
                      <ArrowUpRight size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
                      {m.event}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
