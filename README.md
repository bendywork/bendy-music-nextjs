# ddmusic-nextjs

基于 Next.js 的音乐聚合 API 代理服务，为多平台音乐资源提供统一的访问接口。

## 🎯 项目简介

ddmusic-nextjs 是一个现代化的音乐聚合 API 代理服务，旨在解决不同音乐平台 API 访问的复杂性，为开发者提供统一、简洁的音乐资源访问接口。

### 核心价值
- **统一接口**：屏蔽不同音乐平台 API 的差异，提供标准化的访问方式
- **多平台支持**：集成网易云音乐、QQ 音乐、酷我音乐等多个平台
- **高效代理**：优化请求流程，提高访问速度和稳定性
- **管理系统**：提供直观的后台管理界面，方便配置和监控

## ✨ 功能特点

### 🔐 安全认证
- GitHub Personal Access Token 认证
- 安全的 token 存储和管理

### 🎵 音乐平台集成
- **网易云音乐**：支持音乐搜索、播放、歌单等功能
- **QQ 音乐**：提供丰富的音乐资源访问
- **酷我音乐**：集成第三方音乐平台资源

### 🚀 高性能 API 代理
- 基于 Next.js API 路由的高性能代理服务
- 智能请求处理和错误重试机制
- 支持多种音乐平台的 API 格式转换

### 📊 管理后台
- **系统仪表盘**：实时监控系统状态和请求统计
- **接口管理**：统一管理所有 API 接口
- **文档管理**：内置 Markdown 编辑器，方便管理 API 文档
- **配置管理**：灵活的系统配置参数调整

### 📚 完整的 API 文档
- 详细的接口说明和使用示例
- 支持文档在线编辑和更新
- 多格式文档输出（HTML、Markdown）

## 🛠️ 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js | 16.1.4 | 服务端渲染、API路由 |
| 前端库 | React | 19.2.3 |  UI组件开发 |
| 样式框架 | Tailwind CSS | 4.0 | 响应式样式设计 |
| 数据库 ORM | Prisma | 7.3.0 | 数据库访问和模型管理 |
| 数据库 | MySQL | - | 持久化存储 |
| 缓存 | Redis | 5.10.0 | 缓存和会话管理 |
| HTTP 客户端 | Axios | 1.13.2 | API 请求处理 |
| 认证 | GitHub PAT | - | 安全认证 |
| 编辑器 | react-markdown-editor-lite | 1.4.2 | Markdown 文档编辑 |
| 开发工具 | TypeScript | 5.0 | 类型安全 |
| 开发工具 | ESLint | 9.0 | 代码质量检查 |

## 📁 项目结构

```
ddmusic-nextjs/
├── doc/                    # API文档
│   ├── API文档.md
│   ├── TuneHub API Documentation.html
│   ├── doc-prop.json
│   └── 目录结构说明.md
├── public/                 # 静态资源
│   ├── next.svg
│   └── vercel.svg
├── src/                    # 源代码
│   ├── app/                # Next.js 应用路由
│   │   ├── api/            # API 路由
│   │   ├── dashboard/      # 管理后台
│   │   ├── login/          # 登录页面
│   │   └── page.tsx        # 首页
│   ├── components/         # 组件
│   │   └── MarkdownEditor.tsx
│   ├── config/             # 配置文件
│   │   └── tunehub.ts
│   ├── lib/                # 服务和工具
│   │   ├── db.ts
│   │   ├── github.ts
│   │   └── http.ts
│   └── modules/            # 功能模块
│       └── music/          # 音乐服务模块
│           ├── services/   # 音乐平台服务
│           └── types/      # 类型定义
├── .gitignore
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 9.0 或更高版本
- MySQL 数据库
- Redis 服务

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yokeay/ddmusic-nextjs.git
   cd ddmusic-nextjs
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   创建 `.env.local` 文件，添加以下配置：
   ```env
   # 数据库连接
   DATABASE_URL="mysql://username:password@localhost:3306/ddmusic"
   
   # Redis 连接
   REDIS_URL="redis://localhost:6379"
   
   # GitHub 仓库配置
   GITHUB_REPO="yokeay/ddmusic-nextjs"
   ```

4. **数据库迁移**
   ```bash
   npx prisma migrate dev
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

6. **访问应用**
   - 首页: `http://localhost:3000`
   - 登录页: `http://localhost:3000/login`
   - 管理后台: `http://localhost:3000/dashboard`

## 🔧 核心功能

### 音乐服务集成

系统集成了多个音乐平台的服务，通过统一的接口提供音乐资源访问：

#### 网易云音乐
```typescript
// 示例：获取网易云音乐排行榜
GET /api?provider=tunehub&source=netease&type=toplists
```

#### QQ音乐
```typescript
// 示例：获取QQ音乐推荐
GET /api?provider=tunehub&source=qq&type=recommend
```

#### 酷我音乐
```typescript
// 示例：搜索酷我音乐
GET /api?provider=tunehub&source=kuwo&type=search&keyword=周杰伦
```

### 管理后台功能

1. **系统仪表盘**
   - 实时监控代理请求数
   - 服务商状态管理
   - 系统运行时间统计

2. **接口管理**
   - 统一管理所有 API 接口
   - 接口状态监控
   - 接口配置调整

3. **文档管理**
   - 内置 Markdown 编辑器
   - 支持在线编辑和保存
   - 自动同步到 GitHub 仓库

4. **配置管理**
   - 系统参数调整
   - 平台服务配置
   - API 超时设置

## 📖 API 文档

### 基础接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api` | GET | 统一音乐 API 入口 |
| `/api/proxy/[...path]` | ALL | 通用代理接口 |

### 音乐平台接口

#### 网易云音乐
- `GET /api?provider=tunehub&source=netease&type=toplists` - 获取排行榜
- `GET /api?provider=tunehub&source=netease&type=search&keyword=xxx` - 搜索音乐

#### QQ音乐
- `GET /api?provider=tunehub&source=qq&type=song&id=xxx` - 获取歌曲详情
- `GET /api?provider=tunehub&source=qq&type=album&id=xxx` - 获取专辑

#### 酷我音乐
- `GET /api?provider=tunehub&source=kuwo&type=artist&id=xxx` - 获取歌手信息
- `GET /api?provider=tunehub&source=kuwo&type=playlist&id=xxx` - 获取歌单

### 管理接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/auth/login` | POST | GitHub 认证登录 |
| `/api/docs/save` | POST | 保存文档内容 |
| `/api/config/update` | POST | 更新系统配置 |

## 📦 部署指南

### Vercel 部署

1. **准备工作**
   - 确保项目已推送到 GitHub
   - 配置好环境变量

2. **部署步骤**
   - 访问 [Vercel](https://vercel.com/new)
   - 导入 GitHub 仓库
   - 配置环境变量
   - 点击 "Deploy"

3. **环境变量配置**
   ```
   DATABASE_URL=mysql://username:password@hostname:3306/database
   REDIS_URL=redis://hostname:6379
   GITHUB_REPO=username/repository
   ```

### 自建服务器部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **启动服务**
   ```bash
   npm start
   ```

3. **使用 PM2 管理进程**
   ```bash
   pm2 start npm --name "ddmusic-nextjs" -- start
   ```

## 🤝 贡献指南

### 开发流程

1. **Fork 仓库**
2. **创建分支**
   ```bash
   git checkout -b feature/your-feature
   ```
3. **提交代码**
   ```bash
   git commit -m "Add your feature"
   ```
4. **推送到远程**
   ```bash
   git push origin feature/your-feature
   ```
5. **创建 Pull Request**

### 代码规范

- 使用 TypeScript 类型定义
- 遵循 ESLint 规范
- 使用 Tailwind CSS 进行样式开发
- 保持代码简洁明了

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- **项目地址**：[https://github.com/yokeay/ddmusic-nextjs](https://github.com/yokeay/ddmusic-nextjs)
- **问题反馈**：[Issues](https://github.com/yokeay/ddmusic-nextjs/issues)

---

**享受音乐，享受开发！** 🎵✨
## OAuth Admin Login Setup

This project now uses **GitHub OAuth** for admin login.

1. Create a GitHub OAuth App.
2. Set callback URL to: `https://<your-domain>/api/auth/github/callback`
3. Configure environment variables based on `.env.example`.
4. Set admin allowlist in either:
   - `GITHUB_ADMIN_USERS` (comma-separated, preferred)
   - or `config/app.config.json` -> `auth.github.admins`

Only users in the admin allowlist can access `/dashboard`.

For Vercel deployment, set all required variables in Vercel Project Settings -> Environment Variables.

## GitHub OAuth + Vercel Configuration (Required)

This section is the source of truth for deployment login configuration.

### 1) GitHub OAuth App fields (exactly how to fill)

Use your production domain `https://ddmusic.polofox.com` as below:

- Application name: `ddmusic`
- Homepage URL: `https://ddmusic.polofox.com/login`
- Application description: `ddmusic admin login`
- Authorization callback URL: `https://ddmusic.polofox.com/api/auth/github/callback`
- Enable Device Flow: `unchecked`

Important:
- Callback URL must exactly match `GITHUB_OAUTH_REDIRECT_URI` in Vercel.
- If callback mismatches, GitHub login will fail directly.

### 2) Vercel environment variables (must configure)

Set these variables in Vercel Project Settings -> Environment Variables.

Required for login to work:

- `NEXT_PUBLIC_APP_URL=https://ddmusic.polofox.com`
- `APP_BASE_URL=https://ddmusic.polofox.com`
- `GITHUB_CLIENT_ID=<GitHub OAuth Client ID>`
- `GITHUB_CLIENT_SECRET=<GitHub OAuth Client Secret>`
- `GITHUB_OAUTH_REDIRECT_URI=https://ddmusic.polofox.com/api/auth/github/callback`
- `GITHUB_ADMIN_USERS=<comma-separated github usernames>`
- `AUTH_SESSION_SECRET=<long random secret, at least 32 chars>`

Recommended optional variables:

- `GITHUB_OAUTH_SCOPES=read:user,repo`
- `GITHUB_OAUTH_BASE_URL=https://ddmusic.polofox.com`

Data-layer variables (configure when enabling DB/Redis):

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `TUNEHUB_API_KEY`

### 3) Example values for your current domain

- `NEXT_PUBLIC_APP_URL=https://ddmusic.polofox.com`
- `APP_BASE_URL=https://ddmusic.polofox.com`
- `GITHUB_OAUTH_REDIRECT_URI=https://ddmusic.polofox.com/api/auth/github/callback`
- `GITHUB_ADMIN_USERS=your_github_username,second_admin`

### 4) Quick verification checklist

- Open `/login`
- Click GitHub login
- GitHub authorizes and returns to `/api/auth/github/callback`
- If your GitHub username is in `GITHUB_ADMIN_USERS`, you enter `/dashboard`
- If not in allowlist, you are rejected with `unauthorized_admin`
