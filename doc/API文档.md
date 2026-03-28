# TuneHub API 接口文档

## 服务介绍

TuneHub 是一个统一的音乐信息解析服务。它打破了不同音乐平台之间的壁垒，提供了一套标准化的 API 接口。

## 基本信息

- **Base URL**: http://localhost:3001
- **Version**: 1.0.0
- **支持的平台**: 
  - `netease` - 网易云音乐
  - `kuwo` - 酷我音乐
  - `qq` - QQ音乐

## 核心 API

### 1. 获取歌曲基本信息

**GET** `/api/?source={source}&id={id}&type=info`

获取歌曲的名称、歌手、专辑等基本元数据信息。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source | string | 是 | 平台标识 |
| id | string | 是 | 歌曲ID |
| type | string | 是 | 固定为 `info` |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "name": "歌曲名称",
    "artist": "歌手名称",
    "album": "专辑名称",
    "id": "123456",
    "platform": "netease",
    "url": "http://localhost:3001/api/?source=netease&id=123456&type=url",
    "pic": "http://localhost:3001/api/?source=netease&id=123456&type=pic",
    "lrc": "http://localhost:3001/api/?source=netease&id=123456&type=lrc"
  }
}
```

### 2. 获取音乐文件链接

**GET** `/api/?source={source}&id={id}&type=url&br=[320k]`

获取音乐文件的下载链接，返回 302 重定向。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source | string | 是 | 平台标识 |
| id | string | 是 | 歌曲ID |
| type | string | 是 | 固定为 `url` |
| br | string | 否 | 音质参数，默认 `320k` |

**音质参数对照表**:
| 值 | 说明 | 比特率 |
|-----|------|--------|
| 128k | 标准音质 | 128kbps |
| 320k | 高品质 | 320kbps |
| flac | 无损音质 | ~1000kbps |
| flac24bit | Hi-Res 音质 | ~1400kbps |

**响应说明**:
- 成功时返回 `302 Redirect` 到实际的音乐文件 URL
- 自动换源：当请求的原平台失败时，系统会自动尝试其他平台

### 3. 获取专辑封面

**GET** `/api/?source={source}&id={id}&type=pic`

获取歌曲的专辑封面图片。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source | string | 是 | 平台标识 |
| id | string | 是 | 歌曲ID |
| type | string | 是 | 固定为 `pic` |

**响应说明**:
- 成功时返回 `302 Redirect` 到实际的图片 URL

### 4. 获取歌词

**GET** `/api/?source={source}&id={id}&type=lrc`

获取歌曲的 LRC 格式歌词。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source | string | 是 | 平台标识 |
| id | string | 是 | 歌曲ID |
| type | string | 是 | 固定为 `lrc` |

**响应示例** (Text/Plain):
```
[00:00.00]歌词第一行
[00:05.50]歌词第二行
[00:10.20]歌词第三行
```

### 5. 搜索歌曲

**GET** `/api/?source={source}&type=search&keyword={keyword}&limit=[20]`

搜索指定平台的歌曲。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source | string | 是 | 平台标识 |
| type | string | 是 | 固定为 `search` |
| keyword | string | 是 | 搜索关键词 |
| limit | number | 否 | 结果数量限制，默认 20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "周杰伦",
    "total": 10,
    "results": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "artist": "周杰伦",
        "album": "专辑名称",
        "platform": "netease",
        "url": "http://localhost:3001/api/?source=netease&id=123456&type=url"
      }
    ]
  }
}
```

### 6. 聚合搜索

**GET** `/api/?type=aggregateSearch&keyword={keyword}`

搜索所有平台的歌曲，返回聚合结果。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定为 `aggregateSearch` |
| keyword | string | 是 | 搜索关键词 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "周杰伦",
    "results": [
      {
        "id": "123456",
        "name": "歌曲名称",
        "artist": "周杰伦",
        "album": "专辑名称",
        "platform": "netease",
        "url": "http://localhost:3001/api/?source=netease&id=123456&type=url"
      },
      {
        "id": "789012",
        "name": "歌曲名称",
        "artist": "周杰伦",
        "album": "专辑名称",
        "platform": "qq",
        "url": "http://localhost:3001/api/?source=qq&id=789012&type=url"
      }
    ]
  }
}
```

### 7. 获取歌单详情

**GET** `/api/?source={source}&id={id}&type=playlist`

获取歌单的名称、描述、封面和歌曲列表。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source | string | 是 | 平台标识 |
| id | string | 是 | 歌单ID |
| type | string | 是 | 固定为 `playlist` |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "123456",
    "name": "歌单名称",
    "description": "歌单描述",
    "cover": "http://example.com/cover.jpg",
    "songs": [
      {
        "name": "歌曲名称",
        "artist": "歌手名称",
        "album": "专辑名称",
        "id": "789012",
        "platform": "netease",
        "url": "http://localhost:3001/api/?source=netease&id=789012&type=url",
        "pic": "http://localhost:3001/api/?source=netease&id=789012&type=pic",
        "lrc": "http://localhost:3001/api/?source=netease&id=789012&type=lrc"
      }
    ]
  }
}
```

### 8. 获取排行榜列表

**GET** `/api/?type=toplists`

获取所有支持的排行榜列表。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定为 `toplists` |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "123456",
      "name": "热歌榜",
      "cover": "http://example.com/cover.jpg",
      "description": "热门歌曲排行榜",
      "platform": "netease"
    }
  ]
}
```

### 9. 获取排行榜歌曲

**GET** `/api/?source={source}&id={id}&type=toplist`

获取指定排行榜的歌曲列表。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source | string | 是 | 平台标识 |
| id | string | 是 | 排行榜ID |
| type | string | 是 | 固定为 `toplist` |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "123456",
    "name": "热歌榜",
    "songs": [
      {
        "name": "歌曲名称",
        "artist": "歌手名称",
        "album": "专辑名称",
        "id": "789012",
        "platform": "netease",
        "url": "http://localhost:3001/api/?source=netease&id=789012&type=url",
        "pic": "http://localhost:3001/api/?source=netease&id=789012&type=pic",
        "lrc": "http://localhost:3001/api/?source=netease&id=789012&type=lrc"
      }
    ]
  }
}
```

### 10. 获取系统状态

**GET** `/api/?type=status`

获取系统的运行状态。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定为 `status` |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "ok",
    "timestamp": "2026-01-25T12:00:00.000Z",
    "version": "1.0.0"
  }
}
```

### 11. 获取统计数据

**GET** `/api/?type=stats`

获取系统的统计数据。

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 固定为 `stats` |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalRequests": 10000,
    "todayRequests": 1000,
    "successRate": 99.5,
    "averageResponseTime": 100
  }
}
```

## 开发说明

### 项目结构

```
ddmusic-nextjs/
├── src/
│   ├── app/                          # Next.js 13+ App Router
│   │   ├── api/                      # API 路由
│   │   │   └── route.ts              # 主要API入口
│   │   ├── dashboard/                # 系统面板页面
│   │   └── page.tsx                  # 首页
│   ├── lib/                          # 通用工具库
│   │   ├── http.ts                   # HTTP客户端
│   │   └── db.ts                     # 数据库连接
│   └── modules/                      # 业务模块
│       └── music/                    # 音乐业务模块
│           ├── api/                  # 对外API接口
│           ├── services/             # 内部服务
│           │   ├── providers/        # 服务商对接
│           │   │   ├── netease/      # 网易云音乐
│           │   │   ├── kuwo/         # 酷我音乐
│           │   │   └── qq/           # QQ音乐
│           │   └── MusicService.ts   # 音乐服务接口
│           └── types/                # 类型定义
└── doc/                              # 文档
    └── API文档.md                    # 本文件
```

### 设计模式

1. **策略模式**：定义统一的音乐服务接口，不同服务商实现各自的策略
2. **工厂模式**：根据平台类型创建对应的服务商实例
3. **适配器模式**：适配不同服务商的API返回格式
4. **单例模式**：数据库连接池和Redis连接

### 技术栈

- **前端框架**：Next.js 16.1.4
- **后端语言**：TypeScript
- **ORM框架**：Prisma
- **网络请求**：Axios
- **数据库**：MySQL
- **缓存**：Redis
- **样式**：Tailwind CSS
- **部署**：Vercel

## 部署说明

### Vercel部署

1. 将代码推送到GitHub或GitLab仓库
2. 在Vercel上创建新项目
3. 选择对应的仓库
4. 配置环境变量
5. 点击部署按钮

### 环境变量配置

需要配置以下环境变量：

```
# MySQL配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=ddmusic_proxy

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Next.js配置
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 开发运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm run start
```

## 版本历史

- **v1.0.0** (2026-01-25)
  - 初始版本
  - 支持网易云音乐、酷我音乐、QQ音乐
  - 实现核心API接口
  - 支持聚合搜索
  - 支持排行榜功能

## 许可证

MIT License