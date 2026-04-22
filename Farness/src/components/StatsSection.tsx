import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Globe, Award, Zap, Clock } from 'lucide-react';

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

const metrics = [
  {
    icon: Zap,
    value: 500,
    suffix: '+',
    label: 'Daily Missions Completed',
    desc: 'Across all active deployments',
    color: 'from-blue-600 to-blue-500',
  },
  {
    icon: Globe,
    value: 40,
    suffix: '+',
    label: 'Active Mining Sites',
    desc: 'Across 12 countries',
    color: 'from-cyan-600 to-blue-500',
  },
  {
    icon: TrendingUp,
    value: 99.9,
    suffix: '%',
    label: 'Platform Uptime',
    desc: 'Enterprise SLA guaranteed',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Clock,
    value: 2.4,
    suffix: 's',
    label: 'Average Mission Launch',
    desc: 'From command to flight',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Users,
    value: 150,
    suffix: '+',
    label: 'Enterprise Clients',
    desc: 'Across 4 industries',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Award,
    value: 2.3,
    prefix: '$',
    suffix: 'M',
    label: 'Avg. Annual Client Savings',
    desc: 'ROI achieved within 6 months',
    color: 'from-cyan-500 to-cyan-400',
  },
];

function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2000 }: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const start = Date.now();
          const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(parseFloat((eased * value).toFixed(1)));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, started]);

  const display = Number.isInteger(value) ? Math.floor(count) : count.toFixed(1);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

const testimonials = [
  {
    quote: "Farness has completely transformed how we manage our open-pit operations. What used to take a team of surveyors 3 days now takes one drone 18 minutes.",
    author: "James Mitchell",
    role: "Chief Operations Officer",
    company: "Apex Mining Corp",
  },
  {
    quote: "The AI pipeline inspection has saved us from two major incidents. The system detected micro-fractures our traditional inspection missed. ROI was clear within the first month.",
    author: "Sarah Chen",
    role: "Asset Integrity Manager",
    company: "Pacific Energy Networks",
  },
  {
    quote: "Voice commands for drone missions sounds like science fiction, but it's real and it works. My team went from skeptical to dependent on Farness in under a week.",
    author: "Marcus Weber",
    role: "Site Manager",
    company: "Continental Minerals AG",
  },
];

export default function StatsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="stats"
      className="relative py-28 lg:py-36 overflow-hidden bg-white dark:bg-slate-950"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950" />
        <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-12">
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
                Results that speak for{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  themselves.
                </span>
              </motion.h2>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-4 lg:pb-4"
            >
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Real numbers from real deployments across the world's most demanding industrial operations.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ──────────────── METRICS GRID ──────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mb-24 lg:mb-32"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.article
                  key={metric.label}
                  variants={itemVariants}
                  className="group relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl p-8 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-colors duration-500 overflow-hidden"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg">
                    <Icon size={26} className="text-white" />
                  </div>

                  {/* Value */}
                  <div className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                    <AnimatedCounter value={metric.value} suffix={metric.suffix} prefix={metric.prefix} />
                  </div>

                  {/* Label */}
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                    {metric.label}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {metric.desc}
                  </p>

                  {/* Hover accent line */}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-500" />
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        {/* ──────────────── TESTIMONIALS ──────────────── */}
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
                  Client Impact
                </span>
              </div>
              <h3 className="text-4xl lg:text-5xl xl:text-[56px] font-black leading-[0.95] tracking-tight text-gray-900 dark:text-white">
                Voices from the{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  field.
                </span>
              </h3>
            </div>
          </motion.div>

          {/* Testimonial card */}
          <motion.div
            variants={itemVariants}
            className="max-w-3xl relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl p-10 lg:p-12"
          >
            <div className="text-blue-500 dark:text-blue-400 text-7xl font-serif leading-none mb-6">"</div>

            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ opacity: activeTestimonial === i ? 1 : 0, y: activeTestimonial === i ? 0 : 10 }}
                transition={{ duration: 0.5 }}
                className={`${activeTestimonial === i ? 'relative' : 'absolute inset-0'}`}
              >
                {activeTestimonial === i && (
                  <>
                    <p className="text-lg lg:text-xl text-gray-800 dark:text-white leading-relaxed mb-8 font-serif italic">
                      {t.quote}
                    </p>
                    <div className="h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent mb-6" />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {t.author[0]}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 dark:text-white text-sm">
                          {t.author}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t.role} · {t.company}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}

            {/* Dots */}
            <div className="flex gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeTestimonial === i
                      ? 'w-8 bg-blue-500'
                      : 'w-2 bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
