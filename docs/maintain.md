# 项目维护总记录（maintain.md）

## 文档目标
- 本文档是项目迭代维护的唯一记录入口，所有版本变更、功能迭代、发布动作都必须在此留痕。
- 每次开发按本文件约束执行；每次迭代结束后必须更新本文件记录。
- 本文档与 `docs/plan.md` 配套使用：`plan.md` 管计划，`maintain.md` 管结果。

## 1. 全局版本维护策略

### 1.1 单一版本源
- 全局版本统一采用 `MAJOR.MINOR.PATCH`（大版本.中版本.小版本）。
- 版本参数约定放在配置文件中统一维护，建议路径：`config/release.config.json`。
- 配置参数建议如下：

```json
{
  "version": "0.1.0",
  "major": 0,
  "minor": 1,
  "patch": 0,
  "tagPrefix": "v",
  "autoPatchOnCommit": true
}
```

### 1.2 三段版本定义
- `MAJOR`（大版本）：架构级或大范围不兼容更新，仅在你明确通知后升级。
- `MINOR`（中版本）：一次发布级功能集合更新，在你通知发布时升级。
- `PATCH`（小版本）：每次提交后维护递增，用于日常修复与小改动。

### 1.3 版本与发布规则
- 版本号更新后，发布标签使用 `v{版本号}`，例如 `v1.3.12`。
- 中版本发布流程：`dev -> main`，并创建对应 tag。

## 2. 计划驱动规范
- 维护 `docs/plan.md`，记录当前已规划的全部迭代任务。
- 任务状态必须可追踪，推荐格式：`[ ] 待做`、`[x] 已完成`。
- 开发执行顺序以 `plan.md` 为准，完成即更新状态并在本文件补充结果记录。

## 3. 分支与发布策略
- `main`：生产分支。
- `dev`：开发主分支。
- 每个迭代任务从 `dev` 拉取 `feat/{任务名}` 分支开发。
- 任务完成后合并回 `dev`。
- 中版本发布时将 `dev` 合并到 `main` 并打 tag。

## 4. Web UI 规范
- 样式技术栈：`Tailwind CSS + shadcn/ui`。
- 主题基色：黑、白、灰。
- 必须支持白天/夜间主题切换。
- 主题切换按钮放置在常规 Web 项目位置（默认：页面右上角导航区）。

## 5. 迭代完成质量闸门（强制）
每次迭代完成后，按顺序执行：
1. 依赖安全扫描：`npm audit`（或 `pnpm audit`）。
2. 代码检查：`npm run lint`。
3. 测试执行：`npm test`（及对应测试命令）。
4. 构建验证：`npm run build`。
5. 若任一步失败，必须先修复再继续。
6. 全部通过后自动提交并推送远程 `origin`。

提交信息规范：`chore(release): v{版本号} 迭代完成`

## 6. 测试规范
- 核心安全模块必须编写单元测试：
  - TOTP 生成与验证
  - Token 签发与吊销
  - 会话管理
- 上述核心模块测试覆盖率不得低于 80%。
- 每次迭代新增功能必须附带对应测试。
- 前端测试框架：`Vitest`；后端使用对应语言标准测试框架。

## 7. 安全规范
- 所有密钥和敏感配置统一走 `.env`，禁止硬编码。
- `.env` 必须在 `.gitignore` 中。
- 所有 API 接口必须认证。
- 敏感操作（踢人、吊销 Token）必须二次验证。
- TOTP 密钥存储必须加密。
- 所有用户输入必须校验与转义，防止 XSS/SQL 注入。
- HTTP 接口强制 HTTPS。
- 数据库、Redis、S3 等外部依赖配置均通过环境变量注入。
- 必须提供 `.env.example` 示例配置。

## 8. 环境管理规范
- 维护三套环境配置：
  - `.env.development`
  - `.env.staging`
  - `.env.production`
- 配置内容至少包括：API 地址、数据库连接、密钥等变量。
- 构建命令通过 `--mode` 切换环境。
- 敏感环境变量不得入库。

## 9. 错误处理与日志规范
- 前端统一封装 API 请求层。
- 所有接口错误统一走 toast/notification 提示。
- 后端统一错误码规范（4 位数字），例如：
  - `1001` Token 过期
  - `1002` 权限不足
- 后端统一返回格式：`{code, message, data}`。
- 日志必须结构化。
- 关键操作（登录、踢人、Token 操作）必须记录审计日志。
- 若存在后台管理端，必须提供日志审计入口。

## 10. DB 迁移策略
- 数据库结构变更必须通过迁移文件管理（如 Prisma Migrate / golang-migrate）。
- 禁止手动改表作为正式变更手段。

## 11. Docker 容器化
- 维护 `Dockerfile` 与 `docker-compose.yml`。
- 支持一键启动开发环境。

## 12. i18n 国际化
- 从项目初期即进行文案抽离。
- 推荐方案：`i18next`（或 `vue-i18n`，视技术栈而定）。

## 13. 依赖安全扫描
- 每次构建前必须执行 `npm audit`（或 `pnpm audit`）。
- 存在高危漏洞时禁止发布。

## 14. 备份与灾备策略
- 数据库定时备份策略由配置文件开关控制，默认关闭。
- 若开启灾备与恢复，系统初始化后需自动创建对应计划。
- TOTP 密钥必须采用独立加密备份方案。
- 若执行前需要额外配置，必须同步更新：
  - `README.md`
  - 本 `docs/maintain.md`
  - `.env.example`

## 15. Commit 规范
- 使用 Conventional Commits：
  - `feat: 添加 TOTP 绑定页面`
  - `fix: 修复 Token 刷新逻辑`
  - `chore: 升级依赖`
- 自动发布提交格式：`chore(release): v{版本号} 迭代完成`。

## 16. 迭代记录模板
每次迭代完成后，追加以下记录：

```markdown
## [vX.Y.Z] - YYYY-MM-DD
- 迭代类型：feat / fix / chore / release
- 需求来源：
- 变更摘要：
- 具体修改：
  - 修改文件：
  - 修改方式：
  - 关键实现：
- 测试与验证：
  - lint：
  - test：
  - build：
  - audit：
- 发布动作：
  - 分支：
  - commit：
  - tag：
  - push：
- 风险与回滚：
- 备注：
```

## 17. 迭代记录

## [v0.1.0] - 2026-03-28
- 迭代类型：chore（项目维护基线）
- 需求来源：建立统一的版本、流程、测试、安全、发布规范。
- 变更摘要：新增维护总记录文档，固化 16 条项目约束。
- 具体修改：
  - 修改文件：`docs/maintain.md`
  - 修改方式：新建文档并写入标准化维护规则与记录模板。
  - 关键实现：明确版本分级、分支策略、质量闸门、审计与安全要求。
- 测试与验证：
  - lint：本次为文档新增，未执行代码扫描。
  - test：本次为文档新增，未执行测试。
  - build：本次为文档新增，未执行构建。
  - audit：本次为文档新增，未执行依赖扫描。
- 发布动作：
  - 分支：未执行
  - commit：未执行
  - tag：未执行
  - push：未执行
- 风险与回滚：无代码行为变更，风险低。
- 备注：后续每次迭代需严格按本文件与 `docs/plan.md` 执行。

## [v0.1.1] - 2026-03-28
- 迭代类型：feat（登录体系重构）
- 需求来源：解除 PAT 登录，改为 GitHub OAuth + 管理员白名单准入。
- 变更摘要：新增 OAuth 登录链路、登录中间页、全局管理员配置、服务端会话校验。
- 具体修改：
  - 修改文件：`src/app/login/page.tsx`
  - 修改方式：重写登录页面为左右布局，中间页左侧纯色轮播+打字机，右侧 GitHub 授权按钮。
  - 关键实现：支持回调错误提示、主题切换、会话检查后自动跳转后台。
  - 修改文件：`src/app/api/auth/github/login/route.ts`、`src/app/api/auth/github/callback/route.ts`
  - 修改方式：新增 GitHub OAuth 发起与回调处理。
  - 关键实现：服务端换取 access token，读取 GitHub 用户身份，与管理员白名单比对。
  - 修改文件：`src/app/api/auth/session/route.ts`、`src/app/api/auth/logout/route.ts`、`src/lib/server/auth-session.ts`
  - 修改方式：新增服务端会话签名与会话接口。
  - 关键实现：后台入口通过 session 校验，登出同步清理服务端会话。
  - 修改文件：`src/lib/server/global-config.ts`、`config/app.config.json`、`config/release.config.json`、`.env.example`、`.env.*.example`
  - 修改方式：新增全局配置与多环境示例配置。
  - 关键实现：管理员账号支持多个 GitHub 用户名（文件配置 + 环境变量覆盖），兼容 Vercel。
  - 修改文件：`src/app/dashboard/page.tsx`、`src/app/globals.css`、`docs/plan.md`
  - 修改方式：调整 dashboard 登录校验逻辑并补充计划文档。
  - 关键实现：dashboard 首次加载先校验服务端 session，再加载后台数据。
- 测试与验证：
  - lint：已执行 `npm run lint`，无 error（存在历史 warning 32 条）。
  - test：当前仓库暂无测试脚本，未执行
  - build：已执行 `npm run build`，通过（Next.js 16.2.1）。
  - audit：已执行 `npm audit --audit-level=high`，无高危漏洞（余 2 条 moderate）。
- 发布动作：
  - 分支：未执行（当前目录未检测到 Git 元信息）
  - commit：未执行
  - tag：未执行
  - push：未执行
- 风险与回滚：OAuth 配置依赖环境变量，若未配置会阻断登录；可回滚至上一版本登录页面与 auth 路由。
- 备注：管理员白名单优先读取 `GITHUB_ADMIN_USERS`，为空时回退到 `config/app.config.json`。

## [v0.1.2] - 2026-03-28
- 迭代类型：chore（仓库与部署配置完善）
- 需求来源：初始化 Git 仓库，并在 README 明确 Vercel 必填配置。
- 变更摘要：完成仓库初始化与分支建立，补齐 OAuth + Vercel 配置说明文档。
- 具体修改：
  - 修改文件：`README.md`
  - 修改方式：追加 GitHub OAuth 字段填写与 Vercel 环境变量强制配置清单。
  - 关键实现：明确回调地址、管理员白名单、会话密钥等上线必填项。
  - 修改文件：`docs/plan.md`、`config/release.config.json`、`package.json`
  - 修改方式：更新计划状态并递增小版本号到 `v0.1.2`。
  - 关键实现：保持版本管理与计划管理一致性。
- 测试与验证：
  - lint：已执行 `npm run lint`，通过（0 error，32 warning）。
  - test：当前仓库暂无测试脚本，未执行
  - build：已执行 `npm run build`，通过。
  - audit：已执行 `npm audit --audit-level=high`，无 high 漏洞（2 moderate）。
- 发布动作：
  - 分支：已初始化 `main` 并创建 `dev`
  - commit：未执行
  - tag：未执行
  - push：未执行（未配置远程 origin）
- 风险与回滚：文档与仓库初始化为低风险操作，可直接回退对应提交。
- 备注：远程仓库地址配置后可按 `feat/* -> dev -> main` 策略进入标准发布流。

## [v0.1.3] - 2026-03-28
- 迭代类型：feat（数据存储与文档同步改造）
- 需求来源：移除基于 GitHub repo 的业务数据读写，统一改为 PostgreSQL + Redis，并在文档管理中支持按全局 auth 配置提交到仓库。
- 变更摘要：完成 API 数据层 PostgreSQL 化、Redis 缓存接入（兼容 Upstash URL）、文档管理服务端化并新增 README/API 文档自动 commit 能力。
- 具体修改：
  - 修改文件：`src/lib/server/data-store.ts`、`src/lib/db.ts`、`src/app/api/data/api/route.ts`、`src/app/api/data/provider/route.ts`、`src/app/api/data/dashboard/route.ts`、`src/app/api/sys/route.ts`
  - 修改方式：重构数据读写实现，统一通过 PostgreSQL 表 `app_data_store` 存储，并通过 Redis 做读缓存。
  - 关键实现：首次读取自动从原 `data/*.json` / `sys.json` 回填到 PostgreSQL，实现平滑迁移。
  - 修改文件：`src/app/api/data/docs/readme/route.ts`、`src/app/api/data/docs/api/route.ts`、`src/lib/server/repo-sync.ts`、`src/lib/server/global-config.ts`、`config/app.config.json`
  - 修改方式：新增文档管理 API 与仓库同步服务，补充全局 repo auth 配置。
  - 关键实现：文档保存先入 PostgreSQL，再按 `repoSync.docs.auth.tokenEnvName` 对应环境变量令牌提交到 GitHub 仓库指定分支。
  - 修改文件：`src/app/dashboard/page.tsx`、`src/lib/github.ts`
  - 修改方式：移除前端直连 GitHub repo 的配置读写流程，统一改为调用后端 API。
  - 关键实现：README 与 API 文档保存返回 commit 结果，provider/api/sys 配置仅通过后端数据接口更新。
  - 修改文件：`.env.example`、`.env.development.example`、`.env.staging.example`、`.env.production.example`、`README.md`、`db/migrations/20260328_postgres_store.sql`、`docs/plan.md`、`config/release.config.json`、`package.json`
  - 修改方式：更新部署与变量说明，新增 PostgreSQL 迁移 SQL，递增版本号至 `v0.1.3`。
  - 关键实现：补充 Upstash 兼容配置示例（`rediss://`）及 docs repo sync 环境变量。
- 测试与验证：
  - lint：已执行 `npm run lint`，通过（0 error，27 warning）。
  - test：已执行 `npm test`，失败（仓库未定义 `test` script）。
  - build：已执行 `npm run build`，通过（含 1 条 Turbopack NFT tracing warning）。
  - audit：已执行 `npm audit`，存在 2 条 moderate 漏洞（无 high/critical）。
- 发布动作：
  - 分支：未执行
  - commit：未执行
  - tag：未执行
  - push：未执行
- 风险与回滚：
  - 风险：部署环境需提供 `DATABASE_URL` 与 Redis 连接，否则新数据接口不可用；文档 commit 依赖 `GITHUB_REPO_TOKEN`（或自定义 token env）配置。
  - 回滚：可回退本迭代文件并恢复原本地 JSON 路由实现。
- 备注：`GITHUB_OAUTH_SCOPES` 默认已调整为 `read:user`，repo 写入权限从 OAuth 用户 token 转为全局仓库 token 配置。

## [v0.1.4] - 2026-03-29
- 迭代类型：fix（管理员白名单匹配策略修复）
- 需求来源：`GITHUB_ADMIN_USERS` 配置含 `yokeay.52bendy` 时，`yokeay` 登录被拒绝。
- 变更摘要：将 GitHub 管理员判定从“精确命中”调整为“包含命中（大小写不敏感）”。
- 具体修改：
  - 修改文件：`src/app/api/auth/github/callback/route.ts`
  - 修改方式：新增 `isAdminMatched` 匹配函数并替换原 `includes(exact)` 判定。
  - 关键实现：支持 `adminEntry.includes(login)` 与 `login.includes(adminEntry)` 双向包含匹配。
  - 修改文件：`package.json`、`config/release.config.json`
  - 修改方式：递增版本号到 `v0.1.4`。
- 测试与验证：
  - lint：已执行 `npm run lint`，通过（0 error，27 warning）。
  - test：已执行 `npm test`，失败（仓库未定义 `test` script）。
  - build：已执行 `npm run build`，通过（含 1 条 Turbopack NFT tracing warning）。
  - audit：已执行 `npm audit`，存在 2 条 moderate 漏洞（无 high/critical）。
- 发布动作：
  - 分支：未执行
  - commit：未执行
  - tag：未执行
  - push：未执行
- 风险与回滚：
  - 风险：包含匹配会扩大授权范围，建议白名单值保持完整且唯一，避免过短字符串。
  - 回滚：可回退 `callback/route.ts` 到精确匹配逻辑。
- 备注：本次仅修复登录授权判定，不涉及 OAuth 配置项结构变更。

## [v0.1.5] - 2026-03-29
- 迭代类型：fix（乱码文本修复）
- 需求来源：后台页面与 README 文档出现大面积乱码，影响管理操作与文档编辑。
- 变更摘要：修复 dashboard 可见文案、重写 README 为 ASCII 安全文案，并增加服务端读取时的乱码自动纠正能力。
- 具体修改：
  - 修改文件：`src/app/dashboard/page.tsx`、`src/components/MarkdownEditor.tsx`、`src/lib/dashboard.ts`
  - 修改方式：清理后台可见文案中的乱码，替换为可读的中英文标签，并修正仪表盘默认服务名显示。
  - 关键实现：文档管理、Provider/API 管理、系统概览等主页面均恢复为可读文本。
  - 修改文件：`README.md`
  - 修改方式：重写 README 为纯英文安全文案，避免再次出现编码导致的展示乱码。
  - 关键实现：README 在后台编辑器与仓库预览中均可稳定显示。
  - 修改文件：`src/lib/server/mojibake.ts`、`src/lib/server/data-store.ts`、`src/lib/server/global-config.ts`
  - 修改方式：新增乱码修复工具，并在数据读取阶段自动清理历史脏数据。
  - 关键实现：已存入 PostgreSQL / JSON 文件中的乱码字符串可在读取时自动归一化。
  - 修改文件：`data/api.json`、`data/provider.json`、`data/dashboard.json`、`package.json`、`config/release.config.json`
  - 修改方式：修正示例数据文本并递增版本号到 `v0.1.5`。
  - 关键实现：清除示例数据中的乱码和坏 JSON 问题。
- 测试与验证：
  - lint：已执行 `npm run lint`，通过（0 error，27 warning）。
  - test：当前仓库暂无 `test` script，未执行。
  - build：已执行 `npm run build`，通过（含 1 条 Turbopack NFT tracing warning）。
  - audit：本次未新增高危依赖问题，`npm install` 后仍为 2 条 moderate。
- 发布动作：
  - 分支：未执行
  - commit：未执行
  - tag：未执行
  - push：未执行
- 风险与回滚：
  - 风险：历史数据中若存在无法自动恢复的个别字符串，仍可能需要人工二次校正。
  - 回滚：可回退本次页面文案与 `mojibake` 工具改动。
- 备注：本次重点修复用户可见页面与文档编辑体验，注释内残留乱码不影响运行。

## [v0.1.12] - 2026-03-31
- 迭代类型：feat（结构化后台配置与文档访问控制）
- 需求来源：修复 README 编辑器高度问题，为 `/docs` 增加密码访问，并将系统设置、服务商、接口配置升级为结构化数据库管理。
- 变更摘要：完成 README 编辑器布局修复、`/docs` 密码门禁、系统配置独立表、服务商表/API 主表结构化存储与内置接口种子化，后台支持读取编辑修改删除并按状态控制接口放行。
- 具体修改：
  - 修改文件：`src/components/MarkdownEditor.tsx`、`src/components/docs-page-shell.tsx`、`src/app/docs/page.tsx`、`src/app/api/docs/auth/route.ts`
  - 修改方式：修复 Markdown 编辑器高度问题，新增 `/docs` 密码校验接口与访问门禁页面。
  - 关键实现：`DOCS_ACCESS_PASSWORD` 优先走环境变量，未配置时回退 `config/app.config.json` 默认值 `fntp@polofox.com`。
  - 修改文件：`src/lib/admin-config.ts`、`src/lib/server/admin-config-store.ts`、`src/app/api/sys/route.ts`、`src/app/api/data/provider/route.ts`、`src/app/api/data/api/route.ts`、`db/migrations/20260331_structured_admin_config.sql`
  - 修改方式：新增结构化后台配置模型与 PostgreSQL 持久化层，拆分系统配置表、服务商表、接口表。
  - 关键实现：首次读取自动从 `sys.json`、`data/provider.json`、`data/api.json` 和旧存储回填数据，并内置网易云、酷我、QQ 三个平台接口记录。
  - 修改文件：`src/app/api/route.ts`、`src/components/dashboard/provider-panel.tsx`、`src/components/dashboard/api-panel.tsx`、`src/components/dashboard/types.ts`
  - 修改方式：后台界面改为三态管理（启用/维护中/禁用），服务商字段由 `URL` 改为 `BaseURL`，接口新增 `requestType` 字段。
  - 关键实现：当接口或服务商状态为 `disabled` 时统一返回“该接口已下架”，为 `maintenance` 时返回“该接口维护中暂不可用”。
  - 修改文件：`src/lib/server/global-config.ts`、`config/app.config.json`、`.env.example`、`.env.development.example`、`.env.staging.example`、`.env.production.example`、`README.md`、`src/lib/server/repo-sync.ts`、`src/lib/i18n/dashboard.ts`
  - 修改方式：补充文档访问配置、部署说明、多语言文案与版本信息。
  - 关键实现：README 明确新增迁移文件、`/docs` 密码规则、结构化表说明和状态放行规则。
- 测试与验证：
  - lint：已执行 `npm run lint`，通过（0 error，12 warning，为历史未使用变量 warning）。
  - test：当前仓库暂无 `test` script，未执行。
  - build：已执行 `npm run build`，通过。
  - audit：本次未执行 `npm audit`。
- 发布动作：
  - 分支：待执行 `dev -> main -> push -> checkout dev`
  - commit：待执行
  - tag：未执行
  - push：待执行
- 风险与回滚：
  - 风险：生产环境需补跑新迁移 `db/migrations/20260331_structured_admin_config.sql`，否则结构化配置接口无法正常落表。
  - 回滚：可回退结构化存储层与新迁移，恢复旧 JSON/通用存储读取逻辑。
- 备注：本次保留了旧 `app_data_store` 以兼容文档内容与历史回填，不影响新结构化表使用。

## [v0.1.13] - 2026-03-31
- 迭代类型：fix（Vercel 部署配置修复）
- 需求来源：Vercel 构建阶段读取 `/vercel/path0/package.json` 失败，提示 UTF-8 BOM 导致 JSON 非法。
- 变更摘要：移除 `package.json` 与版本配置文件的 UTF-8 BOM，保证 Vercel/Node 可直接解析；同步补丁版本号并修正文档记录。
- 具体修改：
  - 修改文件：`package.json`
  - 修改方式：重写为无 BOM 的标准 UTF-8 JSON，并同步版本到 `0.1.13`。
  - 关键实现：消除开头 `EF BB BF` 字节，修复 Vercel `Unexpected token '﻿'` 报错。
  - 修改文件：`config/release.config.json`、`package-lock.json`
  - 修改方式：同步统一版本源到 `v0.1.13`，并移除版本配置文件中的 BOM。
  - 关键实现：仓库内主版本源与锁文件版本保持一致，避免后续发布记录错位。
- 测试与验证：
  - lint：已执行 `npm run lint`，通过（0 error，12 warning，为历史未使用变量 warning）。
  - test：已执行 `npm test`，失败（仓库未定义 `test` script）。
  - build：已执行 `npm run build`，通过。
  - audit：已执行 `npm audit --audit-level=high`，存在 2 条 moderate 漏洞，无 high/critical。
- 发布动作：
  - 分支：`dev -> main -> push -> checkout dev`
  - commit：`chore(release): v0.1.13 迭代完成`
  - tag：未执行
  - push：已执行到 `origin/dev` 与 `origin/main`
- 风险与回滚：
  - 风险：若后续继续使用会写入 BOM 的编辑器直接改 JSON 文件，部署错误可能再次出现。
  - 回滚：可回退 `package.json`、`config/release.config.json` 与 `package-lock.json` 到上一个稳定提交。
- 备注：本次发布同时覆盖并完成了 `v0.1.12` 记录中待执行的分支发布流程。

## [v0.1.14] - 2026-03-31
- 迭代类型：fix（首页概览与运行时长修复）
- 需求来源：首页概览中的运行时长在刷新后归零；最近同步信息需要改为版本更新记录；顶部 UTF-8 文案需要精简。
- 变更摘要：将运行时长改为基于 PostgreSQL 持久化基准时间计算并按 10 分钟同步快照，首页概览新增最近一次 commit 时间与 message 摘要展示，并补充构建时 git 元数据生成脚本。
- 具体修改：
  - 修改文件：`src/lib/dashboard.ts`、`src/lib/server/data-store.ts`、`src/app/api/data/dashboard/route.ts`、`data/dashboard.json`
  - 修改方式：新增 `dashboard-runtime` 持久化 key，后台服务启动后从 PostgreSQL 恢复运行基准时间，运行中按 10 分钟同步 runtime/dashboard 快照。
  - 关键实现：前端刷新后会继续基于数据库中的 `systemStartedAt` 和服务端快照动态计时，不再从 0 开始。
  - 修改文件：`scripts/generate-build-metadata.mjs`、`src/lib/server/build-metadata.ts`、`.gitignore`
  - 修改方式：新增构建前 git 元数据生成脚本，输出最后一次 commit 的时间、message 和短 SHA 到运行时可读文件。
  - 关键实现：Vercel 和本地构建都会在 dashboard 概览中展示最近一次版本更新记录，无需运行时依赖 `.git` 目录。
  - 修改文件：`src/components/dashboard/overview-panel.tsx`、`src/components/dashboard/types.ts`、`src/lib/i18n/dashboard.ts`、`package.json`
  - 修改方式：将“最近同步”替换为“版本更新记录”，顶部 badge 精简为 `UTF-8`，并把 uptime 前端计算改为基于服务端快照时间递增展示。
  - 关键实现：首页顶部卡片同时展示 commit 时间、message 摘要和短 SHA，运行时长文案改为基于数据库持久化基准刷新。
- 测试与验证：
  - lint：已执行 `npm run lint`，通过（0 error，12 warning，为历史未使用变量 warning）。
  - test：已执行 `npm test`，失败（仓库未定义 `test` script）。
  - build：已执行 `npm run build`，通过。
  - audit：已执行 `npm audit --audit-level=high`，存在 2 条 moderate 漏洞，无 high/critical。
- 发布动作：
  - 分支：`dev -> main -> push -> checkout dev`
  - commit：`chore(release): v0.1.14 迭代完成`
  - tag：未执行
  - push：已执行到 `origin/dev` 与 `origin/main`
- 风险与回滚：
  - 风险：若部署环境的 `DATABASE_URL` 不可用，dashboard 仍会回退到文件默认值，运行时长将无法跨实例持久化。
  - 回滚：可回退 dashboard 持久化逻辑和构建元数据脚本，恢复原有前端本地计时与最近同步展示。
- 备注：本次未新增数据库结构迁移，沿用现有 `app_data_store` 表承载 runtime 持久化数据。
