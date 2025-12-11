# Implementation Plan

- [x] 1. Set up infrastructure and configuration




  - [ ] 1.1 Add email configuration to config
    - Add SMTP configuration fields to `config/config.go`


    - Add environment variables for SMTP host, port, username, password, from address
    - _Requirements: 1.1_




  - [ ] 1.2 Create Redis client wrapper for password reset
    - Create `internal/storage/redis.go` with connection setup
    - Implement basic get/set/delete operations with TTL support
    - _Requirements: 1.1, 1.2_



- [ ] 2. Implement core password reset service
  - [ ] 2.1 Create PasswordResetToken model and serialization
    - Define `PasswordResetToken` struct with Email, Code, Attempts, CreatedAt, ExpiresAt
    - Implement JSON serialization/deserialization methods

    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 2.2 Write property test for token serialization round trip
    - **Property 9: Token Serialization Round Trip**
    - **Validates: Requirements 5.3**
  - [x] 2.3 Implement verification code generator

    - Create secure 6-digit code generation using crypto/rand
    - _Requirements: 1.1, 3.4_
  - [ ]* 2.4 Write property test for verification code format
    - **Property 1: Verification Code Format**
    - **Validates: Requirements 1.1**
  - [x] 2.5 Implement password validation utility




    - Create `IsValidPassword` function checking length, letters, and numbers
    - _Requirements: 3.2_

  - [-]* 2.6 Write property test for password strength validation



    - **Property 5: Password Strength Validation**

    - **Validates: Requirements 3.2**
  - [ ] 2.7 Implement email masking utility
    - Create function to mask email addresses (e.g., "t***@example.com")
    - _Requirements: 4.1_
  - [x]* 2.8 Write property test for email masking

    - **Property 8: Email Masking**
    - **Validates: Requirements 4.1**

- [ ] 3. Implement email service
  - [ ] 3.1 Create email service interface and SMTP implementation
    - Define `EmailSender` interface
    - Implement `SMTPEmailService` with SendVerificationCode method
    - Create email template for verification code
    - _Requirements: 1.1_

- [x] 4. Implement password reset service

  - [ ] 4.1 Create PasswordResetService with dependencies
    - Initialize service with UserRepository, Redis client, EmailSender
    - _Requirements: 1.1, 1.2_
  - [ ] 4.2 Implement RequestPasswordReset method
    - Validate email exists and is not Google-only account
    - Generate verification code and store in Redis with 10-min TTL
    - Send email with verification code
    - Implement rate limiting (1 request per minute per email)
    - _Requirements: 1.1, 1.5, 4.1_
  - [ ] 4.3 Implement VerifyAndResetPassword method
    - Retrieve and validate verification code from Redis
    - Check expiration and attempt count
    - Update password hash in database

    - Delete verification code from Redis
    - _Requirements: 1.2, 1.3, 1.4, 3.3_
  - [x]* 4.4 Write property test for valid code acceptance




    - **Property 2: Valid Code Acceptance**
    - **Validates: Requirements 1.2**
  - [ ]* 4.5 Write property test for code invalidation after password change
    - **Property 7: Code Invalidation After Password Change**

    - **Validates: Requirements 3.3**
  - [ ] 4.6 Implement ChangePassword method
    - Verify current password matches stored hash
    - Validate new password strength
    - Update password hash

    - Handle Google-only users
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 4.7 Write property test for password update with correct current password
    - **Property 3: Password Update with Correct Current Password**
    - **Validates: Requirements 2.1**

  - [ ]* 4.8 Write property test for invalid password rejection
    - **Property 4: Invalid Password Rejection**
    - **Validates: Requirements 2.2, 2.3**
  - [ ]* 4.9 Write property test for bcrypt hash format
    - **Property 6: Bcrypt Hash Format**
    - **Validates: Requirements 3.1**

- [x] 5. Checkpoint - Ensure all backend tests pass




  - Ensure all tests pass, ask the user if questions arise.



- [ ] 6. Implement API handlers
  - [ ] 6.1 Create ForgotPassword handler
    - Add `POST /api/auth/forgot-password` endpoint
    - Validate request body


    - Call PasswordResetService.RequestPasswordReset
    - Return masked email in response
    - _Requirements: 1.1, 4.1_

  - [-] 6.2 Create ResetPassword handler



    - Add `POST /api/auth/reset-password` endpoint
    - Validate request body (email, code, new_password)
    - Call PasswordResetService.VerifyAndResetPassword
    - Return success response
    - _Requirements: 1.2, 1.3, 1.4, 4.2_
  - [ ] 6.3 Create ChangePassword handler
    - Add `POST /api/auth/change-password` endpoint (requires auth)
    - Validate request body
    - Call PasswordResetService.ChangePassword
    - Return success response
    - _Requirements: 2.1, 2.2, 2.3, 4.3_
  - [ ] 6.4 Register routes in router
    - Add new routes to `internal/api/router.go`
    - Apply auth middleware to change-password endpoint
    - _Requirements: 2.1_
  - [ ]* 6.5 Write unit tests for handlers
    - Test request validation
    - Test error responses
    - Test success responses
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 7. Implement frontend pages
  - [ ] 7.1 Extend auth API client
    - Add `forgotPassword`, `resetPassword`, `changePassword` functions to `lib/api/auth.ts`
    - _Requirements: 1.1, 1.2, 2.1_
  - [ ] 7.2 Create forgot password page
    - Create `app/forgot-password/page.tsx`
    - Implement email input form
    - Implement verification code input form
    - Implement new password form
    - Handle step transitions
    - _Requirements: 1.1, 1.2, 4.1, 4.2_
  - [ ] 7.3 Create change password page
    - Create `app/settings/change-password/page.tsx`
    - Implement current password, new password, confirm password form
    - Add validation and error handling
    - _Requirements: 2.1, 2.2, 2.3, 4.3_
  - [ ] 7.4 Add navigation links
    - Add "Forgot Password" link to login page
    - Add "Change Password" link to user settings/profile
    - _Requirements: 1.1, 2.1_

- [ ] 8. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
