import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, Tag, ArrowLeft, Share2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

const blogPosts = {
  'autonomous-drones-future': {
    title: 'The Rise of Autonomous Drones in Industrial Operations',
    content: `Autonomous drones represent a paradigm shift in industrial operations. By combining advanced AI, real-time sensing, and predictive algorithms, these systems can operate independently in complex environments—from pipeline corridors to mining sites.

## Key Advantages

- **24/7 Operation**: Without human fatigue or limitations
- **Precision Navigation**: In GPS-denied environments
- **Real-Time Detection**: Anomaly detection and instant alerts
- **Cost Reduction**: Up to 60% operational cost savings

## The Technology Behind It

Modern autonomous drones integrate multiple technologies:

### AI & Machine Learning
Advanced algorithms process sensor data in real-time, making decisions at the speed of flight. Edge computing means the drone doesn't need to communicate with cloud systems—decisions happen instantly.

### Multi-Sensor Integration
Thermal cameras, visual sensors, LiDAR, and other instruments work together to build a comprehensive understanding of the environment. Sensor fusion creates a complete picture that no single sensor could provide.

### Autonomous Decision Making
The drone continuously evaluates mission parameters, environmental conditions, and safety constraints. If conditions change, the system adapts without waiting for human input.

## Real-World Impact

In pipeline inspection, autonomous drones have reduced inspection time from weeks to days. A 500km pipeline that once required 3-4 weeks of manual inspection now takes 2-3 days of autonomous operation.

In mining operations, daily stockpile monitoring—previously impossible due to cost and safety—is now routine. Operators have up-to-the-minute inventory data that enables smarter scheduling.

## The Future Isn't About Replacement

The key insight: autonomous drones aren't replacing workers, they're eliminating the need for humans to work in dangerous conditions. That's the real revolution.`,
    author: 'Sarah Chen',
    date: '2024-03-15',
    category: 'Technology',
    readTime: '5 min read',
  },
  'ai-pipeline-inspection': {
    title: 'How AI Detects Pipeline Defects Before They Fail',
    content: `Pipeline failures cost the industry billions annually. Traditional inspection methods rely on visual inspection and manual documentation—both prone to human error.

## The Problem with Traditional Methods

Manual pipeline inspection involves:
- Helicopter patrols (expensive and limited coverage)
- Ground crews (slow and dangerous)
- Human judgment (inconsistent and prone to error)
- Limited frequency (quarterly or annual inspections)

A single major pipeline failure can cost $1M+ in emergency repairs, environmental cleanup, and operational downtime.

## The AI-Powered Solution

Our approach combines multiple technologies:

### Thermal Analysis
Thermal cameras detect temperature anomalies that indicate:
- Leaks (cooldown from escaping fluid)
- Corrosion (surface temperature variations)
- Internal pressure issues (subtle thermal signatures)

### Visual AI
Deep learning models trained on thousands of pipeline images recognize:
- Corrosion patterns
- Crack morphology
- Joint failures
- Surface degradation

### Real-Time Processing
Edge AI means analysis happens during the flight, not after. The system can flag critical defects immediately, enabling rapid response.

## Accuracy That Matters

Our AI detects defects as small as 2mm with 99.2% accuracy. More importantly, it doesn't miss the subtle signs that precede catastrophic failure.

## The Impact

- **Prevention**: Catch problems before they become expensive
- **Compliance**: Automated documentation for regulatory requirements
- **Data**: Historical trend analysis shows progression of issues
- **Cost**: 70% reduction in inspection costs

Pipeline operators can now afford continuous monitoring instead of periodic inspections.`,
    author: 'Dr. James Mueller',
    date: '2024-03-10',
    category: 'AI & Machine Learning',
    readTime: '6 min read',
  },
  'mining-stockpile-analysis': {
    title: 'Stockpile Volumetrics: AI-Powered Inventory Management',
    content: `Mining inventory management is critical—inaccurate stockpile data leads to scheduling conflicts, equipment underutilization, and lost revenue.

## The Traditional Challenge

Manual stockpile surveys:
- Take 1-2 days per site
- Require expensive GPS equipment and trained surveyors
- Disrupt mining operations (survey crews interfere with haul roads)
- Have ±5-10% accuracy margins (unacceptable for inventory)
- Can only be done quarterly or semi-annually

For a large operation with multiple stockpiles, staying current on inventory is nearly impossible.

## The AI Revolution in Volumetrics

Photogrammetry combined with AI delivers:

### Speed
Full site survey in 10-15 minutes. The drone flies a predefined pattern while collecting overlapping images. AI processes the image set into a 3D point cloud in minutes.

### Accuracy
±2cm accuracy—survey-grade precision. This means inventory calculations are reliable for financial and operational purposes.

### Frequency
Because drones are fast and cheap, daily surveying becomes feasible. Operators know exact volumes at any moment.

### Intelligence
Our AI doesn't just calculate volume. It tracks material classification, identifies displaced material, and detects anomalies.

## The Numbers

- **Time savings**: 1-2 days per survey → 15 minutes
- **Cost reduction**: $5,000+ per survey → $500
- **Accuracy gain**: ±10% → ±2cm
- **Operational efficiency**: 15-20% improvement through better scheduling

## ERP Integration

Survey data automatically feeds into enterprise resource planning systems. Inventory reports are generated without manual data entry.

## Real-World Example

A large open-pit mine with 20 active stockpiles:
- **Before**: Quarterly surveys, 2-3 weeks per cycle, 6-month-old data
- **After**: Daily surveys, complete current data, real-time scheduling optimization

Result: 18% improvement in equipment utilization, 12% reduction in material waste.`,
    author: 'Marcus Johnson',
    date: '2024-03-05',
    category: 'Industry Insights',
    readTime: '7 min read',
  },
  'drone-ai-future-work': {
    title: 'Beyond Inspection: The Future of Autonomous Systems in Work',
    content: `The drone industry is entering a new era. Beyond collecting data, autonomous systems are now making autonomous decisions and coordinating complex missions.

## The Evolution

**Generation 1**: Manual drones (human pilot controls everything)
**Generation 2**: Autonomous flight (waypoint navigation)
**Generation 3**: Intelligent autonomy (adaptive decisions, real-time replanning)
**Generation 4**: Collaborative autonomy (drone swarms, multi-agent coordination)

We're transitioning from Generation 2 to Generation 3, with Generation 4 on the horizon.

## Real-Time Decision Making

Modern drones now:

### Adapt Flight Paths Mid-Mission
If weather changes, wind patterns shift, or new obstacles appear, the drone recalculates its route without human input.

### Make Safety Decisions Independently
The system evaluates battery life, weather, airspace, and sensor data to determine if the mission should continue or return to base.

### Optimize in Real-Time
Instead of following a pre-planned path, the drone adjusts to environmental conditions, optimizing for sensor quality, efficiency, and safety.

## Multi-Drone Coordination

Imagine 5 drones inspecting a 500km pipeline:
- They coordinate to avoid overlapping coverage
- They adapt to each other's progress
- They share findings to optimize the remaining routes
- They manage battery and fuel distribution across the fleet

This is possible today with edge AI and drone-to-drone communication.

## Predictive Intelligence

By analyzing data during the mission, drones can:
- Identify areas needing additional inspection
- Predict component failures before they happen
- Suggest maintenance actions to the operator
- Learn from each mission to improve future operations

## The Workplace Transformation

This isn't about eliminating jobs. It's about transforming them:

### From Dangerous to Safe
Workers no longer rappel off towers, work in confined spaces, or climb hazardous structures.

### From Routine to Strategic
Workers focus on decision-making and complex problem-solving, not routine data collection.

### From Reactive to Preventive
With predictive intelligence, teams prevent failures instead of reacting to them.

The future workplace is safer, smarter, and more human.`,
    author: 'Dr. Lisa Rodriguez',
    date: '2024-02-28',
    category: 'Future Tech',
    readTime: '8 min read',
  },
  'infrastructure-inspection-ai': {
    title: 'Scaling Infrastructure Inspection with Intelligent Automation',
    content: `Infrastructure inspection is a never-ending challenge. Thousands of bridges, transmission towers, and wind turbines require regular assessment—a task that's traditionally been expensive and dangerous.

## The Scale Problem

Consider the statistics:
- **620,000** bridges in the US alone
- **180,000** km of transmission lines globally
- **400,000+** wind turbines worldwide
- **50,000+** dams requiring monitoring

At any time, inspection backlogs span years. New damage appears faster than old damage can be repaired.

## Traditional Methods' Limitations

- **High cost**: A single bridge inspection costs $50,000+
- **Danger**: Rope access inspections, traffic disruption, confined spaces
- **Time**: Weeks for thorough assessment
- **Frequency**: Biennial or triennial instead of continuous
- **Data quality**: Inconsistent documentation, human error

## AI-Powered Scaling

Autonomous drones change the economics:

### Cost Reduction
Instead of $50,000, a comprehensive bridge inspection costs $5,000. That's a 10x cost reduction.

### Speed
Instead of weeks, critical inspections take days or hours.

### Frequency
Continuous monitoring becomes economically feasible. Instead of inspecting every 2 years, critical assets are monitored monthly or weekly.

### Consistency
AI doesn't miss details. Every inspection uses the same criteria and detection thresholds.

## Continuous Monitoring Model

Rather than periodic inspections, infrastructure can now be continuously monitored:

- **Real-time alerts**: Critical damage detected immediately
- **Trend analysis**: Degradation tracked over time
- **Predictive maintenance**: Failures predicted before they happen
- **Lifecycle optimization**: Understand when replacement is more efficient than repair

## The Impact on Operations

A major utility company integrating autonomous inspection:

**Before**: Scheduled biennial inspections, reactive maintenance
**After**: Continuous monitoring, predictive maintenance

**Results**:
- 40% reduction in emergency repairs
- 25% extension of asset life
- 60% reduction in inspection costs
- 95% uptime improvement

## Future: Autonomous Repair

The next frontier: autonomous systems that don't just inspect, but minor repairs. Small fixes executed immediately prevent small problems from becoming big ones.`,
    author: 'Engineer Tom Bradley',
    date: '2024-02-20',
    category: 'Infrastructure',
    readTime: '6 min read',
  },
  'edge-computing-drones': {
    title: 'Why Edge AI is the Future of Autonomous Drones',
    content: `For years, drones relied on cloud connectivity. Send data, process in the cloud, receive instructions. But this architecture has fundamental limitations.

## The Cloud Limitation

Cloud-dependent drones face:

### Network Latency
A 200ms cloud roundtrip creates a 4-decision lag at 20 m/s flight speed. In dynamic environments, the drone is always reacting to old information.

### Coverage Gaps
Remote mining sites, offshore platforms, and confined spaces often have no connectivity. Cloud drones can't operate there.

### Bandwidth Constraints
A high-resolution thermal camera produces 10+ GB per flight. Transmitting to cloud for processing is impractical in remote areas.

### Privacy & Security
Sensitive industrial data—pipeline layouts, vulnerability assessments—goes to external servers. That's often unacceptable.

### Latency Jitter
Even with connectivity, variable latency makes autonomous decision-making unreliable.

## Edge AI Changes Everything

Edge AI means the processor is on the drone:

### Real-Time Decisions
AI inference happens on-board, using onboard processors. Decisions are made instantly, at the speed of flight.

### Offline Operation
Without requiring any connectivity, drones can operate autonomously. Perfect for remote areas, offshore, or underground.

### Data Privacy
Sensitive data never leaves the operation. Processing happens locally, only summaries or alerts are transmitted.

### Bandwidth Efficiency
Process 100GB on-board, transmit 100MB of results. Massive reduction in bandwidth requirements.

### Reliability
No dependency on cloud availability. If the internet is down, drones still operate.

## Modern Edge Hardware

Modern drones carry:
- **NVIDIA Jetson**: Real-time AI inference
- **Intel Movidius**: Specialized deep learning accelerators
- **Qualcomm Snapdragon**: Mobile AI processing

These process video at 30+ fps, running complex deep learning models in real-time.

## Real-World Example

A mining operation in a remote area with poor connectivity:

**Cloud-dependent approach**: Can't work (no reliable internet)
**Edge AI approach**: Drone surveys the site, processes imagery, identifies ore grades, all autonomously

The drone lands with actionable intelligence, not raw data.

## The Trend

The industry is moving from "collect data" → "process in cloud" → "return results" toward "process on-edge" → "make decisions autonomously" → "report outcomes."

Edge AI is what makes true autonomy possible.`,
    author: 'Dr. Alex Kumar',
    date: '2024-02-15',
    category: 'Technology',
    readTime: '7 min read',
  },
};

export default function BlogPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const post = postId && blogPosts[postId as keyof typeof blogPosts];

  if (!post) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
              Article Not Found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              The article you're looking for doesn't exist.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-slate-950">
        {/* Article Header */}
        <div className="relative py-16 lg:py-24 overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/[0.05] dark:bg-blue-600/[0.08] rounded-full blur-[140px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold mb-6 transition-colors"
              >
                <ArrowLeft size={18} />
                Back to Blog
              </Link>

              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} />
                  {post.author}
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={16} />
                  {post.readTime}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Article Content */}
        <div className="relative py-20 lg:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose dark:prose-invert max-w-none"
            >
              <div className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {post.content.split('\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('##')) {
                    return (
                      <h2
                        key={idx}
                        className="text-3xl font-black text-gray-900 dark:text-white mt-12 mb-6 tracking-tight"
                      >
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('###')) {
                    return (
                      <h3
                        key={idx}
                        className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-8 mb-4"
                      >
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <li key={idx} className="ml-6 mb-2 list-disc">
                        {paragraph.replace('- ', '')}
                      </li>
                    );
                  }
                  if (paragraph.trim() === '') {
                    return <div key={idx} className="h-4" />;
                  }
                  return (
                    <p key={idx} className="mb-4">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </motion.div>

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Share this article:
                </span>
                <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
