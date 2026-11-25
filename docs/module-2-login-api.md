# Module 2: Authentication & User Management
## Lesson 2.3: Backend Login API & Password Verification Documentation

---

### Overview

The Login API provides a security-hardened authentication endpoint for the **AI Resume Analyzer**. It validates credentials, prevents timing-based user enumeration attacks, verifies passwords against bcrypt hashes stored in MySQL, enforces account status constraints, and establishes stateless authenticated sessions via Secure, `HttpOnly` cookies.

---

### Endpoint Specifications

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Authentication**: Public (Unauthenticated)
- **Rate Limit**: 20 attempts per 15-minute sliding window per IP

---

### Request Body Schema

```json
{
  "email": "sarah.connor@example.com",
  "password": "CyberDyne2026!"
}
```

#### Field Validation Rules (Zod)

| Field | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `email` | `string` | Yes | Valid email format, Max: 191 chars | Trims whitespace, normalized to lowercase via `.transform(val => val.toLowerCase())` prior to lookup. |
| `password` | `string` | Yes | Non-empty string | Validated for presence. Passwords are never logged or stored in plain text. |

---

### Response Specifications

#### 1. Success Response (HTTP 200 OK)

Upon valid credentials and active account verification:
- An `HttpOnly` JWT cookie is dispatched via `Set-Cookie`.
- A sanitized user profile is returned in the response body.

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "fullName": "Sarah Connor",
    "email": "sarah.connor@example.com"
  }
}
```

**Set-Cookie Header:**
```http
Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Max-Age=604800; Path=/; Expires=Wed, 02 Dec 2026 10:48:00 GMT; HttpOnly; SameSite=Lax
```
*(In production, `Secure` is automatically appended).*

---

#### 2. Invalid Credentials Response (HTTP 401 Unauthorized)

Returned identically when:
- The email does not exist in the database.
- The password hash comparison fails.

```json
{
  "success": false,
  "message": "Invalid email or password",
  "errors": null
}
```

> **Security Note**: To eliminate timing side-channel attacks, non-existent users undergo a dummy bcrypt hash comparison (~270ms). Attackers cannot infer whether an email exists based on response latency.

---

#### 3. Inactive / Suspended Account Response (HTTP 403 Forbidden)

If `account_status !== 'active'`:

```json
{
  "success": false,
  "message": "Your account has been suspended. Please contact support.",
  "errors": null
}
```
*(or `"Your account is inactive. Please contact support."` for inactive accounts).*

---

#### 4. Validation Error Response (HTTP 400 Bad Request)

If fields are missing, invalid, or empty:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    },
    {
      "field": "password",
      "message": "Password is required"
    }
  ]
}
```

---

#### 5. Rate Limited Response (HTTP 429 Too Many Requests)

If an IP exceeds 20 requests within 15 minutes:

```json
{
  "success": false,
  "message": "Too many login attempts from this IP. Please try again after 15 minutes.",
  "errors": null
}
```

---

#### 6. Database / Server Error Response (HTTP 500 Internal Server Error)

Internal database or unhandled server errors are safely masked:

```json
{
  "success": false,
  "message": "Internal server error",
  "errors": null
}
```

---

### Password Verification Details

1. **Database Column**: Lookups select `password_hash` (`varchar(255)`) from the `users` table.
2. **Comparison**: Executed via `await bcrypt.compare(password, user.password_hash)`.
3. **Work Factor**: Verified against hashes generated with work factor `12`.
4. **Timing Attack Protection**: Non-existent user requests compare the input password against a constant pre-hashed string (`DUMMY_HASH`), guaranteeing symmetrical execution latency (~270ms) across valid and invalid emails.

---

### Session Strategy

- **Stateless JWT**: Signed using HMAC SHA-256 (`env.JWT_SECRET`) with payload:
  ```json
  {
    "userId": 1,
    "email": "sarah.connor@example.com",
    "roleId": 2,
    "iat": 1795584000,
    "exp": 1796188800
  }
  ```
- **Cookie Delivery**:
  - `name`: `token`
  - `httpOnly: true`: Inaccessible to browser JavaScript `document.cookie` (XSS mitigation).
  - `secure: env.NODE_ENV === "production"`: Enforced only over HTTPS in production.
  - `sameSite: "lax"`: Protects against cross-site request forgery while enabling normal navigation.
  - `maxAge`: `7 * 24 * 60 * 60 * 1000` (7 days).
  - `path`: `/`.
- **Zero LocalStorage**: JWT is never exposed in the JSON response or placed in `localStorage`, eliminating token extraction vectors.

---

### Security Protections Summary

| Protection | Implementation Mechanism | Threat Mitigated |
| :--- | :--- | :--- |
| **Bcrypt Verification** | `bcrypt.compare(password, hash)` | Offline password cracking & credential theft |
| **Timing Equalization** | Dummy hash comparison for missing accounts | Account enumeration via response timing |
| **Generic 401 Messages** | Symmetrical "Invalid email or password" | Account enumeration via status/messages |
| **Account Status Enforcement** | Evaluates `users.account_status === 'active'` | Unauthorized access by suspended/inactive accounts |
| **HttpOnly Cookie Carrier** | `res.cookie('token', token, { httpOnly: true })` | XSS-based session token theft |
| **Rate Limiting** | Sliding window 20 requests per 15 minutes per IP | Online brute-force and credential stuffing |
| **Parameterized Queries** | `db.execute("SELECT ... WHERE email = ?", [email])` | SQL injection |
| **Input Normalization** | `email.trim().toLowerCase()` via Zod transform | Case-sensitivity bypasses and duplicate entries |
| **Production Sanitization** | `errorMiddleware` translates 500s to "Internal server error" | Architecture and database topology leakage |

---

### Postman Testing Instructions

1. **Start the Express backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Open Postman** and configure request:
   - **Method**: `POST`
   - **URL**: `http://localhost:5000/api/auth/login`

3. **Set Headers**:
   - `Content-Type`: `application/json`

4. **Set Body** (raw JSON):
   ```json
   {
     "email": "sarah.connor@example.com",
     "password": "CyberDyne2026!"
   }
   ```

5. **Send Request & Verify**:
   - **Status**: `200 OK`.
   - **Body**:
     ```json
     {
       "success": true,
       "message": "Login successful",
       "user": {
         "id": 1,
         "fullName": "Sarah Connor",
         "email": "sarah.connor@example.com"
       }
     }
     ```
   - **Cookies tab**: Verify that cookie `token` is present with `HttpOnly` and `SameSite=Lax` flags set.

6. **Test Negative Scenarios**:
   - **Wrong Password**: Change password to `"WrongPassword123!"` ➔ Expect `401 Unauthorized` (`"Invalid email or password"`).
   - **Unknown User**: Change email to `"unknown@example.com"` ➔ Expect `401 Unauthorized` (`"Invalid email or password"`).
   - **Empty Password**: Change password to `""` ➔ Expect `400 Bad Request` (`"Password is required"`).
   - **Invalid Email**: Change email to `"notanemail"` ➔ Expect `400 Bad Request` (`"Invalid email address"`).
