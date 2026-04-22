import { motion } from 'framer-motion';

const partners = [
  { id: 1, src: '/partners logo/image.png', alt: 'DJI', name: 'DJI' },
  { id: 2, src: '/partners logo/image copy.png', alt: 'Parrot', name: 'Parrot' },
  { id: 3, src: '/partners logo/image copy 2.png', alt: 'Autel', name: 'Autel' },
  { id: 4, src: '/partners logo/image copy 3.png', alt: 'Freefly', name: 'Freefly' },
  { id: 5, src: '/partners logo/image copy 4.png', alt: 'Trimble', name: 'Trimble' },
  { id: 6, src: '/partners logo/image copy 5.png', alt: 'Leica', name: 'Leica' },
];

export default function PartnerLogos() {
  return (
    <section className="relative py-20 overflow-hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 lg:px-12 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
            Our Partners
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Trusted by industry-leading technology providers
          </p>
        </motion.div>
      </div>

      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* Scrolling Partner Logos */}
      <div className="relative overflow-hidden">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: -2400 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex gap-16 items-center justify-center"
        >
          {/* First set */}
          {partners.map((partner) => (
            <motion.div
              key={`${partner.id}-1`}
              className="flex-shrink-0 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-20 w-48 flex items-center justify-center px-4">
                <img
                  src={partner.src}
                  alt={partner.alt}
                  className="max-h-full max-w-full object-contain transition-all duration-300 hover:brightness-110"
                />
              </div>
            </motion.div>
          ))}

          {/* Duplicate set for seamless loop */}
          {partners.map((partner) => (
            <motion.div
              key={`${partner.id}-2`}
              className="flex-shrink-0 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-20 w-48 flex items-center justify-center px-4">
                <img
                  src={partner.src}
                  alt={partner.alt}
                  className="max-h-full max-w-full object-contain transition-all duration-300 hover:brightness-110"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
