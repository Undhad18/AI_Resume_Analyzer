# Module 2: Authentication & User Management
## Lesson 2.4: JWT Authentication & Protected Routes Documentation

---

### Overview

Lesson 2.4 establishes the core authentication perimeter and access control boundary for the **AI Resume Analyzer**. It enforces stateless JWT verification via `HttpOnly` cookies, verifies token claims against MySQL identity records, enforces strict user data ownership scoping to prevent Insecure Direct Object References (IDOR), and provides CSRF and CORS protections across all protected application endpoints.

---

### JWT Architecture & Token Configuration

```
[ Client Request ]
       │
       ▼
[ cookieParser Middleware ]  ──► populates req.cookies
       │
       ▼
[ csrfProtection Middleware ] ──► validates Origin / CSRF token on state-changing requests
       │
       ▼
[ authenticateToken Middleware ]
       │
       ├─► 1. Read token from cookie (req.cookies.token) or header (Bearer <token>)
       ├─► 2. Cryptographically verify signature with env.JWT_SECRET (HS256 only)
       ├─► 3. Validate issuer (iss: env.JWT_ISSUER) & audience (aud: env.JWT_AUDIENCE)
       ├─► 4. Validate subject claim (sub: user_id)
       ├─► 5. Verify identity in MySQL (SELECT user_id, role_id, account_status FROM users)
       ├─► 6. Enforce account status (rejects suspended or inactive accounts with HTTP 403)
       └─► 7. Attach verified identity to req.user: { id, fullName, email, roleId, accountStatus }
       │
       ▼
[ Protected Controller / Resource Handler ]
       └─► Executes business logic strictly scoped to req.user.id
```

#### Token Configuration (`backend/config/env.js`)

| Variable | Requirement | Default | Description |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | Required, min 32 chars | (Environment) | HMAC SHA-256 signing secret. Never exposed to clients. |
| `JWT_ACCESS_EXPIRES_IN` | Optional | `"15m"` | Short-lived access token lifetime (15 minutes). |
| `JWT_ISSUER` | Optional | `"ai-resume-analyzer"` | Verified during token verification (`iss` claim). |
| `JWT_AUDIENCE` | Optional | `"ai-resume-analyzer-api"` | Intended target audience (`aud` claim). |

#### Token Payload Constraints
- `sub`: Authenticated user ID (string representation of `users.user_id`).
- `iss`: `"ai-resume-analyzer"`.
- `aud`: `"ai-resume-analyzer-api"`.
- `iat`: Issued timestamp.
- `exp`: Expiration timestamp (15 minutes from issuance).
- Sensitive details (`password`, `password_hash`, API keys, personal contents) are strictly excluded.

---

### Cookie Configuration

Tokens are transported exclusively via secure cookies:

```javascript
{
  httpOnly: true,                               // Inaccessible to browser JavaScript (mitigates XSS)
  secure: process.env.NODE_ENV === "production", // Transmitted only via HTTPS in production
  sameSite: "lax",                              // Mitigates CSRF on top-level navigation
  maxAge: 15 * 60 * 1000,                       // 15 minutes (synchronous with access token lifetime)
  path: "/"
}
```

---

### Authentication Middleware (`backend/middleware/authMiddleware.js`)

The `authenticateToken` middleware acts as the server-side gatekeeper:

1. **Extraction**: Reads `req.cookies.token` (primary) or falls back to `req.headers.authorization` (`Bearer <token>`).
2. **Missing Token**: Immediately terminates with `401 Unauthorized` (`"Authentication required"`).
3. **Cryptographic Validation**: Uses `verifyToken(token)` enforcing:
   - Algorithm whitelist: `["HS256"]`
   - Issuer check: `env.JWT_ISSUER`
   - Audience check: `env.JWT_AUDIENCE`
   - Expiration validation.
4. **Database Verification**: Validates that `sub` maps to a valid record in the `users` table.
5. **Account Status Enforcement**: Rejects accounts where `account_status !== 'active'` with `403 Forbidden` (`"Your account has been suspended. Please contact support."`).
6. **Context Binding**: Populates `req.user` with `{ id, userId, fullName, email, roleId, accountStatus }`.

---

### Protected Endpoints

#### 1. Identity Verification (`GET /api/auth/me`)
- **Route**: `GET /api/auth/me`
- **Protection**: `authenticateToken`
- **Unauthenticated**: `401 Unauthorized`
- **Authenticated Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "fullName": "Sarah Connor",
      "email": "sarah.connor@example.com"
    }
  }
  ```

#### 2. Logout (`POST /api/auth/logout`)
- **Route**: `POST /api/auth/logout`
- **Protection**: CSRF protected
- **Behavior**: Clears `token` and `csrfToken` cookies with matching options (`Path=/`, `Max-Age=0`).
- **Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### 3. Private Application APIs (`/api/resumes/:resumeId`)
- **Protection**: `authenticateToken`
- **Ownership Enforcement**: Strictly scoped to `req.user.id`.

---

### User Data Ownership (Anti-IDOR Architecture)

**The Server-Side Identity Truth Rule:**
No client-supplied `user_id` in request bodies, query strings, or URL parameters is ever trusted for authorization or data isolation.

**Query Scoping Pattern:**
```sql
SELECT *
FROM resumes
WHERE resume_id = ?
  AND user_id = ?
  AND deleted_at IS NULL
```
- If User A attempts to view, edit, or download User B's resource (`/api/resumes/:resumeBId`), the server detects the tenant mismatch and responds with `403 Forbidden` (`"Access denied: you do not own this resource"`) or `404 Not Found`.

---

### CSRF, CORS & Cookie Security

1. **CORS Configuration**:
   ```javascript
   cors({
     origin: env.CLIENT_URL, // Exact frontend origin, no wildcards
     credentials: true       // Allows cookies and auth headers
   })
   ```
2. **CSRF Protection Middleware (`backend/middleware/csrfMiddleware.js`)**:
   - Safe read-only methods (`GET`, `HEAD`, `OPTIONS`) proceed unhindered.
   - Public auth endpoints (`/api/auth/login`, `/api/auth/register`) without existing sessions are exempt.
   - For state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) carrying a session cookie:
     - Verifies `req.headers.origin === env.CLIENT_URL`, OR
     - Verifies `X-CSRF-Token` header matches double-submit `csrfToken` cookie, OR
     - Verifies custom `X-Requested-With: XMLHttpRequest` header.
   - Cross-origin malicious requests are blocked with `403 Forbidden` (`"CSRF verification failed"`).

---

### Frontend Protected Route Integration

- [frontend/src/routes/ProtectedRoute.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/routes/ProtectedRoute.jsx):
  - Displays a clean Tailwind spinner while `loading === true`.
  - Redirects unauthenticated visitors to `/login` via `<Navigate to="/login" replace />`.
  - Renders child routes via `<Outlet />` once authenticated.
- [frontend/src/routes/AppRoutes.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/routes/AppRoutes.jsx):
  - Protected route tree prepared for:
    - `/dashboard`
    - `/resumes`
    - `/resume-analysis`
    - `/history` and `/analysis-history`
    - `/profile`
    - `/settings`

---

### Testing Instructions

Run the full automated test suite containing 37 total assertions:

```bash
cd backend
npm test
```

Or run the protected routes test suite independently:
```bash
cd backend
npm run test:protected
```

#### Automated Test Matrix
1. Request without auth cookie ➔ `401 Unauthorized`
2. Request with valid JWT cookie ➔ `200 OK`
3. Request with expired JWT ➔ `401 Unauthorized`
4. Request with invalid signature ➔ `401 Unauthorized`
5. Request with incorrect issuer or audience ➔ `401 Unauthorized`
6. Request with malformed token ➔ `401 Unauthorized`
7. Request from suspended account ➔ `403 Forbidden`
8. `GET /api/auth/me` with valid auth ➔ `200 OK` (safe profile)
9. `GET /api/auth/me` without auth ➔ `401 Unauthorized`
10. `POST /api/auth/logout` ➔ clears authentication cookie
11. User A accessing User B's resource ➔ `403 Access Denied` (IDOR defense)
12. Registration API regression ➔ `201 Created`
13. Login API regression ➔ `200 OK`
14. CSRF protection ➔ blocks untrusted origin (403), allows trusted origin (200)

---

### Known Limitations & Future Considerations

1. **Stateless JWT Revocation**:
   - Clearing the browser cookie during logout removes the token from the client. However, because JWTs are stateless, if a token was previously exfiltrated, it remains cryptographically valid until its 15-minute expiration window elapses.
   - Future modules can implement a token revocation blocklist in Redis for immediate global revocation.
2. **Access Token Lifetime**:
   - Access tokens expire every 15 minutes. In Module 2 Lesson 2.5 (or refresh token flow), a refresh token rotation pattern can be added to refresh the 15-minute access token transparently.
