import { useState } from 'react';
import { ApplicationForm } from './components/ApplicationForm';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { JobListings } from './components/JobListings';
import { Navbar } from './components/Navbar';
import { ScreeningInsights } from './components/ScreeningInsights';
import { JobRoleId } from './data/jobs';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<JobRoleId>('client-relations-officer');

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <JobListings selectedRole={selectedRole} onSelectRole={setSelectedRole} />
        <ScreeningInsights />
        <ApplicationForm selectedRole={selectedRole} onSelectRole={setSelectedRole} />
      </main>
      <Footer />
    </div>
  );
}
