# Module 2: Authentication & User Management
## Lesson 2.5: Frontend Authentication Integration Documentation

---

### Overview

Module 2 Lesson 2.5 connects the React.js + Vite frontend with the Express.js + MySQL authentication backend. It replaces static placeholders with interactive, secure, and resilient user flows:
- Authenticated user state management via `AuthContext`.
- Automatic session restoration on initial page load and browser refresh via `GET /api/auth/me`.
- Client-side and server-side form validation on Register and Login.
- User-friendly error messaging, loading indicators, and responsive UI.
- Secure HTTP-only cookie session handling with Axios (`withCredentials: true`).
- CSRF double-submit token and header propagation.
- Protected client-side routing with deep link preservation (`location.state.from`).
- Seamless server-coordinated logout clearing both server cookies and client context.

---

### Files Created or Modified

#### Created
1. `frontend/src/services/authService.js`: Encapsulates authentication API calls (`registerApi`, `loginApi`, `getMeApi`, `logoutApi`).
2. `frontend/src/pages/auth/Register.jsx`: Interactive registration page with full client-side validation, backend error banners, loading indicators, and redirect to sign-in.
3. `backend/tests/frontendAuthIntegration.test.js`: Comprehensive 14-scenario integration test suite simulating Axios client requests, cookie lifecycle, session recovery, and route access boundaries.
4. `docs/module-2-frontend-auth-integration.md`: Complete documentation of the frontend authentication integration.

#### Modified
1. `frontend/src/services/api.js`: Added automatic CSRF header extraction (`X-Requested-With`, `X-CSRF-Token` from non-HttpOnly cookie) and standardized error formatting.
2. `frontend/src/context/AuthContext.jsx`: Upgraded from in-memory dummy state to live asynchronous state management: `checkAuth`, `login`, `register`, `logout`, session restoration, and loading lifecycle.
3. `frontend/src/pages/auth/Login.jsx`: Transformed from disabled placeholder to functional, responsive login form with inline validation, error banners, loading spinners, and redirection preservation.
4. `frontend/src/routes/ProtectedRoute.jsx`: Enhanced with a polished Tailwind loading spinner while `loading === true` and state preservation (`state={{ from: location }}`) during login redirect.
5. `frontend/src/routes/AppRoutes.jsx`: Added `/register` public route and prepared protected route hierarchy for dashboard, resumes, analysis, history, profile, and settings.
6. `frontend/src/layouts/MainLayout.jsx`: Added personalized user greeting in header (`Welcome, {user.fullName}`) and integrated asynchronous logout handling with clean redirect to `/login`.
7. `frontend/src/pages/dashboard/Dashboard.jsx`: Connected personalized greeting (`Welcome back, {user.fullName}`) via `useAuth()`.
8. `backend/package.json`: Updated `npm test` script to run all 4 test suites.

---

### Authentication Flow & Lifecycle

```
[ Unauthenticated User ]
        │
        ├──► Navigates to /register
        │         │
        │         ▼ (validates fullName, email, password, confirmPassword)
        │    Submits POST /api/auth/register
        │         │
        │         ▼ (success 201)
        │    Shows success alert ──► Redirects to /login
        │
        └──► Navigates to /login
                  │
                  ▼ (validates email & password)
             Submits POST /api/auth/login
                  │
                  ▼ (success 200)
             Backend sets HttpOnly "token" cookie + readable "csrfToken" cookie
             AuthContext updates `user` state & sets `isAuthenticated = true`
                  │
                  ▼
             Redirects to originally requested page (e.g., /dashboard)
```

---

### Session Restoration Lifecycle (Browser Refresh)

```
[ User Refreshes Browser ]
        │
        ▼
AuthProvider mounts with `loading = true`
        │
        ▼
`checkAuth()` issues GET /api/auth/me (withCredentials: true)
        │
        ├─► Valid Cookie:
        │        Server responds with HTTP 200 + user profile
        │        setUser(data.user)
        │        loading -> false (Protected page renders)
        │
        └─► Expired / Missing Cookie:
                 Server responds with HTTP 401
                 setUser(null)
                 loading -> false (ProtectedRoute redirects to /login)
```

---

### API Integration & Axios Configuration

- **Base URL**: `import.meta.env.VITE_API_BASE_URL` (`http://localhost:5000/api`).
- **Credentials**: `withCredentials: true` ensures the browser includes the `token` cookie on all cross-origin requests to the backend.
- **CSRF Defense**:
  - Request interceptor attaches `X-Requested-With: "XMLHttpRequest"`.
  - Automatically parses the readable `csrfToken` cookie and attaches `X-CSRF-Token` header.
- **Zero LocalStorage**: The JWT is never read or stored in `localStorage` or `sessionStorage`, mitigating XSS exfiltration risks.

---

### AuthContext API Reference

The `useAuth()` hook exposes:

| Property / Method | Type | Description |
| :--- | :--- | :--- |
| `user` | `object \| null` | Authenticated user profile `{ id, fullName, email }`. |
| `isAuthenticated` | `boolean` | `true` when user object is populated. |
| `loading` | `boolean` | `true` while `checkAuth()` is in progress. |
| `login(credentials)` | `async function` | Authenticates with email and password, updates `user`. |
| `register(userData)` | `async function` | Registers account with full name, email, password, confirm password. |
| `logout()` | `async function` | Calls server logout, clears cookies, resets `user` to `null`. |
| `checkAuth()` | `async function` | Re-verifies session against `/api/auth/me`. |

---

### Protected Route Behavior

- Guards all private application views (`/dashboard`, `/resumes`, `/resume-analysis`, `/history`, `/profile`, `/settings`).
- Prevents protected content flash by rendering a centered animated Tailwind loading spinner until `loading === false`.
- If `!isAuthenticated`, redirects to `/login` with `state: { from: location }`, allowing the login page to redirect the user back to their intended destination upon successful login.

---

### Logout Behavior

1. User clicks **Logout** in `MainLayout` sidebar.
2. `handleLogout` calls `logout()` from `AuthContext`.
3. `AuthContext` calls `POST /api/auth/logout` via `logoutApi()`.
4. Backend server clears `token` and `csrfToken` cookies with matching options (`Path=/`, `Max-Age=0`).
5. `AuthContext` sets `user` to `null`.
6. Client navigates to `/login` with `{ replace: true }`.
7. Subsequent private API requests fail with `401 Unauthorized`.

---

### Test Scenarios & Actual Results

All 14 integration test scenarios executed against the Express server and live MySQL database via `node tests/frontendAuthIntegration.test.js`:

| Scenario | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **1. Valid Registration** | HTTP 201 with sanitized user payload | 201 Created | **PASS** |
| **2. Invalid Registration** | HTTP 400 with field validation errors | 400 Bad Request | **PASS** |
| **3. Duplicate Email** | HTTP 409 Conflict with error message | 409 Conflict | **PASS** |
| **4. Valid Login** | HTTP 200 with HttpOnly session cookie | 200 OK + cookie | **PASS** |
| **5. Wrong Credentials** | HTTP 401 with generic invalid credentials | 401 Unauthorized | **PASS** |
| **6. Context User State** | Verified user payload contains id, name, email | Payload verified | **PASS** |
| **7. Session Restoration** | GET `/api/auth/me` returns 200 via session cookie | 200 OK | **PASS** |
| **8. Expired Session** | GET `/api/auth/me` returns 401 on expired token | 401 Unauthorized | **PASS** |
| **9. Unauthenticated Access** | Private endpoint returns 401 without cookie | 401 Unauthorized | **PASS** |
| **10. Authenticated Access** | Private endpoint returns 200 with cookie | 200 OK | **PASS** |
| **11. Logout Execution** | POST `/api/auth/logout` clears session cookie | Cookie cleared | **PASS** |
| **12. Post-Logout Access** | Subsequent private request returns 401 | 401 Unauthorized | **PASS** |
| **13. CORS Preflight** | OPTIONS request returns 204/200 | 204 No Content | **PASS** |
| **14. Health Check Regression**| GET `/api/health` returns 200 Connected | 200 OK | **PASS** |

**Test Summary**: 14 Passed, 0 Failed.
**Full Test Suite** (`npm test`): 51 Passed, 0 Failed across Registration, Login, Protected Routes, and Frontend Auth Integration.

---

### Build & Verification

- **Frontend Production Build**: `npm run build` ran cleanly via Vite v8.3.8 in 556ms with zero compilation errors.
- **Backend Startup**: Node.js v24 + Express 5 connected to MySQL cleanly on port 5000.
