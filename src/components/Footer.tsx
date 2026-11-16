import React from 'react';
import { COMPANY_INFO } from '../data/jobs';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <img
            src={COMPANY_INFO.logoPath}
            alt={COMPANY_INFO.name}
            referrerPolicy="no-referrer"
            className="h-16 w-auto object-contain sm:h-20"
          />
          <div>
            <p className="font-display text-base font-bold text-slate-900">{COMPANY_INFO.name}</p>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
              {COMPANY_INFO.fullAddress} <span aria-hidden="true">·</span>{' '}
              <span className="font-mono tabular-nums">{COMPANY_INFO.phoneDisplay}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600 sm:text-sm">
          <a href="#open-roles" className="transition-colors hover:text-slate-900">
            Open Roles
          </a>
          <a href="#candidate-fit" className="transition-colors hover:text-slate-900">
            Expectations
          </a>
          <a href="#apply-form" className="transition-colors hover:text-slate-900">
            Apply Now
          </a>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="cursor-pointer font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            Hiring Panel
          </button>
        </div>
      </div>
    </footer>
  );
};
