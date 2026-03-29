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
  repoSync: {
    docs: {
      enabled: boolean;
      branch: string;
      readmePath: string;
      apiDocPath: string;
      auth: {
        tokenEnvName: string;
      };
      commit: {
        messagePrefix: string;
        authorName: string;
        authorEmail: string;
      };
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
      scopes: ['read:user'],
    },
  },
  repoSync: {
    docs: {
      enabled: true,
      branch: 'main',
      readmePath: 'README.md',
      apiDocPath: 'doc/doc-prop.json',
      auth: {
        tokenEnvName: 'GITHUB_REPO_TOKEN',
      },
      commit: {
        messagePrefix: 'docs',
        authorName: 'ddmusic-bot',
        authorEmail: 'bot@ddmusic.local',
      },
    },
  },
};

const RELEASE_CONFIG_PATH = path.join(process.cwd(), 'config', 'release.config.json');
const APP_CONFIG_PATH = path.join(process.cwd(), 'config', 'app.config.json');
const stripBom = (value: string): string => value.replace(/^\uFEFF/, '');

const parseCsv = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const parseBoolean = (value?: string): boolean | null => {
  if (value === undefined) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return null;
};

const readJsonWithFallback = <T>(filePath: string, fallback: T): T => {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
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
  const fileConfig = readJsonWithFallback<Partial<AppConfig>>(APP_CONFIG_PATH, DEFAULT_APP_CONFIG);
  const envAdmins = parseCsv(process.env.GITHUB_ADMIN_USERS);
  const envScopes = parseCsv(process.env.GITHUB_OAUTH_SCOPES);
  const envRepository = process.env.GITHUB_REPO?.trim() || process.env.PROJECT_REPOSITORY?.trim();
  const envSyncEnabled = parseBoolean(process.env.DOCS_REPO_SYNC_ENABLED);
  const envSyncBranch = process.env.DOCS_REPO_SYNC_BRANCH?.trim();
  const envTokenEnvName = process.env.DOCS_REPO_TOKEN_ENV?.trim();
  const envReadmePath = process.env.DOCS_REPO_README_PATH?.trim();
  const envApiDocPath = process.env.DOCS_REPO_API_PATH?.trim();
  const envMessagePrefix = process.env.DOCS_REPO_COMMIT_PREFIX?.trim();
  const envCommitAuthorName = process.env.DOCS_REPO_COMMIT_AUTHOR?.trim();
  const envCommitAuthorEmail = process.env.DOCS_REPO_COMMIT_EMAIL?.trim();

  const mergedConfig: AppConfig = {
    ...DEFAULT_APP_CONFIG,
    ...fileConfig,
    project: {
      ...DEFAULT_APP_CONFIG.project,
      ...(fileConfig.project ?? {}),
    },
    auth: {
      ...DEFAULT_APP_CONFIG.auth,
      ...(fileConfig.auth ?? {}),
      github: {
        ...DEFAULT_APP_CONFIG.auth.github,
        ...(fileConfig.auth?.github ?? {}),
      },
    },
    repoSync: {
      ...DEFAULT_APP_CONFIG.repoSync,
      ...(fileConfig.repoSync ?? {}),
      docs: {
        ...DEFAULT_APP_CONFIG.repoSync.docs,
        ...(fileConfig.repoSync?.docs ?? {}),
        auth: {
          ...DEFAULT_APP_CONFIG.repoSync.docs.auth,
          ...(fileConfig.repoSync?.docs?.auth ?? {}),
        },
        commit: {
          ...DEFAULT_APP_CONFIG.repoSync.docs.commit,
          ...(fileConfig.repoSync?.docs?.commit ?? {}),
        },
      },
    },
  };

  return {
    ...mergedConfig,
    project: {
      ...mergedConfig.project,
      repository: envRepository || mergedConfig.project.repository,
    },
    auth: {
      ...mergedConfig.auth,
      github: {
        ...mergedConfig.auth.github,
        admins: envAdmins.length > 0 ? envAdmins : mergedConfig.auth.github.admins,
        scopes: envScopes.length > 0 ? envScopes : mergedConfig.auth.github.scopes,
      },
    },
    repoSync: {
      ...mergedConfig.repoSync,
      docs: {
        ...mergedConfig.repoSync.docs,
        enabled: envSyncEnabled ?? mergedConfig.repoSync.docs.enabled,
        branch: envSyncBranch || mergedConfig.repoSync.docs.branch,
        readmePath: envReadmePath || mergedConfig.repoSync.docs.readmePath,
        apiDocPath: envApiDocPath || mergedConfig.repoSync.docs.apiDocPath,
        auth: {
          ...mergedConfig.repoSync.docs.auth,
          tokenEnvName: envTokenEnvName || mergedConfig.repoSync.docs.auth.tokenEnvName,
        },
        commit: {
          ...mergedConfig.repoSync.docs.commit,
          messagePrefix: envMessagePrefix || mergedConfig.repoSync.docs.commit.messagePrefix,
          authorName: envCommitAuthorName || mergedConfig.repoSync.docs.commit.authorName,
          authorEmail: envCommitAuthorEmail || mergedConfig.repoSync.docs.commit.authorEmail,
        },
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
