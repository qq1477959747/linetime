# Implementation Plan

- [x] 1. Backend: 配置和数据模型





  - [x] 1.1 添加 Google OAuth 配置到 config


    - 在 `config/config.go` 中添加 `GoogleOAuthConfig` 结构体
    - 添加环境变量读取: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
    - _Requirements: 3.1_

  - [x] 1.2 更新 User 模型添加 Google 相关字段

    - 添加 `GoogleID` 和 `AuthProvider` 字段到 `model/user.go`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.3 创建数据库迁移脚本

    - 创建 `migrations/002_add_google_auth.sql`
    - 添加 `google_id` 和 `auth_provider` 列
    - _Requirements: 2.1_

- [x] 2. Backend: Google OAuth 服务实现



  - [x] 2.1 创建 Google OAuth 服务


    - 创建 `internal/service/google_oauth_service.go`
    - 实现 `VerifyIDToken` 方法验证 Google ID Token
    - 使用 Google 的公钥验证 JWT 签名
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 2.2 编写 ID Token 验证属性测试


    - **Property 4: ID Token Validation**
    - **Validates: Requirements 3.2, 3.3, 3.4**

  - [x] 2.3 更新 User Repository 添加 Google 相关查询

    - 添加 `FindByGoogleID` 方法
    - 添加 `UpdateGoogleID` 方法
    - _Requirements: 1.3_

- [x] 3. Backend: Auth Service 扩展



  - [x] 3.1 实现 GoogleLogin 方法


    - 在 `auth_service.go` 中添加 `GoogleLogin` 方法
    - 实现用户查找/创建逻辑
    - 实现用户名生成和冲突处理
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_
  - [x] 3.2 编写现有用户 Google 登录属性测试


    - **Property 1: Existing User Google Login Authentication**
    - **Validates: Requirements 1.3, 1.5**
  - [x] 3.3 编写新用户账户创建属性测试

    - **Property 2: New User Account Creation from Google Profile**
    - **Validates: Requirements 1.4, 2.1, 2.2, 2.3**
  - [x] 3.4 编写用户名冲突处理属性测试


    - **Property 3: Username Uniqueness on Conflict**
    - **Validates: Requirements 2.4**

- [x] 4. Backend: API Handler






  - [x] 4.1 添加 Google 登录 API 端点

    - 在 `auth/handler.go` 中添加 `GoogleLogin` handler
    - 在 `router.go` 中注册 `/api/auth/google` 路由
    - _Requirements: 1.2, 1.6_

- [x] 5. Checkpoint - 确保后端测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend: Google Sign-In 集成






  - [x] 6.1 添加 Google Identity Services 脚本

    - 在 `app/layout.tsx` 中添加 Google GIS 脚本
    - 添加 TypeScript 类型声明
    - _Requirements: 1.1_

  - [x] 6.2 更新 Auth API 添加 Google 登录方法

    - 在 `lib/api/auth.ts` 中添加 `googleLogin` 方法
    - 添加 `GoogleLoginRequest` 类型
    - _Requirements: 1.2, 1.5_

  - [x] 6.3 更新登录页面实现 Google 登录

    - 修改 `app/login/page.tsx` 中的 `handleGoogleSignIn`
    - 初始化 Google Sign-In 按钮
    - 处理登录回调和错误
    - _Requirements: 1.1, 1.6, 4.1, 4.2, 4.3, 4.4_

  - [x] 6.4 更新注册页面添加 Google 登录选项

    - 修改 `app/register/page.tsx` 添加 Google 登录按钮
    - _Requirements: 1.1_

- [x] 7. 环境配置






  - [x] 7.1 更新环境变量配置文件

    - 更新 `backend/.env.example` 添加 Google OAuth 配置
    - 更新 `frontend/.env.example` 添加 Google Client ID
    - _Requirements: 3.1_

- [x] 8. Final Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

