# Implementation Plan

## 1. Database and Model Changes

- [x] 1.1 Create database migration for default_space_id field
  - Add `default_space_id` UUID column to users table
  - Add foreign key constraint to spaces table with ON DELETE SET NULL
  - Create index on default_space_id
  - _Requirements: 1.1, 4.1_

- [x] 1.2 Update Go User model
  - Add `DefaultSpaceID *uuid.UUID` field to User struct in `backend/internal/model/user.go`
  - Update JSON tags for API response
  - _Requirements: 1.1_

- [x] 1.3 Update TypeScript User type
  - Add `default_space_id?: string | null` to User interface in `frontend/types/index.ts`
  - Add `SetDefaultSpaceRequest` interface
  - _Requirements: 1.1_

## 2. Backend API Implementation

- [x] 2.1 Implement user repository methods
  - Add `UpdateDefaultSpace(userID, spaceID uuid.UUID) error` method to `backend/internal/repository/user_repo.go`
  - Add `ClearDefaultSpace(userID uuid.UUID) error` method
  - _Requirements: 1.1, 2.1_

- [ ]* 2.2 Write property test for default space storage
  - **Property 1: Setting default space stores exactly that space**
  - **Validates: Requirements 1.1, 1.4**

- [x] 2.3 Implement user service methods
  - Create `backend/internal/service/user_service.go` with `SetDefaultSpace(userID, spaceID uuid.UUID) error` method
  - Add membership validation using space repository
  - Add `ClearDefaultSpace(userID uuid.UUID) error` method
  - _Requirements: 1.1, 2.1_

- [ ]* 2.4 Write property test for clearing default space
  - **Property 4: Clearing default space removes the preference**
  - **Validates: Requirements 2.1**

- [x] 2.5 Implement API handlers
  - Create `backend/internal/api/user/handler.go` with user-related handlers
  - Add `PUT /api/users/default-space` handler for setting default space
  - Add `DELETE /api/users/default-space` handler for clearing default space
  - Update `backend/internal/api/router.go` to register new endpoints
  - _Requirements: 1.1, 2.1_

- [ ]* 2.6 Write unit tests for backend API
  - Test SetDefaultSpace handler with valid/invalid inputs
  - Test ClearDefaultSpace handler
  - Test membership validation
  - _Requirements: 1.1, 2.1_

## 3. Checkpoint - Backend Tests

- [x] 3. Ensure all tests pass, ask the user if questions arise.

## 4. Frontend API and Store Updates

- [x] 4.1 Add frontend API methods
  - Create `frontend/lib/api/user.ts` with user API methods
  - Add `setDefaultSpace(spaceId: string)` function
  - Add `clearDefaultSpace()` function
  - Update `frontend/lib/api/index.ts` to export user API
  - _Requirements: 1.1, 2.1_

- [x] 4.2 Update useAuthStore
  - Add `setDefaultSpace` action to `frontend/stores/useAuthStore.ts`
  - Add `clearDefaultSpace` action
  - Update user state to include default_space_id
  - _Requirements: 1.1, 2.1_

## 5. Login Redirect Logic

- [x] 5.1 Implement login redirect logic
  - Update `frontend/app/login/page.tsx` to check default_space_id after successful login
  - Redirect to default space if set, otherwise to spaces list
  - Handle error case when default space is inaccessible (clear default and redirect to spaces list)
  - _Requirements: 1.2, 1.3, 4.3_

- [ ]* 5.2 Write property test for redirect logic
  - **Property 2: No default space redirects to spaces list**
  - **Property 3: Default space redirects to that space**
  - **Validates: Requirements 1.2, 1.3, 2.2**

## 6. Space List UI Updates

- [x] 6.1 Add default space indicator and actions to space list
  - Update `frontend/app/spaces/page.tsx` to display "默认" badge on the default space card
  - Add "设为默认" / "取消默认" action buttons to space cards
  - Wire up buttons to call setDefaultSpace/clearDefaultSpace actions
  - _Requirements: 3.1_

- [ ]* 6.2 Write property test for default indicator
  - **Property 5: Default space indicator is shown correctly**
  - **Validates: Requirements 3.1**

## 7. Edge Case Handling

- [x] 7.1 Implement space deletion cleanup
  - Verify ON DELETE SET NULL works correctly via database constraint
  - Test that default_space_id is cleared when space is deleted
  - _Requirements: 4.1_

- [x] 7.2 Implement member removal cleanup
  - Update `backend/internal/service/space_service.go` RemoveMember to clear default_space_id when user is removed from their default space
  - Add logic to check if removed space is user's default and clear it
  - _Requirements: 4.2_

- [ ]* 7.3 Write property test for access loss cleanup
  - **Property 6: Losing access clears default space**
  - **Validates: Requirements 4.1, 4.2**

## 8. Final Checkpoint

- [x] 8. Ensure all tests pass, ask the user if questions arise.
