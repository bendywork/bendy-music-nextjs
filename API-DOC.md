# 顶点音乐 API 接口文档

> 版本：v0.1.15 | 更新日期：2026-05-08

所有公开接口统一通过 `/api` 入口访问，使用 `type` 参数区分功能，`source` 参数指定平台。

## 支持平台

| 平台标识 | 名称 |
|---------|------|
| `netease` | 网易云音乐 |
| `qq` | QQ 音乐 |
| `kuwo` | 酷我音乐 |
| `bilibili` | 哔哩哔哩 |

## 通用说明

- 请求方式：**GET**
- 统一响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

- 错误响应：

```json
{
  "code": 400,
  "message": "Missing source or id parameter"
}
```

- 当某个 API 或 Provider 在后台被设置为 `disabled` 时，返回 `该接口已下架`
- 当某个 API 或 Provider 在后台被设置为 `maintenance` 时，返回 `该接口维护中暂不可用`

## 接口总览

| 接口 | type | 必填参数 | 已实现平台 |
|------|------|---------|-----------|
| 获取歌曲信息 | `info` | `source`, `id` | netease / qq / kuwo / bilibili |
| 搜索歌曲 | `search` | `source`, `keyword` | netease / qq / kuwo / bilibili |
| 获取歌单详情 | `playlist` | `source`, `id` | netease / qq / kuwo / bilibili |
| 获取榜单列表 | `toplists` | `source` | netease / qq / kuwo / bilibili |
| 获取榜单歌曲 | `toplist` | `source`, `id` | netease / qq / kuwo / bilibili |
| 获取音频 URL | `url` | `source`, `id` | bilibili |

以下能力当前仍未实现，调用后会得到对应状态码：

| type | 当前返回 | 说明 |
|------|---------|------|
| `pic` | 404 | 专辑封面接口未实现 |
| `lrc` | 404 | 歌词接口未实现 |
| `aggregateSearch` | 404 | 聚合搜索接口未实现 |
| `status` | 501 | 系统状态接口未实现 |
| `stats` | 501 | 统计接口未实现 |

---

## 1. 获取歌曲信息

根据平台和歌曲 ID 返回歌曲基础信息。

**请求参数**

| 参数 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 固定为 `info` |
| `source` | 是 | 平台标识：`netease` / `qq` / `kuwo` / `bilibili` |
| `id` | 是 | 歌曲 ID |

**请求示例**

```
GET /api?type=info&source=netease&id=2608813264
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "name": "示例歌曲",
    "artist": "示例歌手",
    "album": "示例专辑",
    "id": "2608813264",
    "platform": "netease",
    "url": "/api?type=url&source=netease&id=2608813264",
    "pic": "/api?type=pic&source=netease&id=2608813264",
    "lrc": "/api?type=lrc&source=netease&id=2608813264"
  }
}
```

**备注**
- 缺少 `source` 或 `id` 时返回 400
- 内部由 `MusicServiceFactory` 按 `source` 路由到对应平台实现

---

## 2. 搜索歌曲

按平台搜索歌曲，返回匹配结果列表。

**请求参数**

| 参数 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `type` | 是 | 固定为 `search` | - |
| `source` | 是 | 平台标识：`netease` / `qq` / `kuwo` / `bilibili` | - |
| `keyword` | 是 | 搜索关键词 | - |
| `limit` | 否 | 返回数量上限 | `20` |

**请求示例**

```
GET /api?type=search&source=qq&keyword=周杰伦&limit=20
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "周杰伦",
    "total": 2,
    "results": [
      {
        "id": "123456",
        "name": "夜曲",
        "artist": "周杰伦",
        "album": "十一月的萧邦",
        "platform": "qq",
        "url": "/api?type=url&source=qq&id=123456"
      }
    ]
  }
}
```

**备注**
- 缺少 `source` 或 `keyword` 时返回 400
- 不支持的平台返回 400 `Unsupported platform`

---

## 3. 获取歌单详情

根据平台和歌单 ID 返回歌单详情信息。

**请求参数**

| 参数 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 固定为 `playlist` |
| `source` | 是 | 平台标识：`netease` / `qq` / `kuwo` / `bilibili` |
| `id` | 是 | 歌单 ID |

**请求示例**

```
GET /api?type=playlist&source=kuwo&id=3136604274
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "3136604274",
    "name": "示例歌单",
    "description": "示例歌单描述",
    "cover": "https://example.com/cover.jpg",
    "songs": []
  }
}
```

**备注**
- 缺少 `source` 或 `id` 时返回 400
- `kuwo` 走专用公开服务，`bilibili` 走独立 Bilibili 服务，其他平台走统一 `MusicServiceFactory`
- 服务端异常时返回 500 并附带 `error` 字段

---

## 4. 获取榜单列表

根据平台返回该平台所有可用的榜单列表。

**请求参数**

| 参数 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 固定为 `toplists` |
| `source` | 是 | 平台标识：`netease` / `qq` / `kuwo` / `bilibili` |

**请求示例**

```
GET /api?type=toplists&source=netease
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "19723756",
      "name": "云音乐飙升榜",
      "cover": "https://example.com/toplist.jpg",
      "description": "示例榜单",
      "platform": "netease"
    }
  ]
}
```

**备注**
- 缺少 `source` 时返回 400
- 不支持的平台返回 400 `Unsupported platform`

---

## 5. 获取榜单歌曲

根据榜单 ID 返回该榜单下的歌曲列表。

**请求参数**

| 参数 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 固定为 `toplist` |
| `source` | 是 | 平台标识：`netease` / `qq` / `kuwo` / `bilibili` |
| `id` | 是 | 榜单 ID（从 `toplists` 接口获取） |

**请求示例**

```
GET /api?type=toplist&source=qq&id=26
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "26",
    "name": "热歌榜",
    "titleDetail": "示例标题",
    "intro": "示例简介",
    "songs": []
  }
}
```

**备注**
- 缺少 `source` 或 `id` 时返回 400
- 不支持的平台返回 400 `Unsupported platform`
- 榜单 ID 需先通过 `toplists` 接口获取

---

## 6. 获取音频播放 URL

根据平台和歌曲 ID 返回可直接播放的音频 URL。**当前仅 `bilibili` 平台已实现**，其他平台调用会返回 404。

**请求参数**

| 参数 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `type` | 是 | 固定为 `url` | - |
| `source` | 是 | 平台标识，当前仅 `bilibili` 已实现 | - |
| `id` | 是 | 视频/歌曲 ID，bilibili 使用 BV 号 | - |
| `br` | 否 | 音质：`128k` / `320k` / `flac` / `flac24bit` | `320k` |

**请求示例**

```
GET /api?type=url&source=bilibili&id=BV1xx411c7mD
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "url": "https://example.com/audio.m4a",
    "platform": "bilibili"
  }
}
```

**备注**
- 缺少 `source` 或 `id` 时返回 400
- 非 `bilibili` 平台返回 404 `Audio URL not supported for this platform`
- 服务端异常时返回 500 并附带 `error` 字段

---

## 后台管理接口

以下接口主要服务于 Dashboard 后台，不属于公开音乐 API：

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/data/docs/readme` | GET / POST | README 文档读写 |
| `/api/data/docs/api` | GET / POST | API 文档 HTML 读写、可重新生成 |
| `/api/data/provider` | GET / POST | Provider 配置读写 |
| `/api/data/api` | GET / POST | 上游 API 模板配置读写 |
| `/api/sys` | GET / POST | 系统配置读写 |
| `/api/data/dashboard` | GET / POST | 仪表盘运行数据读写 |
| `/api/proxy/[...path]` | ANY | 代理转发占位入口 |
| `/api/auth/github/login` | GET | GitHub OAuth 登录入口 |
| `/api/auth/github/callback` | GET | GitHub OAuth 回调 |
| `/api/auth/session` | GET | 当前后台会话信息 |
| `/api/auth/logout` | POST | 退出后台登录 |
| `/api/docs/auth` | POST | `/docs` 页面密码校验 |
| `/api/debug/request` | GET | 调试用请求信息回显 |
