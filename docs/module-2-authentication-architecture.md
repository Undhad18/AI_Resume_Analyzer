# Module 2: Authentication & User Management
## Lesson 2.1: User Registration & Login Architecture

---

### Executive Summary

This architecture document defines the authentication, session management, and authorization model for the **AI Resume Analyzer** application. Designed by a security-focused software architecture lens, this blueprint establishes a robust, hardened identity layer that integrates seamlessly with the existing Module 1 foundation while preparing the system for the implementation tasks in Lesson 2.2.

---

## 1. Existing Project Audit

An exhaustive audit of the existing codebase and live database was conducted to establish a baseline:

### 1.1 Directory Structure & Packages
- **Frontend** (`/frontend`):
  - Framework: React 19 + Vite 8
  - Styling: Tailwind CSS v4 (`@tailwindcss/vite`)
  - Icons: Lucide React (`lucide-react`)
  - HTTP Client: Axios (`axios` v1.21.1) configured with `withCredentials: true` in `src/services/api.js`
  - Routing: React Router v7 (`react-router-dom`)
  - Charts: Recharts v3
  - Status: Builds cleanly (`npm run build` succeeds).
- **Backend** (`/backend`):
  - Runtime: Node.js (ES modules: `"type": "module"`)
  - Framework: Express 5 (`express` v5.3.0)
  - Database Driver: `mysql2/promise` (connection pooling with keepAlive)
  - Security & Utilities: `bcrypt` (v6.0.0), `jsonwebtoken` (v9.0.3), `helmet` (v8.3.0), `cors` (v2.8.6), `zod` (v4.6.7), `morgan` (v1.12.1)
  - Added in Audit: `cookie-parser` (installed for HttpOnly cookie extraction)
  - Environment: Validated on startup via Zod in `config/env.js`
  - Status: Starts cleanly and connects to MySQL on port 5000.

### 1.2 Database Audit
- MySQL Database: `ai_resume_analyzer` running on port 3306.
- 13 Relational Tables verified:
  1. `roles` (RBAC system: `admin`, `user`)
  2. `users` (Core identity table)
  3. `resumes` (User resume metadata & extracted text)
  4. `resume_files` (Physical file storage metadata)
  5. `resume_versions` (Version control for resumes)
  6. `resume_analyses` (AI analysis runs)
  7. `resume_scores` (ATS, skills, grammar, and overall scores)
  8. `resume_suggestions` (Targeted AI feedback items)
  9. `generated_resumes` (AI-rewritten resumes)
  10. `job_descriptions` (Target job listings)
  11. `job_matches` (Resume-to-job match scores)
  12. `analysis_history` (Audit log of analysis lifecycle events)
  13. `activity_logs` (Security and user action audit trail)

### 1.3 Audit Findings & Gaps
| Component | Existing State in Codebase | Required State for Module 2 |
| :--- | :--- | :--- |
| `backend/models/userModel.js` | Empty file (0 bytes) | Database access methods for user queries and creation |
| `backend/controllers/authController.js` | Empty file (0 bytes) | Controllers for `/register`, `/login`, `/logout`, `/me` |
| `backend/routes/authRoutes.js` | Empty file (0 bytes) | Express routes mapped to controllers with validation |
| `backend/middleware/authMiddleware.js` | Implements `Bearer` header lookup only | Hybrid support: `req.cookies.token` + `Bearer` fallback |
| `backend/validators/authValidator.js` | Has `registerSchema`; missing `loginSchema` | Complete Zod schemas with email normalization |
| `backend/app.js` | Does not mount `authRoutes` or `cookieParser` | Mount `cookieParser()` and `/api/auth` routes |
| `frontend/src/context/AuthContext.jsx` | In-memory dummy state, no persistence/check | Integrate `/api/auth/me` on mount, live auth methods |
| `frontend/src/pages/auth/Login.jsx` | Static placeholder with disabled inputs | Interactive form with Zod/inline validation and submit |
| `frontend/src/pages/auth/Register.jsx` | Missing | Full registration form with password confirmation |
| `database/schema.sql` | Was 0 bytes | Synchronized with live database DDL (13 tables) |
| `database/seed.sql` | Was 0 bytes | Populated with default role seeds (`admin`, `user`) |

---

## 2. Authentication Architecture & User Flows

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT (BROWSER)                                     |
+-----------------------------------------------------------------------------------------+
        |                                                                           ^
 1. POST /api/auth/register                                           6. Set-Cookie: token
    or /api/auth/login                                                   (HttpOnly, Secure)
        |                                                                           |
        v                                                                           |
+-----------------------------------------------------------------------------------------+
|                                 EXPRESS BACKEND (API)                                   |
+-----------------------------------------------------------------------------------------+
| 2. Zod Validation (Email normalized, password rules)                                    |
| 3. Query Database (Verify user existence / Compare bcrypt hash)                         |
| 4. Role Assignment (Strict default: role_id = 2)                                        |
| 5. Mint JWT (Subject: userId, 15m - 2h expiration)                                      |
+-----------------------------------------------------------------------------------------+
        |                                                                           ^
        v                                                                           |
+-----------------------------------------------------------------------------------------+
|                                     MYSQL DATABASE                                      |
+-----------------------------------------------------------------------------------------+
| users table: [ user_id | role_id | name | email | password_hash | account_status ... ]    |
+-----------------------------------------------------------------------------------------+
```

### 2.1 User Registration Flow
1. **Form Submission**: Client sends `{ name, email, password, confirmPassword }`.
2. **Schema Validation**: Backend passes payload through `registerSchema` (Zod).
3. **Email Normalization**: Normalize email via `email.trim().toLowerCase()`.
4. **Duplicate Verification**: Query `users` for existing normalized email. If found, respond with `409 Conflict` ("An account with this email address already exists").
5. **Password Hashing**: Hash plain-text password using `bcrypt.hash(password, 12)`.
6. **Role Assignment**: Automatically set `role_id = 2` (`user`). Never allow client-supplied roles.
7. **Insertion**: Insert into `users` (`name`, `email`, `password_hash`, `role_id`, `account_status: 'active'`, `email_verified: 0`).
8. **Response**: Return `201 Created` with sanitized user data (`user_id`, `name`, `email`, `role`, `account_status`), completely omitting `password_hash`. Optionally issue session cookie immediately.

### 2.2 User Login Flow
1. **Credentials Submission**: Client sends `{ email, password }`.
2. **Schema Validation**: Backend validates with `loginSchema` (Zod).
3. **User Lookup**: Search `users` by normalized email, joining `roles` to obtain role name.
4. **Timing-Safe Verification**: If user is not found, perform a dummy bcrypt comparison or return generic `401 Unauthorized` ("Invalid email or password").
5. **Hash Comparison**: If user is found, execute `await bcrypt.compare(password, user.password_hash)`. If false, return generic `401 Unauthorized` ("Invalid email or password").
6. **Account Status Check**: Verify `user.account_status === 'active'`. If `'inactive'` or `'suspended'`, return `403 Forbidden` ("Your account has been deactivated or suspended. Please contact support.").
7. **Session Token Generation**: Mint a signed JWT containing payload:
   ```json
   {
     "userId": 12,
     "email": "user@example.com",
     "role": "user"
   }
   ```
8. **Cookie Transmission**: Transmit token via `res.cookie('token', token, cookieOptions)`:
   - `httpOnly: true` (prevents XSS access)
   - `secure: process.env.NODE_ENV === 'production'` (HTTPS only in production)
   - `sameSite: 'lax'` (CSRF defense)
   - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days session, or short-lived with refresh)
   - `path: '/'`
9. **Payload Delivery**: Return `200 OK` with sanitized user profile.

### 2.3 Password Verification
- Verification is handled strictly on the backend using `bcrypt.compare`.
- Work factor / salt rounds: `12` (provides optimal compromise between cryptographic hardness and CPU performance on Node.js thread pool).
- Plain-text passwords are never stored, logged, cached, or returned in any response.

### 2.4 Authenticated Session Creation
- Sessions are stateless and token-based, backed by JWT signed with HMAC SHA-256 (`JWT_SECRET`).
- Tokens are delivered via HttpOnly cookies, eliminating the severe security vulnerability of storing tokens in `localStorage`.
- Backend middleware inspects `req.cookies.token` as the primary transport and `Authorization: Bearer <token>` as a secondary fallback for programmatic API access.

### 2.5 Protected Dashboard Access
- On application mount, frontend `AuthProvider` issues a lightweight call to `GET /api/auth/me`.
- If the browser sends a valid session cookie, the server returns the active user profile, setting `isAuthenticated = true` and `user = data`.
- If the cookie is absent or expired, the server returns `401 Unauthorized`, setting `isAuthenticated = false` and `user = null`.
- `ProtectedRoute.jsx` intercepts route transitions:
  - If `loading`, render a clean spinner/skeleton.
  - If `!isAuthenticated`, redirect to `/login` via `<Navigate to="/login" replace />`.
  - If authenticated, render `<Outlet />`.

### 2.6 User Logout Flow
1. Client issues `POST /api/auth/logout`.
2. Backend clears the cookie via `res.clearCookie('token', cookieOptions)`.
3. Backend writes an audit event to `activity_logs` (optional).
4. Response returns `200 OK` ("Logged out successfully").
5. Frontend `AuthContext` wipes local user state to `null`.
6. Client redirects to `/login`.

### 2.7 Session Expiration Handling
- When JWT expires, backend `authMiddleware` rejects the request with `401 Unauthorized` ("Invalid or expired token").
- Frontend Axios response interceptor (`src/services/api.js`) captures `401` errors on protected requests:
  - Resets AuthContext state.
  - Redirects user to `/login?expired=true`.
  - Displays a clear feedback notification: "Your session has expired. Please log in again."

---

## 3. Registration Requirements & Zod Validation

### 3.1 Field Specifications
| Field | Client Name | DB Column | Rules |
| :--- | :--- | :--- | :--- |
| Full Name | `name` (or `full_name`) | `name` | String, 2 to 150 characters, trimmed |
| Email | `email` | `email` | Valid email format, max 191 chars, lowercased, trimmed |
| Password | `password` | `password_hash` | Min 8 chars, max 72 bytes, requires mixed character complexity |
| Confirm Password | `confirmPassword` | N/A | Must match `password` identically |

### 3.2 Zod Registration Schema Definition
```javascript
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must not exceed 150 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(191, "Email must not exceed 191 characters")
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
```

---

## 4. Login Requirements & Zod Validation

### 4.1 Field Specifications
| Field | Name | Rules |
| :--- | :--- | :--- |
| Email | `email` | String, valid email format, trimmed, lowercased |
| Password | `password` | String, min 1 char, required |

### 4.2 Zod Login Schema Definition
```javascript
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(1, "Password is required")
});
```

---

## 5. MySQL Database Audit & Users Table Mapping

### 5.1 Existing Schema Verification
The live database `ai_resume_analyzer` contains the following definition for `users`:

```sql
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `account_status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_status` (`account_status`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.2 Audit Conclusion & Migration Policy
- **Primary Key**: `user_id` (bigint AUTO_INCREMENT) is verified.
- **Full Name Field**: `name` (varchar(150)) is verified.
- **Unique Email Constraint**: `UNIQUE KEY email (email)` is verified.
- **Password Hash**: `password_hash` (varchar(255)) is verified.
- **Timestamps**: `created_at` and `updated_at` (automatic on update) are verified.
- **Account Status**: `account_status` enum ('active', 'inactive', 'suspended') is verified.
- **Foreign Key**: `role_id` references `roles(role_id)` with `RESTRICT` on delete.
- **NO DESTRUCTIVE MIGRATIONS REQUIRED**: The existing table perfectly fulfills all security and architectural requirements. No schema modifications are required.

---

## 6. User Data Ownership Rules (Anti-IDOR Architecture)

In an AI Resume Analyzer, user resumes, extracted contact details, ATS evaluations, and career history are highly sensitive personal data. Multi-tenant isolation is mandatory.

### 6.1 Fundamental Rules
1. **Server-Side Identity Truth**:
   - The backend must **never** accept or trust a `user_id` supplied in `req.body`, `req.query`, or `req.params` to determine ownership.
   - The effective `user_id` is derived **solely** from `req.user.user_id`, established by `authenticateUser` middleware via cryptographically signed JWT.

2. **Ownership Scoping in Database Queries**:
   - **Resumes**: `SELECT * FROM resumes WHERE resume_id = ? AND user_id = ? AND deleted_at IS NULL`
   - **Resume Updates/Deletes**: `UPDATE resumes SET ... WHERE resume_id = ? AND user_id = ?`
   - **Analyses**: Query must join `resumes` table:
     ```sql
     SELECT a.* 
     FROM resume_analyses a
     INNER JOIN resumes r ON a.resume_id = r.resume_id
     WHERE a.analysis_id = ? AND r.user_id = ?
     ```
   - **Job Matches**: Query must join `resumes` and/or `job_descriptions`:
     ```sql
     SELECT m.*
     FROM job_matches m
     INNER JOIN resumes r ON m.resume_id = r.resume_id
     WHERE m.match_id = ? AND r.user_id = ?
     ```
   - **History Records**: `SELECT * FROM analysis_history WHERE history_id = ? AND user_id = ?`

3. **Information Disclosure Prevention**:
   - If an authenticated user queries a `resume_id` belonging to another user, the server must return `404 Not Found` (rather than `403 Forbidden`). This prevents malicious attackers from enumerating valid resource IDs.

---

## 7. Frontend Authentication Design

### 7.1 Router Structure (`frontend/src/routes/AppRoutes.jsx`)
- **Public Routes**:
  - `/login` -> `<Login />`
  - `/register` -> `<Register />`
  - `/forgot-password` -> `<ForgotPassword />`
- **Protected Routes** (guarded by `<ProtectedRoute />` inside `<MainLayout />`):
  - `/dashboard` -> `<Dashboard />`
  - `/resumes` -> `<Resumes />`
  - `/history` -> `<History />`
  - `/settings` -> `<Settings />`
- **Fallback / Redirect**:
  - `/` -> redirect to `/dashboard` (which redirects unauthenticated users to `/login`)
  - `*` -> 404 or redirect to `/dashboard`

### 7.2 AuthContext Design (`frontend/src/context/AuthContext.jsx`)
```javascript
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from HttpOnly cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    setUser(response.data);
    return response;
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

## 8. Backend Architecture & Implementation Blueprint

```
backend/
├── config/
│   ├── db.js                 # MySQL pool
│   ├── env.js                # Zod validated env vars
│   └── openai.js             # OpenAI client configuration
├── controllers/
│   └── authController.js     # register, login, logout, getMe
├── middleware/
│   ├── authMiddleware.js     # authenticateUser (cookie + header)
│   ├── errorMiddleware.js    # Global error handler
│   ├── notFoundMiddleware.js # 404 handler
│   └── validateMiddleware.js # Zod validation runner
├── models/
│   └── userModel.js          # findByEmail, findById, create
├── routes/
│   └── authRoutes.js         # /register, /login, /logout, /me
├── utils/
│   ├── apiResponse.js        # successResponse & errorResponse
│   └── asyncHandler.js       # Promise catch wrapper
└── validators/
    └── authValidator.js      # registerSchema & loginSchema
```

### 8.1 Data Model Layer (`backend/models/userModel.js`)
Methods required:
1. `findUserByEmail(email)`:
   - SQL: `SELECT u.user_id, u.role_id, r.role_name, u.name, u.email, u.password_hash, u.account_status FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = ?`
2. `findUserById(userId)`:
   - SQL: `SELECT u.user_id, u.role_id, r.role_name, u.name, u.email, u.profile_image, u.email_verified, u.account_status, u.created_at FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`
3. `createUser({ name, email, passwordHash, roleId = 2 })`:
   - SQL: `INSERT INTO users (role_id, name, email, password_hash, account_status) VALUES (?, ?, ?, ?, 'active')`

### 8.2 Controller Layer (`backend/controllers/authController.js`)
Endpoints to implement:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me` (Protected by `authenticateUser`)

---

## 9. Security Review & Threat Mitigation Checklist

| Security Risk | Threat Vector | Mitigation in Architecture |
| :--- | :--- | :--- |
| **Plain-text Passwords** | Database breach leaks credentials | `bcrypt` hashing with 12 salt rounds. Plain passwords never stored or logged. |
| **Weak Passwords** | Credential stuffing & dictionary attacks | Zod regex enforcement: min 8 chars, max 72 bytes, uppercase, lowercase, number. |
| **Token Theft via XSS** | Malicious scripts reading `localStorage` | JWT stored exclusively in `HttpOnly` cookies. JavaScript cannot access the token. |
| **CSRF Attacks** | Unauthorized cross-site requests | Cookies set with `SameSite: 'lax'`, CORS restricted to `CLIENT_URL`, Content-Type validation. |
| **Brute-Force Attacks** | Automated login credential cracking | Rate limiting on `/api/auth/login` (planned for 10 requests per 15 minutes per IP). |
| **User Enumeration** | Attackers probe existing email addresses | Consistent generic error ("Invalid email or password") on login failures. |
| **IDOR / User Manipulation** | Client swaps `userId` in request body/params | Complete rejection of client-sent `userId`; all queries strictly use verified `req.user.user_id`. |
| **Privilege Escalation** | Attacker registers with `role_id: 1` (admin) | Role assigned strictly on backend (`role_id: 2`); client-provided roles ignored/stripped. |
| **Secret Exposure** | Leaking DB credentials or OpenAI keys | Environment validated at launch with Zod (`config/env.js`), excluded via `.gitignore`. |
| **Data Leakage in Errors** | Stack traces revealed in production | `errorMiddleware` sanitizes internal errors to "Internal server error" in production. |

---

## 10. Lesson 2.2 Implementation Plan

In Lesson 2.2, we will implement this architecture step-by-step:

1. **Step 1: Express App Configuration**:
   - Mount `cookieParser()` in `backend/app.js`.
   - Mount `authRoutes` under `/api/auth`.
2. **Step 2: User Model Implementation (`backend/models/userModel.js`)**:
   - Implement `findUserByEmail`, `findUserById`, and `createUser` using prepared SQL queries.
3. **Step 3: Validation Schemas (`backend/validators/authValidator.js`)**:
   - Finalize `registerSchema` and add `loginSchema` with email lowercasing and password rules.
4. **Step 4: Auth Middleware Upgrade (`backend/middleware/authMiddleware.js`)**:
   - Support `req.cookies.token` with fallback to `req.headers.authorization`.
5. **Step 5: Auth Controller Implementation (`backend/controllers/authController.js`)**:
   - Implement `register`, `login`, `logout`, and `getMe` controllers using `asyncHandler` and standardized `apiResponse`.
6. **Step 6: Auth Routes Implementation (`backend/routes/authRoutes.js`)**:
   - Wire controllers with validation middleware.
7. **Step 7: Frontend Auth Context Enhancement (`frontend/src/context/AuthContext.jsx`)**:
   - Implement session recovery on mount via `/api/auth/me`.
   - Expose operational `login`, `register`, and `logout` actions.
8. **Step 8: Frontend Pages & Routes (`Login.jsx`, `Register.jsx`, `AppRoutes.jsx`)**:
   - Build active Login and Registration forms with validation feedback and responsive Tailwind styling.
   - Guard protected dashboard routes.
9. **Step 9: End-to-End Verification**:
   - Test user registration, cookie issuance, protected dashboard access, persistence across refresh, and clean logout.
