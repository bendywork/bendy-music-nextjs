'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { githubService } from '@/lib/github';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function DashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [docPropContent, setDocPropContent] = useState('');
  const [activeDocTab, setActiveDocTab] = useState('readme'); // readme 鎴?api
  const [providers, setProviders] = useState<any[]>([]);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [apis, setApis] = useState<any[]>([]);
  const [editingApi, setEditingApi] = useState<any>(null);
  const [sysConfig, setSysConfig] = useState<any>({
    project: {
      github: 'https://github.com/yokeay/ddmusic-nextjs'
    },
    api: {
      timeout: 30,
      maxConcurrentRequests: 100
    }
  });
  const [userInfo, setUserInfo] = useState<any>({
    login: 'admin',
    avatar_url: 'https://github.com/favicon.ico'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dashboardData, setDashboardData] = useState<any>({
    proxyRequestCount: 0,
    systemUptime: 0,
    recentRequests: [],
    serviceStatus: [
      { name: 'kuwo', displayName: '酷我音乐', errorCount: 0, status: 'Normal' },
      { name: 'qq', displayName: 'QQ音乐', errorCount: 0, status: 'Normal' },
      { name: 'Netease', displayName: '网易云音乐', errorCount: 0, status: 'Normal' }
    ]
  });
  const [uptime, setUptime] = useState('0s');

  // 妫€鏌ョ櫥褰曠姸鎬?
  useEffect(() => {
    void checkLoginStatus();
  }, []);

  // 定时更新运行时间
  useEffect(() => {
    const updateUptime = () => {
      const uptimeMs = dashboardData.systemUptime || 0;
      const seconds = Math.floor(uptimeMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let uptimeStr = '';
      if (days > 0) {
        uptimeStr = `${days}d ${hours % 24}h ${minutes % 60}m`;
      } else if (hours > 0) {
        uptimeStr = `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        uptimeStr = `${minutes}m ${seconds % 60}s`;
      } else {
        uptimeStr = `${seconds}s`;
      }
      setUptime(uptimeStr);
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [dashboardData.systemUptime]);

  // 鍔犺浇浠〃鐩樻暟鎹?
  useEffect(() => {
    if (isLoggedIn) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/data/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.warn('鍔犺浇浠〃鐩樻暟鎹け璐?', err);
    }
  };

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unauthenticated');
      }

      const sessionPayload = await response.json();
      const sessionData = sessionPayload?.data;

      if (!sessionData?.authenticated || !sessionData?.user?.login) {
        throw new Error('Unauthenticated');
      }

      if (sessionData.token) {
        localStorage.setItem('github_token', sessionData.token);
      }
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('auth_timestamp', Date.now().toString());
      localStorage.setItem('github_login', sessionData.user.login);
      if (sessionData.user.avatar_url) {
        localStorage.setItem('github_avatar_url', sessionData.user.avatar_url);
      }

      setUserInfo({
        login: sessionData.user.login || 'admin',
        avatar_url: sessionData.user.avatar_url || 'https://github.com/favicon.ico'
      });

      setIsLoggedIn(true);
      fetchUserInfo();
      loadDocuments();
      loadSysConfig();
      loadApiConfig();
      loadProviderConfig();
    } catch (err) {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      githubService.logout();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('github_token');
      if (token) {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUserInfo({
            login: userData.login || 'admin',
            avatar_url: userData.avatar_url || 'https://github.com/favicon.ico'
          });
        }
      }
    } catch (err) {
      console.warn('获取用户信息失败:', err);
    }
  };

  const loadSysConfig = async () => {
    try {
      // 从API端点加载sys.json配置
      const response = await fetch('/api/sys');
      if (response.ok) {
        const config = await response.json();
        // 加载System Settings
        if (config.configuration) {
          setSysConfig({
            project: {
              github: config.configuration.githubProjectPath || 'https://github.com/yokeay/ddmusic-nextjs'
            },
            api: {
              timeout: config.configuration.apiTimeout || 30,
              maxConcurrentRequests: config.configuration.maxConcurrentRequests || 10
            }
          });
        }
      }
    } catch (err) {
      console.warn('加载System Settings失败:', err);
    }
  };

  // 加载接口配置
  const loadApiConfig = async () => {
    try {
      const response = await fetch('/api/data/api');
      if (response.ok) {
        const apiConfig = await response.json();
        // 加载接口配置
        if (apiConfig.apis) {
          setApis(apiConfig.apis);
        }
      }
    } catch (err) {
      console.warn('加载接口配置失败:', err);
    }
  };

  // 鍔犺浇Provider嗛厤缃?
  const loadProviderConfig = async () => {
    try {
      const response = await fetch('/api/data/provider');
      if (response.ok) {
        const providerConfig = await response.json();
        // 鍔犺浇Provider嗛厤缃?
        if (providerConfig.providers) {
          setProviders(providerConfig.providers);
        }
      }
    } catch (err) {
      console.warn('鍔犺浇Provider嗛厤缃け璐?', err);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const [readmeResponse, apiDocResponse] = await Promise.all([
        fetch('/api/data/docs/readme', { cache: 'no-store' }),
        fetch('/api/data/docs/api', { cache: 'no-store' }),
      ]);

      if (readmeResponse.ok) {
        const readmePayload = await readmeResponse.json();
        setReadmeContent(readmePayload.content || '# ddmusic-nextjs\n');
      } else {
        setReadmeContent('# ddmusic-nextjs\n');
      }

      if (apiDocResponse.ok) {
        const apiDocPayload = await apiDocResponse.json();
        setDocPropContent(apiDocPayload.content || '{\n  "api": {}\n}\n');
      } else {
        setDocPropContent('{\n  "api": {}\n}\n');
      }
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleReadmeSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/data/docs/readme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: readmeContent }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save README.md');
      }

      const syncSuffix = payload.repoSync?.message ? ` (${payload.repoSync.message})` : '';
      setSuccess(`README.md Save成功${syncSuffix}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save README.md 失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDocPropSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/data/docs/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: docPropContent }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save API document config');
      }

      const syncSuffix = payload.repoSync?.message ? ` (${payload.repoSync.message})` : '';
      setSuccess(`API Doc ConfigSave成功${syncSuffix}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save API Doc Config失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    githubService.logout();
    setIsLoggedIn(false);
    setReadmeContent('');
    setDocPropContent('');
    setProviders([]);
    setSysConfig({
      project: {
        github: 'https://github.com/yokeay/ddmusic-nextjs'
      },
      api: {
        timeout: 30,
        maxConcurrentRequests: 100
      }
    });
    setUserInfo({
      login: 'admin',
      avatar_url: 'https://github.com/favicon.ico'
    });
    // 璺宠浆鍒扮櫥褰曢〉闈?
    router.push('/login');
  };

  // SaveSystem Settings
  const saveSysConfig = async () => {
    try {
      // 构建新的sys.json内容
      const newSysConfig = {
        apiManagement: {
          apis: []
        },
        providerManagement: {
          providers
        },
        configuration: {
          githubProjectPath: sysConfig.project.github,
          apiTimeout: parseInt(sysConfig.api.timeout) * 1000, // 杞崲涓烘绉掞紝纭繚鏄暣鏁?
          maxConcurrentRequests: parseInt(sysConfig.api.maxConcurrentRequests) // 纭繚鏄暣鏁?
        }
      };

      // 使用API端点Savesys.json文件
      const response = await fetch('/api/sys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSysConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`SaveSystem Settings失败: ${errorData.error || '未知错误'}`);
      }

      return true;
    } catch (err) {
      console.error('SaveSystem Settings失败:', err);
      setError(err instanceof Error ? err.message : 'SaveSystem Settings失败，请检查服务器权限');
      return false;
    }
  };

  // Save接口配置
  const saveApiConfig = async () => {
    try {
      // 构建接口配置内容
      const apiConfig = {
        apis: []
      };

      // 使用API端点Saveapi.json文件
      const response = await fetch('/api/data/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Save接口配置失败: ${errorData.error || '未知错误'}`);
      }

      return true;
    } catch (err) {
      console.error('Save接口配置失败:', err);
      setError(err instanceof Error ? err.message : 'Save接口配置失败，请检查服务器权限');
      return false;
    }
  };

  // SaveProvider嗛厤缃?
  const saveProviderConfig = async () => {
    try {
      const response = await fetch('/api/data/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providers }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Save服务商配置失败: ${errorData.error || '未知错误'}`);
      }

      return true;
    } catch (err) {
      console.error('Save服务商配置失败:', err);
      setError(err instanceof Error ? err.message : 'Save服务商配置失败，请检查服务端权限');
      return false;
    }
  };

  // Save鍒皊ys.json鐨勫嚱鏁帮紙淇濇寔鍚戝悗鍏煎锛?
  const saveToSysJson = async () => {
    try {
      const sysSaved = await saveSysConfig();
      const apiSaved = await saveApiConfig();
      const providerSaved = await saveProviderConfig();

      if (sysSaved && apiSaved && providerSaved) {
        setSuccess('配置Save成功');
      }
    } catch (err) {
      console.error('Save Settings失败:', err);
      setError(err instanceof Error ? err.message : 'Save Settings失败，请检查服务端权限');
    }
  };

  // Provider Management嗗姛鑳?
  const handleAddProvider = () => {
    const newProvider = {
      id: `provider-${Date.now()}`,
      name: '',
      code: '',
      category: 'official',
      nature: 'openSource',
      url: '',
      status: 'enabled',
      remark: ''
    };
    setEditingProvider(newProvider);
  };

  const handleEditProvider = (provider: any) => {
    setEditingProvider({ ...provider });
  };

  const handleSaveProvider = async () => {
    if (!editingProvider) return;

    if (!editingProvider.name || !editingProvider.code) {
      setError('服务商名称和代码不能为空');
      return;
    }

    const updatedProviders = providers.map((p) =>
      p.id === editingProvider.id ? editingProvider : p
    );

    if (!providers.some((p) => p.id === editingProvider.id)) {
      updatedProviders.push(editingProvider);
    }

    setProviders(updatedProviders);
    setEditingProvider(null);

    try {
      const response = await fetch('/api/data/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providers: updatedProviders }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Save服务商失败');
      }

      setSuccess('服务商Save成功');
    } catch (err) {
      console.error('Save服务商失败:', err);
      setError(err instanceof Error ? err.message : 'Save服务商失败，请检查服务端权限');
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (confirm('Are you sure you want to delete this provider?')) {
      const updatedProviders = providers.filter((p) => p.id !== providerId);
      setProviders(updatedProviders);

      try {
        const response = await fetch('/api/data/provider', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ providers: updatedProviders }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '删除服务商失败');
        }

        setSuccess('服务商删除成功');
      } catch (err) {
        console.error('删除服务商失败:', err);
        setError(err instanceof Error ? err.message : '删除服务商失败，请检查服务端权限');
      }
    }
  };

  const handleToggleProviderStatus = async (providerId: string) => {
    const updatedProviders = providers.map((p) =>
      p.id === providerId
        ? { ...p, status: p.status === 'enabled' ? 'disabled' : 'enabled' }
        : p
    );
    setProviders(updatedProviders);

    try {
      const response = await fetch('/api/data/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providers: updatedProviders }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '更新服务商状态失败');
      }

      setSuccess('服务商状态更新成功');
    } catch (err) {
      console.error('更新服务商状态失败:', err);
      setError(err instanceof Error ? err.message : '更新服务商状态失败，请检查服务端权限');
    }
  };

  // API Management功能
  const handleAddApi = () => {
    const newApi = {
      id: `api-${Date.now()}`,
      name: '',
      path: '',
      pathType: 'relative',
      method: 'GET',
      provider: '',
      params: '',
      headers: '',
      status: 'enabled',
      remark: ''
    };
    setEditingApi(newApi);
  };

  const handleEditApi = (api: any) => {
    setEditingApi({ ...api });
  };

  const handleSaveApi = async () => {
    if (!editingApi) return;

    if (!editingApi.name || !editingApi.path || !editingApi.method) {
      setError('API Name、路径和方法不能为空');
      return;
    }

    const updatedApis = apis.map((p) =>
      p.id === editingApi.id ? editingApi : p
    );

    if (!apis.some((p) => p.id === editingApi.id)) {
      updatedApis.push(editingApi);
    }

    setApis(updatedApis);
    setEditingApi(null);

    try {
      const response = await fetch('/api/data/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apis: updatedApis }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Save接口失败');
      }

      setSuccess('接口Save成功');
    } catch (err) {
      console.error('Save接口失败:', err);
      setError(err instanceof Error ? err.message : 'Save接口失败，请检查服务端权限');
    }
  };

  const handleDeleteApi = async (apiId: string) => {
    if (confirm('Are you sure you want to delete this API?')) {
      const updatedApis = apis.filter((p) => p.id !== apiId);
      setApis(updatedApis);

      try {
        const response = await fetch('/api/data/api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apis: updatedApis }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '删除接口失败');
        }

        setSuccess('接口删除成功');
      } catch (err) {
        console.error('删除接口失败:', err);
        setError(err instanceof Error ? err.message : '删除接口失败，请检查服务端权限');
      }
    }
  };

  const handleToggleApiStatus = async (apiId: string) => {
    const updatedApis = apis.map((p) =>
      p.id === apiId
        ? { ...p, status: p.status === 'enabled' ? 'disabled' : 'enabled' }
        : p
    );
    setApis(updatedApis);

    try {
      const response = await fetch('/api/data/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apis: updatedApis }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '更新接口状态失败');
      }

      setSuccess('接口状态更新成功');
    } catch (err) {
      console.error('更新接口状态失败:', err);
      setError(err instanceof Error ? err.message : '更新接口状态失败，请检查服务端权限');
    }
  };

  // Settings功能
  const handleConfigSave = async () => {
    try {
      // SaveSystem Settings
      const saved = await saveSysConfig();
      if (saved) {
        // 清除登录缓存
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        githubService.logout();
        // 璺宠浆鍒扮櫥褰曢〉闈㈤噸鏂伴獙璇?
        router.push('/login');
      }
    } catch (err) {
      console.error('Save Settings失败:', err);
      // 閿欒宸茬粡鍦?saveSysConfig 鍑芥暟涓鐞?
    }
  };

  const menuItems = [
    {
      title: '系统面板',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'DB'
        }
      ]
    },
    {
      title: '核心功能',
      items: [
        {
          id: 'provider-management',
          label: 'Provider Management',
          icon: 'PR'
        },
        {
          id: 'api-management',
          label: 'API Management',
          icon: 'API'
        },
        {
          id: 'doc-management',
          label: 'Docs Management',
          icon: 'DOC'
        },
        {
          id: 'config-management',
          label: 'Settings',
          icon: 'CFG'
        }
      ]
    }
  ];

  // 鍔犺浇涓姸鎬?
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* 渚ц竟鏍忓鑸?*/}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* 品牌标识 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <img src="/logo.svg" alt="Admin Console" className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Console</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">API Gateway</p>
          </div>
        </div>

        {/* 瀵艰埅鑿滃崟 */}
        <nav className="flex-1 overflow-y-auto p-4">
          {menuItems.map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {section.title}
              </h2>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveMenu(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        activeMenu === item.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* 用户信息 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {userInfo.avatar_url ? (
                <img 
                  src={userInfo.avatar_url} 
                  alt={userInfo.login} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">AD</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userInfo.login || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">GitHub Auth</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="mt-3 w-full text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* 涓诲唴瀹瑰尯鍩?*/}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 椤堕儴瀵艰埅鏍?*/}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeMenu === 'dashboard' && 'Dashboard'}
              {activeMenu === 'api-management' && 'API Management'}
              {activeMenu === 'doc-management' && 'Docs Management'}
              {activeMenu === 'config-management' && 'Settings'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Alerts</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Settings</span>
            </button>
          </div>
        </header>

        {/* 鍐呭鍖哄煙 */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {/* 娑堟伅鎻愮ず */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-md mb-6">
              {success}
            </div>
          )}

          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Overview</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome to the API gateway dashboard</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Running
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Proxy Requests</h3>
                    <div className="h-4 w-4 text-green-500">RQ</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.proxyRequestCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Requests</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Providers</h3>
                    <div className="h-4 w-4 text-blue-500">PR</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Current Connections</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Database Connections</h3>
                    <div className="h-4 w-4 text-purple-500">DB</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Active Connections</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">系统运行时间</h3>
                    <div className="h-4 w-4 text-amber-500">UP</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{uptime}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Since Last Restart</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:col-span-2">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Proxy Requests</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Proxy request history in the last 24 hours</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">时间</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Path</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Provider</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Status Code</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentRequests && dashboardData.recentRequests.length > 0 ? (
                          dashboardData.recentRequests.slice(0, 10).map((request: any, index: number) => (
                            <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                {new Date(request.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{request.path}</td>
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{request.provider}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.statusCode >= 200 && request.statusCode < 400
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {request.statusCode}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{request.duration}ms</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                              暂无请求记录
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Status</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Runtime status and error count for each API service</p>
                  </div>
                  <div className="space-y-4">
                    {dashboardData.serviceStatus && dashboardData.serviceStatus.map((service: any) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-full ${
                            service.status === 'Normal' ? 'bg-green-500' :
                            service.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{service.displayName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Errors: {service.errorCount}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            service.status === 'Normal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            service.status === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {service.status === 'Normal' ? 'Normal' : service.status === 'Warning' ? 'Warning' : 'Down'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Errors &lt;100 Normal, 100-999 Warning, &gt;=1000 Down
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'api-management' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Management</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system API configuration and status</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API List</h3>
                  <button 
                    onClick={handleAddApi}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Add API
                  </button>
                </div>
                
                {/* 接口编辑表单 */}
                {editingApi && (
                  <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-md font-semibold mb-4">{apis.some(p => p.id === editingApi.id) ? 'Edit API' : 'Add API'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          API Name
                        </label>
                        <input
                          type="text"
                          value={editingApi.name}
                          onChange={(e) => setEditingApi({ ...editingApi, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter API name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          API Path
                        </label>
                        <input
                          type="text"
                          value={editingApi.path}
                          onChange={(e) => setEditingApi({ ...editingApi, path: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter API path"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Path Type
                        </label>
                        <select
                          value={editingApi.pathType || 'relative'}
                          onChange={(e) => setEditingApi({ ...editingApi, pathType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="absolute">Absolute Path</option>
                          <option value="relative">Relative Path</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Method
                        </label>
                        <select
                          value={editingApi.method}
                          onChange={(e) => setEditingApi({ ...editingApi, method: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                          <option value="PATCH">PATCH</option>
                          <option value="CURL">CURL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Provider
                        </label>
                        <select
                          value={editingApi.provider || ''}
                          onChange={(e) => setEditingApi({ ...editingApi, provider: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Provider</option>
                          {providers.map(provider => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name} ({provider.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Query Params
                        </label>
                        <input
                          type="text"
                          value={editingApi.params || ''}
                          onChange={(e) => setEditingApi({ ...editingApi, params: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="请输入Query Params，如：key1=value1&key2=value2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Headers
                        </label>
                        <input
                          type="text"
                          value={editingApi.headers || ''}
                          onChange={(e) => setEditingApi({ ...editingApi, headers: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="请输入请求头，如：Content-Type=application/json"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={editingApi.status}
                          onChange={(e) => setEditingApi({ ...editingApi, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="enabled">Enabled</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={editingApi.remark}
                          onChange={(e) => setEditingApi({ ...editingApi, remark: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter note"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveApi}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingApi(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">API Name</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Path</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Path Type</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">方法</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Provider</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Notes</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apis.map(api => {
                        // 找到对应的服务商信息
                        const provider = providers.find(p => p.id === api.provider);
                        return (
                          <tr key={api.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-3 px-4">{api.name}</td>
                            <td className="py-3 px-4 font-mono text-sm">{api.path}</td>
                            <td className="py-3 px-4">{api.pathType === 'absolute' ? 'Absolute Path' : '相对路径'}</td>
                            <td className="py-3 px-4">{api.method}</td>
                            <td className="py-3 px-4">{provider ? `${provider.name} (${provider.code})` : '-'}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleApiStatus(api.id)}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  api.status === 'enabled'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                                } transition-colors`}
                              >
                                {api.status === 'enabled' ? 'Enabled' : 'Disabled'}
                              </button>
                            </td>
                            <td className="py-3 px-4">{api.remark || '-'}</td>
                            <td className="py-3 px-4">
                              <button 
                                onClick={() => handleEditApi(api)}
                                className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                              >
                                编辑
                              </button>
                              <button 
                                onClick={() => handleDeleteApi(api.id)}
                                className="text-red-600 dark:text-red-400 hover:underline mr-2"
                              >
                                Delete
                              </button>
                              <button 
                                onClick={() => alert('Test API is under development')}
                                className="text-green-600 dark:text-green-400 hover:underline"
                              >
                                娴嬭瘯
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {apis.length === 0 && (
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No API data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'provider-management' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Provider Management</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage provider settings</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Provider List</h3>
                  <button 
                    onClick={handleAddProvider}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Add Provider
                  </button>
                </div>
                
                {/* Provider嗙紪杈戣〃鍗?*/}
                {editingProvider && (
                  <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-md font-semibold mb-4">
                      {providers.some(p => p.id === editingProvider.id) ? 'Edit Provider' : 'Add Provider'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Provider Name
                        </label>
                        <input
                          type="text"
                          value={editingProvider.name}
                          onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter provider name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Provider Code
                        </label>
                        <input
                          type="text"
                          value={editingProvider.code}
                          onChange={(e) => setEditingProvider({ ...editingProvider, code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter provider code"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          value={editingProvider.category || 'official'}
                          onChange={(e) => setEditingProvider({ ...editingProvider, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="official">Official</option>
                          <option value="personal">Personal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Type
                        </label>
                        <select
                          value={editingProvider.nature || 'openSource'}
                          onChange={(e) => setEditingProvider({ ...editingProvider, nature: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="openSource">Open Source</option>
                          <option value="nonProfit">Non-profit</option>
                          <option value="paid">付费</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          URL
                        </label>
                        <input
                          type="text"
                          value={editingProvider.url || ''}
                          onChange={(e) => setEditingProvider({ ...editingProvider, url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter request base URL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={editingProvider.status}
                          onChange={(e) => setEditingProvider({ ...editingProvider, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="enabled">Enabled</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={editingProvider.remark}
                          onChange={(e) => setEditingProvider({ ...editingProvider, remark: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter note"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveProvider}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingProvider(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Provider Name</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">代码</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">URL</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Notes</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map(provider => (
                        <tr key={provider.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4">{provider.name}</td>
                          <td className="py-3 px-4 font-mono text-sm">{provider.code}</td>
                          <td className="py-3 px-4">{provider.category === 'official' ? '官方' : '个人'}</td>
                          <td className="py-3 px-4">
                            {provider.nature === 'openSource' ? 'Open Source' : 
                             provider.nature === 'nonProfit' ? '公益' : '付费'}
                          </td>
                          <td className="py-3 px-4 font-mono text-sm break-all">{provider.url || '-'}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleProviderStatus(provider.id)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                provider.status === 'enabled'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                              } transition-colors`}
                            >
                              {provider.status === 'enabled' ? 'Enabled' : 'Disabled'}
                            </button>
                          </td>
                          <td className="py-3 px-4">{provider.remark || '-'}</td>
                          <td className="py-3 px-4">
                            <button 
                              onClick={() => handleEditProvider(provider)}
                              className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                            >
                              编辑
                            </button>
                            <button 
                              onClick={() => handleDeleteProvider(provider.id)}
                              className="text-red-600 dark:text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {providers.length === 0 && (
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No provider data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'doc-management' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Docs Management</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage README and API doc configuration</p>
              </div>

              {/* 文档类型切换菜单 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveDocTab('readme')}
                    className={`px-4 py-2 rounded-md transition-colors ${activeDocTab === 'readme' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    README.md
                  </button>
                  <button
                    onClick={() => setActiveDocTab('api')}
                    className={`px-4 py-2 rounded-md transition-colors ${activeDocTab === 'api' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    API Doc Config
                  </button>
                </div>
              </div>

              {/* README管理 */}
              {activeDocTab === 'readme' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">README.md</h3>
                    <button
                      onClick={handleReadmeSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-center py-10">Loading...</div>
                  ) : (
                    <MarkdownEditor
                      value={readmeContent}
                      onChange={setReadmeContent}
                      placeholder="Enter README.md content"
                    />
                  )}
                </div>
              )}

              {/* API Doc Config */}
              {activeDocTab === 'api' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Doc Config</h3>
                    <button
                      onClick={handleDocPropSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-center py-10">Loading...</div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        doc-prop.json content
                      </label>
                      <textarea
                        value={docPropContent}
                        onChange={(e) => setDocPropContent(e.target.value)}
                        className="w-full h-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                        placeholder="Enter doc-prop.json content"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeMenu === 'config-management' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system settings</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Settings</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project GitHub Path
                    </label>
                    <input
                      type="text"
                      value={sysConfig.project.github}
                      onChange={(e) => setSysConfig({
                        ...sysConfig,
                        project: {
                          ...sysConfig.project,
                          github: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter project GitHub path"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Timeout
                    </label>
                    <input
                      type="number"
                      value={sysConfig.api.timeout}
                      onChange={(e) => setSysConfig({
                        ...sysConfig,
                        api: {
                          ...sysConfig.api,
                          timeout: parseInt(e.target.value) || 30
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Concurrent Requests
                    </label>
                    <input
                      type="number"
                      value={sysConfig.api.maxConcurrentRequests}
                      onChange={(e) => setSysConfig({
                        ...sysConfig,
                        api: {
                          ...sysConfig.api,
                          maxConcurrentRequests: parseInt(e.target.value) || 10
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={handleConfigSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}







