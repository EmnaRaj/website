import Navigation from '../components/Navigation';
import TechnologySection from '../components/TechnologySection';
import UseCasesSection from '../components/UseCasesSection';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

export default function TechnologyPage() {
  return (
    <>
      <Navigation />
      <main>
        <TechnologySection />
        <UseCasesSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
