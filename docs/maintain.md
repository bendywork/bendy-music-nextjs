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
