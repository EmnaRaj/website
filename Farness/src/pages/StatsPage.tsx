import Navigation from '../components/Navigation';
import StatsSection from '../components/StatsSection';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

export default function StatsPage() {
  return (
    <>
      <Navigation />
      <main>
        <StatsSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
