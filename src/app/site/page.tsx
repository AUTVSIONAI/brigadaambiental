import { Navbar } from '@/components/site/Navbar';
import { Hero } from '@/components/site/Hero';
import { About } from '@/components/site/About';
import { Projects } from '@/components/site/Projects';
import { Contact } from '@/components/site/Contact';
import { Footer } from '@/components/site/Footer';

export default function SitePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Contact />
      <Footer />
    </div>
  );
}