import Navigation from '../components/Navigation';
import BlogSection from '../components/BlogSection';
import DemoSection from '../components/DemoSection';
import Footer from '../components/Footer';

export default function BlogPage() {
  return (
    <>
      <Navigation />
      <main>
        <BlogSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
