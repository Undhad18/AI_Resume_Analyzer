# Module 3 – Lesson 3.1: Dashboard Layout & Navigation Architecture

## 1. Executive Summary

This document describes the design, implementation, and verification of the user dashboard layout and navigation system for the **AI Resume Analyzer** application. 

The implementation establishes a clean, responsive, and accessible dashboard foundation that integrates seamlessly with the existing authentication system (JWT, `HttpOnly` cookie session, `AuthContext`, and `ProtectedRoute`) established in Module 2. It adheres strictly to the rule against fabricating false or unpersisted dashboard statistics; genuine analytical metrics and resume metadata aggregation will be introduced via dedicated backend APIs in Lesson 3.2.

---

## 2. Component Hierarchy & Layout Architecture

The dashboard is structured into modular, reusable presentation and container components within `frontend/src/components/dashboard/`:

```
App.jsx (AuthProvider, BrowserRouter)
 └── AppRoutes.jsx
      └── ProtectedRoute (Guards session state via AuthContext)
           └── MainLayout.jsx (Maintains backward compatibility)
                └── DashboardLayout.jsx
                     ├── Sidebar.jsx (Desktop navigation, w-64, fixed/sticky, hidden on < lg)
                     ├── MobileSidebar.jsx (Mobile navigation drawer with backdrop, hidden on >= lg)
                     └── Main Content Area (flex-1 flex flex-col min-w-0 min-h-screen)
                          ├── TopNavbar.jsx (Sticky top bar, hamburger toggle, route title, avatar initials, dropdown)
                          └── <Outlet /> (Dynamic route target, e.g., Dashboard.jsx or placeholder modules)
```

### Component Roles & Specifications:

1. **`DashboardLayout.jsx`**
   - Manages responsive mobile drawer state (`mobileMenuOpen: boolean`).
   - Hosts the persistent desktop `Sidebar` on `lg` screens (min-width: 1024px).
   - Hosts the overlay-based `MobileSidebar` for screen widths below 1024px.
   - Provides accessible state propagation, handling `onClose`, `onOpen`, and body scroll lock synchronization.

2. **`Sidebar.jsx`**
   - Brand identity section featuring the "ResumeAI" logo and badge.
   - Navigation links configured with React Router's `<NavLink>` for automatic `isActive` tracking.
   - Navigation targets:
     - **Dashboard** (`/dashboard`): Home dashboard view.
     - **My Resumes** (`/resumes`): Saved resume inventory.
     - **Upload Resume** (`/upload`): Resume intake point.
     - **Resume Analysis** (`/resume-analysis`): ATS scoring and analysis.
     - **Job Matching** (`/job-matching`): Job description comparison.
     - **Analysis History** (`/history`): Historical audit log.
     - **Resume Builder** (`/builder`): In-browser resume editor.
     - **My Profile** (`/profile`): User account preferences.
     - **Settings** (`/settings`): Application settings.
   - User footer displaying current user's full name, email, and a direct logout action button.

3. **`TopNavbar.jsx`**
   - **Dynamic Route Titles**: Maps route paths (`/dashboard`, `/resumes`, `/upload`, etc.) to human-readable titles.
   - **System Status Badge**: Real-time status indicator ("AI Engine Ready").
   - **User Initials Avatar**: Computes clean uppercase initials from `user.fullName` (e.g., "John Doe" → "JD").
   - **Profile Dropdown Menu**: Accessible dropdown with outside-click detection (`useRef` + `mousedown`) and `Escape` key listeners. Contains links to Profile, Settings, and a secure session logout action.
   - **Mobile Menu Trigger**: Accessible hamburger toggle button (`aria-label="Open navigation menu"`) visible on smaller screens.

4. **`MobileSidebar.jsx`**
   - Slid-out drawer with a high-contrast backdrop overlay (`bg-slate-900/60 backdrop-blur-xs`).
   - Automatically closes upon navigation link selection or `Escape` key press.
   - Body scroll locking preventing viewport scrolling while open (`document.body.style.overflow = "hidden"`).
   - Compliant ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile Navigation"`.

5. **`Dashboard.jsx`**
   - **Personalized Header**: Greets the authenticated user by name (`Welcome back, {user?.fullName}!`).
   - **Strict Metric Integrity**: Completely avoids fake or hardcoded counters (`Total Resumes: 0`, `Average Score: 0/100`, etc.).
   - **Real-Time Backend Connection Check**: Verifies live connectivity with the Express.js backend via `checkServerHealth()`.
   - **Empty State Quick Start Card**: Informs first-time users that no resumes have been analyzed yet, featuring a prominent call-to-action to `/upload`.
   - **Feature Highlights**: Explains ATS Scoring, AI Recommendations, and Job Matching capabilities.

---

## 3. Route Configuration & Navigation Matrix

All dashboard routes are defined within `frontend/src/routes/AppRoutes.jsx` protected by `<ProtectedRoute>`:

| Route Path | View / Component | Status / Role |
| :--- | :--- | :--- |
| `/dashboard` | `Dashboard.jsx` | Active (Personalized greeting, health check, empty state CTA) |
| `/resumes` | `Placeholder` | Planned for upcoming lesson |
| `/upload` | `Placeholder` | Planned for upcoming lesson |
| `/resume-analysis` | `Placeholder` | Planned for upcoming lesson |
| `/job-matching` | `Placeholder` | Planned for upcoming lesson |
| `/history` | `Placeholder` | Planned for upcoming lesson |
| `/analysis-history` | `Placeholder` | Route alias for `/history` |
| `/builder` | `Placeholder` | Planned for upcoming lesson |
| `/profile` | `Placeholder` | Planned for upcoming lesson |
| `/settings` | `Placeholder` | Planned for upcoming lesson |
| `/dashboard/*` | Redirects to `/*` | Aliases for nested route backward compatibility |
| `/` | Redirects to `/dashboard` | Default landing redirect |

---

## 4. Responsive Design Implementation

The layout uses Tailwind CSS utility classes to achieve a responsive experience across all screen sizes:

- **Desktop (>= 1024px / `lg`)**:
  - The desktop `Sidebar` is fixed on the left (`w-64 shrink-0`).
  - The mobile menu toggle button on `TopNavbar` is hidden (`lg:hidden`).
  - The content area occupies `flex-1 min-w-0` with standard content padding (`p-6 lg:p-8`).
- **Tablet / Mobile (< 1024px)**:
  - The desktop `Sidebar` is hidden (`hidden lg:flex`).
  - Top navbar displays the hamburger menu button.
  - Clicking the hamburger button slides in `MobileSidebar` with a dimmed backdrop.
  - Clicking any navigation item or clicking the backdrop automatically dismisses the mobile drawer.

---

## 5. Security & Authentication Integration

1. **Authentication State Consumption**:
   - The layout consumes `user` and `logout` from `useAuth()` (`AuthContext.jsx`).
   - Displays user details directly from verified JWT claims (`user.fullName`, `user.email`).
2. **Session Termination**:
   - Both the sidebar and top navbar dropdown feature direct logout buttons calling `authService.logout()`.
   - Upon logout, the server clears the `accessToken` `HttpOnly` cookie, sets `user` to `null` in context, and React Router redirects immediately to `/login`.
3. **Route Guarding**:
   - Unauthenticated direct URL visits to any dashboard route are intercepted by `<ProtectedRoute>`, saving the attempted path and redirecting to `/login`.

---

## 6. Build and Test Verification

### Frontend Production Build:
- **Command**: `npm --prefix frontend run build`
- **Tool**: Vite v8.3.8
- **Result**: Successfully transformed 2,213 modules with **0 errors and 0 warnings**.
- **Bundle Output**:
  - `dist/index.html`: `0.45 kB`
  - `dist/assets/index-DYHOpW6B.css`: `26.93 kB`
  - `dist/assets/index-BTP84WdB.js`: `359.23 kB`

### Backend Automated Test Suite:
- **Command**: `npm --prefix backend test`
- **Result**: **51 tests passed out of 51 total tests (100% pass rate)** across 4 comprehensive suites:
  1. `registration.test.js`: 12 Passed, 0 Failed
  2. `login.test.js`: 11 Passed, 0 Failed
  3. `protectedRoutes.test.js`: 14 Passed, 0 Failed
  4. `frontendAuthIntegration.test.js`: 14 Passed, 0 Failed

---

## 7. Next Steps for Lesson 3.2

In Lesson 3.2, the empty state on the dashboard will be enhanced to support real data:
1. **Backend Metrics API**: Implement endpoints to compute and return aggregate metrics for the authenticated user (`totalResumes`, `averageScore`, `highestScore`, `recentAnalyses`).
2. **Database Queries**: Query `resumes` and `analyses` tables grouped by `user_id`.
3. **Frontend Dashboard Widgets**: Dynamically render real metric scorecards when resume records exist, retaining the clean empty state when no records exist.
