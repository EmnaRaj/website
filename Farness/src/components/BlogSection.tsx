import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const blogPosts = [
  {
    id: 'autonomous-drones-future',
    title: 'The Rise of Autonomous Drones in Industrial Operations',
    excerpt: 'Autonomous drones are revolutionizing how industries inspect critical infrastructure. Learn how AI-powered systems are replacing dangerous manual inspections.',
    content: `Autonomous drones represent a paradigm shift in industrial operations. By combining advanced AI, real-time sensing, and predictive algorithms, these systems can operate independently in complex environments—from pipeline corridors to mining sites.

Key advantages:
- 24/7 operation without human fatigue
- Precision navigation in GPS-denied environments
- Real-time anomaly detection and alerts
- Reduced operational costs by up to 60%

The future isn't about replacing workers—it's about eliminating the need for them to work in dangerous conditions.`,
    author: 'Sarah Chen',
    date: '2024-03-15',
    category: 'Technology',
    readTime: '5 min read',
    image: '/blog/autonomous-drones.jpg',
  },
  {
    id: 'ai-pipeline-inspection',
    title: 'How AI Detects Pipeline Defects Before They Fail',
    excerpt: 'Computer vision and machine learning are transforming pipeline inspection. Discover how our AI catches corrosion, cracks, and leaks that human eyes would miss.',
    content: `Pipeline failures cost the industry billions annually. Traditional inspection methods rely on visual inspection and manual documentation—both prone to human error.

Our AI-powered approach:
- Thermal + visual analysis simultaneously
- Detects defects as small as 2mm
- Classifies corrosion severity in real-time
- Generates automated compliance reports

By catching problems early, operators prevent catastrophic failures and extend asset lifespan by decades.`,
    author: 'Dr. James Mueller',
    date: '2024-03-10',
    category: 'AI & Machine Learning',
    readTime: '6 min read',
    image: '/blog/pipeline-inspection.jpg',
  },
  {
    id: 'mining-stockpile-analysis',
    title: 'Stockpile Volumetrics: AI-Powered Inventory Management',
    excerpt: 'Mining operations waste thousands of hours on manual stockpile surveys. See how photogrammetry and AI deliver survey-grade accuracy in minutes.',
    content: `Mining inventory management is critical—inaccurate stockpile data leads to scheduling conflicts, equipment underutilization, and lost revenue.

Traditional methods:
- Manual GPS surveys (1-2 days per site)
- High error margins (±5-10%)
- Safety risks in hazardous areas

Our AI solution:
- Full site survey in 10-15 minutes
- ±2cm accuracy (survey-grade)
- Real-time trend tracking
- Automatic ERP integration

Operations now have up-to-the-minute inventory data, enabling smarter scheduling and 15-20% efficiency gains.`,
    author: 'Marcus Johnson',
    date: '2024-03-05',
    category: 'Industry Insights',
    readTime: '7 min read',
    image: '/blog/stockpile-analysis.jpg',
  },
  {
    id: 'drone-ai-future-work',
    title: 'Beyond Inspection: The Future of Autonomous Systems in Work',
    excerpt: 'Autonomous drones aren\'t just inspection tools—they\'re becoming essential partners in industrial operations. What\'s next for the industry?',
    content: `The drone industry is entering a new era. Beyond collecting data, autonomous systems are now:

1. Making real-time decisions without human intervention
2. Coordinating multi-drone missions autonomously
3. Adapting flight paths mid-mission based on conditions
4. Predicting failures before they happen

The integration of edge AI means processing happens on-board, not in the cloud. Decisions are made at the speed of flight.

What this means:
- Remote operations with minimal connectivity requirements
- Instant threat response without human delay
- Fully autonomous swarms for massive area coverage
- Predictive maintenance based on continuous monitoring

The future workplace won't eliminate humans—it will eliminate human exposure to danger.`,
    author: 'Dr. Lisa Rodriguez',
    date: '2024-02-28',
    category: 'Future Tech',
    readTime: '8 min read',
    image: '/blog/future-work.jpg',
  },
  {
    id: 'infrastructure-inspection-ai',
    title: 'Scaling Infrastructure Inspection with Intelligent Automation',
    excerpt: 'Bridges, towers, and power lines need constant monitoring. Learn how AI-powered drones scale inspection to thousands of structures.',
    content: `Infrastructure inspection is a never-ending challenge. Thousands of bridges, transmission towers, and wind turbines require regular assessment—a task that\'s traditionally been expensive and dangerous.

The Scale Problem:
- A single bridge inspection takes days and costs $50,000+
- Transmission lines span hundreds of kilometers
- Wind turbines require rope access inspections
- Infrastructure ages faster than we can inspect it

AI-Powered Solution:
- Autonomous drones inspect structures in hours, not days
- Continuous monitoring instead of periodic checks
- Predictive models flag assets needing attention
- Reduced inspection costs by 70%+

With intelligent automation, we can finally keep pace with infrastructure maintenance and prevent failures that disrupt communities.`,
    author: 'Engineer Tom Bradley',
    date: '2024-02-20',
    category: 'Infrastructure',
    readTime: '6 min read',
    image: '/blog/infrastructure-inspection.jpg',
  },
  {
    id: 'edge-computing-drones',
    title: 'Why Edge AI is the Future of Autonomous Drones',
    excerpt: 'Cloud processing has limitations. Discover why processing data on-board drones enables true autonomy and real-time decisions.',
    content: `For years, drones relied on cloud connectivity. Send data, process in the cloud, receive instructions. But this architecture has fundamental limitations:

- Network latency (cloud is too slow for real-time decisions)
- Coverage gaps (no connectivity in remote areas)
- Privacy concerns (sensitive industrial data in the cloud)
- Bandwidth constraints (processing large datasets)

Edge AI changes everything:

1. **Onboard Processing**: AI models run directly on drone hardware
2. **Real-Time Decisions**: No cloud latency—decisions made instantly
3. **Offline Operation**: Works even without connectivity
4. **Data Privacy**: Sensitive data never leaves the site

Modern drones now process gigabytes of video in real-time, detect anomalies on-board, and make autonomous decisions without human intervention.

This is the foundation for true autonomous systems.`,
    author: 'Dr. Alex Kumar',
    date: '2024-02-15',
    category: 'Technology',
    readTime: '7 min read',
    image: '/blog/edge-computing.jpg',
  },
];

export default function BlogSection() {
  return (
    <section
      id="blog"
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
                  Insights & Stories
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-[44px] sm:text-5xl lg:text-[72px] xl:text-[84px] font-black leading-[0.95] tracking-[-0.03em] text-gray-900 dark:text-white"
              >
                Knowledge{' '}
                <span className="italic font-serif font-normal text-blue-600 dark:text-blue-400">
                  shared.
                </span>
              </motion.h2>
            </div>

            <motion.div
              variants={itemVariants}
              className="lg:col-span-4 lg:pb-4"
            >
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-blue-500/40 pl-5">
                Expert insights on autonomous systems, drone technology, and industrial AI. Real-world lessons from the field.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Blog Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {blogPosts.map((post) => (
            <motion.article
              key={post.id}
              variants={itemVariants}
              className="group h-full flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-500"
            >
              {/* Image Container */}
              <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 group-hover:from-blue-500/30 group-hover:to-cyan-500/20 transition-all duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-black text-blue-600/20 dark:text-blue-400/20 mb-2">📰</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{post.image}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 lg:p-10 flex-1 flex flex-col">
                {/* Meta */}
                <div className="flex items-center gap-4 mb-6 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={14} />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} />
                    {post.readTime}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white mb-3 leading-tight tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6 flex-1">
                  {post.excerpt}
                </p>

                {/* Category */}
                <div className="inline-flex items-center gap-2 mb-6 w-fit">
                  <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-full">
                    {post.category}
                  </span>
                </div>

                {/* Read More Link */}
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent mb-6" />

                <Link
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Hover accent */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-500" />
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
