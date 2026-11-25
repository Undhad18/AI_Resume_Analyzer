# Module 2: Authentication & User Management
## Lesson 2.2: Backend User Registration API Documentation

---

### Overview

The User Registration API provides a secure, validated, and hardened endpoint for registering new users into the **AI Resume Analyzer** application. This API establishes user identity in MySQL, hashes credentials using bcrypt, isolates user roles, and prevents duplicate accounts or credential harvesting.

---

### Endpoint Specifications

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Authentication**: Public (Unauthenticated)
- **Rate Limit**: 30 requests per 15-minute sliding window per IP

---

### Request Body Schema

```json
{
  "fullName": "Sarah Connor",
  "email": "sarah.connor@example.com",
  "password": "CyberDyne2026!",
  "confirmPassword": "CyberDyne2026!"
}
```

#### Field Validation Rules (Zod)

| Field | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `fullName` | `string` | Yes | Min: 2, Max: 150 chars | Trims leading/trailing whitespace. Stored in `users.name`. |
| `email` | `string` | Yes | Valid email format, Max: 191 chars | Trims whitespace, normalized to lowercase before database query and insertion. |
| `password` | `string` | Yes | Min: 8, Max: 72 chars, 1 uppercase, 1 lowercase, 1 number | Password complexity enforced. Max 72 bytes prevents bcrypt truncation vulnerability. Never logged or saved in plain text. |
| `confirmPassword` | `string` | Yes | Must match `password` identically | Client confirmation check. Never saved or stored in database. |

---

### Response Specifications

#### 1. Success Response (HTTP 201 Created)

When registration succeeds, the server returns the generated MySQL user ID, user's full name, and normalized email. Sensitive credentials (`password_hash`, plain-text passwords, tokens) are strictly excluded.

```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "fullName": "Sarah Connor",
    "email": "sarah.connor@example.com"
  }
}
```

#### 2. Validation Error Response (HTTP 400 Bad Request)

If payload fails Zod validation:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "fullName",
      "message": "Full name must be at least 2 characters"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

#### 3. Duplicate Email Error (HTTP 409 Conflict)

If an account with the specified email (case-insensitive) already exists in MySQL:

```json
{
  "success": false,
  "message": "An account with this email address already exists",
  "errors": null
}
```

#### 4. Rate Limited Response (HTTP 429 Too Many Requests)

If an IP exceeds 30 requests within 15 minutes:

```json
{
  "success": false,
  "message": "Too many registration attempts from this IP. Please try again later.",
  "errors": null
}
```

#### 5. Server / Database Error (HTTP 500 Internal Server Error)

If the database is unreachable or an unhandled internal exception occurs, raw SQL errors and stack traces are suppressed:

```json
{
  "success": false,
  "message": "Internal server error",
  "errors": null
}
```

---

### Database Mapping & Schema

The registration service maps incoming payload attributes to the existing MySQL `users` table:

```
Payload Field        MySQL Column      Type / Constraints
─────────────        ────────────      ──────────────────
fullName        ──►  name              varchar(150) NOT NULL
email           ──►  email             varchar(191) NOT NULL (UNIQUE)
password        ──►  password_hash     varchar(255) NOT NULL (bcrypt hash)
(server-set)    ──►  role_id           int NOT NULL (DEFAULT 2 -> 'user')
(server-set)    ──►  account_status    enum('active','inactive','suspended') (DEFAULT 'active')
(server-set)    ──►  email_verified    tinyint(1) (DEFAULT 0)
(auto)          ──►  created_at        timestamp DEFAULT CURRENT_TIMESTAMP
(auto)          ──►  updated_at        timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE
```

#### Unique Email Constraint
The `email` column enforces `UNIQUE KEY email (email)`. The registration service normalizes emails to lowercase prior to execution and catches race-condition duplicate inserts via MySQL `ER_DUP_ENTRY` error codes (code 1062), translating them safely into HTTP 409 responses.

---

### Security Implementation Highlights

1. **Server-Side Validation**: All constraints enforced on the backend via Zod (`authValidator.js`). Client-side inputs are never implicitly trusted.
2. **Password Cryptography**: Passwords hashed with `bcrypt` using **12 work factor salt rounds** (~250-300ms compute time), mitigating rainbow table and GPU brute-force attacks.
3. **Password Truncation Defense**: Passwords are constrained to a maximum of 72 characters, preventing bcrypt buffer truncation attacks and denial-of-service via oversized payloads.
4. **Parameterized SQL Queries**: All database operations use `mysql2/promise` parameterized statements (`db.execute("INSERT ... VALUES (?, ?, ?, ?)", [...])`), eliminating SQL injection vulnerabilities.
5. **Least Privilege Role Assignment**: The client cannot specify a role. Every registered user is strictly assigned `role_id: 2` (standard `'user'`). System administrator roles cannot be claimed during registration.
6. **No Plain-Text Storage or Leakage**: Plain-text passwords and confirmation passwords are never logged, cached, or returned in response bodies.
7. **Rate Limiting**: Custom in-memory rate limiting (`rateLimitMiddleware.js`) throttles abusive registration requests by client IP.
8. **Information Disclosure Prevention**: Database connection failures and unexpected server errors return a generic `Internal server error` without exposing database topology, table structures, or stack traces.

---

### How to Test the Registration API

#### 1. Automated Test Suite

Run the preconfigured test suite covering all 11 core verification scenarios:

```bash
cd backend
npm test
```

Test coverage includes:
- Valid registration (HTTP 201)
- Missing required fields (HTTP 400)
- Invalid email format (HTTP 400)
- Password shorter than 8 characters (HTTP 400)
- Password confirmation mismatch (HTTP 400)
- Duplicate email rejection (HTTP 409)
- Case-insensitive duplicate email handling (HTTP 409)
- Database failure masking (HTTP 500)
- SQL injection immunity via parameterized queries
- Bcrypt hash verification in MySQL (`$2b$12$...`)
- Response safety (no secrets/passwords leaked)

#### 2. Manual Testing with cURL / Postman

**Start the server:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**cURL Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'
```

**Postman Steps:**
1. Open Postman.
2. Set Method to **POST**.
3. Set URL to: `http://localhost:5000/api/auth/register`
4. In the **Headers** tab, add:
   - `Content-Type`: `application/json`
5. In the **Body** tab, select **raw** and format as **JSON**:
   ```json
   {
     "fullName": "Jane Doe",
     "email": "jane.doe@example.com",
     "password": "Password123!",
     "confirmPassword": "Password123!"
   }
   ```
6. Click **Send**.
7. Expected Status: `201 Created`.
8. Verify JSON response:
   ```json
   {
     "success": true,
     "message": "Registration successful",
     "user": {
       "id": 2,
       "fullName": "Jane Doe",
       "email": "jane.doe@example.com"
     }
   }
   ```
