# Feature 1.6: Basic UI Layout

## Overview

This feature implements the foundational UI layout and navigation structure for the Radiology Reporting App. It provides a consistent, responsive, and accessible interface that integrates with the existing authentication system and supports future feature expansion. The layout follows modern medical application design principles with a focus on clarity, usability, and professional aesthetics.

## Objectives

1. Create a complete application shell with responsive navigation
2. Implement authenticated and public route layouts
3. Provide consistent user feedback systems (loading, errors, notifications)
4. Establish a design system for future features
5. Ensure accessibility compliance (WCAG 2.1 AA)
6. Optimize for mobile, tablet, and desktop devices
7. Integrate with existing authentication (Feature 1.4) and billing (Feature 1.5)

---

## Functional Requirements

### FR-1: Application Shell Layout

#### FR-1.1: Root Layout Structure

**User Story:** As a user, I want a consistent layout across the application, so that I can easily navigate and understand the interface.

**Acceptance Criteria:**
1. WHEN the app loads THEN the system SHALL display a root layout with header, main content area, and footer
2. WHEN the user is authenticated THEN the system SHALL display the dashboard layout with sidebar navigation
3. WHEN the user is unauthenticated THEN the system SHALL display the public layout without sidebar
4. WHEN the viewport width changes THEN the layout SHALL responsively adapt to mobile (<768px), tablet (768-1024px), and desktop (>1024px) breakpoints
5. WHEN rendering THEN the system SHALL use semantic HTML elements (header, nav, main, footer)

#### FR-1.2: Header Component

**User Story:** As a user, I want a persistent header with branding and navigation, so that I can access key features from any page.

**Acceptance Criteria:**
1. WHEN the header renders THEN it SHALL display the application logo/name on the left
2. WHEN the user is authenticated THEN the header SHALL display a user menu on the right with avatar, name, and dropdown
3. WHEN the user is unauthenticated THEN the header SHALL display "Log In" and "Sign Up" buttons
4. WHEN the user clicks the logo THEN the system SHALL navigate to the home page (/ for unauthenticated, /dashboard for authenticated)
5. WHEN on mobile THEN the header SHALL display a hamburger menu button that toggles the mobile navigation
6. WHEN scrolling down THEN the header SHALL remain fixed at the top of the viewport
7. WHEN the header is fixed THEN it SHALL have a subtle shadow to indicate elevation

#### FR-1.3: Sidebar Navigation (Authenticated Users)

**User Story:** As an authenticated user, I want a sidebar with navigation links, so that I can quickly access different sections of the application.

**Acceptance Criteria:**
1. WHEN the dashboard layout renders THEN the system SHALL display a sidebar on the left (desktop) or as a drawer (mobile)
2. WHEN the sidebar displays THEN it SHALL include navigation links for:
   - Dashboard (/)
   - Generate Report (/generate)
   - Reports (/reports)
   - Templates (/templates)
   - Settings (/settings)
3. WHEN a navigation link is active THEN it SHALL be highlighted with the primary color
4. WHEN hovering over a link THEN it SHALL display a subtle background color change
5. WHEN on mobile THEN the sidebar SHALL be hidden by default and slide in from the left when the hamburger menu is clicked
6. WHEN the mobile sidebar is open THEN clicking outside SHALL close it
7. WHEN navigating to a new page THEN the mobile sidebar SHALL automatically close
8. WHEN the sidebar displays THEN each link SHALL show an icon and label
9. WHEN the viewport is desktop THEN the sidebar SHALL be persistent and occupy 240px width

#### FR-1.4: User Account Menu

**User Story:** As an authenticated user, I want a user menu in the header, so that I can access my profile, settings, and logout.

**Acceptance Criteria:**
1. WHEN the user menu renders THEN it SHALL display the user's avatar (or initials if no avatar) and name
2. WHEN the user clicks the menu THEN it SHALL display a dropdown with the following options:
   - Profile (/dashboard/profile)
   - Billing (/dashboard/billing)
   - Settings (/settings)
   - Divider
   - Log Out
3. WHEN the user clicks "Profile" THEN the system SHALL navigate to the profile page
4. WHEN the user clicks "Billing" THEN the system SHALL navigate to the billing dashboard
5. WHEN the user clicks "Settings" THEN the system SHALL navigate to the settings page
6. WHEN the user clicks "Log Out" THEN the system SHALL call the logout API and redirect to the login page
7. WHEN clicking outside the dropdown THEN it SHALL close
8. WHEN the dropdown is open THEN pressing Escape SHALL close it
9. WHEN the user has an active subscription THEN the menu SHALL display a subscription badge (e.g., "Professional")

#### FR-1.5: Footer Component

**User Story:** As a user, I want a footer with relevant links and information, so that I can access support and legal information.

**Acceptance Criteria:**
1. WHEN the footer renders THEN it SHALL display at the bottom of the page
2. WHEN the footer displays THEN it SHALL include:
   - Copyright notice (e.g., "© 2025 Radiology Reporting. All rights reserved.")
   - Links to: Terms of Service, Privacy Policy, Support
   - Optional: Social media links
3. WHEN on mobile THEN the footer SHALL stack links vertically
4. WHEN on desktop THEN the footer SHALL display links horizontally
5. WHEN the page content is shorter than the viewport THEN the footer SHALL stick to the bottom

### FR-2: Layout Variants

#### FR-2.1: Dashboard Layout

**User Story:** As an authenticated user, I want a dashboard layout with sidebar navigation, so that I can efficiently navigate the application.

**Acceptance Criteria:**
1. WHEN a user accesses a protected route THEN the system SHALL render the dashboard layout
2. WHEN the dashboard layout renders THEN it SHALL include:
   - Header with user menu
   - Sidebar navigation (persistent on desktop, drawer on mobile)
   - Main content area
   - Footer
3. WHEN the main content area renders THEN it SHALL have padding and max-width for optimal readability
4. WHEN the sidebar is visible (desktop) THEN the main content SHALL be offset by the sidebar width
5. WHEN on tablet THEN the sidebar SHALL collapse to icon-only mode with tooltips on hover

#### FR-2.2: Public Layout (Auth Pages)

**User Story:** As an unauthenticated user, I want a clean layout for authentication pages, so that I can focus on signing in or signing up.

**Acceptance Criteria:**
1. WHEN accessing `/login`, `/signup`, or `/reset-password` THEN the system SHALL render the auth layout
2. WHEN the auth layout renders THEN it SHALL include:
   - Centered card with auth form
   - Application logo/name at the top
   - Background with subtle branding
   - Optional: Testimonials or feature highlights
3. WHEN the auth card renders THEN it SHALL have a maximum width of 450px
4. WHEN on mobile THEN the auth card SHALL take full width with padding
5. WHEN the auth layout renders THEN it SHALL NOT display header navigation or footer

#### FR-2.3: Landing Page Layout

**User Story:** As a new visitor, I want an attractive landing page, so that I understand the product and can sign up.

**Acceptance Criteria:**
1. WHEN accessing the root `/` as an unauthenticated user THEN the system SHALL display the landing page
2. WHEN the landing page renders THEN it SHALL include:
   - Hero section with headline, description, and CTA buttons
   - Features section highlighting key capabilities
   - Pricing section (links to pricing page)
   - Footer with links
3. WHEN a user is authenticated and visits `/` THEN the system SHALL redirect to `/dashboard`
4. WHEN the user clicks "Get Started" THEN the system SHALL navigate to `/signup`
5. WHEN the user clicks "Log In" THEN the system SHALL navigate to `/login`

### FR-3: Feedback Components

#### FR-3.1: Loading States

**User Story:** As a user, I want to see loading indicators when content is being fetched, so that I know the app is working.

**Acceptance Criteria:**
1. WHEN a page is loading THEN the system SHALL display a loading component
2. WHEN a page with suspense boundaries loads THEN it SHALL display skeleton screens for the loading content
3. WHEN an API request is in progress THEN buttons SHALL be disabled and show a loading spinner
4. WHEN loading THEN the loading spinner SHALL use the primary color
5. WHEN a page takes longer than 300ms to load THEN the system SHALL display the loading indicator
6. WHEN loading completes THEN the indicator SHALL smoothly fade out

**Loading Variants:**
- Page loader: Full-page spinner for route changes
- Skeleton screens: Content placeholders for list items, cards
- Inline spinners: Small spinners for button actions
- Progress indicators: For multi-step processes

#### FR-3.2: Error Boundaries

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and what to do next.

**Acceptance Criteria:**
1. WHEN a component error occurs THEN the error boundary SHALL catch it and display a friendly error message
2. WHEN an error displays THEN it SHALL include:
   - Error icon
   - Error message (non-technical language)
   - Suggested actions (e.g., "Refresh page", "Go to dashboard")
   - Optional: "Report this issue" button
3. WHEN the user clicks "Refresh page" THEN the system SHALL reload the current page
4. WHEN the user clicks "Go to dashboard" THEN the system SHALL navigate to `/dashboard`
5. WHEN a critical error occurs THEN the system SHALL log it to the error tracking service (future)
6. WHEN in development mode THEN the error boundary SHALL display the stack trace

#### FR-3.3: Toast Notifications

**User Story:** As a user, I want toast notifications for actions and events, so that I receive immediate feedback without disrupting my workflow.

**Acceptance Criteria:**
1. WHEN a user action completes successfully THEN the system SHALL display a success toast (green)
2. WHEN an error occurs THEN the system SHALL display an error toast (red)
3. WHEN important information needs to be communicated THEN the system SHALL display an info toast (blue)
4. WHEN a warning is needed THEN the system SHALL display a warning toast (yellow)
5. WHEN a toast displays THEN it SHALL auto-dismiss after 4 seconds (configurable)
6. WHEN multiple toasts are active THEN they SHALL stack vertically
7. WHEN the user hovers over a toast THEN it SHALL pause the auto-dismiss timer
8. WHEN the user clicks the close button THEN the toast SHALL immediately dismiss
9. WHEN a toast dismisses THEN it SHALL slide out smoothly

**Toast Structure:**
- Icon (success/error/info/warning)
- Title (optional)
- Message (required)
- Close button
- Optional action button

#### FR-3.4: Modal/Dialog System

**User Story:** As a user, I want modal dialogs for important actions, so that I can confirm or cancel before proceeding.

**Acceptance Criteria:**
1. WHEN a modal opens THEN it SHALL overlay the page content with a backdrop
2. WHEN the modal displays THEN it SHALL be centered on the screen and have a maximum width of 600px
3. WHEN the modal opens THEN focus SHALL move to the modal content
4. WHEN the user presses Escape THEN the modal SHALL close (unless marked as non-dismissible)
5. WHEN the user clicks the backdrop THEN the modal SHALL close (unless marked as non-dismissible)
6. WHEN the modal closes THEN focus SHALL return to the trigger element
7. WHEN a modal is open THEN the body scroll SHALL be disabled
8. WHEN a modal is open THEN screen readers SHALL announce the modal title

**Modal Variants:**
- Confirmation dialog: Yes/No actions
- Alert dialog: Single "OK" action
- Form dialog: Complex forms with submit/cancel
- Full-screen modal: For large content (mobile optimization)

### FR-4: Page-Specific Layouts

#### FR-4.1: Dashboard Home Page

**User Story:** As an authenticated user, I want a dashboard home page that provides an overview of my activity, so that I can quickly see my recent work.

**Acceptance Criteria:**
1. WHEN the user accesses `/dashboard` THEN the system SHALL display the dashboard home page
2. WHEN the dashboard displays THEN it SHALL include:
   - Welcome message with user's name
   - Quick stats cards (e.g., "Reports this month", "Templates created")
   - Recent reports list (last 5)
   - Quick action buttons ("Generate Report", "Create Template")
   - Usage meter (if applicable to subscription)
3. WHEN on mobile THEN cards SHALL stack vertically
4. WHEN on desktop THEN cards SHALL display in a responsive grid (2-3 columns)
5. WHEN the user clicks "View all reports" THEN the system SHALL navigate to `/reports`

#### FR-4.2: Profile Page

**User Story:** As an authenticated user, I want to view and edit my profile information, so that I can keep my account up to date.

**Acceptance Criteria:**
1. WHEN the user accesses `/dashboard/profile` THEN the system SHALL display the profile page
2. WHEN the profile page renders THEN it SHALL display:
   - Avatar with upload/change option
   - Name (editable)
   - Email (display only with "Change email" link)
   - Account creation date
   - Save button (disabled until changes are made)
3. WHEN the user changes their name THEN the Save button SHALL enable
4. WHEN the user clicks Save THEN the system SHALL update the profile and display a success toast
5. WHEN the user uploads a new avatar THEN it SHALL be cropped to square and resized to 200x200px
6. WHEN profile updates fail THEN an error toast SHALL display with the reason

#### FR-4.3: Settings Page

**User Story:** As an authenticated user, I want a settings page to configure my preferences, so that I can customize my experience.

**Acceptance Criteria:**
1. WHEN the user accesses `/settings` THEN the system SHALL display the settings page
2. WHEN the settings page renders THEN it SHALL include sections for:
   - Account settings (email, password)
   - Preferences (theme, notifications)
   - Subscription (current plan, usage)
   - Danger zone (delete account)
3. WHEN the user changes the theme THEN the system SHALL immediately apply it
4. WHEN the user changes settings THEN they SHALL be saved automatically or require a "Save" action
5. WHEN the user clicks "Change password" THEN a modal SHALL open with a password change form
6. WHEN the user clicks "Delete account" THEN a confirmation modal SHALL open with a warning

---

## Non-Functional Requirements

### NFR-1: Performance

1. **Page Load Performance**
   - First Contentful Paint (FCP) < 1.5 seconds
   - Largest Contentful Paint (LCP) < 2.5 seconds
   - Time to Interactive (TTI) < 3.5 seconds
   - Cumulative Layout Shift (CLS) < 0.1

2. **Navigation Performance**
   - Client-side navigation < 200ms
   - API-driven page load < 1 second (p95)
   - Sidebar toggle animation 60fps

3. **Bundle Size**
   - Initial JavaScript bundle < 200KB (gzipped)
   - CSS bundle < 50KB (gzipped)
   - Images optimized with Next.js Image component

### NFR-2: Responsive Design

1. **Mobile First Approach**
   - Design starts with mobile (320px width)
   - Progressive enhancement for larger screens
   - Touch targets minimum 44x44px

2. **Breakpoints**
   - Mobile: < 768px
   - Tablet: 768px - 1024px
   - Desktop: > 1024px
   - Large desktop: > 1440px

3. **Responsive Behavior**
   - Sidebar collapses to drawer on mobile/tablet
   - Navigation becomes hamburger menu on mobile
   - Cards stack on mobile, grid on desktop
   - Typography scales with viewport

### NFR-3: Accessibility (WCAG 2.1 AA)

1. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Focus indicators visible and clear
   - Logical tab order maintained
   - Keyboard shortcuts for common actions (optional)

2. **Screen Reader Support**
   - Semantic HTML structure
   - ARIA labels for icon-only buttons
   - Live regions for dynamic content
   - Skip navigation links

3. **Visual Accessibility**
   - Color contrast ratio ≥ 4.5:1 for text
   - Color not the only means of conveying information
   - Focus states clearly visible
   - Text resizable up to 200% without breaking layout

4. **Motion & Animation**
   - Respect `prefers-reduced-motion` setting
   - Animations can be disabled
   - No flashing content

### NFR-4: User Experience

1. **Consistency**
   - Consistent color scheme across app
   - Consistent spacing and typography
   - Consistent interaction patterns
   - Consistent feedback mechanisms

2. **Clarity**
   - Clear visual hierarchy
   - Intuitive navigation labels
   - Descriptive error messages
   - Progressive disclosure of complexity

3. **Feedback**
   - Immediate feedback for user actions
   - Loading states for async operations
   - Success/error confirmations
   - Progress indicators for multi-step processes

### NFR-5: Design System

1. **Color Palette**
   - Primary: Blue (#0ea5e9 - medical/trust)
   - Secondary: Gray (#64748b - neutral)
   - Success: Green (#10b981)
   - Warning: Yellow (#f59e0b)
   - Error: Red (#ef4444)
   - Info: Light Blue (#3b82f6)

2. **Typography**
   - Font family: Inter (system fallback: -apple-system, BlinkMacSystemFont, sans-serif)
   - Headings: Font weights 600-700
   - Body: Font weight 400-500
   - Line height: 1.5 for body, 1.2 for headings

3. **Spacing Scale**
   - Uses Tailwind's default spacing scale (4px base)
   - Common: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

4. **Border Radius**
   - Small: 4px (buttons, inputs)
   - Medium: 8px (cards)
   - Large: 12px (modals)
   - Full: 9999px (avatars, badges)

5. **Shadows**
   - sm: subtle elevation
   - md: card elevation
   - lg: modal elevation
   - xl: maximum elevation

---

## Technical Requirements

### TR-1: Next.js 14 App Router Layouts

**Acceptance Criteria:**
1. WHEN implementing layouts THEN the system SHALL use Next.js 14 App Router conventions
2. WHEN layouts are nested THEN the system SHALL use route groups (e.g., `(auth)`, `(dashboard)`)
3. WHEN layout changes THEN only the changed segments SHALL re-render

**File Structure:**
```
app/
├── layout.tsx                 # Root layout (includes AuthProvider, Toaster)
├── page.tsx                   # Landing page
├── (auth)/
│   ├── layout.tsx            # Auth layout (centered card)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/
│   ├── layout.tsx            # Dashboard layout (sidebar + header)
│   ├── page.tsx              # Dashboard home
│   ├── profile/page.tsx
│   ├── billing/page.tsx
│   ├── settings/page.tsx
│   ├── generate/page.tsx
│   ├── reports/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── templates/
│       ├── page.tsx
│       ├── new/page.tsx
│       └── [id]/page.tsx
├── error.tsx                 # Global error boundary
├── not-found.tsx            # 404 page
└── loading.tsx              # Global loading UI
```

### TR-2: Component Architecture

#### TR-2.1: Layout Components

**Location:** `components/layout/`

**Components:**
1. `Header.tsx` - Main header (Client Component)
2. `Sidebar.tsx` - Dashboard sidebar (Client Component)
3. `Footer.tsx` - Footer (Server Component)
4. `UserMenu.tsx` - User account dropdown (Client Component)
5. `MobileNav.tsx` - Mobile navigation drawer (Client Component)

#### TR-2.2: UI Base Components

**Location:** `components/ui/`

**Components:**
1. `Button.tsx` - Button with variants (primary, secondary, ghost, danger)
2. `Card.tsx` - Card container with optional header/footer
3. `Input.tsx` - Form input with validation states
4. `Avatar.tsx` - User avatar with fallback to initials
5. `Badge.tsx` - Small labels/tags
6. `Dropdown.tsx` - Dropdown menu
7. `Modal.tsx` - Modal/dialog
8. `Toast.tsx` - Toast notification
9. `Spinner.tsx` - Loading spinner
10. `Skeleton.tsx` - Skeleton loading placeholder

#### TR-2.3: Navigation Components

**Location:** `components/navigation/`

**Components:**
1. `NavLink.tsx` - Navigation link with active state
2. `NavSection.tsx` - Grouped navigation items
3. `Breadcrumbs.tsx` - Breadcrumb navigation (optional)

### TR-3: Styling with Tailwind CSS

**Acceptance Criteria:**
1. WHEN styling components THEN the system SHALL use Tailwind CSS utility classes
2. WHEN custom styles are needed THEN the system SHALL extend Tailwind config
3. WHEN component variants are needed THEN the system SHALL use `clsx` or `classnames` for conditional classes

**Tailwind Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* blue palette */ },
        secondary: { /* gray palette */ },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### TR-4: State Management

**Acceptance Criteria:**
1. WHEN managing global UI state (sidebar open/close, theme) THEN the system SHALL use React Context
2. WHEN managing auth state THEN the system SHALL use existing AuthProvider (Feature 1.4)
3. WHEN managing local component state THEN the system SHALL use useState hook

**Contexts:**
- `ThemeContext` - Dark/light theme preference
- `SidebarContext` - Sidebar open/close state (mobile)
- `ToastContext` - Toast notification queue

### TR-5: TypeScript Types

**Acceptance Criteria:**
1. WHEN defining component props THEN all props SHALL have explicit types
2. WHEN using data from API THEN types SHALL match backend contracts
3. WHEN passing callbacks THEN function signatures SHALL be typed

**Common Types:**
```typescript
// types/components.ts
interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}
```

---

## Component Specifications

### Header Component

**Props:**
```typescript
interface HeaderProps {
  variant?: 'public' | 'authenticated';
}
```

**Behavior:**
- Renders conditionally based on authentication state
- Sticky positioning at top
- Responsive: Hamburger menu on mobile

### Sidebar Component

**Props:**
```typescript
interface SidebarProps {
  navItems: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
}
```

**Behavior:**
- Desktop: Persistent, 240px width
- Tablet: Collapsible to icon-only
- Mobile: Drawer from left, overlay backdrop

### UserMenu Component

**Props:**
```typescript
interface UserMenuProps {
  user: {
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
  subscription?: {
    plan_name: string;
  } | null;
}
```

**Behavior:**
- Dropdown menu with user actions
- Avatar with fallback to initials
- Subscription badge (if active)

### Toast Component

**Props:**
```typescript
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}
```

**Behavior:**
- Auto-dismiss after duration
- Pause on hover
- Slide-in animation
- Stacks with other toasts

### Modal Component

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  dismissible?: boolean;
}
```

**Behavior:**
- Overlay backdrop
- Centered positioning
- Keyboard and click-outside handling
- Focus trap

---

## Navigation Structure

### Authenticated Navigation

**Main Navigation:**
1. Dashboard (/)
   - Icon: Home
   - Route: `/dashboard`

2. Generate Report
   - Icon: Plus or Document with Plus
   - Route: `/generate`

3. Reports
   - Icon: Document List
   - Route: `/reports`
   - Badge: Count of unread/recent reports (optional)

4. Templates
   - Icon: Template Grid
   - Route: `/templates`

5. Settings
   - Icon: Gear/Cog
   - Route: `/settings`

**User Menu:**
1. Profile
2. Billing
3. Settings (duplicate for quick access)
4. Divider
5. Log Out

### Public Navigation

**Header:**
- Logo (left)
- "Log In" button (right)
- "Sign Up" button (right, primary style)

---

## Integration Points

### With Feature 1.4 (Supabase Authentication)

1. **AuthProvider Integration**
   - Wrap root layout with AuthProvider
   - Access user state via useAuthContext hook
   - Render components conditionally based on authentication status

2. **Protected Routes**
   - Use middleware from Feature 1.4 for route protection
   - Display loading state while checking authentication
   - Redirect to login if unauthenticated

### With Feature 1.5 (Stripe Integration)

1. **Subscription Display**
   - Show current plan in user menu
   - Display usage meter on dashboard home
   - Link to billing dashboard from user menu

2. **Usage Limits**
   - Display warnings when approaching limits
   - Show upgrade prompts in toast notifications

---

## Dependencies

### External Dependencies

1. **@heroicons/react** (v2.0+)
   - Purpose: Icon library for navigation and UI
   - Usage: Import icons for buttons, navigation items

2. **clsx** (v2.0+)
   - Purpose: Conditional className utility
   - Usage: Combine Tailwind classes dynamically

3. **@headlessui/react** (v1.7+)
   - Purpose: Unstyled, accessible UI components
   - Usage: Dropdown menus, modals, transitions

### Internal Dependencies

1. **Feature 1.4: Supabase Authentication**
   - AuthProvider
   - useAuthContext hook
   - Login/Signup forms

2. **Feature 1.5: Stripe Integration**
   - Subscription data
   - Usage tracking

---

## Success Metrics

1. **Core Web Vitals**
   - LCP < 2.5s: ✓
   - FID < 100ms: ✓
   - CLS < 0.1: ✓

2. **Accessibility**
   - Lighthouse Accessibility Score ≥ 95
   - No critical WCAG violations

3. **User Experience**
   - Navigation click-to-content < 200ms
   - Zero layout shifts on page load
   - Responsive on all devices (320px - 2560px)

4. **Code Quality**
   - 100% TypeScript type coverage
   - Zero ESLint errors
   - All components have prop types

---

## Related Documents

- `docs/01-ARCHITECTURE/BLUEPRINT.md` - System architecture
- `docs/02-DESIGN/TECHNICAL.md` - Technical design patterns
- `docs/specs/features/1.4-supabase-authentication/SPEC.md` - Auth integration
- `docs/specs/features/1.5-stripe-integration/SPEC.md` - Billing integration (future)
