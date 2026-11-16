import React, { useState } from 'react';
import { ArrowDownRight, Building2, MapPin, Phone } from 'lucide-react';
import { COMPANY_INFO } from '../data/jobs';
import heroSiteImg from '../assets/images/hero_construction_site_1794747897396.jpg';

export const Hero: React.FC = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Lahore Hiring Drive <span aria-hidden="true">·</span> Al-Kabir Town Phase II{' '}
                <span aria-hidden="true">·</span> Immediate Openings
              </p>

              <h1
                className="mt-4 font-display font-bold tracking-tight text-slate-900 text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', lineHeight: 1.08 }}
              >
                Build with HK Construction &amp; Builders in Lahore.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                We are hiring experienced, dependable professionals for our active construction projects and
                client office on Raiwind Road. Complete the short screening form below to submit your profile
                directly to our hiring desk.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#apply-form"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                >
                  <span>Start 60-Second Application</span>
                  <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <a
                  href="#open-roles"
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Compare Both Roles
                </a>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
                <span>C Block, Al-Kabir Town Phase II, Raiwind Road</span>
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-xs font-medium text-slate-800 tabular-nums sm:text-sm">
                <Phone className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
                <span>{COMPANY_INFO.phoneDisplay}</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 sm:h-96 lg:h-full lg:min-h-[440px]">
              {!imgError ? (
                <img
                  src={heroSiteImg}
                  alt="Civil engineer inspecting architectural blueprints at an active HK Construction & Builders project site"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-8 text-center text-white">
                  <Building2 className="h-12 w-12 text-amber-500" aria-hidden="true" />
                  <p className="mt-4 font-display text-xl font-semibold">{COMPANY_INFO.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{COMPANY_INFO.fullAddress}</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-6">
                <p className="text-xs font-medium text-amber-300">
                  Site Execution <span aria-hidden="true">·</span> Client Advisory
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  Direct office and on-site roles based in Al-Kabir Town Phase II, Lahore
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-[#F8F8F6] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Open Positions</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900 tabular-nums">
              2 Active Roles
            </p>
            <p className="mt-0.5 text-xs text-slate-600">Client Relations &amp; Civil Engineering</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Monthly Compensation</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900 tabular-nums">
              Rs. 30,000 – 70,000
            </p>
            <p className="mt-0.5 text-xs text-slate-600">Role &amp; experience dependent + commission</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Work Location</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900">
              Raiwind Road, Lahore
            </p>
            <p className="mt-0.5 text-xs text-slate-600">C Block, Al-Kabir Town Phase II</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Hiring Desk</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900 tabular-nums">
              Direct · 0300 8540222
            </p>
            <p className="mt-0.5 text-xs text-slate-600">60-second online application</p>
          </div>
        </div>
      </div>
    </section>
  );
};
