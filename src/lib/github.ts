// GitHub API服务

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'yokeay';
const REPO_NAME = 'ddmusic-nextjs';

interface GitHubFile {
  content: string;
  sha: string;
}

interface GitHubFileContent {
  message: string;
  content: string;
  sha?: string;
}

// 获取GitHub token
const getToken = (): string => {
  if (typeof window === 'undefined') {
    throw new Error('GitHub token not found');
  }
  const token = localStorage.getItem('github_token');
  if (!token) {
    throw new Error('GitHub token not found');
  }
  return token;
};

// 构建请求头
const getHeaders = (): HeadersInit => {
  return {
    'Authorization': `token ${getToken()}`,
    'Accept': 'application/vnd.github.v3+json'
  };
};

// 读取文件
const readFile = async (path: string): Promise<GitHubFile> => {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  
  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.statusText}`);
  }

  const data = await response.json();
  // 修复base64解码，支持非ASCII字符
  const decodeBase64 = (base64: string): string => {
    try {
      if (typeof Buffer !== 'undefined') {
        // Node.js环境
        return Buffer.from(base64, 'base64').toString('utf8');
      } else {
        // 浏览器环境
        // 首先尝试直接解码
        try {
          return atob(base64);
        } catch (e) {
          // 如果失败，尝试使用兼容方案
          return decodeURIComponent(escape(atob(base64)));
        }
      }
    } catch (error) {
      console.error('Base64解码失败:', error);
      // 如果解码失败，返回原始内容
      return base64;
    }
  };
  return {
    content: decodeBase64(data.content),
    sha: data.sha
  };
};

// 写入文件
const writeFile = async (path: string, content: string, message: string, sha?: string): Promise<void> => {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  
  // 修复base64编码，支持非ASCII字符
  const encodeBase64 = (str: string): string => {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8').toString('base64');
    } else {
      // 浏览器环境的兼容方案
      return btoa(unescape(encodeURIComponent(str)));
    }
  };

  const fileContent: GitHubFileContent = {
    message,
    content: encodeBase64(content)
  };

  if (sha) {
    fileContent.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(fileContent)
  });

  if (!response.ok) {
    throw new Error(`Failed to write file: ${response.statusText}`);
  }
};

// 检查用户是否已登录
const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const token = localStorage.getItem('github_token');
  const isAuthenticated = localStorage.getItem('is_authenticated');
  return token !== null && isAuthenticated === 'true';
};

// 登出
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
  logout
};
