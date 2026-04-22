import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import PartnerLogos from '../components/PartnerLogos';
import FeaturePanels from '../components/FeaturePanels';
import AboutSection from '../components/AboutSection';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <PartnerLogos />
        <FeaturePanels />
        <AboutSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
