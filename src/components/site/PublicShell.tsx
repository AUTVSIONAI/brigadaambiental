import { Navbar } from '@/components/site/Navbar';
import { Footer } from '@/components/site/Footer';

export function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

