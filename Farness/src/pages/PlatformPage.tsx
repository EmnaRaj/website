import Navigation from '../components/Navigation';
import PlatformSection from '../components/PlatformSection';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

export default function PlatformPage() {
  return (
    <>
      <Navigation />
      <main>
        <PlatformSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
