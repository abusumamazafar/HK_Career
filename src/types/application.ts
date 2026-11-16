export type ApplicationStatus = 'new' | 'shortlisted' | 'contacted' | 'rejected';

export interface StoredFileMeta {
  fileName: string;
  sizeBytes: number;
  url: string;
}

export interface JobApplicationRecord {
  id: string;
  roleId: string;
  roleTitle: string;
  fullName: string;
  gender?: string;
  phone: string;
  area: string;
  experience: string;
  qualification: string;
  summary: string;
  availability: string;
  profilePhoto: StoredFileMeta | null;
  cvFile: StoredFileMeta | null;
  status: ApplicationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
