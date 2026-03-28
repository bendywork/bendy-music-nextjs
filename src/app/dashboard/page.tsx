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
  const [readmeSha, setReadmeSha] = useState('');
  const [docPropContent, setDocPropContent] = useState('');
  const [docPropSha, setDocPropSha] = useState('');
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
      { name: 'kuwo', displayName: '閰锋垜闊充箰', errorCount: 0, status: 'Normal' },
      { name: 'qq', displayName: 'QQ闊充箰', errorCount: 0, status: 'Normal' },
      { name: 'Netease', displayName: 'Netease Music', errorCount: 0, status: 'Normal' }
    ]
  });
  const [uptime, setUptime] = useState('0s');

  // 妫€鏌ョ櫥褰曠姸鎬?
  useEffect(() => {
    void checkLoginStatus();
  }, []);

  // 瀹氭椂鏇存柊杩愯鏃堕棿
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
      console.warn('鑾峰彇鐢ㄦ埛淇℃伅澶辫触:', err);
    }
  };

  const loadSysConfig = async () => {
    try {
      // 浠嶢PI绔偣鍔犺浇sys.json閰嶇疆
      const response = await fetch('/api/sys');
      if (response.ok) {
        const config = await response.json();
        // 鍔犺浇绯荤粺閰嶇疆
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
      console.warn('鍔犺浇绯荤粺閰嶇疆澶辫触:', err);
    }
  };

  // 鍔犺浇鎺ュ彛閰嶇疆
  const loadApiConfig = async () => {
    try {
      const response = await fetch('/api/data/api');
      if (response.ok) {
        const apiConfig = await response.json();
        // 鍔犺浇鎺ュ彛閰嶇疆
        if (apiConfig.apis) {
          setApis(apiConfig.apis);
        }
      }
    } catch (err) {
      console.warn('鍔犺浇鎺ュ彛閰嶇疆澶辫触:', err);
    }
  };

  // 鍔犺浇鏈嶅姟鍟嗛厤缃?
  const loadProviderConfig = async () => {
    try {
      const response = await fetch('/api/data/provider');
      if (response.ok) {
        const providerConfig = await response.json();
        // 鍔犺浇鏈嶅姟鍟嗛厤缃?
        if (providerConfig.providers) {
          setProviders(providerConfig.providers);
        }
      }
    } catch (err) {
      console.warn('鍔犺浇鏈嶅姟鍟嗛厤缃け璐?', err);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 鍔犺浇README.md
      try {
        const readme = await githubService.readFile('README.md');
        setReadmeContent(readme.content);
        setReadmeSha(readme.sha);
      } catch (readmeErr) {
        console.warn('璇诲彇README.md澶辫触:', readmeErr);
        setReadmeContent('# ddmusic-nextjs\n\n鍩轰簬Next.js鐨勯煶涔愯仛鍚圓PI浠ｇ悊鏈嶅姟');
        setReadmeSha('');
      }
      
      // 鍔犺浇doc-prop.json
      try {
        const docProp = await githubService.readFile('doc/doc-prop.json');
        setDocPropContent(docProp.content);
        setDocPropSha(docProp.sha);
      } catch (docPropErr) {
        console.warn('璇诲彇doc-prop.json澶辫触:', docPropErr);
        // 浣跨敤榛樿閰嶇疆
        const defaultConfig = {
          "api": {
            "toplists": {
              "netease": {
                "enabled": true,
                "description": "鑾峰彇缃戞槗浜戦煶涔愭帓琛屾鍒楄〃",
                "endpoint": "GET /api?provider=tunehub&source=netease&type=toplists",
                "params": []
              }
            }
          }
        };
        setDocPropContent(JSON.stringify(defaultConfig, null, 2));
        setDocPropSha('');
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
      await githubService.writeFile('README.md', readmeContent, 'Update README.md', readmeSha);
      setSuccess('README.md 淇濆瓨鎴愬姛');
      // 閲嶆柊鍔犺浇浠ヨ幏鍙栨渶鏂扮殑sha
      try {
        const readme = await githubService.readFile('README.md');
        setReadmeSha(readme.sha);
      } catch (readmeErr) {
        console.warn('閲嶆柊璇诲彇README.md澶辫触:', readmeErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '淇濆瓨README.md澶辫触');
    } finally {
      setLoading(false);
    }
  };

  const handleDocPropSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await githubService.writeFile('doc/doc-prop.json', docPropContent, 'Update doc-prop.json', docPropSha);
      setSuccess('doc-prop.json 淇濆瓨鎴愬姛');
      // 閲嶆柊鍔犺浇浠ヨ幏鍙栨渶鏂扮殑sha
      try {
        const docProp = await githubService.readFile('doc/doc-prop.json');
        setDocPropSha(docProp.sha);
      } catch (docPropErr) {
        console.warn('閲嶆柊璇诲彇doc-prop.json澶辫触:', docPropErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '淇濆瓨doc-prop.json澶辫触');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    githubService.logout();
    setIsLoggedIn(false);
    setReadmeContent('');
    setReadmeSha('');
    setDocPropContent('');
    setDocPropSha('');
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

  // 淇濆瓨绯荤粺閰嶇疆
  const saveSysConfig = async () => {
    try {
      // 鏋勫缓鏂扮殑sys.json鍐呭
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

      // 浣跨敤API绔偣淇濆瓨sys.json鏂囦欢
      const response = await fetch('/api/sys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSysConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`淇濆瓨绯荤粺閰嶇疆澶辫触: ${errorData.error || '鏈煡閿欒'}`);
      }

      return true;
    } catch (err) {
      console.error('淇濆瓨绯荤粺閰嶇疆澶辫触:', err);
      setError(err instanceof Error ? err.message : '淇濆瓨绯荤粺閰嶇疆澶辫触锛岃妫€鏌ユ湇鍔″櫒鏉冮檺');
      return false;
    }
  };

  // 淇濆瓨鎺ュ彛閰嶇疆
  const saveApiConfig = async () => {
    try {
      // 鏋勫缓鎺ュ彛閰嶇疆鍐呭
      const apiConfig = {
        apis: []
      };

      // 浣跨敤API绔偣淇濆瓨api.json鏂囦欢
      const response = await fetch('/api/data/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`淇濆瓨鎺ュ彛閰嶇疆澶辫触: ${errorData.error || '鏈煡閿欒'}`);
      }

      return true;
    } catch (err) {
      console.error('淇濆瓨鎺ュ彛閰嶇疆澶辫触:', err);
      setError(err instanceof Error ? err.message : '淇濆瓨鎺ュ彛閰嶇疆澶辫触锛岃妫€鏌ユ湇鍔″櫒鏉冮檺');
      return false;
    }
  };

  // 淇濆瓨鏈嶅姟鍟嗛厤缃?
  const saveProviderConfig = async () => {
    console.log('寮€濮嬩繚瀛樻湇鍔″晢閰嶇疆...');
    console.log('褰撳墠providers鐘舵€?', providers);
    try {
      // 鏋勫缓鏈嶅姟鍟嗛厤缃唴瀹?
      const providerConfig = {
        providers
      };

      console.log('鏋勫缓鐨勬湇鍔″晢閰嶇疆:', providerConfig);

      // 浣跨敤API绔偣淇濆瓨provider.json鏂囦欢
      console.log('姝ｅ湪淇濆瓨鍒版湰鍦皃rovider.json鏂囦欢...');
      const response = await fetch('/api/data/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(providerConfig)
      });

      console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鐘舵€?', response.status);
      
      // 鑾峰彇瀹屾暣鐨勫搷搴斿唴瀹?
      const responseText = await response.text();
      console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鍐呭:', responseText);

      if (!response.ok) {
        throw new Error(`淇濆瓨鏈嶅姟鍟嗛厤缃け璐? ${responseText}`);
      }

      // 鍚屾椂鏇存柊GitHub浠撳簱涓殑provider.json鏂囦欢
      try {
        const token = localStorage.getItem('github_token');
        if (token) {
          // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
          let repoOwner = 'yokeay';
          let repoName = 'ddmusic-nextjs';
          
          // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
          const githubPath = sysConfig.project.github;
          if (githubPath) {
            const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
            if (match) {
              repoOwner = match[1];
              repoName = match[2];
            }
          }

          // 鏋勫缓GitHub API URL
          const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/provider.json`;

          // 棣栧厛鑾峰彇褰撳墠provider.json鐨剆ha鍊?
          let providerJsonSha = '';
          try {
            const providerJsonResponse = await fetch(apiUrl, {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            if (providerJsonResponse.ok) {
              const providerJsonData = await providerJsonResponse.json();
              providerJsonSha = providerJsonData.sha;
            }
          } catch (err) {
            console.warn('鑾峰彇GitHub浠撳簱涓璸rovider.json鐨剆ha鍊煎け璐?', err);
          }

          // 淇濆瓨provider.json鏂囦欢鍒癎itHub浠撳簱
          const githubResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Update provider.json',
              content: btoa(unescape(encodeURIComponent(JSON.stringify(providerConfig, null, 2)))),
              sha: providerJsonSha
            })
          });

          if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            console.warn('淇濆瓨provider.json鍒癎itHub浠撳簱澶辫触:', errorData);
            // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
            setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
            // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
          } else {
            console.log('provider.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
            // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
            setSuccess('鏈嶅姟鍟嗛厤缃繚瀛樻垚鍔燂紝宸插悓姝ュ埌GitHub浠撳簱');
          }
        }
      } catch (githubErr) {
        console.warn('鏇存柊GitHub浠撳簱涓殑provider.json澶辫触:', githubErr);
        // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
      }

      console.log('Provider config saved');
      return true;
    } catch (err) {
      console.error('淇濆瓨鏈嶅姟鍟嗛厤缃け璐?', err);
      setError(err instanceof Error ? err.message : '淇濆瓨鏈嶅姟鍟嗛厤缃け璐ワ紝璇锋鏌ユ湇鍔″櫒鏉冮檺');
      return false;
    }
  };

  // 淇濆瓨鍒皊ys.json鐨勫嚱鏁帮紙淇濇寔鍚戝悗鍏煎锛?
  const saveToSysJson = async () => {
    try {
      // 淇濆瓨绯荤粺閰嶇疆
      const sysSaved = await saveSysConfig();
      // 淇濆瓨鎺ュ彛閰嶇疆
      const apiSaved = await saveApiConfig();
      // 淇濆瓨鏈嶅姟鍟嗛厤缃?
      const providerSaved = await saveProviderConfig();

      if (sysSaved && apiSaved && providerSaved) {
        // 淇濆瓨鎴愬姛鍚庯紝鍚屾椂鏇存柊GitHub浠撳簱涓殑sys.json鏂囦欢
        try {
          const token = localStorage.getItem('github_token');
          if (token) {
            // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
            let repoOwner = 'yokeay';
            let repoName = 'ddmusic-nextjs';
            
            // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
            const githubPath = sysConfig.project.github;
            if (githubPath) {
              const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
              if (match) {
                repoOwner = match[1];
                repoName = match[2];
              }
            }

            // 鏋勫缓GitHub API URL
            const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/sys.json`;

            // 棣栧厛鑾峰彇褰撳墠sys.json鐨剆ha鍊?
            let sysJsonSha = '';
            try {
              const sysJsonResponse = await fetch(apiUrl, {
                headers: {
                  'Authorization': `token ${token}`,
                  'Accept': 'application/vnd.github.v3+json'
                }
              });
              if (sysJsonResponse.ok) {
                const sysJsonData = await sysJsonResponse.json();
                sysJsonSha = sysJsonData.sha;
              }
            } catch (err) {
              console.warn('鑾峰彇GitHub浠撳簱涓璼ys.json鐨剆ha鍊煎け璐?', err);
            }

            // 鏋勫缓sys.json鍐呭
            const newSysConfig = {
              apiManagement: {
                apis: []
              },
              providerManagement: {
                providers
              },
              configuration: {
                githubProjectPath: sysConfig.project.github,
                apiTimeout: parseInt(sysConfig.api.timeout) * 1000,
                maxConcurrentRequests: parseInt(sysConfig.api.maxConcurrentRequests)
              }
            };

            // 淇濆瓨sys.json鏂囦欢鍒癎itHub浠撳簱
            const githubResponse = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'Update sys.json',
                content: btoa(unescape(encodeURIComponent(JSON.stringify(newSysConfig, null, 2)))),
                sha: sysJsonSha
              })
            });

            if (!githubResponse.ok) {
              const errorData = await githubResponse.json();
              console.warn('淇濆瓨sys.json鍒癎itHub浠撳簱澶辫触:', errorData);
              // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
              setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
              // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
            } else {
              console.log('sys.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
              // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
              setSuccess('閰嶇疆淇濆瓨鎴愬姛锛屽凡鍚屾鍒癎itHub浠撳簱');
            }
          }
        } catch (githubErr) {
          console.warn('鏇存柊GitHub浠撳簱涓殑sys.json澶辫触:', githubErr);
          // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
        }

        setSuccess('閰嶇疆淇濆瓨鎴愬姛');
      }
    } catch (err) {
      console.error('淇濆瓨閰嶇疆澶辫触:', err);
      setError(err instanceof Error ? err.message : '淇濆瓨閰嶇疆澶辫触锛岃妫€鏌ユ湇鍔″櫒鏉冮檺');
    }
  };

  // 鏈嶅姟鍟嗙鐞嗗姛鑳?
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
      setError('鏈嶅姟鍟嗗悕绉板拰浠ｇ爜涓嶈兘涓虹┖');
      return;
    }

    const updatedProviders = providers.map(p => 
      p.id === editingProvider.id ? editingProvider : p
    );

    if (!providers.some(p => p.id === editingProvider.id)) {
      updatedProviders.push(editingProvider);
    }

    setProviders(updatedProviders);
    setEditingProvider(null);
    
    try {
      // 淇濆瓨鏈嶅姟鍟嗛厤缃?
      const providerConfig = {
        providers: updatedProviders
      };

      // 鍏堜繚瀛樺埌鏈湴
      console.log('姝ｅ湪淇濆瓨鍒版湰鍦皃rovider.json鏂囦欢...');
      const response = await fetch('/api/data/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(providerConfig)
      });

      console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鐘舵€?', response.status);
      
      // 鑾峰彇瀹屾暣鐨勫搷搴斿唴瀹?
      const responseText = await response.text();
      console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鍐呭:', responseText);

      if (!response.ok) {
        throw new Error(`淇濆瓨鏈嶅姟鍟嗛厤缃け璐? ${responseText}`);
      }

      // 鍚屾椂鏇存柊GitHub浠撳簱涓殑provider.json鏂囦欢
      try {
        const token = localStorage.getItem('github_token');
        if (token) {
          // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
          let repoOwner = 'yokeay';
          let repoName = 'ddmusic-nextjs';
          
          // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
          const githubPath = sysConfig.project.github;
          if (githubPath) {
            const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
            if (match) {
              repoOwner = match[1];
              repoName = match[2];
            }
          }

          // 鏋勫缓GitHub API URL
          const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/provider.json`;

          // 棣栧厛鑾峰彇褰撳墠provider.json鐨剆ha鍊?
          let providerJsonSha = '';
          try {
            const providerJsonResponse = await fetch(apiUrl, {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            if (providerJsonResponse.ok) {
              const providerJsonData = await providerJsonResponse.json();
              providerJsonSha = providerJsonData.sha;
            }
          } catch (err) {
            console.warn('鑾峰彇GitHub浠撳簱涓璸rovider.json鐨剆ha鍊煎け璐?', err);
          }

          // 淇濆瓨provider.json鏂囦欢鍒癎itHub浠撳簱
          const githubResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Update provider.json',
              content: btoa(unescape(encodeURIComponent(JSON.stringify(providerConfig, null, 2)))),
              sha: providerJsonSha
            })
          });

          if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            console.warn('淇濆瓨provider.json鍒癎itHub浠撳簱澶辫触:', errorData);
            // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
            setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
            // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
          } else {
            console.log('provider.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
            // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
            setSuccess('鏈嶅姟鍟嗕繚瀛樻垚鍔燂紝宸插悓姝ュ埌GitHub浠撳簱');
          }
        }
      } catch (githubErr) {
        console.warn('鏇存柊GitHub浠撳簱涓殑provider.json澶辫触:', githubErr);
        // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
      }

      console.log('Provider config saved');
    } catch (err) {
      console.error('淇濆瓨鏈嶅姟鍟嗗け璐?', err);
      setError(err instanceof Error ? err.message : '淇濆瓨鏈嶅姟鍟嗗け璐ワ紝璇锋鏌ユ湇鍔″櫒鏉冮檺');
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (confirm('纭畾瑕佸垹闄よ繖涓湇鍔″晢鍚楋紵')) {
      const updatedProviders = providers.filter(p => p.id !== providerId);
      setProviders(updatedProviders);
      
      try {
        // 淇濆瓨鏈嶅姟鍟嗛厤缃?
        const providerConfig = {
          providers: updatedProviders
        };

        // 鍏堜繚瀛樺埌鏈湴
        console.log('姝ｅ湪淇濆瓨鍒版湰鍦皃rovider.json鏂囦欢...');
        const response = await fetch('/api/data/provider', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(providerConfig)
        });

        console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鐘舵€?', response.status);
        
        // 鑾峰彇瀹屾暣鐨勫搷搴斿唴瀹?
        const responseText = await response.text();
        console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鍐呭:', responseText);

        if (!response.ok) {
          throw new Error(`淇濆瓨鏈嶅姟鍟嗛厤缃け璐? ${responseText}`);
        }

        // 鍚屾椂鏇存柊GitHub浠撳簱涓殑provider.json鏂囦欢
        try {
          const token = localStorage.getItem('github_token');
          if (token) {
            // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
            let repoOwner = 'yokeay';
            let repoName = 'ddmusic-nextjs';
            
            // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
            const githubPath = sysConfig.project.github;
            if (githubPath) {
              const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
              if (match) {
                repoOwner = match[1];
                repoName = match[2];
              }
            }

            // 鏋勫缓GitHub API URL
            const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/provider.json`;

            // 棣栧厛鑾峰彇褰撳墠provider.json鐨剆ha鍊?
            let providerJsonSha = '';
            try {
              const providerJsonResponse = await fetch(apiUrl, {
                headers: {
                  'Authorization': `token ${token}`,
                  'Accept': 'application/vnd.github.v3+json'
                }
              });
              if (providerJsonResponse.ok) {
                const providerJsonData = await providerJsonResponse.json();
                providerJsonSha = providerJsonData.sha;
              }
            } catch (err) {
              console.warn('鑾峰彇GitHub浠撳簱涓璸rovider.json鐨剆ha鍊煎け璐?', err);
            }

            // 淇濆瓨provider.json鏂囦欢鍒癎itHub浠撳簱
            const githubResponse = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'Update provider.json',
                content: btoa(unescape(encodeURIComponent(JSON.stringify(providerConfig, null, 2)))),
                sha: providerJsonSha
              })
            });

            if (!githubResponse.ok) {
              const errorData = await githubResponse.json();
              console.warn('淇濆瓨provider.json鍒癎itHub浠撳簱澶辫触:', errorData);
              // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
              setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
              // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
            } else {
              console.log('provider.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
              // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
              setSuccess('鏈嶅姟鍟嗗垹闄ゆ垚鍔燂紝宸插悓姝ュ埌GitHub浠撳簱');
            }
          }
        } catch (githubErr) {
          console.warn('鏇存柊GitHub浠撳簱涓殑provider.json澶辫触:', githubErr);
          // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
        }

        console.log('Provider config saved');
      } catch (err) {
        console.error('淇濆瓨鏈嶅姟鍟嗗け璐?', err);
        setError(err instanceof Error ? err.message : '淇濆瓨鏈嶅姟鍟嗗け璐ワ紝璇锋鏌ユ湇鍔″櫒鏉冮檺');
      }
    }
  };

  const handleToggleProviderStatus = async (providerId: string) => {
    const updatedProviders = providers.map(p => 
      p.id === providerId 
        ? { ...p, status: p.status === 'enabled' ? 'disabled' : 'enabled' }
        : p
    );
    setProviders(updatedProviders);
    
    try {
      // 淇濆瓨鏈嶅姟鍟嗛厤缃?
      const providerConfig = {
        providers: updatedProviders
      };

      // 鍏堜繚瀛樺埌鏈湴
      console.log('姝ｅ湪淇濆瓨鍒版湰鍦皃rovider.json鏂囦欢...');
      const response = await fetch('/api/data/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(providerConfig)
      });

      console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鐘舵€?', response.status);
      
      // 鑾峰彇瀹屾暣鐨勫搷搴斿唴瀹?
      const responseText = await response.text();
      console.log('淇濆瓨鏈嶅姟鍟嗛厤缃殑鍝嶅簲鍐呭:', responseText);

      if (!response.ok) {
        throw new Error(`淇濆瓨鏈嶅姟鍟嗛厤缃け璐? ${responseText}`);
      }

      // 鍚屾椂鏇存柊GitHub浠撳簱涓殑provider.json鏂囦欢
      try {
        const token = localStorage.getItem('github_token');
        if (token) {
          // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
          let repoOwner = 'yokeay';
          let repoName = 'ddmusic-nextjs';
          
          // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
          const githubPath = sysConfig.project.github;
          if (githubPath) {
            const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
            if (match) {
              repoOwner = match[1];
              repoName = match[2];
            }
          }

          // 鏋勫缓GitHub API URL
          const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/provider.json`;

          // 棣栧厛鑾峰彇褰撳墠provider.json鐨剆ha鍊?
          let providerJsonSha = '';
          try {
            const providerJsonResponse = await fetch(apiUrl, {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            if (providerJsonResponse.ok) {
              const providerJsonData = await providerJsonResponse.json();
              providerJsonSha = providerJsonData.sha;
            }
          } catch (err) {
            console.warn('鑾峰彇GitHub浠撳簱涓璸rovider.json鐨剆ha鍊煎け璐?', err);
          }

          // 淇濆瓨provider.json鏂囦欢鍒癎itHub浠撳簱
          const githubResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Update provider.json',
              content: btoa(unescape(encodeURIComponent(JSON.stringify(providerConfig, null, 2)))),
              sha: providerJsonSha
            })
          });

          if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            console.warn('淇濆瓨provider.json鍒癎itHub浠撳簱澶辫触:', errorData);
            // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
            setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
            // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
          } else {
            console.log('provider.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
            // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
            setSuccess('鏈嶅姟鍟嗙姸鎬佹洿鏂版垚鍔燂紝宸插悓姝ュ埌GitHub浠撳簱');
          }
        }
      } catch (githubErr) {
        console.warn('鏇存柊GitHub浠撳簱涓殑provider.json澶辫触:', githubErr);
        // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
      }

      console.log('Provider config saved');
    } catch (err) {
      console.error('淇濆瓨鏈嶅姟鍟嗙姸鎬佸け璐?', err);
      setError(err instanceof Error ? err.message : '淇濆瓨鏈嶅姟鍟嗙姸鎬佸け璐ワ紝璇锋鏌ユ湇鍔″櫒鏉冮檺');
    }
  };

  // 鎺ュ彛绠＄悊鍔熻兘
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
      setError('鎺ュ彛鍚嶇О銆佽矾寰勫拰鏂规硶涓嶈兘涓虹┖');
      return;
    }

    const updatedApis = apis.map(p => 
      p.id === editingApi.id ? editingApi : p
    );

    if (!apis.some(p => p.id === editingApi.id)) {
      updatedApis.push(editingApi);
    }

    setApis(updatedApis);
    setEditingApi(null);
    
    try {
      // 淇濆瓨鎺ュ彛閰嶇疆
      const apiConfig = {
        apis: updatedApis
      };

      // 鍏堜繚瀛樺埌鏈湴
      console.log('姝ｅ湪淇濆瓨鍒版湰鍦癮pi.json鏂囦欢...');
      const response = await fetch('/api/data/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig)
      });

      console.log('淇濆瓨鎺ュ彛閰嶇疆鐨勫搷搴旂姸鎬?', response.status);
      
      // 鑾峰彇瀹屾暣鐨勫搷搴斿唴瀹?
      const responseText = await response.text();
      console.log('淇濆瓨鎺ュ彛閰嶇疆鐨勫搷搴斿唴瀹?', responseText);

      if (!response.ok) {
        throw new Error(`淇濆瓨鎺ュ彛閰嶇疆澶辫触: ${responseText}`);
      }

      // 鍚屾椂鏇存柊GitHub浠撳簱涓殑api.json鏂囦欢
      try {
        const token = localStorage.getItem('github_token');
        if (token) {
          // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
          let repoOwner = 'yokeay';
          let repoName = 'ddmusic-nextjs';
          
          // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
          const githubPath = sysConfig.project.github;
          if (githubPath) {
            const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
            if (match) {
              repoOwner = match[1];
              repoName = match[2];
            }
          }

          // 鏋勫缓GitHub API URL
          const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/api.json`;

          // 棣栧厛鑾峰彇褰撳墠api.json鐨剆ha鍊?
          let apiJsonSha = '';
          try {
            const apiJsonResponse = await fetch(apiUrl, {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            if (apiJsonResponse.ok) {
              const apiJsonData = await apiJsonResponse.json();
              apiJsonSha = apiJsonData.sha;
            }
          } catch (err) {
            console.warn('鑾峰彇GitHub浠撳簱涓璦pi.json鐨剆ha鍊煎け璐?', err);
          }

          // 淇濆瓨api.json鏂囦欢鍒癎itHub浠撳簱
          const githubResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Update api.json',
              content: btoa(unescape(encodeURIComponent(JSON.stringify(apiConfig, null, 2)))),
              sha: apiJsonSha
            })
          });

          if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            console.warn('淇濆瓨api.json鍒癎itHub浠撳簱澶辫触:', errorData);
            // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
            setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
            // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
          } else {
            console.log('api.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
            // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
            setSuccess('鎺ュ彛淇濆瓨鎴愬姛锛屽凡鍚屾鍒癎itHub浠撳簱');
          }
        }
      } catch (githubErr) {
        console.warn('鏇存柊GitHub浠撳簱涓殑api.json澶辫触:', githubErr);
        // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
      }

      console.log('鎺ュ彛閰嶇疆淇濆瓨鎴愬姛');
    } catch (err) {
      console.error('淇濆瓨鎺ュ彛澶辫触:', err);
      setError(err instanceof Error ? err.message : '淇濆瓨鎺ュ彛澶辫触锛岃妫€鏌ユ湇鍔″櫒鏉冮檺');
    }
  };

  const handleDeleteApi = async (apiId: string) => {
    if (confirm('Are you sure you want to delete this API?')) {
      const updatedApis = apis.filter(p => p.id !== apiId);
      setApis(updatedApis);
      
      try {
        // 淇濆瓨鎺ュ彛閰嶇疆
        const apiConfig = {
          apis: updatedApis
        };

        // 鍏堜繚瀛樺埌鏈湴
        console.log('姝ｅ湪淇濆瓨鍒版湰鍦癮pi.json鏂囦欢...');
        const response = await fetch('/api/data/api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiConfig)
        });

        console.log('淇濆瓨鎺ュ彛閰嶇疆鐨勫搷搴旂姸鎬?', response.status);
        
        // 鑾峰彇瀹屾暣鐨勫搷搴斿唴瀹?
        const responseText = await response.text();
        console.log('淇濆瓨鎺ュ彛閰嶇疆鐨勫搷搴斿唴瀹?', responseText);

        if (!response.ok) {
          throw new Error(`淇濆瓨鎺ュ彛閰嶇疆澶辫触: ${responseText}`);
        }

        // 鍚屾椂鏇存柊GitHub浠撳簱涓殑api.json鏂囦欢
        try {
          const token = localStorage.getItem('github_token');
          if (token) {
            // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
            let repoOwner = 'yokeay';
            let repoName = 'ddmusic-nextjs';
            
            // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
            const githubPath = sysConfig.project.github;
            if (githubPath) {
              const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
              if (match) {
                repoOwner = match[1];
                repoName = match[2];
              }
            }

            // 鏋勫缓GitHub API URL
            const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/api.json`;

            // 棣栧厛鑾峰彇褰撳墠api.json鐨剆ha鍊?
            let apiJsonSha = '';
            try {
              const apiJsonResponse = await fetch(apiUrl, {
                headers: {
                  'Authorization': `token ${token}`,
                  'Accept': 'application/vnd.github.v3+json'
                }
              });
              if (apiJsonResponse.ok) {
                const apiJsonData = await apiJsonResponse.json();
                apiJsonSha = apiJsonData.sha;
              }
            } catch (err) {
              console.warn('鑾峰彇GitHub浠撳簱涓璦pi.json鐨剆ha鍊煎け璐?', err);
            }

            // 淇濆瓨api.json鏂囦欢鍒癎itHub浠撳簱
            const githubResponse = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'Update api.json',
                content: btoa(unescape(encodeURIComponent(JSON.stringify(apiConfig, null, 2)))),
                sha: apiJsonSha
              })
            });

            if (!githubResponse.ok) {
              const errorData = await githubResponse.json();
              console.warn('淇濆瓨api.json鍒癎itHub浠撳簱澶辫触:', errorData);
              // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
              setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
              // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
            } else {
              console.log('api.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
              // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
              setSuccess('鎺ュ彛鍒犻櫎鎴愬姛锛屽凡鍚屾鍒癎itHub浠撳簱');
            }
          }
        } catch (githubErr) {
          console.warn('鏇存柊GitHub浠撳簱涓殑api.json澶辫触:', githubErr);
          // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
        }

        console.log('鎺ュ彛閰嶇疆淇濆瓨鎴愬姛');
      } catch (err) {
        console.error('淇濆瓨鎺ュ彛澶辫触:', err);
        setError(err instanceof Error ? err.message : '淇濆瓨鎺ュ彛澶辫触锛岃妫€鏌ユ湇鍔″櫒鏉冮檺');
      }
    }
  };

  const handleToggleApiStatus = async (apiId: string) => {
    const updatedApis = apis.map(p => 
      p.id === apiId 
        ? { ...p, status: p.status === 'enabled' ? 'disabled' : 'enabled' }
        : p
    );
    setApis(updatedApis);
    
    try {
      // 淇濆瓨鎺ュ彛閰嶇疆
      const apiConfig = {
        apis: updatedApis
      };

      // 鍏堜繚瀛樺埌鏈湴
      console.log('姝ｅ湪淇濆瓨鍒版湰鍦癮pi.json鏂囦欢...');
      const response = await fetch('/api/data/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig)
      });

      console.log('淇濆瓨鎺ュ彛閰嶇疆鐨勫搷搴旂姸鎬?', response.status);
      
      // 鑾峰彇瀹屾暣鐨勫搷搴斿唴瀹?
      const responseText = await response.text();
      console.log('淇濆瓨鎺ュ彛閰嶇疆鐨勫搷搴斿唴瀹?', responseText);

      if (!response.ok) {
        throw new Error(`淇濆瓨鎺ュ彛閰嶇疆澶辫触: ${responseText}`);
      }

      // 鍚屾椂鏇存柊GitHub浠撳簱涓殑api.json鏂囦欢
      try {
        const token = localStorage.getItem('github_token');
        if (token) {
          // 浠庨厤缃腑鎻愬彇GitHub椤圭洰璺緞
          let repoOwner = 'yokeay';
          let repoName = 'ddmusic-nextjs';
          
          // 灏濊瘯浠庨厤缃殑GitHub璺緞涓彁鍙杘wner鍜宺epo
          const githubPath = sysConfig.project.github;
          if (githubPath) {
            const match = githubPath.match(/github\.com\/(.*?)\/(.*?)(?:\/|$)/);
            if (match) {
              repoOwner = match[1];
              repoName = match[2];
            }
          }

          // 鏋勫缓GitHub API URL
          const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/api.json`;

          // 棣栧厛鑾峰彇褰撳墠api.json鐨剆ha鍊?
          let apiJsonSha = '';
          try {
            const apiJsonResponse = await fetch(apiUrl, {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            if (apiJsonResponse.ok) {
              const apiJsonData = await apiJsonResponse.json();
              apiJsonSha = apiJsonData.sha;
            }
          } catch (err) {
            console.warn('鑾峰彇GitHub浠撳簱涓璦pi.json鐨剆ha鍊煎け璐?', err);
          }

          // 淇濆瓨api.json鏂囦欢鍒癎itHub浠撳簱
          const githubResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Update api.json',
              content: btoa(unescape(encodeURIComponent(JSON.stringify(apiConfig, null, 2)))),
              sha: apiJsonSha
            })
          });

          if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            console.warn('淇濆瓨api.json鍒癎itHub浠撳簱澶辫触:', errorData);
            // 鏄剧ず璀﹀憡娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾澶辫触
            setError(`GitHub鍚屾澶辫触: ${errorData.message || '鏈煡閿欒'}`);
            // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
          } else {
            console.log('api.json淇濆瓨鍒癎itHub浠撳簱鎴愬姛');
            // 鏄剧ず鎴愬姛娑堟伅锛屽憡璇夌敤鎴稧itHub鍚屾鎴愬姛
            setSuccess('鎺ュ彛鐘舵€佹洿鏂版垚鍔燂紝宸插悓姝ュ埌GitHub浠撳簱');
          }
        }
      } catch (githubErr) {
        console.warn('鏇存柊GitHub浠撳簱涓殑api.json澶辫触:', githubErr);
        // 涓嶆姏鍑洪敊璇紝鍥犱负鏈湴淇濆瓨宸茬粡鎴愬姛
      }

      console.log('鎺ュ彛閰嶇疆淇濆瓨鎴愬姛');
    } catch (err) {
      console.error('淇濆瓨鎺ュ彛鐘舵€佸け璐?', err);
      setError(err instanceof Error ? err.message : '淇濆瓨鎺ュ彛鐘舵€佸け璐ワ紝璇锋鏌ユ湇鍔″櫒鏉冮檺');
    }
  };

  // 閰嶇疆绠＄悊鍔熻兘
  const handleConfigSave = async () => {
    try {
      // 淇濆瓨绯荤粺閰嶇疆
      const saved = await saveSysConfig();
      if (saved) {
        // 娓呴櫎鐧诲綍缂撳瓨
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        githubService.logout();
        // 璺宠浆鍒扮櫥褰曢〉闈㈤噸鏂伴獙璇?
        router.push('/login');
      }
    } catch (err) {
      console.error('淇濆瓨閰嶇疆澶辫触:', err);
      // 閿欒宸茬粡鍦?saveSysConfig 鍑芥暟涓鐞?
    }
  };

  const menuItems = [
    {
      title: '绯荤粺闈㈡澘',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: '馃搳'
        }
      ]
    },
    {
      title: '鏍稿績鍔熻兘',
      items: [
        {
          id: 'provider-management',
          label: 'Provider Management',
          icon: '馃彧'
        },
        {
          id: 'api-management',
          label: '鎺ュ彛绠＄悊',
          icon: '馃攲'
        },
        {
          id: 'doc-management',
          label: '鏂囨。绠＄悊',
          icon: '馃摎'
        },
        {
          id: 'config-management',
          label: '閰嶇疆绠＄悊',
          icon: '鈿欙笍'
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
          <p className="text-gray-600 dark:text-gray-400">鍔犺浇涓?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* 渚ц竟鏍忓鑸?*/}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* 鍝佺墝鏍囪瘑 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <img src="/logo.svg" alt="椤剁偣鍚庡彴" className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">椤剁偣鍚庡彴</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">API浠ｇ悊鏈嶅姟</p>
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

        {/* 鐢ㄦ埛淇℃伅 */}
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
              <p className="text-xs text-gray-500 dark:text-gray-400">GitHub璁よ瘉</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="mt-3 w-full text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            鐧诲嚭
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
              {activeMenu === 'api-management' && '鎺ュ彛绠＄悊'}
              {activeMenu === 'doc-management' && '鏂囨。绠＄悊'}
              {activeMenu === 'config-management' && '閰嶇疆绠＄悊'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400">馃敂</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400">鈿欙笍</span>
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">绯荤粺姒傝</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">娆㈣繋浣跨敤API浠ｇ悊鏈嶅姟绠＄悊绯荤粺</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  杩愯涓?
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">浠ｇ悊璇锋眰鏁</h3>
                    <div className="h-4 w-4 text-green-500">鈿</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.proxyRequestCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">鎬昏姹</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">娲昏穬鏈嶅姟鍟</h3>
                    <div className="h-4 w-4 text-blue-500">馃枼锔</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">褰撳墠杩炴帴</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">鏁版嵁搴撹繛鎺</h3>
                    <div className="h-4 w-4 text-purple-500">馃梽锔</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">娲昏穬杩炴帴</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-row items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">绯荤粺杩愯鏃堕棿</h3>
                    <div className="h-4 w-4 text-amber-500">鈴</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{uptime}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">浠庝笂娆″惎鍔</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:col-span-2">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">鏈€杩戜唬鐞嗚姹</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">杩囧幓24灏忔椂鍐呯殑浠ｇ悊璇锋眰璁板綍</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鏃堕棿</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">璺緞</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鏈嶅姟鍟</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鐘舵€佺爜</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鑰楁椂</th>
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
                              鏆傛棤璇锋眰璁板綍
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">鏈嶅姟鐘舵€</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">鍚凙PI鏈嶅姟鐨勮繍琛岀姸鎬佸拰閿欒缁熻</p>
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
                          <span className="text-xs text-gray-500 dark:text-gray-400">閿欒: {service.errorCount}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            service.status === 'Normal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            service.status === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {service.status === 'Normal' ? '姝ｅ父' : service.status === 'Warning' ? '璀﹀憡' : '鏁呴殰'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      閿欒 &lt;100 姝ｅ父锛?00-999 璀﹀憡锛屸墺1000 鏁呴殰
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'api-management' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">鎺ュ彛绠＄悊</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">绠＄悊绯荤粺鎺ュ彛閰嶇疆鍜岀姸鎬</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">鎺ュ彛鍒楄〃</h3>
                  <button 
                    onClick={handleAddApi}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    娣诲姞鎺ュ彛
                  </button>
                </div>
                
                {/* 鎺ュ彛缂栬緫琛ㄥ崟 */}
                {editingApi && (
                  <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-md font-semibold mb-4">{apis.some(p => p.id === editingApi.id) ? '缂栬緫鎺ュ彛' : '娣诲姞鎺ュ彛'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          鎺ュ彛鍚嶇О
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
                          鎺ュ彛璺緞
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
                          璺緞绫诲瀷
                        </label>
                        <select
                          value={editingApi.pathType || 'relative'}
                          onChange={(e) => setEditingApi({ ...editingApi, pathType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="absolute">缁濆璺緞</option>
                          <option value="relative">鐩稿璺緞</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          璇锋眰鏂规硶
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
                          鏈嶅姟鍟?
                        </label>
                        <select
                          value={editingApi.provider || ''}
                          onChange={(e) => setEditingApi({ ...editingApi, provider: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">璇烽€夋嫨鏈嶅姟鍟</option>
                          {providers.map(provider => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name} ({provider.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          璇锋眰鍙傛暟
                        </label>
                        <input
                          type="text"
                          value={editingApi.params || ''}
                          onChange={(e) => setEditingApi({ ...editingApi, params: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="璇疯緭鍏ヨ姹傚弬鏁帮紝濡傦細key1=value1&key2=value2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          璇锋眰澶碒eader
                        </label>
                        <input
                          type="text"
                          value={editingApi.headers || ''}
                          onChange={(e) => setEditingApi({ ...editingApi, headers: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="璇疯緭鍏ヨ姹傚ご锛屽锛欳ontent-Type=application/json"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          鐘舵€?
                        </label>
                        <select
                          value={editingApi.status}
                          onChange={(e) => setEditingApi({ ...editingApi, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="enabled">鍚敤</option>
                          <option value="disabled">绂佺敤</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          澶囨敞
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
                        淇濆瓨
                      </button>
                      <button
                        onClick={() => setEditingApi(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        鍙栨秷
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鎺ュ彛鍚嶇О</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">璺緞</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">璺緞绫诲瀷</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鏂规硶</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鏈嶅姟鍟</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鐘舵€</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">澶囨敞</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鎿嶄綔</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apis.map(api => {
                        // 鎵惧埌瀵瑰簲鐨勬湇鍔″晢淇℃伅
                        const provider = providers.find(p => p.id === api.provider);
                        return (
                          <tr key={api.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-3 px-4">{api.name}</td>
                            <td className="py-3 px-4 font-mono text-sm">{api.path}</td>
                            <td className="py-3 px-4">{api.pathType === 'absolute' ? '缁濆璺緞' : '鐩稿璺緞'}</td>
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
                                {api.status === 'enabled' ? '鍚敤' : '绂佺敤'}
                              </button>
                            </td>
                            <td className="py-3 px-4">{api.remark || '-'}</td>
                            <td className="py-3 px-4">
                              <button 
                                onClick={() => handleEditApi(api)}
                                className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                              >
                                缂栬緫
                              </button>
                              <button 
                                onClick={() => handleDeleteApi(api.id)}
                                className="text-red-600 dark:text-red-400 hover:underline mr-2"
                              >
                                鍒犻櫎
                              </button>
                              <button 
                                onClick={() => alert('娴嬭瘯鎺ュ彛鍔熻兘寮€鍙戜腑')}
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
                            鏆傛棤鎺ュ彛鏁版嵁
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">鏈嶅姟鍟嗙鐞</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">绠＄悊绯荤粺鏈嶅姟鍟嗛厤缃</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">鏈嶅姟鍟嗗垪琛</h3>
                  <button 
                    onClick={handleAddProvider}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    娣诲姞鏈嶅姟鍟?
                  </button>
                </div>
                
                {/* 鏈嶅姟鍟嗙紪杈戣〃鍗?*/}
                {editingProvider && (
                  <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-md font-semibold mb-4">
                      {providers.some(p => p.id === editingProvider.id) ? 'Edit provider' : 'Add provider'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          鏈嶅姟鍟嗗悕绉?
                        </label>
                        <input
                          type="text"
                          value={editingProvider.name}
                          onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="璇疯緭鍏ユ湇鍔″晢鍚嶇О"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          鏈嶅姟鍟嗕唬鐮?
                        </label>
                        <input
                          type="text"
                          value={editingProvider.code}
                          onChange={(e) => setEditingProvider({ ...editingProvider, code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="璇疯緭鍏ユ湇鍔″晢浠ｇ爜"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          绫诲埆
                        </label>
                        <select
                          value={editingProvider.category || 'official'}
                          onChange={(e) => setEditingProvider({ ...editingProvider, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="official">瀹樻柟</option>
                          <option value="personal">涓汉</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          鎬ц川
                        </label>
                        <select
                          value={editingProvider.nature || 'openSource'}
                          onChange={(e) => setEditingProvider({ ...editingProvider, nature: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="openSource">寮€婧</option>
                          <option value="nonProfit">鍏泭</option>
                          <option value="paid">浠樿垂</option>
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
                          鐘舵€?
                        </label>
                        <select
                          value={editingProvider.status}
                          onChange={(e) => setEditingProvider({ ...editingProvider, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="enabled">鍚敤</option>
                          <option value="disabled">绂佺敤</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          澶囨敞
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
                        淇濆瓨
                      </button>
                      <button
                        onClick={() => setEditingProvider(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        鍙栨秷
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鏈嶅姟鍟嗗悕绉</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">浠ｇ爜</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">绫诲埆</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鎬ц川</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">URL</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鐘舵€</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">澶囨敞</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">鎿嶄綔</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map(provider => (
                        <tr key={provider.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4">{provider.name}</td>
                          <td className="py-3 px-4 font-mono text-sm">{provider.code}</td>
                          <td className="py-3 px-4">{provider.category === 'official' ? '瀹樻柟' : '涓汉'}</td>
                          <td className="py-3 px-4">
                            {provider.nature === 'openSource' ? 'Open Source' : 
                             provider.nature === 'nonProfit' ? '鍏泭' : '浠樿垂'}
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
                              {provider.status === 'enabled' ? '鍚敤' : '绂佺敤'}
                            </button>
                          </td>
                          <td className="py-3 px-4">{provider.remark || '-'}</td>
                          <td className="py-3 px-4">
                            <button 
                              onClick={() => handleEditProvider(provider)}
                              className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                            >
                              缂栬緫
                            </button>
                            <button 
                              onClick={() => handleDeleteProvider(provider.id)}
                              className="text-red-600 dark:text-red-400 hover:underline"
                            >
                              鍒犻櫎
                            </button>
                          </td>
                        </tr>
                      ))}
                      {providers.length === 0 && (
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                            鏆傛棤鏈嶅姟鍟嗘暟鎹?
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">鏂囨。绠＄悊</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">绠＄悊README鍜孉PI鏂囨。閰嶇疆</p>
              </div>

              {/* 鏂囨。绫诲瀷鍒囨崲鑿滃崟 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveDocTab('readme')}
                    className={`px-4 py-2 rounded-md transition-colors ${activeDocTab === 'readme' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    README.md 鏂囨。
                  </button>
                  <button
                    onClick={() => setActiveDocTab('api')}
                    className={`px-4 py-2 rounded-md transition-colors ${activeDocTab === 'api' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    API 鏂囨。閰嶇疆
                  </button>
                </div>
              </div>

              {/* README绠＄悊 */}
              {activeDocTab === 'readme' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">README.md 绠＄悊</h3>
                    <button
                      onClick={handleReadmeSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {loading ? '淇濆瓨涓?..' : '淇濆瓨'}
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-center py-10">鍔犺浇涓?..</div>
                  ) : (
                    <MarkdownEditor
                      value={readmeContent}
                      onChange={setReadmeContent}
                      placeholder="璇疯緭鍏EADME.md鍐呭"
                    />
                  )}
                </div>
              )}

              {/* API鏂囨。閰嶇疆绠＄悊 */}
              {activeDocTab === 'api' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API鏂囨。閰嶇疆绠＄悊</h3>
                    <button
                      onClick={handleDocPropSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {loading ? '淇濆瓨涓?..' : '淇濆瓨'}
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-center py-10">鍔犺浇涓?..</div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        doc-prop.json 鍐呭
                      </label>
                      <textarea
                        value={docPropContent}
                        onChange={(e) => setDocPropContent(e.target.value)}
                        className="w-full h-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                        placeholder="璇疯緭鍏oc-prop.json鍐呭"
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">閰嶇疆绠＄悊</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">绠＄悊绯荤粺閰嶇疆鍙傛暟</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">绯荤粺閰嶇疆</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      椤圭洰 GitHub 璺緞
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
                      placeholder="璇疯緭鍏ラ」鐩?GitHub 璺緞"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API璇锋眰瓒呮椂鏃堕棿
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
                      鏈€澶у苟鍙戣姹傛暟
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
                      淇濆瓨閰嶇疆
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


