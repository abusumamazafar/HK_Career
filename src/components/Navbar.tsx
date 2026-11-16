import React from 'react';
import { COMPANY_INFO } from '../data/jobs';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#F8F8F6]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-2 sm:px-6 lg:px-8">
        <a
          href="#"
          className="inline-flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
          aria-label={COMPANY_INFO.name}
        >
          <img
            src={COMPANY_INFO.logoPath}
            alt={COMPANY_INFO.name}
            referrerPolicy="no-referrer"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"
        >
          <a
            href="#open-roles"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-900 hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
          >
            Open Roles
          </a>
          <a
            href="#candidate-fit"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-900 hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
          >
            Expectations
          </a>
          <a
            href="#office-location"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-900 hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
          >
            Office Location
          </a>
          <a
            href="#apply-form"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-900 hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600"
          >
            Apply
          </a>
        </nav>

        <div className="shrink-0">
          <a
            href="#apply-form"
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:text-sm"
          >
            Apply Now
          </a>
        </div>
      </div>
    </header>
  );
};
