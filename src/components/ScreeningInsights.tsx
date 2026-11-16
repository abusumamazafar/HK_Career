import React from 'react';

const EXPECTATIONS = [
  {
    number: '01.',
    title: 'Verified Hands-On Experience',
    description:
      'We prioritize candidates who have already managed live client inquiries or supervised active residential and commercial construction sites—not purely theoretical profiles.',
    detail: 'Civil Engineers: Grey structure, finishing & BOQs · CROs: Call & ad-lead conversion',
  },
  {
    number: '02.',
    title: 'Clear & Prompt Communication',
    description:
      'Whether coordinating subcontractors on site or welcoming prospective homeowners at our office, dependable follow-through and professional Urdu/English communication are essential.',
    detail: 'Daily reporting discipline · Timely inquiry response · Structured meeting scheduling',
  },
  {
    number: '03.',
    title: 'Reliable Commute to Raiwind Road',
    description:
      'All positions operate full-time from our office and project sites around C Block, Al-Kabir Town Phase II, Raiwind Road, Lahore. Punctuality and daily site/office presence are mandatory.',
    detail: 'Office Hours: Monday – Saturday · 9:00 AM – 6:00 PM',
  },
];

export const ScreeningInsights: React.FC = () => {
  return (
    <section id="candidate-fit" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold text-amber-700">Hiring Standards</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl">
              What we prioritize when reviewing applications.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              To respect your time and ours, every submitted application is screened against three practical
              standards before we schedule an in-person interview in Al-Kabir Town Phase II.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-8">
            {EXPECTATIONS.map((item) => (
              <div
                key={item.number}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F8F8F6] p-6"
              >
                <div>
                  <p className="font-mono text-xs font-medium text-amber-700">{item.number}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
                <p className="mt-5 border-t border-slate-200 pt-4 text-xs font-medium text-slate-700">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
