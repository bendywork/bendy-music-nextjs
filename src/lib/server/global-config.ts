import fs from 'node:fs';
import path from 'node:path';

export interface ReleaseConfig {
  version: string;
  major: number;
  minor: number;
  patch: number;
  tagPrefix: string;
  autoPatchOnCommit: boolean;
}

export interface AppConfig {
  project: {
    name: string;
    repository: string;
  };
  auth: {
    github: {
      admins: string[];
      scopes: string[];
    };
  };
}

export interface GitHubAuthRuntimeConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  adminUsers: string[];
  scopes: string[];
}

const DEFAULT_RELEASE_CONFIG: ReleaseConfig = {
  version: '0.1.0',
  major: 0,
  minor: 1,
  patch: 0,
  tagPrefix: 'v',
  autoPatchOnCommit: true,
};

const DEFAULT_APP_CONFIG: AppConfig = {
  project: {
    name: 'ddmusic-nextjs',
    repository: 'yokeay/ddmusic-nextjs',
  },
  auth: {
    github: {
      admins: ['yokeay'],
      scopes: ['read:user', 'repo'],
    },
  },
};

const RELEASE_CONFIG_PATH = path.join(process.cwd(), 'config', 'release.config.json');
const APP_CONFIG_PATH = path.join(process.cwd(), 'config', 'app.config.json');

const parseCsv = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const readJsonWithFallback = <T>(filePath: string, fallback: T): T => {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse config file: ${filePath}`, error);
    return fallback;
  }
};

export const getReleaseConfig = (): ReleaseConfig => {
  return readJsonWithFallback(RELEASE_CONFIG_PATH, DEFAULT_RELEASE_CONFIG);
};

export const getAppConfig = (): AppConfig => {
  const fileConfig = readJsonWithFallback(APP_CONFIG_PATH, DEFAULT_APP_CONFIG);
  const envAdmins = parseCsv(process.env.GITHUB_ADMIN_USERS);
  const envScopes = parseCsv(process.env.GITHUB_OAUTH_SCOPES);

  return {
    ...fileConfig,
    auth: {
      ...fileConfig.auth,
      github: {
        ...fileConfig.auth.github,
        admins: envAdmins.length > 0 ? envAdmins : fileConfig.auth.github.admins,
        scopes: envScopes.length > 0 ? envScopes : fileConfig.auth.github.scopes,
      },
    },
  };
};

const resolveBaseUrl = (origin: string): string => {
  if (process.env.GITHUB_OAUTH_BASE_URL) {
    return process.env.GITHUB_OAUTH_BASE_URL.replace(/\/$/, '');
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  return origin.replace(/\/$/, '');
};

export const getGitHubAuthRuntimeConfig = (origin: string): GitHubAuthRuntimeConfig => {
  const appConfig = getAppConfig();
  const baseUrl = resolveBaseUrl(origin);
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI?.trim()
    ? process.env.GITHUB_OAUTH_REDIRECT_URI.trim()
    : `${baseUrl}/api/auth/github/callback`;

  return {
    clientId: process.env.GITHUB_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET?.trim() ?? '',
    redirectUri,
    adminUsers: appConfig.auth.github.admins.map((user) => user.toLowerCase()),
    scopes: appConfig.auth.github.scopes,
  };
};
