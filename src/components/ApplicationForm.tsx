import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  Trash2,
  Upload,
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

interface UploadedFileInfo {
  fileName: string;
  sizeBytes: number;
  url: string;
  previewUrl?: string;
}

const EXPERIENCE_OPTIONS = ['Less than 1 Year', '1–2 Years', '3–5 Years', '5+ Years'];
const AVAILABILITY_OPTIONS = ['Immediate', 'Within 1 Week', '2 Weeks – 1 Month'];
const GENDER_OPTIONS = ['Male', 'Female'];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_CV_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  selectedRole,
  onSelectRole,
}) => {
  const activeRole = JOB_ROLES.find((r) => r.id === selectedRole) ?? JOB_ROLES[0];

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [gender, setGender] = useState('Male');
  const [experience, setExperience] = useState('1–2 Years');
  const [qualification, setQualification] = useState(activeRole.qualificationOptions[0]);
  const [summary, setSummary] = useState('');
  const [availability, setAvailability] = useState('Immediate');
  const [confirmedLocation, setConfirmedLocation] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState<UploadedFileInfo | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [cvFile, setCvFile] = useState<UploadedFileInfo | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRecordId, setSubmittedRecordId] = useState<string | null>(null);

  useEffect(() => {
    setQualification(activeRole.qualificationOptions[0]);
    setSubmittedRecordId(null);
    setSubmitError(null);
  }, [activeRole.id]);

  useEffect(() => {
    return () => {
      if (profilePhoto?.previewUrl) {
        URL.revokeObjectURL(profilePhoto.previewUrl);
      }
    };
  }, [profilePhoto?.previewUrl]);

  const uploadFile = async (kind: 'photo' | 'cv', file: File) => {
    const isPhoto = kind === 'photo';
    const maxBytes = isPhoto ? MAX_PHOTO_BYTES : MAX_CV_BYTES;

    if (file.size > maxBytes) {
      const msg = isPhoto
        ? 'Profile image must be 5 MB or smaller.'
        : 'CV file must be 10 MB or smaller.';
      if (isPhoto) setPhotoError(msg);
      else setCvError(msg);
      return;
    }

    if (isPhoto) {
      setPhotoError(null);
      setPhotoUploading(true);
    } else {
      setCvError(null);
      setCvUploading(true);
    }

    try {
      const dataBase64 = await readFileAsDataUrl(file);
      let hostedUrl = '';

      try {
        const response = await fetch('./api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind,
            fileName: file.name,
            mimeType: file.type || '',
            dataBase64,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const result = await response.json();
          if (result?.url) {
            hostedUrl = String(result.url).replace(/^\//, '');
          }
        } else if (response.status >= 400 && response.status < 500 && response.status !== 404 && response.status !== 405) {
          const errData = contentType.includes('application/json') ? await response.json() : null;
          throw new Error(errData?.error || 'Upload rejected. Please try another file.');
        }
      } catch (networkErr) {
        if (networkErr instanceof Error && networkErr.message.includes('Upload rejected')) {
          throw networkErr;
        }
        // Static hosting fallback (e.g. bundlenest.xyz/hkc without Node backend)
      }

      if (isPhoto) {
        if (profilePhoto?.previewUrl) {
          URL.revokeObjectURL(profilePhoto.previewUrl);
        }
        setProfilePhoto({
          fileName: file.name,
          sizeBytes: file.size,
          url: hostedUrl,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        setCvFile({
          fileName: file.name,
          sizeBytes: file.size,
          url: hostedUrl,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process selected file.';
      if (isPhoto) setPhotoError(message);
      else setCvError(message);
    } finally {
      if (isPhoto) setPhotoUploading(false);
      else setCvUploading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadFile('photo', file);
    }
    e.target.value = '';
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadFile('cv', file);
    }
    e.target.value = '';
  };

  const clearPhoto = () => {
    if (profilePhoto?.previewUrl) {
      URL.revokeObjectURL(profilePhoto.previewUrl);
    }
    setProfilePhoto(null);
    setPhotoError(null);
  };

  const clearCv = () => {
    setCvFile(null);
    setCvError(null);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photoUploading || cvUploading || submitting) {
      return;
    }

    const validationErrors = validate();
    setErrors(validationErrors);
    setSubmitError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('./api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: activeRole.id,
          roleTitle: activeRole.title,
          fullName: fullName.trim(),
          ...(activeRole.id === 'client-relations-officer' ? { gender } : {}),
          phone: phone.trim(),
          area: area.trim(),
          experience,
          qualification,
          summary: summary.trim(),
          availability,
          profilePhoto: profilePhoto
            ? {
                fileName: profilePhoto.fileName,
                sizeBytes: profilePhoto.sizeBytes,
                url: profilePhoto.url,
              }
            : null,
          cvFile: cvFile
            ? {
                fileName: cvFile.fileName,
                sizeBytes: cvFile.sizeBytes,
                url: cvFile.url,
              }
            : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) {
        throw new Error(data?.error || 'Could not submit application. Please try again.');
      }

      setSubmittedRecordId(String(data.id));
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to reach hiring server. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnotherApplication = () => {
    setSubmittedRecordId(null);
    setSubmitError(null);
    setFullName('');
    setPhone('');
    setArea('');
    setSummary('');
    setConfirmedLocation(false);
    clearPhoto();
    clearCv();
  };

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
            {submittedRecordId ? (
              <div>
                <div className="flex items-start gap-3 border-b border-slate-200 pb-6">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">
                      Application Received
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Thank you, <span className="font-semibold text-slate-900">{fullName.trim()}</span>.
                      Your application for <span className="font-semibold text-slate-900">{activeRole.title}</span>{' '}
                      has been recorded for our hiring team. Shortlisted candidates will be contacted directly.
                    </p>
                    <p className="mt-2 font-mono text-xs text-slate-500 tabular-nums">
                      Reference ID: {submittedRecordId.slice(0, 8).toUpperCase()}
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
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Profile Image</dt>
                    <dd className="mt-1 flex items-center gap-2 text-slate-900">
                      {profilePhoto ? (
                        <>
                          {profilePhoto.previewUrl && (
                            <img
                              src={profilePhoto.previewUrl}
                              alt="Uploaded profile"
                              className="h-7 w-7 rounded object-cover border border-slate-200"
                            />
                          )}
                          <span className="truncate">{profilePhoto.fileName}</span>
                        </>
                      ) : (
                        <span className="text-slate-500">Not attached</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">CV / Resume</dt>
                    <dd className="mt-1 truncate text-slate-900">
                      {cvFile ? cvFile.fileName : <span className="text-slate-500">Not attached</span>}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={resetForAnotherApplication}
                    className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span>Submit Another Application</span>
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

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-900">
                      Profile Image <span className="text-xs font-normal text-slate-500">(Optional · Max 5 MB)</span>
                    </label>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="sr-only"
                      aria-label="Upload Profile Image"
                    />
                    {profilePhoto ? (
                      <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#F8F8F6] p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {profilePhoto.previewUrl && (
                            <img
                              src={profilePhoto.previewUrl}
                              alt="Candidate profile preview"
                              className="h-11 w-11 shrink-0 rounded-md border border-slate-200 object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {profilePhoto.fileName}
                            </p>
                            <p className="text-xs text-emerald-700 font-medium tabular-nums">
                              Uploaded · {formatBytes(profilePhoto.sizeBytes)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearPhoto}
                          aria-label="Remove profile image"
                          className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={photoUploading}
                        className="mt-1.5 flex min-h-[68px] w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-[#F8F8F6] px-4 py-3 text-left transition-colors duration-150 hover:border-amber-600 hover:bg-amber-50/40 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
                          {photoUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-700" aria-hidden="true" />
                          ) : (
                            <ImagePlus className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-slate-900">
                            {photoUploading ? 'Uploading Profile Image...' : 'Upload Profile Image'}
                          </span>
                          <span className="block text-xs text-slate-500">JPG, PNG, or WEBP</span>
                        </div>
                      </button>
                    )}
                    {photoError && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{photoError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900">
                      Upload CV / Resume <span className="text-xs font-normal text-slate-500">(Optional · Max 10 MB)</span>
                    </label>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCvChange}
                      className="sr-only"
                      aria-label="Upload CV or Resume"
                    />
                    {cvFile ? (
                      <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#F8F8F6] p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-amber-700">
                            <FileText className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{cvFile.fileName}</p>
                            <p className="text-xs text-emerald-700 font-medium tabular-nums">
                              Uploaded · {formatBytes(cvFile.sizeBytes)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearCv}
                          aria-label="Remove CV file"
                          className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => cvInputRef.current?.click()}
                        disabled={cvUploading}
                        className="mt-1.5 flex min-h-[68px] w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-[#F8F8F6] px-4 py-3 text-left transition-colors duration-150 hover:border-amber-600 hover:bg-amber-50/40 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
                          {cvUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-700" aria-hidden="true" />
                          ) : (
                            <Upload className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-slate-900">
                            {cvUploading ? 'Uploading CV...' : 'Upload CV / Resume'}
                          </span>
                          <span className="block text-xs text-slate-500">PDF, DOC, or DOCX</span>
                        </div>
                      </button>
                    )}
                    {cvError && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{cvError}</span>
                      </p>
                    )}
                  </div>
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

                {submitError && (
                  <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800 sm:text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={photoUploading || cvUploading || submitting}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white whitespace-nowrap transition-colors duration-150 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  <span>
                    {photoUploading || cvUploading
                      ? 'Uploading files...'
                      : submitting
                      ? 'Submitting...'
                      : 'Submit'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
