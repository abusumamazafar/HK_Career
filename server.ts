import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DATA_DIR = path.resolve(process.cwd(), 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const ADMIN_PIN = (process.env.ADMIN_PIN || 'hkc2026').trim();
const TOKEN_SECRET = crypto
  .createHash('sha256')
  .update(`hkc-admin-secret:${ADMIN_PIN}`)
  .digest('hex');

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

const PHOTO_MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const CV_MIME_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_CV_BYTES = 10 * 1024 * 1024;

function sanitizeBaseName(fileName: string): string {
  const base = path.basename(fileName, path.extname(fileName));
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return cleaned || 'file';
}

function createAdminToken(): string {
  const issuedAt = Date.now().toString(36);
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${issuedAt}.${nonce}`;
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [issuedAt, nonce, sig] = parts;
  if (!issuedAt || !nonce || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${issuedAt}.${nonce}`)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const timestampMs = parseInt(issuedAt, 36);
  if (Number.isNaN(timestampMs)) return false;
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - timestampMs <= maxAgeMs;
}

let writeLock: Promise<void> = Promise.resolve();

async function ensureStorage(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(APPLICATIONS_FILE);
  } catch {
    await fs.writeFile(APPLICATIONS_FILE, '[]', 'utf8');
  }
}

async function readApplications(): Promise<JobApplicationRecord[]> {
  try {
    const raw = await fs.readFile(APPLICATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function mutateApplications<T>(
  mutator: (current: JobApplicationRecord[]) => { next: JobApplicationRecord[]; result: T }
): Promise<T> {
  let out!: T;
  writeLock = writeLock.then(async () => {
    const current = await readApplications();
    const { next, result } = mutator(current);
    const tempFile = `${APPLICATIONS_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tempFile, APPLICATIONS_FILE);
    out = result;
  });
  await writeLock;
  return out;
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Please sign in to the hiring panel.' });
    return;
  }
  next();
}

async function startServer() {
  await ensureStorage();

  const app = express();
  app.use(express.json({ limit: '16mb' }));

  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      fallthrough: false,
      setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.pdf' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
          res.setHeader('Content-Disposition', 'inline');
        } else {
          res.setHeader('Content-Disposition', 'attachment');
        }
      },
    })
  );

  app.post('/api/upload', async (req, res) => {
    try {
      const { kind, fileName, mimeType, dataBase64 } = req.body ?? {};

      if (kind !== 'photo' && kind !== 'cv') {
        res.status(400).json({ error: 'Invalid upload kind.' });
        return;
      }

      if (typeof fileName !== 'string' || typeof mimeType !== 'string' || typeof dataBase64 !== 'string') {
        res.status(400).json({ error: 'Missing required file payload.' });
        return;
      }

      const normalizedMime = mimeType.toLowerCase().trim();
      const allowedMap = kind === 'photo' ? PHOTO_MIME_EXT : CV_MIME_EXT;
      let ext = allowedMap[normalizedMime];

      if (!ext) {
        const fallbackExt = path.extname(fileName).toLowerCase();
        if (kind === 'photo' && ['.jpg', '.jpeg', '.png', '.webp'].includes(fallbackExt)) {
          ext = fallbackExt === '.jpeg' ? '.jpg' : fallbackExt;
        } else if (kind === 'cv' && ['.pdf', '.doc', '.docx'].includes(fallbackExt)) {
          ext = fallbackExt;
        }
      }

      if (!ext) {
        res.status(400).json({
          error:
            kind === 'photo'
              ? 'Profile image must be JPG, PNG, or WEBP.'
              : 'CV must be PDF, DOC, or DOCX.',
        });
        return;
      }

      const base64Payload = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
      const buffer = Buffer.from(base64Payload, 'base64');

      if (!buffer.length) {
        res.status(400).json({ error: 'Uploaded file appears empty.' });
        return;
      }

      const maxBytes = kind === 'photo' ? MAX_PHOTO_BYTES : MAX_CV_BYTES;
      if (buffer.length > maxBytes) {
        res.status(413).json({
          error:
            kind === 'photo'
              ? 'Profile image exceeds the 5 MB limit.'
              : 'CV file exceeds the 10 MB limit.',
        });
        return;
      }

      const id = crypto.randomBytes(6).toString('hex');
      const safeName = sanitizeBaseName(fileName);
      const storedName = `${id}-${kind}-${safeName}${ext}`;
      const destination = path.join(UPLOADS_DIR, storedName);

      await fs.writeFile(destination, buffer);

      res.json({
        ok: true,
        storedName,
        url: `uploads/${storedName}`,
        sizeBytes: buffer.length,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to store uploaded file.' });
    }
  });

  app.post('/api/applications', async (req, res) => {
    try {
      const body = req.body ?? {};
      const roleId = typeof body.roleId === 'string' ? body.roleId.trim() : '';
      const roleTitle = typeof body.roleTitle === 'string' ? body.roleTitle.trim() : '';
      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
      const gender = typeof body.gender === 'string' ? body.gender.trim() : undefined;
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      const area = typeof body.area === 'string' ? body.area.trim() : '';
      const experience = typeof body.experience === 'string' ? body.experience.trim() : '';
      const qualification = typeof body.qualification === 'string' ? body.qualification.trim() : '';
      const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
      const availability = typeof body.availability === 'string' ? body.availability.trim() : '';

      if (!roleId || !roleTitle || fullName.length < 2 || area.length < 2 || summary.length < 15) {
        res.status(400).json({ error: 'Please complete all required application fields.' });
        return;
      }

      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        res.status(400).json({ error: 'Please provide a valid mobile number.' });
        return;
      }

      const normalizeFile = (raw: unknown): StoredFileMeta | null => {
        if (!raw || typeof raw !== 'object') return null;
        const candidate = raw as Record<string, unknown>;
        if (typeof candidate.fileName !== 'string' || typeof candidate.url !== 'string') {
          return null;
        }
        return {
          fileName: candidate.fileName.slice(0, 180),
          sizeBytes: typeof candidate.sizeBytes === 'number' ? candidate.sizeBytes : 0,
          url: candidate.url.slice(0, 300),
        };
      };

      const now = new Date().toISOString();
      const record: JobApplicationRecord = {
        id: crypto.randomUUID(),
        roleId,
        roleTitle,
        fullName: fullName.slice(0, 120),
        ...(gender ? { gender: gender.slice(0, 30) } : {}),
        phone: phone.slice(0, 30),
        area: area.slice(0, 120),
        experience: experience.slice(0, 60),
        qualification: qualification.slice(0, 160),
        summary: summary.slice(0, 2000),
        availability: availability.slice(0, 60),
        profilePhoto: normalizeFile(body.profilePhoto),
        cvFile: normalizeFile(body.cvFile),
        status: 'new',
        notes: '',
        createdAt: now,
        updatedAt: now,
      };

      await mutateApplications((current) => ({
        next: [record, ...current],
        result: record,
      }));

      res.status(201).json({
        ok: true,
        id: record.id,
        createdAt: record.createdAt,
      });
    } catch (error) {
      console.error('Application submission error:', error);
      res.status(500).json({ error: 'Unable to save application right now.' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    const providedBuf = Buffer.from(passcode, 'utf8');
    const expectedBuf = Buffer.from(ADMIN_PIN, 'utf8');

    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      res.status(401).json({ error: 'Incorrect passcode. Please try again.' });
      return;
    }

    res.json({
      ok: true,
      token: createAdminToken(),
    });
  });

  app.get('/api/admin/applications', requireAdmin, async (_req, res) => {
    try {
      const applications = await readApplications();
      res.json({
        ok: true,
        applications,
      });
    } catch (error) {
      console.error('Fetch applications error:', error);
      res.status(500).json({ error: 'Unable to load applications.' });
    }
  });

  app.patch('/api/admin/applications/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body ?? {};
      const validStatuses: ApplicationStatus[] = ['new', 'shortlisted', 'contacted', 'rejected'];

      if (status !== undefined && !validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status value.' });
        return;
      }

      if (notes !== undefined && typeof notes !== 'string') {
        res.status(400).json({ error: 'Notes must be plain text.' });
        return;
      }

      const updated = await mutateApplications((current) => {
        let found: JobApplicationRecord | null = null;
        const next = current.map((item) => {
          if (item.id !== id) return item;
          found = {
            ...item,
            ...(status !== undefined ? { status } : {}),
            ...(notes !== undefined ? { notes: notes.slice(0, 2000) } : {}),
            updatedAt: new Date().toISOString(),
          };
          return found;
        });
        return { next, result: found };
      });

      if (!updated) {
        res.status(404).json({ error: 'Application not found.' });
        return;
      }

      res.json({ ok: true, application: updated });
    } catch (error) {
      console.error('Update application error:', error);
      res.status(500).json({ error: 'Failed to update application.' });
    }
  });

  app.delete('/api/admin/applications/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const removed = await mutateApplications((current) => {
        const target = current.find((item) => item.id === id) || null;
        const next = current.filter((item) => item.id !== id);
        return { next, result: target };
      });

      if (!removed) {
        res.status(404).json({ error: 'Application not found.' });
        return;
      }

      const filesToDelete = [removed.profilePhoto?.url, removed.cvFile?.url].filter(
        (u): u is string => typeof u === 'string' && u.length > 0
      );

      for (const relUrl of filesToDelete) {
        const fileName = path.basename(relUrl);
        if (fileName) {
          await fs.unlink(path.join(UPLOADS_DIR, fileName)).catch(() => {});
        }
      }

      res.json({ ok: true, id });
    } catch (error) {
      console.error('Delete application error:', error);
      res.status(500).json({ error: 'Failed to delete application.' });
    }
  });

  app.use('/uploads', (_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(404).json({ error: 'File not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
