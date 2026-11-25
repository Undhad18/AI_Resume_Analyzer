# Module 3 – Lesson 3.3: User Profile & Dashboard Data Integration

## 1. Executive Summary

This document specifies the technical architecture, security enforcement, API implementation, and frontend integration for **Module 3 – Lesson 3.3: User Profile & Dashboard Data Integration** of the **AI Resume Analyzer** platform.

In this lesson, authenticated user profile viewing and live editing were implemented. The user's identity is resolved on the backend exclusively from cryptographically verified JWT session claims (`req.user.id`). Safe profile fields are returned, avoiding password and internal sensitive data leaks. Editing allows updating the user's full name and email with duplicate email collision prevention, database unique constraint adherence, and immediate context synchronization across `AuthContext`, `TopNavbar`, and `Sidebar`.

---

## 2. Database Schema & Columns Utilized

The profile module interfaces with the existing MySQL `users` table:

```sql
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `account_status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
);
```

### Column Scoping & Protection:
- **`user_id`**: Primary identifier, strictly derived from authenticated JWT session (`req.user.id`).
- **`name`**: Editable via `PUT /api/users/profile` (sanitized, trimmed).
- **`email`**: Editable via `PUT /api/users/profile` (normalized lowercase, validated against duplicates).
- **`account_status`**: Read-only display in profile view; cannot be changed via profile endpoints.
- **`role_id`**: Strictly immutable through profile endpoints (prevents privilege escalation).
- **`password_hash`**: Strictly omitted from all API responses and queries.
- **`created_at` / `updated_at`**: Timestamps surfaced for account metadata.

---

## 3. Backend API Endpoints

### 3.1 Retrieve Current User Profile
- **Route**: `GET /api/users/profile`
- **Access**: Private (requires valid `token` cookie or Bearer header via `authenticateToken`).
- **Handler**: `getProfile` in [backend/controllers/userController.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/controllers/userController.js)
- **Service**: `getUserProfile(userId)` in [backend/services/userService.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/services/userService.js)
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Alice Developer",
    "email": "alice@example.com",
    "profileImage": null,
    "emailVerified": false,
    "accountStatus": "active",
    "createdAt": "2026-11-25T07:00:00.000Z",
    "updatedAt": "2026-11-25T07:05:00.000Z"
  }
}
```

### 3.2 Update User Profile
- **Route**: `PUT /api/users/profile`
- **Access**: Private (requires valid session cookie and CSRF validation).
- **Validation**: Zod schema in [backend/validators/userValidator.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/validators/userValidator.js):
  - `fullName`: string, required, trimmed, min 2, max 150.
  - `email`: string, required, trimmed, valid email format, max 191, transformed to lowercase.
- **Duplicate Prevention**:
  - Checks if another user already owns the target email (`WHERE email = ? AND user_id != ?`).
  - Returns HTTP 409 Conflict if taken:
    ```json
    {
      "success": false,
      "message": "This email is already in use by another account",
      "errors": null
    }
    ```
  - Preserves the user's ability to submit and keep their current email address without collision.
- **Session Refresh**:
  - Re-issues the `token` `HttpOnly` cookie with refreshed identity claims (`email`, `fullName`) so ongoing sessions immediately reflect the updated credentials.
- **Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "fullName": "Alice Senior Architect",
    "email": "alice.arch@example.com",
    "accountStatus": "active",
    "createdAt": "2026-11-25T07:00:00.000Z",
    "updatedAt": "2026-11-25T07:10:00.000Z"
  }
}
```

---

## 4. Frontend Integration & Reactive State Architecture

1. **Profile Service ([frontend/src/services/profileService.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/services/profileService.js))**:
   - Encapsulates `getProfile()` and `updateProfile(profileData)` calls using the configured `api.js` Axios instance.
   - Preserves `withCredentials: true` and automatically includes CSRF tokens from cookies.

2. **AuthContext Reactive Updates ([frontend/src/context/AuthContext.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/context/AuthContext.jsx))**:
   - Added `updateUser(updatedData)` callback.
   - When a profile edit is completed, `updateUser({ fullName, email })` is called, updating the root `user` state without terminating the session or triggering a full-page reload.

3. **Navbar & Sidebar Integration**:
   - `TopNavbar.jsx` computes avatar initials from `user.fullName` (or `user.email`).
   - Displays real full name and email in the user dropdown and on desktop screens.
   - Immediately reflects updated full names, emails, and initials when modified.
   - "My Profile" navigation item opens `/profile`.

4. **Profile View & Edit Components**:
   - `Profile.jsx`: Coordinates view mode, edit mode, loading skeleton, error recovery, and success alerts.
   - `ProfileDetails.jsx`: Presentation card showing avatar initials, full name, email, account status pill, and member since date.
   - `EditProfileForm.jsx`: Controlled form with instant client validation, saving state indicator (`Loader2`), cancel button, and server error presentation.
   - `AppRoutes.jsx`: Connected route `/profile` to `<Profile />` inside `<ProtectedRoute>` and `<MainLayout>`.

---

## 5. Security & Ownership Verification

- **Strict Identity Scoping**: No `userId` parameter is accepted from the client. All database operations strictly use `req.user.id`.
- **Privilege Escalation Prevention**: Incoming payloads attempting to inject `roleId`, `role_id`, `password`, or `account_status` are filtered out by Zod schema validation; queries only mutate `name` and `email`.
- **Password Protection**: Passwords and `password_hash` are excluded from all query outputs and responses.
- **CSRF Defense**: State-changing `PUT /api/users/profile` requests enforce double-submit CSRF verification.
- **Multi-Tenant Isolation**: Verified through automated tests that User A cannot read or mutate User B's profile.

---

## 6. Testing & Quality Assurance

### Automated Test Suite Execution:
Command: `npm --prefix backend test`
```
Registration Suite:           12 Passed, 0 Failed
Login Suite:                  11 Passed, 0 Failed
Protected Routes Suite:       14 Passed, 0 Failed
Frontend Auth Suite:          14 Passed, 0 Failed
Dashboard Summary Suite:       6 Passed, 0 Failed
User Profile Suite:           12 Passed, 0 Failed
-------------------------------------------------
TOTAL:                        69 Passed, 0 Failed (100% Pass Rate)
```

### User Profile Test Scenarios ([backend/tests/userProfile.test.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/tests/userProfile.test.js)):
1. `GET /api/users/profile` unauthenticated returns HTTP 401.
2. Authenticated user retrieves their profile (HTTP 200).
3. Password and `password_hash` are completely absent from API responses.
4. User updates their full name successfully (HTTP 200).
5. User updates their email address successfully (HTTP 200).
6. Keeping existing email unchanged causes no duplicate error (HTTP 200).
7. Duplicate email collision with another user returns HTTP 409 Conflict.
8. Invalid email format is rejected with HTTP 400 Validation Error.
9. Empty full name is rejected with HTTP 400 Validation Error.
10. Role, password, and account status fields cannot be modified via profile update.
11. Multi-tenant isolation verified: User A's updates never mutate User B's profile.
12. Profile update returns refreshed session cookie with new token claims.

### Frontend Production Build:
- **Command**: `npm --prefix frontend run build`
- **Output**: 2,223 modules transformed in 1.26s with **0 errors and 0 warnings**.

---

## 7. Remaining Issues

None. All constraints and criteria for Lesson 3.3 have been satisfied.
