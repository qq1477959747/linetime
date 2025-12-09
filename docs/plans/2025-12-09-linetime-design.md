# LineTime 时间线系统设计文档

**文档版本**: v1.0
**创建日期**: 2025-12-09
**项目类型**: 个人+共享时间线应用

---

## 1. 项目概述

### 1.1 产品定位

LineTime 是一个支持个人与多人共享的时间线应用，用户可以在特定日期上传照片、编写文字记录生活点滴。核心场景是情侣空间，双方可以共同维护一个时间线，记录共同的回忆。

### 1.2 核心功能

- ✅ 用户注册/登录（邮箱 + 第三方登录）
- ✅ 个人时间线（自动创建）
- ✅ 共享空间（情侣空间/多人空间）
- ✅ 事件卡片（日期 + 时间点 + 图片 + 文字）
- ✅ 邀请码/链接机制
- ✅ 日历视图与时间线视图
- ✅ 图片上传与管理

### 1.3 技术选型

| 分类 | 技术栈 | 版本 |
|------|--------|------|
| 前端框架 | Next.js | 14 (App Router) |
| 前端语言 | TypeScript | 5.x |
| UI 框架 | Tailwind CSS + shadcn/ui | 最新 |
| 后端语言 | Go | 1.21+ |
| Web 框架 | Gin | 1.9+ |
| ORM | GORM | 1.25+ |
| 数据库 | PostgreSQL | 15+ |
| 缓存 | Redis | 7+ |
| 对象存储 | MinIO (开发) / 阿里云 OSS (生产) | 最新 |
| 认证 | JWT + OAuth 2.0 | - |
| 容器化 | Docker + Docker Compose | 最新 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────┐
│          Next.js 14 前端应用                      │
│  ├─ 用户认证页面 (Login/Register)                 │
│  ├─ 个人时间线 (Personal Timeline)                │
│  ├─ 共享空间 (Shared Space)                      │
│  └─ 事件卡片编辑器 (Event Editor)                 │
└─────────────────────────────────────────────────┘
                      ↓ HTTPS/REST API
┌─────────────────────────────────────────────────┐
│           Gin API Server (Go)                   │
│  ├─ auth/      - 认证授权模块                     │
│  ├─ timeline/  - 时间线业务模块                   │
│  ├─ event/     - 事件卡片模块                     │
│  ├─ upload/    - 文件上传模块                     │
│  ├─ share/     - 共享空间模块                     │
│  └─ user/      - 用户管理模块                     │
└─────────────────────────────────────────────────┘
          ↓                           ↓
┌──────────────────┐        ┌─────────────────┐
│   PostgreSQL     │        │     MinIO       │
│  - 用户数据       │        │  - 图片存储      │
│  - 时间线数据     │        │  - 文件管理      │
│  - 事件卡片       │        └─────────────────┘
│  - 共享关系       │
└──────────────────┘
          ↓
    ┌──────────┐
    │  Redis   │
    │ - 会话    │
    │ - 缓存    │
    └──────────┘
```

### 2.2 架构模式：模块化单体架构

**选择理由：**
- 快速启动，开发效率高
- 单一部署单元，运维简单
- 代码按业务模块清晰划分
- 预留后期拆分为微服务的可能性

**模块划分：**
- **auth** - 认证授权（注册、登录、Token 管理）
- **user** - 用户管理（个人信息、头像）
- **space** - 空间管理（创建、邀请、成员管理）
- **event** - 事件卡片（CRUD、查询）
- **upload** - 文件上传（图片上传、缩略图生成）
- **timeline** - 时间线聚合（查询优化、缓存）

---

## 3. 数据库设计

### 3.1 ER 图概览

```
users (用户表)
  ↓ 1:N
spaces (空间表)
  ↓ N:M
space_members (空间成员关联表)
  ↓ 1:N
events (事件卡片表)
  ↓ 1:N
event_images (事件图片表)
```

### 3.2 表结构详细设计

#### users 表（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 用户 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password_hash | VARCHAR(255) | NULL | 密码哈希（第三方登录可为空）|
| avatar_url | TEXT | NULL | 头像 URL |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**索引：**
- `idx_email` ON (email)
- `idx_username` ON (username)

---

#### spaces 表（空间表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 空间 ID |
| name | VARCHAR(100) | NOT NULL | 空间名称 |
| invite_code | VARCHAR(8) | UNIQUE, NOT NULL | 邀请码 |
| invite_link | TEXT | NOT NULL | 邀请链接 |
| owner_id | UUID | FK -> users(id) | 创建者 |
| type | ENUM | NOT NULL | 类型: personal/couple/group |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

**索引：**
- `idx_invite_code` ON (invite_code)
- `idx_owner_id` ON (owner_id)

---

#### space_members 表（空间成员关联表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 记录 ID |
| space_id | UUID | FK -> spaces(id) | 空间 ID |
| user_id | UUID | FK -> users(id) | 用户 ID |
| role | ENUM | NOT NULL | 角色: owner/member |
| joined_at | TIMESTAMP | NOT NULL | 加入时间 |

**索引：**
- `idx_space_user` UNIQUE ON (space_id, user_id)
- `idx_user_id` ON (user_id)

---

#### events 表（事件卡片表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 事件 ID |
| space_id | UUID | FK -> spaces(id) | 所属空间 |
| user_id | UUID | FK -> users(id) | 发布者 |
| event_date | DATE | NOT NULL | 事件日期 |
| event_time | TIME | NULL | 事件时间点 |
| title | VARCHAR(200) | NULL | 标题 |
| content | TEXT | NULL | 文字内容 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**索引：**
- `idx_space_date` ON (space_id, event_date DESC)
- `idx_user_id` ON (user_id)

---

#### event_images 表（事件图片表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 图片 ID |
| event_id | UUID | FK -> events(id) | 所属事件 |
| image_url | TEXT | NOT NULL | 原图 URL |
| thumbnail_url | TEXT | NOT NULL | 缩略图 URL |
| sort_order | INT | NOT NULL | 排序顺序 |
| uploaded_at | TIMESTAMP | NOT NULL | 上传时间 |

**索引：**
- `idx_event_id` ON (event_id, sort_order)

---

## 4. API 设计

### 4.1 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 4.2 错误码定义

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token 无效 |
| 403 | 无权限操作 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已注册）|
| 413 | 文件过大 |
| 422 | 业务逻辑错误 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 4.3 API 接口列表

#### 认证模块 (/api/auth)

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /auth/register | 邮箱注册 | 否 |
| POST | /auth/login | 邮箱登录 | 否 |
| POST | /auth/oauth/:provider | 第三方登录 | 否 |
| POST | /auth/refresh | 刷新 Token | 是 |
| POST | /auth/logout | 登出 | 是 |
| GET | /auth/me | 获取当前用户信息 | 是 |

**注册请求示例：**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**登录响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "avatar_url": "https://..."
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 7200
  }
}
```

---

#### 空间模块 (/api/spaces)

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /spaces | 创建空间 | 是 |
| GET | /spaces | 获取用户的所有空间 | 是 |
| GET | /spaces/:id | 获取空间详情 | 是 |
| PUT | /spaces/:id | 更新空间信息 | 是 |
| POST | /spaces/:id/invite | 生成/刷新邀请码 | 是 |
| POST | /spaces/join/:invite_code | 通过邀请码加入空间 | 是 |
| DELETE | /spaces/:id/members/:user_id | 移除成员 | 是 |

**创建空间请求：**
```json
POST /api/spaces
{
  "name": "我们的小窝",
  "type": "couple"
}
```

**邀请码响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "invite_code": "AB12CD34",
    "invite_link": "https://linetime.app/invite/AB12CD34",
    "expires_at": "2025-12-16T00:00:00Z"
  }
}
```

---

#### 事件模块 (/api/events)

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /spaces/:space_id/events | 创建事件卡片 | 是 |
| GET | /spaces/:space_id/events | 获取空间的事件列表 | 是 |
| GET | /events/:id | 获取事件详情 | 是 |
| PUT | /events/:id | 更新事件 | 是 |
| DELETE | /events/:id | 删除事件 | 是 |

**查询参数：**
- `date` - 查询特定日期
- `start_date` & `end_date` - 日期范围
- `year` & `month` - 按月查询

**创建事件请求：**
```json
POST /api/spaces/{space_id}/events
{
  "event_date": "2025-12-09",
  "event_time": "14:30:00",
  "title": "午后的咖啡时光",
  "content": "今天和你一起去了新开的咖啡店",
  "images": [
    {
      "image_url": "https://...",
      "thumbnail_url": "https://...",
      "sort_order": 1
    }
  ]
}
```

**事件列表响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "events": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "username": "username",
          "avatar_url": "https://..."
        },
        "event_date": "2025-12-09",
        "event_time": "14:30:00",
        "title": "午后的咖啡时光",
        "content": "...",
        "images": [...],
        "created_at": "2025-12-09T14:35:00Z"
      }
    ],
    "total": 15
  }
}
```

---

#### 文件上传模块 (/api/upload)

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /upload/image | 上传单张图片 | 是 |
| POST | /upload/images | 批量上传图片（最多9张）| 是 |
| DELETE | /upload/image/:id | 删除图片 | 是 |

**上传响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "image_url": "https://cdn.example.com/images/original/uuid.jpg",
    "thumbnail_url": "https://cdn.example.com/images/thumbnails/uuid.jpg",
    "size": 1024000,
    "width": 1920,
    "height": 1080
  }
}
```

---

## 5. 前端设计

### 5.1 页面路由（Next.js App Router）

```
/                           # 首页/登录页
/register                   # 注册页
/dashboard                  # 用户主面板（显示所有空间）
/spaces/[id]                # 空间时间线主页
/spaces/[id]/calendar       # 日历视图
/spaces/[id]/events/new     # 创建事件
/spaces/[id]/events/[eventId] # 事件详情
/invite/[code]              # 邀请链接页面
/settings                   # 用户设置
/settings/profile           # 个人资料
```

### 5.2 组件结构

```
components/
├── auth/
│   ├── LoginForm.tsx       # 登录表单
│   ├── RegisterForm.tsx    # 注册表单
│   └── OAuthButtons.tsx    # 第三方登录按钮
├── timeline/
│   ├── TimelineView.tsx    # 时间线主视图
│   ├── EventCard.tsx       # 事件卡片
│   └── DateSelector.tsx    # 日期选择器
├── event/
│   ├── EventEditor.tsx     # 事件编辑器
│   ├── ImageUpload.tsx     # 图片上传组件
│   └── ImageGallery.tsx    # 图片画廊
└── space/
    ├── SpaceList.tsx       # 空间列表
    ├── InviteModal.tsx     # 邀请弹窗
    └── MemberList.tsx      # 成员列表
```

### 5.3 关键交互流程

**创建事件流程：**
1. 用户点击"+" 按钮
2. 选择日期（DatePicker）+ 时间点（TimePicker，可选）
3. 上传图片（拖拽或选择，最多9张）
   - 前端预览
   - 客户端压缩（可选）
   - 并发上传到后端
4. 填写标题和内容
5. 提交创建
6. 返回时间线，新事件卡片出现

**加入空间流程：**
1. 用户 A 在空间内点击"邀请"
2. 生成邀请码和链接
3. 分享给用户 B
4. 用户 B 点击链接，跳转到 `/invite/AB12CD34`
5. 页面显示空间信息，点击"加入"
6. 加入成功，跳转到空间时间线

---

## 6. 后端设计

### 6.1 项目目录结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go             # 程序入口
├── internal/
│   ├── api/                    # API 路由层
│   │   ├── auth/
│   │   │   └── handler.go
│   │   ├── space/
│   │   │   └── handler.go
│   │   ├── event/
│   │   │   └── handler.go
│   │   ├── upload/
│   │   │   └── handler.go
│   │   └── router.go           # 路由注册
│   ├── service/                # 业务逻辑层
│   │   ├── auth_service.go
│   │   ├── space_service.go
│   │   ├── event_service.go
│   │   └── upload_service.go
│   ├── repository/             # 数据访问层
│   │   ├── user_repo.go
│   │   ├── space_repo.go
│   │   ├── event_repo.go
│   │   └── image_repo.go
│   ├── model/                  # 数据模型
│   │   ├── user.go
│   │   ├── space.go
│   │   ├── event.go
│   │   └── image.go
│   ├── middleware/             # 中间件
│   │   ├── auth.go             # JWT 验证
│   │   ├── cors.go             # CORS 处理
│   │   └── logger.go           # 日志记录
│   ├── storage/                # 存储服务
│   │   ├── minio.go            # MinIO 客户端
│   │   └── storage.go          # 存储接口
│   └── pkg/                    # 工具包
│       ├── jwt/
│       ├── validator/
│       └── response/           # 统一响应格式
├── config/
│   └── config.go               # 配置管理
├── migrations/                 # 数据库迁移
│   └── 001_init.sql
├── docker-compose.yml
├── Dockerfile
├── go.mod
└── go.sum
```

### 6.2 核心 Go 依赖

```go
require (
    github.com/gin-gonic/gin v1.9.1              // Web 框架
    gorm.io/gorm v1.25.5                         // ORM
    gorm.io/driver/postgres v1.5.4               // PostgreSQL 驱动
    github.com/golang-jwt/jwt/v5 v5.2.0          // JWT
    github.com/minio/minio-go/v7 v7.0.63         // MinIO SDK
    github.com/redis/go-redis/v9 v9.3.0          // Redis
    github.com/google/uuid v1.5.0                // UUID 生成
    golang.org/x/crypto v0.17.0                  // bcrypt 密码加密
    github.com/joho/godotenv v1.5.1              // 环境变量
)
```

### 6.3 分层架构职责

| 层级 | 职责 | 示例 |
|------|------|------|
| **Handler** | 接收请求，参数验证，调用 Service | `CreateEvent(c *gin.Context)` |
| **Service** | 业务逻辑处理，事务管理，权限验证 | `CreateEventWithImages()` |
| **Repository** | 数据库操作，SQL 查询封装 | `FindEventsBySpaceID()` |
| **Model** | 数据结构定义，GORM 标签 | `type Event struct { ... }` |

---

## 7. 核心业务流程

### 7.1 用户注册与认证

**注册流程：**
```
1. 用户提交邮箱 + 用户名 + 密码
2. 验证邮箱格式、用户名唯一性、密码强度
3. bcrypt 加密密码（cost = 12）
4. 创建用户记录
5. 自动创建个人空间（type=personal）
6. 生成 JWT Token (access_token 2h + refresh_token 7d)
7. refresh_token 存入 Redis
8. 返回 token 和用户信息
```

**登录流程：**
```
1. 用户提交邮箱 + 密码
2. 查询用户记录
3. bcrypt 验证密码
4. 生成 JWT Token
5. refresh_token 存入 Redis (key: user:{user_id}:refresh)
6. 返回 token 和用户信息
```

**Token 刷新流程：**
```
1. 前端发送 refresh_token
2. 验证 refresh_token 有效性
3. 检查 Redis 中是否存在
4. 生成新的 access_token
5. 返回新 token
```

### 7.2 共享空间邀请

**生成邀请：**
```
1. 用户点击"邀请"按钮
2. 验证用户是否为空间 owner 或有权限
3. 生成 8位随机邀请码（字母数字混合）
4. 生成邀请链接: https://linetime.app/invite/{code}
5. 更新 spaces 表的 invite_code 和 invite_link
6. （可选）设置过期时间，存入 Redis
7. 返回邀请信息
```

**加入空间：**
```
1. 用户访问 /invite/{code}
2. 前端获取邀请码，调用 POST /spaces/join/{code}
3. 后端验证:
   - 邀请码是否存在
   - 是否已过期
   - 用户是否已在该空间
4. 创建 space_members 记录（role=member）
5. 清除相关缓存
6. 返回空间信息
7. 前端跳转到空间时间线
```

### 7.3 事件卡片创建

**创建流程：**
```
1. 用户选择日期和时间点
2. 上传图片:
   - 前端并发上传多张图片
   - 后端验证文件类型、大小
   - 生成 UUID 文件名
   - 上传原图到 MinIO: bucket/images/original/{uuid}.jpg
   - 生成缩略图（宽400px）: bucket/images/thumbnails/{uuid}.jpg
   - 返回图片 URL
3. 用户填写标题和内容
4. 提交事件数据
5. 后端开启事务:
   - 验证用户是否在该空间
   - 创建 events 记录
   - 批量创建 event_images 记录
   - 提交事务
6. 返回事件详情
7. 前端刷新时间线
```

**图片处理：**
```go
// 缩略图生成伪代码
func GenerateThumbnail(originalPath string) (thumbnailPath string, err error) {
    img, _ := imaging.Open(originalPath)
    thumbnail := imaging.Resize(img, 400, 0, imaging.Lanczos)
    thumbnailPath = "thumbnails/" + uuid.New().String() + ".jpg"
    imaging.Save(thumbnail, thumbnailPath)
    return
}
```

### 7.4 时间线查询优化

**查询策略：**
```sql
-- 按月查询（推荐）
SELECT e.*, u.username, u.avatar_url,
       json_agg(
         json_build_object(
           'id', ei.id,
           'image_url', ei.image_url,
           'thumbnail_url', ei.thumbnail_url,
           'sort_order', ei.sort_order
         ) ORDER BY ei.sort_order
       ) as images
FROM events e
JOIN users u ON e.user_id = u.id
LEFT JOIN event_images ei ON e.id = ei.event_id
WHERE e.space_id = $1
  AND e.event_date >= $2  -- 月初
  AND e.event_date < $3   -- 月末
GROUP BY e.id, u.id
ORDER BY e.event_date DESC, e.event_time DESC
LIMIT 50;
```

**缓存策略：**
- 空间成员列表: `space:members:{space_id}` (TTL: 5分钟)
- 用户信息: `user:{user_id}` (TTL: 30分钟)
- 事件列表: 不缓存（实时性要求高）

---

## 8. 安全性设计

### 8.1 认证与授权

**JWT 配置：**
```
- Algorithm: HS256
- Access Token: 2小时过期
  Payload: { user_id, username, exp, iat }
- Refresh Token: 7天过期
  存储: Redis (key: user:{user_id}:refresh)
- Secret: 从环境变量读取（256 bit）
```

**权限验证：**
```
- 中间件验证 JWT 有效性
- Service 层验证资源所有权:
  例: 删除事件前检查 event.user_id == current_user_id
      或者 current_user 是空间 owner
```

### 8.2 文件上传安全

**验证规则：**
```
- 文件类型白名单: jpg, jpeg, png, gif, webp
- 文件大小: 单张 10MB，单次最多 9张
- MIME 类型验证（不仅检查扩展名）
- 文件名随机化（UUID）防止路径遍历
```

**MinIO 配置：**
```
- 私有 Bucket，需要预签名 URL 访问
- 预签名 URL 有效期: 1小时
- 生产环境配置防盗链
- 定期清理未关联的图片（孤儿文件）
```

### 8.3 API 安全

**中间件配置：**
```
- CORS: 限制允许的域名
- Rate Limiting:
  - 全局: 同一 IP 每分钟 60 请求
  - 敏感操作: 注册/登录 每分钟 5次
- SQL 注入防护: GORM 参数化查询
- XSS 防护: 前端使用 DOMPurify 清理用户输入
```

**密码策略：**
```
- 最小长度: 8位
- 包含字母和数字
- bcrypt cost: 12
- 禁止常见弱密码（可选）
```

---

## 9. 部署方案

### 9.1 开发环境（docker-compose.yml）

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: linetime
      POSTGRES_USER: linetime
      POSTGRES_PASSWORD: linetime_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      REDIS_HOST: redis
      MINIO_ENDPOINT: minio:9000
    depends_on:
      - postgres
      - redis
      - minio

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 9.2 环境变量配置（.env）

```bash
# Server
SERVER_PORT=8080
GIN_MODE=debug  # release in production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=linetime
DB_PASSWORD=your_password
DB_NAME=linetime

# Redis
REDIS_HOST=localhost:6379
REDIS_PASSWORD=

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=linetime
MINIO_USE_SSL=false

# JWT
JWT_SECRET=your-256-bit-secret-key-here
JWT_ACCESS_EXPIRE=2h
JWT_REFRESH_EXPIRE=168h

# Upload
MAX_FILE_SIZE=10485760  # 10MB
MAX_FILES_PER_UPLOAD=9

# OAuth (可选)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
WECHAT_APP_ID=
WECHAT_APP_SECRET=
```

### 9.3 生产部署

**方案一：单机部署（初期推荐）**
```
服务器: 2核4G (阿里云/腾讯云)
架构:
  - Docker + Docker Compose
  - Nginx 反向代理 + SSL
  - 定时备份数据库
成本: ¥100-200/月
```

**方案二：云服务组合（扩展性好）**
```
- 前端: Vercel (免费) 或 阿里云 OSS + CDN
- 后端: 阿里云 ECS (2核4G)
- 数据库: 阿里云 RDS PostgreSQL (基础版)
- Redis: 阿里云 Redis (256MB)
- 存储: 阿里云 OSS (按量付费)
成本: ¥200-400/月
```

**Nginx 配置示例：**
```nginx
server {
    listen 80;
    server_name api.linetime.app;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 9.4 CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t linetime-backend ./backend
      - name: Push to registry
        run: docker push registry.example.com/linetime-backend
      - name: Deploy to server
        run: ssh user@server 'docker-compose pull && docker-compose up -d'
```

### 9.5 监控与备份

**监控指标：**
```
- API 响应时间、错误率
- 数据库连接数、慢查询
- 服务器 CPU、内存、磁盘使用率
- MinIO 存储空间
```

**备份策略：**
```
- PostgreSQL: 每天凌晨 3点全量备份
- 备份保留: 最近 30天
- MinIO: 定期同步到云存储
- 自动化脚本: cron + pg_dump
```

---

## 10. 性能优化建议

### 10.1 数据库优化

```sql
-- 索引优化
CREATE INDEX idx_events_space_date ON events(space_id, event_date DESC);
CREATE INDEX idx_space_members_user ON space_members(user_id);

-- 定期维护
VACUUM ANALYZE events;
VACUUM ANALYZE event_images;

-- 连接池配置
MaxOpenConns: 100
MaxIdleConns: 10
ConnMaxLifetime: 1小时
```

### 10.2 缓存策略

```
Redis 缓存:
- 空间成员列表: 5分钟
- 用户信息: 30分钟
- 邀请码: 7天（带过期时间）

缓存更新策略:
- 成员加入/退出: 立即删除缓存
- 用户信息更新: 立即删除缓存
```

### 10.3 图片优化

```
- 前端上传前压缩（可选）
- 后端生成多种尺寸:
  - 原图: 最大 1920px
  - 缩略图: 400px
  - 列表缩略图: 200px (可选)
- CDN 分发静态资源
- 懒加载: 滚动到可视区域才加载
- WebP 格式支持（浏览器兼容时）
```

### 10.4 查询优化

```
- 分页加载: 游标分页代替偏移分页
- 批量查询: 减少 N+1 查询
- 聚合查询: 使用 JSON 聚合减少请求次数
- 慢查询日志: 记录超过 500ms 的查询
```

---

## 11. 开发路线图

### Phase 1: MVP（4-6周）

**Week 1-2: 后端基础**
- [x] 项目初始化（Go + Gin）
- [x] 数据库设计与迁移
- [x] 用户注册/登录 API
- [x] JWT 认证中间件
- [x] MinIO 集成

**Week 3-4: 核心功能**
- [x] 空间管理 API
- [x] 事件卡片 CRUD
- [x] 图片上传与处理
- [x] 邀请码机制

**Week 5-6: 前端开发**
- [x] Next.js 项目搭建
- [x] 认证页面
- [x] 时间线视图
- [x] 事件编辑器
- [x] 基础交互完成

### Phase 2: 完善功能（2-3周）

- [ ] 第三方登录（GitHub/微信）
- [ ] 日历视图
- [ ] 图片画廊与预览
- [ ] 响应式设计优化
- [ ] 错误处理完善

### Phase 3: 性能与体验（2周）

- [ ] Redis 缓存实现
- [ ] 查询性能优化
- [ ] 前端懒加载
- [ ] 图片 CDN 配置
- [ ] 单元测试与集成测试

### Phase 4: 上线准备（1-2周）

- [ ] 生产环境配置
- [ ] Docker 镜像优化
- [ ] CI/CD 流程
- [ ] 监控与日志
- [ ] 安全审计

### Phase 5: 扩展功能（按需）

- [ ] 评论与点赞
- [ ] 标签与搜索
- [ ] 数据导出
- [ ] 移动端 App（React Native）
- [ ] WebSocket 实时推送

---

## 12. 技术风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 图片存储成本超预期 | 高 | 前端压缩 + 定期清理孤儿文件 + 按需加载 |
| 并发上传性能瓶颈 | 中 | Go 协程并发处理 + MinIO 分布式部署 |
| 数据库查询变慢 | 高 | 索引优化 + Redis 缓存 + 分页加载 |
| 跨域与认证问题 | 中 | CORS 配置 + Token 刷新机制 |
| 第三方登录失败 | 低 | 降级到邮箱登录 + 错误提示 |

---

## 13. 附录

### 13.1 参考资料

- [Gin Web Framework](https://gin-gonic.com/)
- [GORM Documentation](https://gorm.io/)
- [MinIO Go SDK](https://min.io/docs/minio/linux/developers/go/minio-go.html)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)

### 13.2 团队约定

**代码规范：**
- Go: 遵循 Effective Go + golangci-lint
- TypeScript: ESLint + Prettier
- 提交信息: Conventional Commits

**分支策略：**
```
main        - 生产环境
develop     - 开发主分支
feature/*   - 功能分支
bugfix/*    - 修复分支
```

**代码审查：**
- 所有 PR 需至少 1 人 Review
- 自动化测试通过后才能合并

---

**文档更新日期**: 2025-12-09
**下次评审日期**: 实现 MVP 后
