import packageJson from '../../../package.json';
import { STORE_KEYS, getStoredValue, readJsonFile } from '@/lib/server/data-store';
import { Platform, Provider } from '@/modules/music/types';

export const GENERATED_API_DOC_MARKER = 'bendy-music-nextjs-generated-api-doc';

interface ProviderConfigItem {
  id: string;
  name: string;
  code: string;
  category?: string;
  nature?: string;
  url?: string;
  status?: string;
  remark?: string;
}

interface ProviderConfigShape {
  providers?: ProviderConfigItem[];
}

interface ApiConfigItem {
  id: string;
  name: string;
  path: string;
  pathType?: string;
  method: string;
  provider?: string;
  params?: string;
  headers?: string;
  status?: string;
  remark?: string;
}

interface ApiConfigShape {
  apis?: ApiConfigItem[];
}

interface EndpointParameter {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

interface EndpointDefinition {
  method: string;
  route: string;
  title: string;
  summary: string;
  params: EndpointParameter[];
  notes: string[];
  example: string;
  responseExample?: unknown;
}

const DEFAULT_PROVIDER_CONFIG: ProviderConfigShape = { providers: [] };
const DEFAULT_API_CONFIG: ApiConfigShape = { apis: [] };
const PUBLIC_API_TITLE = '顶点音乐API文档';
const HTML_FILE_PATH = 'doc/doc.html';
const README_FILE_PATH = 'README.md';

const providerCategoryLabels: Record<string, string> = {
  official: '官方',
  personal: '个人',
};

const providerNatureLabels: Record<string, string> = {
  openSource: '开源',
  nonProfit: '公益',
  paid: '付费',
};

const statusLabels: Record<string, string> = {
  enabled: '启用',
  disabled: '停用',
};

const implementedPublicEndpoints: EndpointDefinition[] = [
  {
    method: 'GET',
    route: '/api',
    title: '获取歌曲信息',
    summary: '根据 provider、source 和 id 返回歌曲基础信息。',
    params: [
      { name: 'type', required: true, description: '固定为 info。' },
      { name: 'source', required: true, description: '平台标识，目前支持 netease、qq、kuwo。' },
      { name: 'id', required: true, description: '歌曲 ID。' },
      { name: 'provider', required: false, description: '服务商标识。当前默认使用 tunehub。', defaultValue: Provider.TUNEHUB },
    ],
    notes: [
      '缺少 source 或 id 时会返回 400。',
      '成功时返回统一的 { code, message, data } 结构。',
    ],
    example: 'GET /api?type=info&source=netease&id=2608813264&provider=tunehub',
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        name: '示例歌曲',
        artist: '示例歌手',
        album: '示例专辑',
        id: '2608813264',
        platform: 'netease',
        url: '/api?type=url&source=netease&id=2608813264',
        pic: '/api?type=pic&source=netease&id=2608813264',
        lrc: '/api?type=lrc&source=netease&id=2608813264',
      },
    },
  },
  {
    method: 'GET',
    route: '/api',
    title: '搜索歌曲',
    summary: '按平台搜索歌曲，当前由平台适配器直接处理，provider 参数不会参与分发。',
    params: [
      { name: 'type', required: true, description: '固定为 search。' },
      { name: 'source', required: true, description: '平台标识，目前支持 netease、qq、kuwo。' },
      { name: 'keyword', required: true, description: '搜索关键词。' },
      { name: 'limit', required: false, description: '返回数量上限。', defaultValue: '20' },
    ],
    notes: [
      '缺少 source 或 keyword 时会返回 400。',
      '不支持的平台会返回 400 Unsupported platform。',
    ],
    example: 'GET /api?type=search&source=qq&keyword=周杰伦&limit=20',
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        keyword: '周杰伦',
        total: 2,
        results: [
          {
            id: '123456',
            name: '夜曲',
            artist: '周杰伦',
            album: '十一月的萧邦',
            platform: 'qq',
            url: '/api?type=url&source=qq&id=123456',
          },
        ],
      },
    },
  },
  {
    method: 'GET',
    route: '/api',
    title: '获取歌单详情',
    summary: '根据 source 和 id 返回歌单详情。kuwo 平台会走公开服务，其他平台走已注册的音乐服务。',
    params: [
      { name: 'type', required: true, description: '固定为 playlist。' },
      { name: 'source', required: true, description: '平台标识，目前支持 netease、qq、kuwo。' },
      { name: 'id', required: true, description: '歌单 ID。' },
      { name: 'provider', required: false, description: '服务商标识。当前默认使用 tunehub。', defaultValue: Provider.TUNEHUB },
    ],
    notes: [
      '缺少 source 或 id 时会返回 400。',
      '服务端异常时返回 500，并透出 error 字段。',
    ],
    example: 'GET /api?type=playlist&source=kuwo&id=3136604274',
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        id: '3136604274',
        name: '示例歌单',
        description: '示例歌单描述',
        cover: 'https://example.com/cover.jpg',
        songs: [],
      },
    },
  },
  {
    method: 'GET',
    route: '/api',
    title: '获取榜单列表',
    summary: '根据平台返回榜单列表。',
    params: [
      { name: 'type', required: true, description: '固定为 toplists。' },
      { name: 'source', required: true, description: '平台标识，目前支持 netease、qq、kuwo。' },
    ],
    notes: [
      '缺少 source 时会返回 400。',
      '当前代码对 netease、qq、kuwo 都有显式实现。',
    ],
    example: 'GET /api?type=toplists&source=netease',
    responseExample: {
      code: 200,
      message: 'success',
      data: [
        {
          id: '19723756',
          name: '云音乐飙升榜',
          cover: 'https://example.com/toplist.jpg',
          description: '示例榜单',
          platform: 'netease',
        },
      ],
    },
  },
  {
    method: 'GET',
    route: '/api',
    title: '获取榜单歌曲',
    summary: '根据榜单 ID 返回榜单歌曲。',
    params: [
      { name: 'type', required: true, description: '固定为 toplist。' },
      { name: 'source', required: true, description: '平台标识，目前支持 netease、qq、kuwo。' },
      { name: 'id', required: true, description: '榜单 ID。' },
    ],
    notes: [
      '缺少 source 或 id 时会返回 400。',
      '不支持的平台会返回 400 Unsupported platform。',
    ],
    example: 'GET /api?type=toplist&source=qq&id=26',
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        id: '26',
        name: '热歌榜',
        titleDetail: '示例标题',
        intro: '示例简介',
        songs: [],
      },
    },
  },
];

const pendingPublicEndpoints = [
  { type: 'url', statusCode: 404, behavior: 'Music url endpoint not implemented' },
  { type: 'pic', statusCode: 404, behavior: 'Album cover endpoint not implemented' },
  { type: 'lrc', statusCode: 404, behavior: 'Lyrics endpoint not implemented' },
  { type: 'aggregateSearch', statusCode: 404, behavior: 'Aggregate search endpoint not implemented' },
  { type: 'status', statusCode: 501, behavior: 'Not implemented' },
  { type: 'stats', statusCode: 501, behavior: 'Not implemented' },
] as const;

const managementEndpoints: EndpointDefinition[] = [
  {
    method: 'GET / POST',
    route: '/api/data/docs/readme',
    title: 'README 文档管理',
    summary: `读取或保存 ${README_FILE_PATH}。`,
    params: [
      { name: 'content', required: false, description: 'POST 时提交新的 Markdown 内容。' },
    ],
    notes: [
      'GET 直接读取项目根目录 README.md。',
      'POST 保存顺序为本地文件 -> 数据存储镜像 -> 可选 GitHub 同步。',
    ],
    example: 'POST /api/data/docs/readme\n{ "content": "# README" }',
  },
  {
    method: 'GET / POST',
    route: '/api/data/docs/api',
    title: 'API 文档 HTML 管理',
    summary: `读取、保存或重新生成 ${HTML_FILE_PATH}。`,
    params: [
      { name: 'content', required: false, description: 'POST 时提交新的完整 HTML 文档。' },
      { name: 'regenerate', required: false, description: 'POST 为 true 时按当前源码与配置重建文档。' },
    ],
    notes: [
      'GET 会在文档缺失、为空、是旧版占位内容或旧版 JSON 文档时自动重建。',
      'POST regenerate=true 会忽略传入 content，直接覆盖 doc/doc.html。',
    ],
    example: 'POST /api/data/docs/api\n{ "regenerate": true }',
  },
  {
    method: 'GET / POST',
    route: '/api/data/provider',
    title: 'Provider 配置管理',
    summary: '读取或保存服务商配置。',
    params: [
      { name: 'providers', required: false, description: 'POST 时提交完整 providers 数组。' },
    ],
    notes: [
      '优先读取数据存储中的配置，没有时回退到 data/provider.json。',
      '当前实现 POST 仅保存到数据存储，不会回写 data/provider.json。',
    ],
    example: 'GET /api/data/provider',
  },
  {
    method: 'GET / POST',
    route: '/api/data/api',
    title: '上游 API 模板配置管理',
    summary: '读取或保存后台维护的上游 API 配置模板。',
    params: [
      { name: 'apis', required: false, description: 'POST 时提交完整 apis 数组。' },
    ],
    notes: [
      '优先读取数据存储中的配置，没有时回退到 data/api.json。',
      '这些记录描述的是上游接口模板，不是本地 Next.js 路由本身。',
    ],
    example: 'GET /api/data/api',
  },
  {
    method: 'GET / POST',
    route: '/api/sys',
    title: '系统配置管理',
    summary: '读取或保存系统配置，包括 GitHub 仓库地址、接口超时和并发数。',
    params: [
      { name: 'configuration', required: false, description: 'POST 时提交新的系统配置。' },
    ],
    notes: [
      'POST 会写入数据存储并同步回 sys.json。',
      '文档同步目标仓库优先读取这里的 githubProjectPath。',
    ],
    example: 'GET /api/sys',
  },
  {
    method: 'GET / POST',
    route: '/api/data/dashboard',
    title: '运行态仪表盘数据',
    summary: '读取或保存仪表盘运行数据。',
    params: [],
    notes: [
      'GET 会优先返回运行时内存中的实时数据。',
      'POST 用于 dashboardService 周期性同步仪表盘快照。',
    ],
    example: 'GET /api/data/dashboard',
  },
  {
    method: 'ANY',
    route: '/api/proxy/[...path]',
    title: '代理转发入口',
    summary: '接收任意路径并转发到示例上游服务。',
    params: [],
    notes: [
      '当前代码中 serviceProvider 和目标地址仍是硬编码示例值。',
      '它更像占位路由，不应被当作已完成的生产代理能力。',
    ],
    example: 'GET /api/proxy/example/path',
  },
];

const authEndpoints: EndpointDefinition[] = [
  {
    method: 'GET',
    route: '/api/auth/github/login',
    title: 'GitHub OAuth 登录入口',
    summary: '发起 GitHub OAuth 登录流程。',
    params: [],
    notes: ['用于后台管理员登录。'],
    example: 'GET /api/auth/github/login',
  },
  {
    method: 'GET',
    route: '/api/auth/github/callback',
    title: 'GitHub OAuth 回调',
    summary: '处理 GitHub OAuth 回调。',
    params: [],
    notes: ['成功后会建立后台会话。'],
    example: 'GET /api/auth/github/callback?code=...',
  },
  {
    method: 'GET',
    route: '/api/auth/session',
    title: '当前会话信息',
    summary: '返回当前后台认证会话。',
    params: [],
    notes: ['Dashboard 初始化时依赖这个接口判断是否已登录。'],
    example: 'GET /api/auth/session',
  },
  {
    method: 'POST',
    route: '/api/auth/logout',
    title: '退出登录',
    summary: '清理当前后台会话。',
    params: [],
    notes: ['Dashboard 退出登录时会调用这个接口。'],
    example: 'POST /api/auth/logout',
  },
];

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatStatus = (status?: string): string => {
  if (!status) {
    return '未标注';
  }

  return statusLabels[status] ?? status;
};

const formatProviderCategory = (value?: string): string => {
  if (!value) {
    return '未标注';
  }

  return providerCategoryLabels[value] ?? value;
};

const formatProviderNature = (value?: string): string => {
  if (!value) {
    return '未标注';
  }

  return providerNatureLabels[value] ?? value;
};

const maskSensitiveLine = (line: string): string => {
  const trimmed = line.trim();
  if (!trimmed) {
    return '';
  }

  const pairMatch = trimmed.match(/^([^:=]+?)(\s*[:=]\s*)(.+)$/);
  const key = pairMatch?.[1] ?? trimmed;
  if (!/(authorization|api[-_ ]?key|token|secret|password)/i.test(key)) {
    return trimmed;
  }

  if (!pairMatch) {
    return '[hidden]';
  }

  return `${pairMatch[1]}${pairMatch[2]}[hidden]`;
};

const maskSensitiveMultilineText = (value?: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '未配置';
  }

  return trimmed
    .split(/\r?\n/)
    .map(maskSensitiveLine)
    .filter((line) => line.length > 0)
    .join('\n');
};

const toCodeBlock = (value: string): string => `<pre>${escapeHtml(value)}</pre>`;

const toJsonBlock = (value: unknown): string => {
  const serialized = JSON.stringify(value, null, 2) ?? '';
  return toCodeBlock(serialized);
};

const renderParameterTable = (params: EndpointParameter[]): string => {
  if (params.length === 0) {
    return '<p class="muted">无额外参数。</p>';
  }

  const rows = params
    .map((param) => `
      <tr>
        <td><code>${escapeHtml(param.name)}</code></td>
        <td>${param.required ? '是' : '否'}</td>
        <td>${escapeHtml(param.description)}${param.defaultValue ? `<div class="muted">默认值：${escapeHtml(param.defaultValue)}</div>` : ''}</td>
      </tr>
    `)
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>必填</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const renderEndpointList = (items: EndpointDefinition[]): string => items
  .map((item) => `
    <article class="endpoint-card">
      <div class="endpoint-heading">
        <div>
          <div class="chips">
            <span class="chip chip-method">${escapeHtml(item.method)}</span>
            <span class="chip">${escapeHtml(item.route)}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
      </div>
      <p>${escapeHtml(item.summary)}</p>
      ${renderParameterTable(item.params)}
      <div class="subsection">
        <h4>调用示例</h4>
        ${toCodeBlock(item.example)}
      </div>
      ${item.responseExample !== undefined ? `
        <div class="subsection">
          <h4>响应示例</h4>
          ${toJsonBlock(item.responseExample)}
        </div>
      ` : ''}
      <div class="subsection">
        <h4>当前行为说明</h4>
        <ul>${item.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
      </div>
    </article>
  `)
  .join('');

const renderProviderCards = (providers: ProviderConfigItem[]): string => {
  if (providers.length === 0) {
    return '<div class="empty-state">当前没有可用于文档展示的 Provider 配置。</div>';
  }

  return providers
    .map((provider) => `
      <article class="provider-card">
        <div class="chips">
          <span class="chip">${escapeHtml(provider.code || provider.id)}</span>
          <span class="chip">${escapeHtml(formatStatus(provider.status))}</span>
        </div>
        <h3>${escapeHtml(provider.name || provider.id)}</h3>
        <dl class="detail-list">
          <div>
            <dt>类别</dt>
            <dd>${escapeHtml(formatProviderCategory(provider.category))}</dd>
          </div>
          <div>
            <dt>性质</dt>
            <dd>${escapeHtml(formatProviderNature(provider.nature))}</dd>
          </div>
          <div>
            <dt>地址</dt>
            <dd>${escapeHtml(provider.url?.trim() || '未配置')}</dd>
          </div>
          <div>
            <dt>备注</dt>
            <dd>${escapeHtml(provider.remark?.trim() || '无')}</dd>
          </div>
        </dl>
      </article>
    `)
    .join('');
};

const renderApiTemplateTable = (apis: ApiConfigItem[], providerMap: Map<string, ProviderConfigItem>): string => {
  if (apis.length === 0) {
    return '<div class="empty-state">当前没有配置任何上游 API 模板。</div>';
  }

  const rows = apis
    .map((api) => {
      const providerName = api.provider ? (providerMap.get(api.provider)?.name ?? api.provider) : '未分配';
      return `
        <tr>
          <td>${escapeHtml(api.name)}</td>
          <td><span class="inline-chip">${escapeHtml(api.method || 'GET')}</span></td>
          <td><code>${escapeHtml(api.path || '-')}</code></td>
          <td>${escapeHtml(providerName)}</td>
          <td>${escapeHtml(formatStatus(api.status))}</td>
          <td>${toCodeBlock(maskSensitiveMultilineText(api.headers))}</td>
          <td>${toCodeBlock(api.params?.trim() || '未配置')}</td>
          <td>${escapeHtml(api.remark?.trim() || '无')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>名称</th>
          <th>方法</th>
          <th>上游路径</th>
          <th>绑定 Provider</th>
          <th>状态</th>
          <th>请求头</th>
          <th>参数模板</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const renderPendingEndpointTable = (): string => {
  const rows = pendingPublicEndpoints
    .map((item) => `
      <tr>
        <td><code>${escapeHtml(item.type)}</code></td>
        <td>${item.statusCode}</td>
        <td>${escapeHtml(item.behavior)}</td>
      </tr>
    `)
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>type</th>
          <th>当前返回</th>
          <th>代码中的行为</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const loadStoredConfig = async <T>(key: string, filePath: string, fallback: T): Promise<T> => {
  try {
    return await getStoredValue<T>(key, () => readJsonFile(filePath, fallback));
  } catch (error) {
    console.warn(`Failed to load ${key} from store, fallback to ${filePath}:`, error);
    return readJsonFile(filePath, fallback);
  }
};

export async function generateProjectApiDocHtml(): Promise<string> {
  const [{ providers }, { apis }] = await Promise.all([
    loadStoredConfig<ProviderConfigShape>(STORE_KEYS.PROVIDER_CONFIG, 'data/provider.json', DEFAULT_PROVIDER_CONFIG),
    loadStoredConfig<ApiConfigShape>(STORE_KEYS.API_CONFIG, 'data/api.json', DEFAULT_API_CONFIG),
  ]);

  const providerList = providers ?? [];
  const apiList = apis ?? [];
  const providerMap = new Map(providerList.map((provider) => [provider.id, provider]));
  const supportedPlatforms = Object.values(Platform);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${PUBLIC_API_TITLE}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #efe9df;
      --paper: rgba(255, 252, 247, 0.96);
      --paper-strong: #fffdf9;
      --ink: #18181b;
      --muted: #5b5f67;
      --line: rgba(24, 24, 27, 0.1);
      --accent: #0f766e;
      --accent-soft: rgba(15, 118, 110, 0.12);
      --shadow: 0 22px 60px rgba(15, 23, 42, 0.12);
      --radius-xl: 28px;
      --radius-lg: 18px;
      --radius-md: 12px;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      color: var(--ink);
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.18), transparent 22%),
        radial-gradient(circle at bottom right, rgba(8, 145, 178, 0.14), transparent 26%),
        var(--bg);
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    code,
    pre {
      font-family: "IBM Plex Mono", "Cascadia Code", Consolas, monospace;
    }

    .shell {
      width: min(1420px, calc(100% - 32px));
      margin: 24px auto;
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }

    .sidebar,
    .panel {
      border: 1px solid var(--line);
      border-radius: var(--radius-xl);
      background: var(--paper);
      box-shadow: var(--shadow);
    }

    .sidebar {
      position: sticky;
      top: 24px;
      padding: 24px 20px;
      max-height: calc(100vh - 48px);
      overflow: auto;
    }

    .sidebar .eyebrow,
    .hero .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .sidebar h1 {
      margin: 16px 0 10px;
      font-size: 30px;
      line-height: 1.05;
      letter-spacing: -0.04em;
    }

    .sidebar p {
      margin: 0;
      color: var(--muted);
      line-height: 1.8;
      font-size: 14px;
    }

    .nav-group {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
    }

    .nav-group h2 {
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .nav-group a {
      display: block;
      margin-top: 4px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 14px;
      transition: background-color 0.18s ease, transform 0.18s ease;
    }

    .nav-group a:hover,
    .nav-group a.active {
      background: rgba(255, 255, 255, 0.92);
      transform: translateX(2px);
    }

    .main {
      display: grid;
      gap: 24px;
    }

    .hero {
      overflow: hidden;
    }

    .hero-top {
      padding: 34px;
      background:
        linear-gradient(135deg, rgba(15, 118, 110, 0.96), rgba(8, 145, 178, 0.94)),
        #0f766e;
      color: #f0fdfa;
    }

    .hero-top h2 {
      margin: 16px 0 12px;
      font-size: clamp(34px, 5vw, 56px);
      line-height: 0.98;
      letter-spacing: -0.05em;
    }

    .hero-top p {
      margin: 0;
      max-width: 840px;
      line-height: 1.85;
      color: rgba(240, 253, 250, 0.92);
      font-size: 16px;
    }

    .hero-grid,
    .provider-grid,
    .stat-grid {
      display: grid;
      gap: 16px;
    }

    .hero-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      padding: 24px 34px 34px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.94));
    }

    .stat-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 18px;
    }

    .stat-card,
    .provider-card,
    .endpoint-card,
    .note-card {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--paper-strong);
    }

    .stat-card,
    .provider-card,
    .note-card {
      padding: 18px;
    }

    .stat-card span {
      display: block;
      margin-bottom: 10px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .stat-card strong {
      font-size: 28px;
      line-height: 1;
    }

    .panel {
      padding: 28px;
    }

    .panel h2 {
      margin: 0 0 12px;
      font-size: 30px;
      letter-spacing: -0.04em;
    }

    .panel > p {
      margin: 0;
      color: var(--muted);
      line-height: 1.85;
    }

    .provider-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 20px;
    }

    .provider-card h3,
    .endpoint-card h3 {
      margin: 12px 0 10px;
      font-size: 22px;
      letter-spacing: -0.03em;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip,
    .inline-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.06);
      color: #0f172a;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .chip-method {
      background: rgba(15, 118, 110, 0.12);
      color: var(--accent);
    }

    .inline-chip {
      font-size: 11px;
      padding: 4px 8px;
    }

    .detail-list {
      display: grid;
      gap: 14px;
      margin: 16px 0 0;
    }

    .detail-list dt {
      margin: 0 0 4px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .detail-list dd {
      margin: 0;
      line-height: 1.75;
      word-break: break-word;
    }

    .endpoint-list {
      display: grid;
      gap: 18px;
      margin-top: 20px;
    }

    .endpoint-card {
      padding: 22px;
    }

    .endpoint-card p,
    .endpoint-card li,
    .muted {
      color: var(--muted);
      line-height: 1.8;
    }

    .endpoint-heading {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 12px;
    }

    .subsection {
      margin-top: 16px;
    }

    .subsection h4 {
      margin: 0 0 10px;
      font-size: 14px;
      letter-spacing: 0.02em;
    }

    table {
      width: 100%;
      margin-top: 14px;
      border-collapse: collapse;
      border: 1px solid var(--line);
      border-radius: 16px;
      overflow: hidden;
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }

    th {
      background: rgba(15, 23, 42, 0.05);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    tr:last-child td {
      border-bottom: none;
    }

    pre {
      margin: 0;
      padding: 16px 18px;
      border-radius: 16px;
      background: #111827;
      color: #f8fafc;
      font-size: 13px;
      line-height: 1.7;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    code {
      word-break: break-word;
    }

    ul {
      margin: 0;
      padding-left: 20px;
    }

    li + li {
      margin-top: 6px;
    }

    .empty-state {
      margin-top: 20px;
      padding: 18px;
      border: 1px dashed var(--line);
      border-radius: var(--radius-lg);
      color: var(--muted);
      background: rgba(255, 255, 255, 0.56);
    }

    .footer {
      text-align: center;
      color: var(--muted);
      font-size: 13px;
      padding: 6px 0 12px;
    }

    @media (max-width: 1180px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        max-height: none;
      }

      .hero-grid,
      .stat-grid,
      .provider-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 760px) {
      body {
        background: var(--bg);
      }

      .shell {
        width: min(100%, calc(100% - 20px));
        margin: 10px auto 24px;
        gap: 16px;
      }

      .sidebar,
      .panel {
        padding: 22px;
      }

      .hero-top,
      .hero-grid {
        padding: 22px;
      }

      .hero-grid,
      .stat-grid,
      .provider-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <!-- ${GENERATED_API_DOC_MARKER} -->
  <div class="shell">
    <aside class="sidebar">
      <span class="eyebrow">Generated Docs</span>
      <h1>${PUBLIC_API_TITLE}</h1>
      <p>当前页面由项目源码路由、Provider 配置和 API 模板配置自动生成，用于保证后台文档与真实实现尽量保持一致。</p>

      <nav>
        <div class="nav-group">
          <h2>Overview</h2>
          <a href="#overview">项目概览</a>
          <a href="#providers">当前 Provider</a>
          <a href="#public-api">公开接口</a>
        </div>
        <div class="nav-group">
          <h2>Admin</h2>
          <a href="#api-templates">上游 API 模板</a>
          <a href="#management">后台管理接口</a>
          <a href="#auth">认证接口</a>
        </div>
        <div class="nav-group">
          <h2>Status</h2>
          <a href="#pending">未实现能力</a>
          <a href="#doc-flow">文档链路</a>
        </div>
      </nav>
    </aside>

    <main class="main">
      <section class="panel hero" id="overview">
        <div class="hero-top">
          <span class="eyebrow">Version ${escapeHtml(packageJson.version)}</span>
          <h2>${PUBLIC_API_TITLE}</h2>
          <p>文档基于当前 Next.js 路由实现自动整理：公开入口为 <code>/api</code>，文档页为 <code>/docs</code>，后台配置页为 <code>/dashboard</code>。README 与 API 文档分别直接落盘到 <code>${README_FILE_PATH}</code> 和 <code>${HTML_FILE_PATH}</code>。</p>
        </div>
        <div class="hero-grid">
          <div class="stat-card">
            <span>项目版本</span>
            <strong>v${escapeHtml(packageJson.version)}</strong>
          </div>
          <div class="stat-card">
            <span>已实现公开 type</span>
            <strong>${implementedPublicEndpoints.length}</strong>
          </div>
          <div class="stat-card">
            <span>当前 Provider</span>
            <strong>${providerList.length}</strong>
          </div>
          <div class="stat-card">
            <span>上游 API 模板</span>
            <strong>${apiList.length}</strong>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>项目概览</h2>
        <p>公开音乐接口当前全部聚合在同一个 <code>/api</code> 路由中，通过 <code>type</code> 区分能力。默认 provider 为 <code>${Provider.TUNEHUB}</code>，当前支持的平台枚举来自源码：${supportedPlatforms.map((platform) => `<code>${escapeHtml(platform)}</code>`).join('、')}。</p>
        <div class="stat-grid">
          <div class="note-card">
            <strong>公开入口</strong>
            <p><code>/api</code></p>
          </div>
          <div class="note-card">
            <strong>文档入口</strong>
            <p><code>/docs</code></p>
          </div>
          <div class="note-card">
            <strong>后台入口</strong>
            <p><code>/dashboard</code></p>
          </div>
          <div class="note-card">
            <strong>文档文件</strong>
            <p><code>${README_FILE_PATH}</code> / <code>${HTML_FILE_PATH}</code></p>
          </div>
        </div>
      </section>

      <section class="panel" id="providers">
        <h2>当前 Provider 配置</h2>
        <p>这里展示的是后台当前可读到的 Provider 配置快照，优先来自数据存储，回退到 <code>data/provider.json</code>。</p>
        <div class="provider-grid">
          ${renderProviderCards(providerList)}
        </div>
      </section>

      <section class="panel" id="public-api">
        <h2>公开接口</h2>
        <p>下列能力直接对应 <code>src/app/api/route.ts</code> 中当前已落地的 switch 分支，是对外最核心的访问入口。</p>
        <div class="endpoint-list">
          ${renderEndpointList(implementedPublicEndpoints)}
        </div>
      </section>

      <section class="panel" id="api-templates">
        <h2>上游 API 模板配置</h2>
        <p>下表来自后台维护的 API 模板配置，用于描述调用外部 Provider 时的目标路径、参数模板与请求头。为了避免泄露敏感信息，包含密钥语义的请求头值会自动隐藏。</p>
        ${renderApiTemplateTable(apiList, providerMap)}
      </section>

      <section class="panel" id="management">
        <h2>后台管理接口</h2>
        <p>这些接口主要服务于 Dashboard 自身，不应当直接作为公开业务 API 使用。</p>
        <div class="endpoint-list">
          ${renderEndpointList(managementEndpoints)}
        </div>
      </section>

      <section class="panel" id="auth">
        <h2>认证接口</h2>
        <p>后台登录使用 GitHub OAuth，会话检查和退出登录也都通过独立接口完成。</p>
        <div class="endpoint-list">
          ${renderEndpointList(authEndpoints)}
        </div>
      </section>

      <section class="panel" id="pending">
        <h2>未实现能力</h2>
        <p>以下 <code>type</code> 虽然已经在公开路由中预留了分支，但当前源码仍返回 404 或 501，不应在外部文档中描述为可用能力。</p>
        ${renderPendingEndpointTable()}
      </section>

      <section class="panel" id="doc-flow">
        <h2>文档链路</h2>
        <p>README 与 API 文档已经统一成“文件为准、后台可编辑、可选同步到远程仓库”的链路。README 使用 Markdown，API 文档使用完整 HTML，并由 <code>/docs</code> 页面原样渲染。</p>
        <table>
          <thead>
            <tr>
              <th>文档</th>
              <th>后台编辑格式</th>
              <th>本地文件</th>
              <th>渲染入口</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>项目 README</td>
              <td>Markdown</td>
              <td><code>${README_FILE_PATH}</code></td>
              <td>后台文档中心预览</td>
            </tr>
            <tr>
              <td>API 文档</td>
              <td>HTML</td>
              <td><code>${HTML_FILE_PATH}</code></td>
              <td><code>/docs</code></td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="footer">
        Auto-generated from the current project routes and config snapshot.
      </div>
    </main>
  </div>

  <script>
    (function () {
      const links = Array.from(document.querySelectorAll('.nav-group a'));
      const sections = links
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

      const setActive = (id) => {
        links.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      }, { rootMargin: '-35% 0px -50% 0px', threshold: 0.01 });

      sections.forEach((section) => observer.observe(section));
    })();
  </script>
</body>
</html>`;
}
