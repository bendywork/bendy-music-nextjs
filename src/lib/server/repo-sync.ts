import { getAppConfig, getRepositoryOverrideFromEnv, resolveProjectRepository } from '@/lib/server/global-config';
import { loadSystemConfig } from '@/lib/server/admin-config-store';

interface ParsedRepository {
  owner: string;
  name: string;
}

export interface RepoSyncResult {
  ok: boolean;
  committed: boolean;
  message: string;
  branch?: string;
}

const parseRepository = (repository: string): ParsedRepository | null => {
  const raw = repository.trim();
  if (!raw) {
    return null;
  }

  if (raw.includes('github.com/')) {
    const match = raw.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (!match) {
      return null;
    }

    return {
      owner: match[1],
      name: match[2].replace(/\.git$/i, ''),
    };
  }

  const [owner, name] = raw.split('/');
  if (!owner || !name) {
    return null;
  }

  return { owner, name: name.replace(/\.git$/i, '') };
};

const encodePath = (filePath: string): string => {
  return filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
};

const createGitHubHeaders = (token: string, includeJsonContentType = false): HeadersInit => {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
  };
};

const readRepositoryDefaultBranch = async (
  owner: string,
  repo: string,
  token: string,
): Promise<string | null> => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    method: 'GET',
    headers: createGitHubHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to read repository metadata: ${errorText}`);
  }

  const payload = (await response.json()) as { default_branch?: string };
  return payload.default_branch?.trim() || null;
};

const branchExists = async (
  owner: string,
  repo: string,
  branch: string,
  token: string,
): Promise<boolean> => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
    {
      method: 'GET',
      headers: createGitHubHeaders(token),
      cache: 'no-store',
    },
  );

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to read branch ${branch}: ${errorText}`);
  }

  return true;
};

const resolveTargetBranch = async (
  owner: string,
  repo: string,
  preferredBranch: string,
  token: string,
): Promise<string> => {
  const normalizedPreferredBranch = preferredBranch.trim();
  let defaultBranch: string | null = null;

  try {
    defaultBranch = await readRepositoryDefaultBranch(owner, repo, token);
  } catch (error) {
    console.warn('Failed to resolve repository default branch:', error);
  }

  if (!normalizedPreferredBranch) {
    return defaultBranch || 'main';
  }

  if (defaultBranch && normalizedPreferredBranch === defaultBranch) {
    return normalizedPreferredBranch;
  }

  try {
    if (await branchExists(owner, repo, normalizedPreferredBranch, token)) {
      return normalizedPreferredBranch;
    }
  } catch (error) {
    console.warn(`Failed to validate configured branch "${normalizedPreferredBranch}":`, error);
    return normalizedPreferredBranch;
  }

  if (defaultBranch) {
    console.warn(
      `Configured branch "${normalizedPreferredBranch}" not found for ${owner}/${repo}, falling back to "${defaultBranch}"`,
    );
    return defaultBranch;
  }

  return normalizedPreferredBranch;
};

const readExistingSha = async (
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token: string,
): Promise<string | null> => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: createGitHubHeaders(token),
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to read ${filePath} from GitHub: ${errorText}`);
  }

  const payload = (await response.json()) as { sha?: string };
  return payload.sha ?? null;
};

const upsertFileToGitHub = async (
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  commitMessage: string,
  token: string,
  committerName: string,
  committerEmail: string,
): Promise<void> => {
  const sha = await readExistingSha(owner, repo, branch, filePath, token);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(filePath)}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: createGitHubHeaders(token, true),
    body: JSON.stringify({
      message: commitMessage,
      branch,
      content: Buffer.from(content, 'utf8').toString('base64'),
      ...(sha ? { sha } : {}),
      committer: {
        name: committerName,
        email: committerEmail,
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to commit ${filePath} to GitHub: ${errorText}`);
  }
};

const getRepositoryFromSystemConfig = async (): Promise<string | null> => {
  try {
    const sysConfig = await loadSystemConfig();
    const repository = sysConfig.configuration?.githubProjectPath?.trim();
    return repository || null;
  } catch (error) {
    console.warn('Failed to resolve repository from system config, fallback to app config:', error);
    return null;
  }
};

export const syncDocToRepository = async (
  docType: 'readme' | 'api',
  content: string,
): Promise<RepoSyncResult> => {
  const appConfig = getAppConfig();
  const docsSyncConfig = appConfig.repoSync.docs;

  if (!docsSyncConfig.enabled) {
    return {
      ok: true,
      committed: false,
      message: 'Repository sync disabled by config',
    };
  }

  const configuredRepository = getRepositoryOverrideFromEnv()
    ?? resolveProjectRepository(await getRepositoryFromSystemConfig() ?? appConfig.project.repository);
  const parsedRepo = parseRepository(configuredRepository);
  if (!parsedRepo) {
    return {
      ok: false,
      committed: false,
      message: `Invalid repository config: ${configuredRepository}`,
    };
  }

  const token = process.env[docsSyncConfig.auth.tokenEnvName]?.trim();
  if (!token) {
    return {
      ok: false,
      committed: false,
      message: `Missing repository token: env ${docsSyncConfig.auth.tokenEnvName}`,
    };
  }

  const targetPath = docType === 'readme'
    ? docsSyncConfig.readmePath
    : docsSyncConfig.apiDocPath;
  const commitMessage = `${docsSyncConfig.commit.messagePrefix}: update ${targetPath}`;

  try {
    const targetBranch = await resolveTargetBranch(
      parsedRepo.owner,
      parsedRepo.name,
      docsSyncConfig.branch,
      token,
    );

    await upsertFileToGitHub(
      parsedRepo.owner,
      parsedRepo.name,
      targetBranch,
      targetPath,
      content,
      commitMessage,
      token,
      docsSyncConfig.commit.authorName,
      docsSyncConfig.commit.authorEmail,
    );

    return {
      ok: true,
      committed: true,
      message: `Committed ${targetPath} to ${parsedRepo.owner}/${parsedRepo.name}@${targetBranch}`,
      branch: targetBranch,
    };
  } catch (error) {
    return {
      ok: false,
      committed: false,
      message: error instanceof Error ? error.message : 'Unknown repository sync error',
    };
  }
};
