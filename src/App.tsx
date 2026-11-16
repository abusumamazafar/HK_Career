import { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { ApplicationForm } from './components/ApplicationForm';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { JobListings } from './components/JobListings';
import { Navbar } from './components/Navbar';
import { ScreeningInsights } from './components/ScreeningInsights';
import { JobRoleId } from './data/jobs';

function isAdminHash(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash === '#/admin' || window.location.search.includes('panel=admin');
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState<JobRoleId>('client-relations-officer');
  const [viewMode, setViewMode] = useState<'public' | 'admin'>(() =>
    isAdminHash() ? 'admin' : 'public'
  );

  useEffect(() => {
    const handleHashChange = () => {
      setViewMode(isAdminHash() ? 'admin' : 'public');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openAdmin = () => {
    window.location.hash = '#/admin';
    setViewMode('admin');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const openPublic = () => {
    if (window.location.hash === '#/admin') {
      window.location.hash = '';
    }
    setViewMode('public');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (viewMode === 'admin') {
    return <AdminPanel onExitAdmin={openPublic} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <JobListings selectedRole={selectedRole} onSelectRole={setSelectedRole} />
        <ScreeningInsights />
        <ApplicationForm selectedRole={selectedRole} onSelectRole={setSelectedRole} />
      </main>
      <Footer onOpenAdmin={openAdmin} />
    </div>
  );
}
