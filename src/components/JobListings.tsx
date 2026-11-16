import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { JOB_ROLES, JobRoleId } from '../data/jobs';

interface JobListingsProps {
  selectedRole: JobRoleId;
  onSelectRole: (roleId: JobRoleId) => void;
}

export const JobListings: React.FC<JobListingsProps> = ({ selectedRole, onSelectRole }) => {
  const handleApplyClick = (roleId: JobRoleId) => {
    onSelectRole(roleId);
    const formEl = document.getElementById('apply-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="open-roles" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-amber-700">Current Openings</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl">
          Review role responsibilities before applying.
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Both positions are full-time and based out of our Al-Kabir Town Phase II office. Please review the
          experience expectations carefully to ensure a strong fit.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {JOB_ROLES.map((role) => {
          const isSelected = selectedRole === role.id;

          return (
            <article
              key={role.id}
              className={`flex flex-col justify-between rounded-xl border bg-white p-6 transition-colors duration-150 sm:p-8 ${
                isSelected ? 'border-amber-600 ring-1 ring-amber-600/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500">
                    {role.indexLabel} {role.eligibilityNote} <span aria-hidden="true">·</span> {role.jobType}
                  </p>
                  {isSelected && (
                    <span className="text-xs font-semibold text-amber-700">Selected for Application</span>
                  )}
                </div>

                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
                  {role.title}
                </h3>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-slate-200 py-4">
                  <span className="font-mono text-lg font-medium text-slate-900 tabular-nums sm:text-xl">
                    {role.salary}
                  </span>
                  <span className="text-sm text-slate-600">
                    <span aria-hidden="true">/</span> month <span aria-hidden="true">·</span> {role.salaryDetail}
                  </span>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">{role.summary}</p>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-900">Core Responsibilities</h4>
                  <ul className="mt-3 space-y-2.5">
                    {role.responsibilities.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h4 className="text-sm font-semibold text-slate-900">Experience &amp; Candidate Fit</h4>
                  <ul className="mt-3 space-y-2">
                    {role.preferredExperience.map((req) => (
                      <li key={req} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="mb-4 text-xs text-slate-500">
                  Location: <span className="font-medium text-slate-700">{role.location}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyClick(role.id)}
                  className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${
                    isSelected
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Apply for {role.title}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
