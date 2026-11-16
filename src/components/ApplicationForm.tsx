import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { COMPANY_INFO, JOB_ROLES, JobRoleId } from '../data/jobs';

interface ApplicationFormProps {
  selectedRole: JobRoleId;
  onSelectRole: (roleId: JobRoleId) => void;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  area?: string;
  summary?: string;
  confirmedLocation?: string;
}

const EXPERIENCE_OPTIONS = ['Less than 1 Year', '1–2 Years', '3–5 Years', '5+ Years'];
const AVAILABILITY_OPTIONS = ['Immediate', 'Within 1 Week', '2 Weeks – 1 Month'];
const GENDER_OPTIONS = ['Male', 'Female'];

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  selectedRole,
  onSelectRole,
}) => {
  const activeRole = JOB_ROLES.find((r) => r.id === selectedRole) ?? JOB_ROLES[0];

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [gender, setGender] = useState('Male');
  const [experience, setExperience] = useState('1–2 Years');
  const [qualification, setQualification] = useState(activeRole.qualificationOptions[0]);
  const [summary, setSummary] = useState('');
  const [availability, setAvailability] = useState('Immediate');
  const [confirmedLocation, setConfirmedLocation] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  useEffect(() => {
    setQualification(activeRole.qualificationOptions[0]);
    setSubmittedMessage(null);
  }, [activeRole.id]);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your full name.';
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      nextErrors.phone = 'Enter a valid mobile number (e.g., 0300 1234567).';
    }

    if (area.trim().length < 2) {
      nextErrors.area = 'Enter your current residential area in Lahore.';
    }

    if (summary.trim().length < 15) {
      nextErrors.summary =
        'Please write at least 1–2 sentences describing your relevant work experience.';
    }

    if (!confirmedLocation) {
      nextErrors.confirmedLocation =
        'Please confirm you can commute to Al-Kabir Town Phase II, Raiwind Road.';
    }

    return nextErrors;
  };

  const buildApplicationPayload = (): string => {
    const appliedAt = new Date().toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const lines = [
      `*NEW JOB APPLICATION — ${COMPANY_INFO.name}*`,
      `Applied Date: ${appliedAt}`,
      '',
      `*1. CANDIDATE PROFILE*`,
      `• *Position Applied:* ${activeRole.title}`,
      `• *Full Name:* ${fullName.trim()}`,
      ...(activeRole.id === 'client-relations-officer' ? [`• *Gender:* ${gender}`] : []),
      `• *Mobile Number:* ${phone.trim()}`,
      `• *Current Area (Lahore):* ${area.trim()}`,
      '',
      `*2. EXPERIENCE & QUALIFICATION*`,
      `• *Relevant Experience:* ${experience}`,
      `• *${activeRole.qualificationLabel}:* ${qualification}`,
      `• *Work Summary:* ${summary.trim()}`,
      '',
      `*3. AVAILABILITY & COMMUTE*`,
      `• *Availability to Join:* ${availability}`,
      `• *Office / Site Location:* Confirmed (${COMPANY_INFO.fullAddress})`,
    ];
    return lines.join('\n');
  };

  const buildSubmissionUrl = (message: string): string =>
    `https://wa.me/${COMPANY_INFO.whatsappDigits}?text=${encodeURIComponent(message)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const formatted = buildApplicationPayload();
    setSubmittedMessage(formatted);

    const anchor = document.createElement('a');
    anchor.href = buildSubmissionUrl(formatted);
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const submissionUrl = submittedMessage ? buildSubmissionUrl(submittedMessage) : '#';

  return (
    <section id="apply-form" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div id="office-location" className="lg:col-span-5">
          <p className="text-xs font-semibold text-amber-700">Direct Application</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl">
            Submit your application.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Fill out this brief screening form. Once submitted, your profile is forwarded directly to our
            hiring desk so management can review your experience and schedule an interview.
          </p>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-base font-semibold text-slate-900">
              {COMPANY_INFO.name} — Hiring Office
            </h3>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <dt className="font-medium text-slate-900">Office Address</dt>
                  <dd className="mt-0.5 text-slate-600">{COMPANY_INFO.fullAddress}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <dt className="font-medium text-slate-900">Direct Hiring Line</dt>
                  <dd className="mt-0.5 font-mono text-slate-700 tabular-nums">
                    {COMPANY_INFO.phoneDisplay}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <dt className="font-medium text-slate-900">Interview Schedule</dt>
                  <dd className="mt-0.5 text-slate-600">{COMPANY_INFO.officeHours}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-sm font-semibold text-slate-900">How Screening Works</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-medium text-amber-700">01.</span>
                <span>Select your role and summarize your relevant experience below.</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-medium text-amber-700">02.</span>
                <span>Click Submit to forward your profile to our hiring team.</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-medium text-amber-700">03.</span>
                <span>Shortlisted candidates are contacted directly for an office interview.</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            {submittedMessage ? (
              <div>
                <div className="flex items-start gap-3 border-b border-slate-200 pb-6">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">
                      Application Submitted
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Thank you, <span className="font-semibold text-slate-900">{fullName.trim()}</span>.
                      Your application for <span className="font-semibold text-slate-900">{activeRole.title}</span>{' '}
                      has been prepared for our hiring desk.
                    </p>
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-[#F8F8F6] p-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Position</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">{activeRole.title}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Mobile Number</dt>
                    <dd className="mt-0.5 font-mono text-slate-900 tabular-nums">{phone.trim()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Area in Lahore</dt>
                    <dd className="mt-0.5 text-slate-900">{area.trim()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Experience &amp; Availability</dt>
                    <dd className="mt-0.5 text-slate-900">
                      {experience} · {availability}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                  >
                    <span>Confirm &amp; Finalize Submission</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={() => setSubmittedMessage(null)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span>Edit Application Details</span>
                  </button>
                  <p className="text-xs text-slate-500">
                    Direct Line: <span className="font-mono tabular-nums">{COMPANY_INFO.phoneDisplay}</span>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    1. Select Position Applying For
                  </label>
                  <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg bg-[#F8F8F6] p-1.5 sm:grid-cols-2">
                    {JOB_ROLES.map((role) => {
                      const active = selectedRole === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => onSelectRole(role.id)}
                          className={`min-h-[44px] rounded-md px-3.5 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${
                            active
                              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{role.title}</span>
                          <span className="mt-0.5 block font-mono text-xs text-slate-500 tabular-nums">
                            {role.salary}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-900">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      placeholder="e.g. Muhammad Bilal"
                      className={`mt-1.5 block min-h-[44px] w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.fullName
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-300 focus:border-amber-600 focus:ring-amber-600/20'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-900">
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="e.g. 0300 1234567"
                      className={`mt-1.5 block min-h-[44px] w-full rounded-lg border bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.phone
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-300 focus:border-amber-600 focus:ring-amber-600/20'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="area" className="block text-sm font-medium text-slate-900">
                      Current Area in Lahore <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="area"
                      type="text"
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value);
                        if (errors.area) setErrors((prev) => ({ ...prev, area: undefined }));
                      }}
                      placeholder="e.g. Raiwind Road, Johar Town, Bahria Town"
                      className={`mt-1.5 block min-h-[44px] w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.area
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-300 focus:border-amber-600 focus:ring-amber-600/20'
                      }`}
                    />
                    {errors.area && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.area}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="qualification" className="block text-sm font-medium text-slate-900">
                      {activeRole.qualificationLabel}
                    </label>
                    <select
                      id="qualification"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                    >
                      {activeRole.qualificationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeRole.id === 'client-relations-officer' && (
                  <div>
                    <span className="block text-sm font-medium text-slate-900">
                      Candidate Gender <span className="text-slate-500">(Both Male &amp; Female Invited)</span>
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-2.5 sm:max-w-xs">
                      {GENDER_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setGender(item)}
                          className={`min-h-[42px] rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${
                            gender === item
                              ? 'border-amber-600 bg-amber-50 text-amber-900'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="block text-sm font-medium text-slate-900">
                    Relevant Work Experience
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {EXPERIENCE_OPTIONS.map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setExperience(exp)}
                        className={`min-h-[42px] rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:text-sm ${
                          experience === exp
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-slate-900">
                    Brief Experience Summary <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="summary"
                    rows={3}
                    value={summary}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      if (errors.summary) setErrors((prev) => ({ ...prev, summary: undefined }));
                    }}
                    placeholder={activeRole.summaryPlaceholder}
                    className={`mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.summary
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-amber-600 focus:ring-amber-600/20'
                    }`}
                  />
                  {errors.summary && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.summary}</span>
                    </p>
                  )}
                </div>

                <div>
                  <span className="block text-sm font-medium text-slate-900">
                    Availability to Join
                  </span>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {AVAILABILITY_OPTIONS.map((avail) => (
                      <button
                        key={avail}
                        type="button"
                        onClick={() => setAvailability(avail)}
                        className={`min-h-[42px] rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${
                          availability === avail
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {avail}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-[#F8F8F6] p-4">
                    <input
                      type="checkbox"
                      checked={confirmedLocation}
                      onChange={(e) => {
                        setConfirmedLocation(e.target.checked);
                        if (errors.confirmedLocation) {
                          setErrors((prev) => ({ ...prev, confirmedLocation: undefined }));
                        }
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-xs leading-relaxed text-slate-700 sm:text-sm">
                      I confirm my details are accurate and I am able to work full-time in Lahore at{' '}
                      <span className="font-semibold text-slate-900">{COMPANY_INFO.fullAddress}</span>.
                    </span>
                  </label>
                  {errors.confirmedLocation && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.confirmedLocation}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white whitespace-nowrap transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
