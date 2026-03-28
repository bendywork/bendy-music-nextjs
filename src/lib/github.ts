// Legacy client helper kept for auth/session localStorage compatibility.
// Data read/write no longer talks to GitHub directly.

interface GitHubFile {
  content: string;
  sha: string;
}

const getDocEndpoint = (filePath: string): string => {
  if (filePath === 'README.md') {
    return '/api/data/docs/readme';
  }

  if (filePath === 'doc/doc-prop.json') {
    return '/api/data/docs/api';
  }

  throw new Error(`Unsupported file path: ${filePath}`);
};

const readFile = async (filePath: string): Promise<GitHubFile> => {
  const response = await fetch(getDocEndpoint(filePath), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to read file: ${filePath}`);
  }

  const payload = (await response.json()) as { content?: string };
  return {
    content: payload.content ?? '',
    sha: '',
  };
};

const writeFile = async (filePath: string, content: string): Promise<void> => {
  const response = await fetch(getDocEndpoint(filePath), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(payload.error || `Failed to write file: ${filePath}`);
  }
};

const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const token = localStorage.getItem('github_token');
  const isAuthenticated = localStorage.getItem('is_authenticated');
  return token !== null && isAuthenticated === 'true';
};

const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('github_token');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('auth_timestamp');
  }
};

export const githubService = {
  readFile,
  writeFile,
  isLoggedIn,
  logout,
};
