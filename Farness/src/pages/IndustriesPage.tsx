import Navigation from '../components/Navigation';
import IndustriesSection from '../components/IndustriesSection';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

export default function IndustriesPage() {
  return (
    <>
      <Navigation />
      <main>
        <IndustriesSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
