import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  LogOut,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { COMPANY_INFO, JOB_ROLES } from '../data/jobs';
import { ApplicationStatus, JobApplicationRecord } from '../types/application';

interface AdminPanelProps {
  onExitAdmin: () => void;
}

const ADMIN_TOKEN_STORAGE_KEY = 'hkc_admin_token';

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  new: {
    label: 'New',
    dotClass: 'bg-amber-600',
    textClass: 'text-amber-800',
  },
  shortlisted: {
    label: 'Shortlisted',
    dotClass: 'bg-emerald-600',
    textClass: 'text-emerald-800',
  },
  contacted: {
    label: 'Contacted',
    dotClass: 'bg-slate-700',
    textClass: 'text-slate-800',
  },
  rejected: {
    label: 'Archived',
    dotClass: 'bg-red-600',
    textClass: 'text-red-700',
  },
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveFileHref(url: string): string {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `./${url.replace(/^\.\//, '').replace(/^\//, '')}`;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitAdmin }) => {
  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage failure
    }
    setToken('');
    setApplications([]);
    setSelectedId(null);
  }, []);

  const fetchApplications = useCallback(
    async (activeToken: string) => {
      if (!activeToken) return;
      setLoadingList(true);
      setListError(null);
      try {
        const res = await fetch('./api/admin/applications', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.status === 401) {
          clearSession();
          setLoginError('Session expired. Please sign in again.');
          return;
        }
        const data = await res.json();
        if (!res.ok || !Array.isArray(data?.applications)) {
          throw new Error(data?.error || 'Unable to load applications.');
        }
        setApplications(data.applications);
      } catch (err) {
        setListError(err instanceof Error ? err.message : 'Unable to reach backend server.');
      } finally {
        setLoadingList(false);
      }
    },
    [clearSession]
  );

  useEffect(() => {
    if (token) {
      void fetchApplications(token);
    }
  }, [token, fetchApplications]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setLoginError('Enter the admin passcode.');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('./api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.token) {
        throw new Error(data?.error || 'Invalid passcode.');
      }
      try {
        sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, data.token);
      } catch {
        // ignore storage error
      }
      setPasscode('');
      setToken(data.token);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const counts = useMemo(() => {
    return {
      all: applications.length,
      new: applications.filter((a) => a.status === 'new').length,
      shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
      contacted: applications.filter((a) => a.status === 'contacted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return applications.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (roleFilter !== 'all' && item.roleId !== roleFilter) return false;
      if (!query) return true;
      return (
        item.fullName.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query) ||
        item.area.toLowerCase().includes(query) ||
        item.qualification.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query)
      );
    });
  }, [applications, statusFilter, roleFilter, searchQuery]);

  const selectedApplicant = useMemo(() => {
    if (!filteredApplications.length) return null;
    return filteredApplications.find((a) => a.id === selectedId) ?? filteredApplications[0];
  }, [filteredApplications, selectedId]);

  useEffect(() => {
    if (selectedApplicant) {
      setNotesDraft(selectedApplicant.notes || '');
      setNotesSavedNotice(false);
      setConfirmDeleteId(null);
    }
  }, [selectedApplicant?.id]);

  const handleUpdateApplication = async (
    id: string,
    patch: { status?: ApplicationStatus; notes?: string }
  ) => {
    if (!token) return;
    setSavingId(id);
    try {
      const res = await fetch(`./api/admin/applications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      if (res.status === 401) {
        clearSession();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data?.application) {
        throw new Error(data?.error || 'Failed to save update.');
      }
      setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
      if (patch.notes !== undefined) {
        setNotesSavedNotice(true);
        setTimeout(() => setNotesSavedNotice(false), 2000);
      }
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Unable to update applicant.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setSavingId(id);
    try {
      const res = await fetch(`./api/admin/applications/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearSession();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Delete failed.');
      }
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteId(null);
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Unable to delete record.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCopyPhone = async (id: string, phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Applied At',
      'Status',
      'Position',
      'Full Name',
      'Gender',
      'Mobile Number',
      'Area in Lahore',
      'Experience',
      'Qualification',
      'Availability',
      'Summary',
      'HR Notes',
    ];

    const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = filteredApplications.map((a) =>
      [
        a.createdAt,
        STATUS_META[a.status].label,
        a.roleTitle,
        a.fullName,
        a.gender || '',
        a.phone,
        a.area,
        a.experience,
        a.qualification,
        a.availability,
        a.summary,
        a.notes,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hkc-applicants-${statusFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] px-4 py-12 text-slate-900 sm:py-20">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <img
              src={COMPANY_INFO.logoPath}
              alt={COMPANY_INFO.name}
              referrerPolicy="no-referrer"
              className="h-14 w-auto object-contain"
            />
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Public Job Page</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5 text-amber-700">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold">Protected Workspace</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              Hiring Admin Panel
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Sign in with your management passcode to review received job applications, view CVs, and
              shortlist candidates to contact.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="admin-passcode" className="block text-sm font-medium text-slate-900">
                  Admin Passcode
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="admin-passcode"
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter passcode"
                    autoFocus
                    className="block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode((v) => !v)}
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-900"
                  >
                    {showPasscode ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Default passcode: <span className="font-mono font-medium text-slate-700">hkc2026</span>
                </p>
              </div>

              {loginError && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{loginError}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In to Hiring Panel</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={COMPANY_INFO.logoPath}
              alt={COMPANY_INFO.name}
              referrerPolicy="no-referrer"
              className="h-11 w-auto shrink-0 object-contain"
            />
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-slate-400">/</span>
              <span className="font-display font-semibold text-slate-900 whitespace-nowrap">
                Hiring Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void fetchApplications(token)}
              disabled={loadingList}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50 disabled:opacity-60 sm:text-sm"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingList ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50 sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Public Page</span>
            </button>

            <button
              type="button"
              onClick={clearSession}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-slate-800 sm:text-sm"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Total Received</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {counts.all}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">New Unreviewed</p>
            <p className="mt-1 font-display text-2xl font-bold text-amber-700 tabular-nums">
              {counts.new}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Shortlisted</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-700 tabular-nums">
              {counts.shortlisted}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">Contacted</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {counts.contacted}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F8F8F6] p-1">
            {(['all', 'new', 'shortlisted', 'contacted', 'rejected'] as const).map((key) => {
              const active = statusFilter === key;
              const label = key === 'all' ? 'All' : STATUS_META[key].label;
              const count = counts[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label} <span className="ml-1 font-mono text-slate-400 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by position"
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-600 focus:outline-none sm:text-sm"
            >
              <option value="all">All Positions</option>
              {JOB_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, area..."
                className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none sm:w-60 sm:text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredApplications.length === 0}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {listError && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{listError}</span>
            </span>
            <button
              type="button"
              onClick={() => setListError(null)}
              className="text-xs font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {loadingList && applications.length === 0 ? (
                <div className="divide-y divide-slate-200 p-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-center justify-between py-4 animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 w-40 rounded bg-slate-200" />
                        <div className="h-3 w-28 rounded bg-slate-100" />
                      </div>
                      <div className="h-4 w-20 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-10 text-center">
                  <Users className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
                  <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">
                    {applications.length === 0
                      ? 'No applications received yet'
                      : 'No matching candidates'}
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600">
                    {applications.length === 0
                      ? 'When applicants submit the form on your landing page, their profile, photo, and CV will appear here immediately.'
                      : 'Try clearing your search query or switching back to All status tabs.'}
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    {applications.length === 0 ? (
                      <button
                        type="button"
                        onClick={onExitAdmin}
                        className="inline-flex min-h-[40px] items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Open Public Application Form
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setRoleFilter('all');
                          setSearchQuery('');
                        }}
                        className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#F8F8F6] text-xs font-semibold text-slate-600">
                        <th className="px-4 py-3">Candidate</th>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3">Exp</th>
                        <th className="px-4 py-3">Received</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredApplications.map((item) => {
                        const isSelected = selectedApplicant?.id === item.id;
                        const statusInfo = STATUS_META[item.status];
                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                {item.profilePhoto?.url ? (
                                  <img
                                    src={resolveFileHref(item.profilePhoto.url)}
                                    alt={item.fullName}
                                    className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-[#F8F8F6] font-display text-xs font-bold text-slate-700">
                                    {item.fullName
                                      .split(' ')
                                      .slice(0, 2)
                                      .map((p) => p[0])
                                      .join('')
                                      .toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">{item.fullName}</p>
                                  <p className="truncate text-xs text-slate-500">{item.area}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                              {item.roleTitle}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                              {item.experience}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                              {formatDateTime(item.createdAt)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusInfo.textClass}`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-xs ${statusInfo.dotClass}`}
                                  aria-hidden="true"
                                />
                                <span>{statusInfo.label}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            {selectedApplicant ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {selectedApplicant.profilePhoto?.url ? (
                      <a
                        href={resolveFileHref(selectedApplicant.profilePhoto.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                        title="Open full profile image"
                      >
                        <img
                          src={resolveFileHref(selectedApplicant.profilePhoto.url)}
                          alt={selectedApplicant.fullName}
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                        />
                      </a>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#F8F8F6] font-display text-lg font-bold text-slate-700">
                        {selectedApplicant.fullName
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-amber-700">
                        {selectedApplicant.roleTitle}
                        {selectedApplicant.gender ? ` · ${selectedApplicant.gender}` : ''}
                      </p>
                      <h2 className="mt-0.5 font-display text-xl font-bold text-slate-900 truncate">
                        {selectedApplicant.fullName}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {selectedApplicant.area} · Applied{' '}
                        <span className="font-mono tabular-nums">
                          {formatDateTime(selectedApplicant.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <a
                    href={`tel:${selectedApplicant.phone.replace(/\s+/g, '')}`}
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white whitespace-nowrap hover:bg-slate-800"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <span className="font-mono tabular-nums">{selectedApplicant.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyPhone(selectedApplicant.id, selectedApplicant.phone)
                    }
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap hover:bg-slate-50"
                  >
                    {copiedPhoneId === selectedApplicant.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold text-slate-900">Shortlist Decision</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(['new', 'shortlisted', 'contacted', 'rejected'] as ApplicationStatus[]).map(
                      (statusKey) => {
                        const active = selectedApplicant.status === statusKey;
                        return (
                          <button
                            key={statusKey}
                            type="button"
                            disabled={savingId === selectedApplicant.id}
                            onClick={() =>
                              void handleUpdateApplication(selectedApplicant.id, {
                                status: statusKey,
                              })
                            }
                            className={`min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                              active
                                ? statusKey === 'shortlisted'
                                  ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                                  : statusKey === 'rejected'
                                  ? 'border-red-600 bg-red-50 text-red-900'
                                  : 'border-amber-600 bg-amber-50 text-amber-900'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {STATUS_META[statusKey].label}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-[#F8F8F6] p-4 text-xs sm:text-sm">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Experience</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">
                      {selectedApplicant.experience}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Availability</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">
                      {selectedApplicant.availability}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-medium text-slate-500">Qualification / Strength</dt>
                    <dd className="mt-0.5 text-slate-900">{selectedApplicant.qualification}</dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-900">Experience Summary</p>
                  <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-slate-200 bg-[#F8F8F6] p-3.5 text-sm leading-relaxed text-slate-700">
                    {selectedApplicant.summary}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-900">Uploaded Documents</p>
                  <div className="mt-2 space-y-2">
                    {selectedApplicant.cvFile?.url ? (
                      <a
                        href={resolveFileHref(selectedApplicant.cvFile.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#F8F8F6] px-3.5 py-2.5 text-sm transition-colors hover:border-amber-600"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <FileText className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                          <span className="truncate font-medium text-slate-900">
                            {selectedApplicant.cvFile.fileName}
                          </span>
                          {selectedApplicant.cvFile.sizeBytes > 0 && (
                            <span className="shrink-0 font-mono text-xs text-slate-500 tabular-nums">
                              ({formatBytes(selectedApplicant.cvFile.sizeBytes)})
                            </span>
                          )}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700">
                          <span>Open CV</span>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500">No CV uploaded.</p>
                    )}

                    {selectedApplicant.profilePhoto?.url && (
                      <a
                        href={resolveFileHref(selectedApplicant.profilePhoto.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#F8F8F6] px-3.5 py-2.5 text-sm transition-colors hover:border-amber-600"
                      >
                        <span className="truncate font-medium text-slate-900">
                          {selectedApplicant.profilePhoto.fileName}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700">
                          <span>View Photo</span>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="hr-notes" className="text-xs font-semibold text-slate-900">
                      HR Interview Notes
                    </label>
                    {notesSavedNotice && (
                      <span className="text-xs font-medium text-emerald-700">Saved</span>
                    )}
                  </div>
                  <textarea
                    id="hr-notes"
                    rows={3}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Add call feedback, interview date, or expected salary notes..."
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={savingId === selectedApplicant.id}
                      onClick={() =>
                        void handleUpdateApplication(selectedApplicant.id, { notes: notesDraft })
                      }
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Save Notes</span>
                    </button>

                    {confirmDeleteId === selectedApplicant.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDelete(selectedApplicant.id)}
                          disabled={savingId === selectedApplicant.id}
                          className="min-h-[36px] rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[36px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selectedApplicant.id)}
                        className="inline-flex min-h-[36px] items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Select a candidate from the list to inspect their profile, view documents, and update
                shortlist status.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
