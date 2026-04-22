import Navigation from '../components/Navigation';
import AIAgentsSection from '../components/AIAgentsSection';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

export default function AIAgentsPage() {
  return (
    <>
      <Navigation />
      <main>
        <AIAgentsSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
