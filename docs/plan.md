# 项目迭代计划（plan.md）

## 当前迭代任务
- [x] 移除原 GitHub PAT token 登录流程，改为 GitHub OAuth 按钮授权登录
- [x] 新增 login 中间页（左侧项目展示，右侧登录操作区）
- [x] 新增左侧纯色轮播 + 打字机文案效果
- [x] 新增全局配置文件并支持管理员白名单（多个 GitHub 用户）
- [x] OAuth 回调获取 GitHub 用户身份并按管理员白名单放行后台
- [x] 增加会话接口（session/logout）并让 dashboard 先校验服务端会话
- [x] 增加环境变量示例文件，兼容 Vercel 部署场景
- [x] 初始化 Git 仓库并建立 `main/dev` 分支
- [x] 在 README 明确 Vercel 必填环境变量与 GitHub OAuth 字段填写说明

## 后续待办（按优先级）
- [ ] 将 dashboard 内所有直接 GitHub API 调用迁移为后端统一代理层
- [ ] 按规范接入 shadcn/ui 组件体系并统一主题 Token
- [ ] 新增 Vitest 并补齐核心安全模块单元测试（覆盖率 >= 80%）
- [ ] 补充 Dockerfile 与 docker-compose.yml 一键开发环境
- [ ] 落地 i18n 文案抽离（i18next）
