import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_SETTINGS, INITIAL_DEMO_EMAILS, INITIAL_SOCIAL_POSTS } from './defaultData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      settings: DEFAULT_SETTINGS,
      emails: INITIAL_DEMO_EMAILS,
      socialPosts: INITIAL_SOCIAL_POSTS,
      syncHistory: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      settings: {
        gmail: { ...DEFAULT_SETTINGS.gmail, ...(parsed.settings?.gmail || {}) },
        ai: { ...DEFAULT_SETTINGS.ai, ...(parsed.settings?.ai || {}) },
        socialAccounts: {
          linkedin: {
            ...DEFAULT_SETTINGS.socialAccounts.linkedin,
            ...(parsed.settings?.socialAccounts?.linkedin || {}),
          },
          instagram: {
            ...DEFAULT_SETTINGS.socialAccounts.instagram,
            ...(parsed.settings?.socialAccounts?.instagram || {}),
          },
        },
        companyProfile: {
          ...DEFAULT_SETTINGS.companyProfile,
          ...(parsed.settings?.companyProfile || {}),
        },
      },
      emails: Array.isArray(parsed.emails) ? parsed.emails : INITIAL_DEMO_EMAILS,
      socialPosts: Array.isArray(parsed.socialPosts) && parsed.socialPosts.length > 0
        ? parsed.socialPosts
        : INITIAL_SOCIAL_POSTS,
      syncHistory: Array.isArray(parsed.syncHistory) ? parsed.syncHistory : [],
    };
  } catch (err) {
    console.error('Error reading db.json, resetting to defaults:', err);
    return {
      settings: DEFAULT_SETTINGS,
      emails: INITIAL_DEMO_EMAILS,
      socialPosts: INITIAL_SOCIAL_POSTS,
      syncHistory: [],
    };
  }
}

export function getDb() {
  return ensureDb();
}

export function saveDb(dbData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
  return dbData;
}

export function resetDemoEmails() {
  const db = ensureDb();
  const nonDemo = db.emails.filter((e) => !e.isDemo);
  db.emails = [...INITIAL_DEMO_EMAILS, ...nonDemo];
  saveDb(db);
  return db.emails;
}
