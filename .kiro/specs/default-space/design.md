# Design Document: Default Space Feature

## Overview

本设计文档描述了 LineTime 系统的默认空间功能实现方案。该功能允许用户设置一个默认空间，登录后系统自动跳转到该空间的时间线视图，提升用户体验。

核心设计原则：
- 最小化数据库变更，在用户表添加一个字段存储默认空间 ID
- 前端在登录成功后检查默认空间设置并执行相应跳转
- 优雅处理边界情况（空间删除、用户被移除等）

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Login Page  │  │ Spaces List │  │ Space Detail Page   │  │
│  │ (redirect   │  │ (default    │  │ (set as default     │  │
│  │  logic)     │  │  indicator) │  │  action)            │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                    ┌─────▼─────┐                             │
│                    │ Auth Store│                             │
│                    │ (user +   │                             │
│                    │ default)  │                             │
│                    └─────┬─────┘                             │
└──────────────────────────┼───────────────────────────────────┘
                           │ REST API
┌──────────────────────────┼───────────────────────────────────┐
│                    Backend (Go/Gin)                          │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                    API Layer                           │  │
│  │  PUT /api/users/default-space     (set default)       │  │
│  │  DELETE /api/users/default-space  (clear default)     │  │
│  │  GET /api/auth/me                 (includes default)  │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                  Service Layer                         │  │
│  │  - Validate space membership before setting default   │  │
│  │  - Clear default when space deleted/user removed      │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                Repository Layer                        │  │
│  │  - User.DefaultSpaceID field                          │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │ users table │
                    │ +default_   │
                    │  space_id   │
                    └─────────────┘
```

## Components and Interfaces

### Backend API Endpoints

#### 1. Set Default Space
```
PUT /api/users/default-space
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "space_id": "uuid-string"
}

Response (200):
{
  "code": 200,
  "message": "success",
  "data": {
    "default_space_id": "uuid-string"
  }
}

Error Responses:
- 400: Invalid space_id format
- 403: User is not a member of the space
- 404: Space not found
```

#### 2. Clear Default Space
```
DELETE /api/users/default-space
Authorization: Bearer <token>

Response (200):
{
  "code": 200,
  "message": "success",
  "data": null
}
```

#### 3. Get Current User (Updated)
```
GET /api/auth/me
Authorization: Bearer <token>

Response (200):
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "avatar_url": "https://...",
    "default_space_id": "uuid-or-null"
  }
}
```

### Frontend Components

#### 1. useAuthStore (Updated)
```typescript
interface User {
  // ... existing fields
  default_space_id?: string | null;
}

interface AuthState {
  // ... existing fields
  setDefaultSpace: (spaceId: string) => Promise<void>;
  clearDefaultSpace: () => Promise<void>;
}
```

#### 2. Login Redirect Logic
```typescript
// In login page or auth callback
const handleLoginSuccess = async () => {
  await fetchUser();
  if (user.default_space_id) {
    router.push(`/spaces/${user.default_space_id}`);
  } else {
    router.push('/spaces');
  }
};
```

#### 3. Space List Default Indicator
- 在空间卡片上显示 "默认" 标签
- 提供 "设为默认" / "取消默认" 操作按钮

## Data Models

### Database Schema Changes

#### users 表新增字段

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| default_space_id | UUID | FK -> spaces(id), NULL | 用户的默认空间 ID |

```sql
-- Migration
ALTER TABLE users 
ADD COLUMN default_space_id UUID REFERENCES spaces(id) ON DELETE SET NULL;

CREATE INDEX idx_users_default_space ON users(default_space_id);
```

### Go Model Changes

```go
// model/user.go
type User struct {
    // ... existing fields
    DefaultSpaceID *uuid.UUID `gorm:"type:uuid;index" json:"default_space_id"`
}
```

### TypeScript Type Changes

```typescript
// types/index.ts
export interface User {
  // ... existing fields
  default_space_id?: string | null;
}

export interface SetDefaultSpaceRequest {
  space_id: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Setting default space stores exactly that space
*For any* user and *for any* space that the user is a member of, when the user sets that space as default, querying the user's default_space_id should return exactly that space's ID.
**Validates: Requirements 1.1, 1.4**

### Property 2: No default space redirects to spaces list
*For any* user with no default_space_id set (null), after successful login, the redirect target should be the spaces list page ("/spaces").
**Validates: Requirements 1.3, 2.2**

### Property 3: Default space redirects to that space
*For any* user with a valid default_space_id set, after successful login, the redirect target should be the default space's timeline page ("/spaces/{default_space_id}").
**Validates: Requirements 1.2**

### Property 4: Clearing default space removes the preference
*For any* user with a default space set, after clearing the default space, the user's default_space_id should be null.
**Validates: Requirements 2.1**

### Property 5: Default space indicator is shown correctly
*For any* space list containing the user's default space, the rendered output should contain a visual indicator (e.g., "默认" badge) only on the default space card.
**Validates: Requirements 3.1**

### Property 6: Losing access clears default space
*For any* user whose default space is deleted OR who is removed from their default space, the user's default_space_id should be automatically set to null.
**Validates: Requirements 4.1, 4.2**

## Error Handling

### Backend Error Scenarios

| 场景 | HTTP Status | Error Code | 处理方式 |
|------|-------------|------------|---------|
| 空间不存在 | 404 | SPACE_NOT_FOUND | 返回错误信息 |
| 用户不是空间成员 | 403 | NOT_SPACE_MEMBER | 返回错误信息 |
| 无效的 space_id 格式 | 400 | INVALID_SPACE_ID | 返回错误信息 |
| 默认空间被删除 | - | - | 自动清除 default_space_id (ON DELETE SET NULL) |

### Frontend Error Handling

```typescript
// 登录后检查默认空间是否可访问
const handleLoginRedirect = async () => {
  if (user.default_space_id) {
    try {
      // 尝试获取空间信息验证可访问性
      await spaceApi.getSpace(user.default_space_id);
      router.push(`/spaces/${user.default_space_id}`);
    } catch (error) {
      // 空间不可访问，清除默认设置并跳转到空间列表
      await clearDefaultSpace();
      router.push('/spaces');
    }
  } else {
    router.push('/spaces');
  }
};
```

## Testing Strategy

### Property-Based Testing

使用 Go 的 `testing/quick` 或 `gopter` 库进行属性测试，TypeScript 使用 `fast-check` 库。

#### Backend Property Tests (Go)
- 使用 `gopter` 库
- 每个属性测试运行至少 100 次迭代
- 测试标注格式: `// **Feature: default-space, Property {number}: {property_text}**`

#### Frontend Property Tests (TypeScript)
- 使用 `fast-check` 库
- 每个属性测试运行至少 100 次迭代
- 测试标注格式: `// **Feature: default-space, Property {number}: {property_text}**`

### Unit Tests

#### Backend Unit Tests
- `SetDefaultSpace` 服务方法的正常流程
- `ClearDefaultSpace` 服务方法的正常流程
- 权限验证（非成员不能设置默认空间）

#### Frontend Unit Tests
- 登录重定向逻辑
- 默认空间指示器渲染
- 设置/清除默认空间 API 调用

### Integration Tests
- 完整的设置默认空间流程
- 登录后重定向流程
- 空间删除后默认设置自动清除

