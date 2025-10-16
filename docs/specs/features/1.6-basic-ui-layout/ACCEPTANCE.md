# Feature 1.6: Basic UI Layout - Acceptance Criteria

## Overview

This document defines the acceptance tests and validation criteria for Feature 1.6: Basic UI Layout. Each requirement from the SPEC.md has corresponding acceptance tests that must pass before the feature is considered complete.

---

## AC-1: Application Shell Layout

### AC-1.1: Root Layout Structure

**Test Scenario:** Verify root layout renders correctly for authenticated and unauthenticated users

**Given:** A user visits the application
**When:** The page loads
**Then:**
- [ ] The root layout includes `<html>`, `<body>` tags
- [ ] The AuthProvider wraps the entire application
- [ ] The Toaster component is present at the root level
- [ ] Font loading is optimized (Inter font)

**Given:** An authenticated user navigates to any page
**When:** The page renders
**Then:**
- [ ] The dashboard layout is applied (header + sidebar + main + footer)
- [ ] User information is loaded and displayed
- [ ] Navigation links are accessible

**Given:** An unauthenticated user navigates to a public page
**When:** The page renders
**Then:**
- [ ] The public layout is applied (header + main + footer)
- [ ] No sidebar is displayed
- [ ] "Log In" and "Sign Up" buttons are visible

**Test Method:** Manual testing + E2E tests

### AC-1.2: Header Component - Public State

**Test Scenario:** Verify header renders correctly for unauthenticated users

**Given:** An unauthenticated user
**When:** Any public page loads
**Then:**
- [ ] Logo/app name is displayed on the left
- [ ] Logo is clickable and links to `/`
- [ ] "Log In" button is displayed on the right
- [ ] "Sign Up" button is displayed on the right (primary style)
- [ ] Header has a white/light background
- [ ] Header has a bottom border or shadow

**Test Method:** Visual regression test + E2E test

### AC-1.3: Header Component - Authenticated State

**Test Scenario:** Verify header renders correctly for authenticated users

**Given:** An authenticated user
**When:** The dashboard loads
**Then:**
- [ ] Logo/app name is displayed on the left
- [ ] Logo links to `/dashboard`
- [ ] User avatar is displayed on the right
- [ ] User name is displayed next to avatar
- [ ] Clicking user avatar opens the user menu
- [ ] On mobile, hamburger menu button is visible
- [ ] On desktop, hamburger menu button is hidden

**Test Method:** E2E test with authenticated session

### AC-1.4: Header Component - Sticky Behavior

**Test Scenario:** Verify header remains visible while scrolling

**Given:** A page with scrollable content
**When:** The user scrolls down the page
**Then:**
- [ ] Header remains fixed at the top of the viewport
- [ ] Header has position: sticky or fixed
- [ ] Header has z-index higher than main content
- [ ] Header shows a subtle shadow when scrolled

**Test Method:** Visual test + scroll automation

### AC-1.5: Sidebar Navigation - Desktop

**Test Scenario:** Verify sidebar renders and functions on desktop

**Given:** An authenticated user on a desktop device (>1024px width)
**When:** The dashboard loads
**Then:**
- [ ] Sidebar is visible on the left side
- [ ] Sidebar occupies 240px width
- [ ] Sidebar contains all navigation links:
  - Dashboard
  - Generate Report
  - Reports
  - Templates
  - Settings
- [ ] Each link has an icon and label
- [ ] Active link is highlighted with primary color
- [ ] Main content is offset by sidebar width

**Test Method:** Visual regression test + unit test

### AC-1.6: Sidebar Navigation - Active State

**Test Scenario:** Verify active navigation link is highlighted

**Given:** An authenticated user on the Reports page
**When:** The sidebar renders
**Then:**
- [ ] "Reports" link has active styling (primary color background)
- [ ] "Reports" link has primary color text
- [ ] Other links have default styling
- [ ] Active indicator is clearly visible

**Test Method:** E2E test with navigation

### AC-1.7: Sidebar Navigation - Hover State

**Test Scenario:** Verify hover effects on navigation links

**Given:** An authenticated user on desktop
**When:** The user hovers over a navigation link
**Then:**
- [ ] Link background changes to a subtle hover color
- [ ] Cursor changes to pointer
- [ ] Transition is smooth (200-300ms)

**Test Method:** Manual testing + visual regression

### AC-1.8: Sidebar Navigation - Mobile

**Test Scenario:** Verify sidebar becomes a drawer on mobile

**Given:** An authenticated user on mobile (<768px width)
**When:** The dashboard loads
**Then:**
- [ ] Sidebar is hidden by default
- [ ] Hamburger menu button is visible in header
- [ ] When hamburger is clicked, sidebar slides in from left
- [ ] Backdrop overlay covers main content
- [ ] Clicking backdrop closes sidebar
- [ ] Clicking a nav link closes sidebar and navigates
- [ ] Sidebar has smooth slide animation

**Test Method:** Mobile E2E test

### AC-1.9: User Account Menu - Display

**Test Scenario:** Verify user menu displays user information

**Given:** An authenticated user
**When:** The header renders
**Then:**
- [ ] User avatar is displayed (circular)
- [ ] If no avatar, initials are shown in a colored circle
- [ ] User name is displayed next to avatar
- [ ] If user has subscription, plan badge is shown
- [ ] Clicking the menu opens a dropdown

**Test Method:** Unit test + E2E test

### AC-1.10: User Account Menu - Dropdown

**Test Scenario:** Verify user menu dropdown functions correctly

**Given:** An authenticated user
**When:** The user clicks the avatar/menu
**Then:**
- [ ] Dropdown opens below the avatar
- [ ] Dropdown contains:
  - Profile link
  - Billing link
  - Settings link
  - Divider
  - Log Out button
- [ ] Clicking "Profile" navigates to `/dashboard/profile`
- [ ] Clicking "Billing" navigates to `/dashboard/billing`
- [ ] Clicking "Settings" navigates to `/settings`
- [ ] Clicking "Log Out" calls logout and redirects to `/login`
- [ ] Clicking outside closes the dropdown
- [ ] Pressing Escape closes the dropdown

**Test Method:** E2E test with keyboard and mouse interactions

### AC-1.11: Footer Component

**Test Scenario:** Verify footer renders correctly

**Given:** Any page in the application
**When:** The page renders
**Then:**
- [ ] Footer is at the bottom of the page
- [ ] Footer contains copyright notice
- [ ] Footer contains links: Terms, Privacy, Support
- [ ] On mobile, links stack vertically
- [ ] On desktop, links are horizontal
- [ ] If page is short, footer sticks to bottom of viewport

**Test Method:** Visual regression test

---

## AC-2: Layout Variants

### AC-2.1: Dashboard Layout

**Test Scenario:** Verify dashboard layout structure

**Given:** An authenticated user accesses `/dashboard`
**When:** The page renders
**Then:**
- [ ] Header is displayed at the top
- [ ] Sidebar is displayed on the left (desktop) or as drawer (mobile)
- [ ] Main content area is displayed
- [ ] Main content has appropriate padding (24px or more)
- [ ] Main content has max-width for readability (1280px)
- [ ] Footer is displayed at the bottom

**Test Method:** E2E test + visual regression

### AC-2.2: Auth Layout

**Test Scenario:** Verify auth pages use centered card layout

**Given:** An unauthenticated user accesses `/login`
**When:** The page renders
**Then:**
- [ ] No sidebar is displayed
- [ ] Header is minimal or hidden
- [ ] Auth card is centered on the page
- [ ] Auth card has max-width of 450px
- [ ] Logo/app name is displayed above the card
- [ ] Background has subtle branding or gradient
- [ ] On mobile, card takes full width with padding

**Test Method:** Visual regression test

### AC-2.3: Landing Page Layout

**Test Scenario:** Verify landing page structure

**Given:** An unauthenticated user accesses `/`
**When:** The page renders
**Then:**
- [ ] Hero section is displayed with headline and CTAs
- [ ] "Get Started" button links to `/signup`
- [ ] "Log In" button links to `/login`
- [ ] Features section is displayed
- [ ] Pricing section or link is displayed
- [ ] Footer is displayed

**Given:** An authenticated user accesses `/`
**When:** The page loads
**Then:**
- [ ] System redirects to `/dashboard`

**Test Method:** E2E test

---

## AC-3: Feedback Components

### AC-3.1: Loading Spinner

**Test Scenario:** Verify loading spinner displays correctly

**Given:** A page or component is loading
**When:** Loading state is active
**Then:**
- [ ] Spinner is centered in its container
- [ ] Spinner uses primary color
- [ ] Spinner animation is smooth (60fps)
- [ ] Spinner has appropriate size (24px, 32px, 48px variants)

**Test Method:** Visual test + performance check

### AC-3.2: Skeleton Screens

**Test Scenario:** Verify skeleton loading placeholders

**Given:** A page with suspense boundaries is loading
**When:** Data is being fetched
**Then:**
- [ ] Skeleton placeholders match the layout of loaded content
- [ ] Skeletons have a subtle shimmer animation
- [ ] Skeletons use neutral gray colors
- [ ] Skeletons smoothly transition to real content

**Test Method:** Visual regression test

### AC-3.3: Button Loading State

**Test Scenario:** Verify buttons show loading state

**Given:** A button triggers an async action
**When:** The action is in progress
**Then:**
- [ ] Button is disabled
- [ ] Button shows a spinner inside
- [ ] Button text may change to "Loading..." or remain
- [ ] Button cursor is "not-allowed"
- [ ] Button cannot be clicked again

**Test Method:** Unit test + E2E test

### AC-3.4: Error Boundary - Caught Error

**Test Scenario:** Verify error boundary catches component errors

**Given:** A component throws an error during rendering
**When:** The error occurs
**Then:**
- [ ] Error boundary catches the error
- [ ] User sees a friendly error message (not stack trace)
- [ ] Error message includes:
  - Error icon
  - "Something went wrong" message
  - "Refresh page" button
  - "Go to dashboard" button
- [ ] Clicking "Refresh" reloads the page
- [ ] Clicking "Go to dashboard" navigates to `/dashboard`
- [ ] Error is logged (to console in dev, to service in prod)

**Test Method:** Unit test with error simulation

### AC-3.5: Error Boundary - Development Mode

**Test Scenario:** Verify error boundary shows stack trace in development

**Given:** A component error occurs in development mode
**When:** The error boundary catches it
**Then:**
- [ ] Stack trace is displayed
- [ ] Component stack is displayed
- [ ] Error message is displayed

**Test Method:** Manual test in development mode

### AC-3.6: Toast Notification - Success

**Test Scenario:** Verify success toast displays correctly

**Given:** A user action succeeds
**When:** A success toast is triggered
**Then:**
- [ ] Toast slides in from top-right corner
- [ ] Toast has green background
- [ ] Toast shows success icon
- [ ] Toast shows message text
- [ ] Toast auto-dismisses after 4 seconds
- [ ] Hovering pauses auto-dismiss
- [ ] Clicking close button immediately dismisses

**Test Method:** E2E test

### AC-3.7: Toast Notification - Error

**Test Scenario:** Verify error toast displays correctly

**Given:** A user action fails
**When:** An error toast is triggered
**Then:**
- [ ] Toast slides in from top-right corner
- [ ] Toast has red background
- [ ] Toast shows error icon
- [ ] Toast shows error message
- [ ] Toast auto-dismisses after 6 seconds (longer for errors)

**Test Method:** E2E test

### AC-3.8: Toast Notification - Stacking

**Test Scenario:** Verify multiple toasts stack correctly

**Given:** Multiple actions trigger toasts
**When:** Toasts are displayed
**Then:**
- [ ] Toasts stack vertically
- [ ] Each toast has 8px or 12px gap
- [ ] Maximum of 5 toasts visible at once
- [ ] Older toasts are dismissed first when limit is reached

**Test Method:** E2E test with multiple actions

### AC-3.9: Modal - Open/Close

**Test Scenario:** Verify modal opens and closes correctly

**Given:** A user triggers a modal (e.g., confirmation dialog)
**When:** The modal opens
**Then:**
- [ ] Modal is centered on screen
- [ ] Modal has a backdrop overlay (semi-transparent)
- [ ] Body scroll is disabled
- [ ] Focus moves to the modal
- [ ] Pressing Escape closes the modal
- [ ] Clicking backdrop closes the modal (if dismissible)
- [ ] Clicking close button closes the modal
- [ ] When closed, focus returns to trigger element

**Test Method:** E2E test with keyboard and mouse

### AC-3.10: Modal - Focus Trap

**Test Scenario:** Verify modal traps focus

**Given:** A modal is open
**When:** The user presses Tab
**Then:**
- [ ] Focus cycles through focusable elements in the modal
- [ ] Focus does not move to elements behind the modal
- [ ] Shift+Tab cycles backward
- [ ] First and last focusable elements wrap focus

**Test Method:** Accessibility test

### AC-3.11: Modal - Non-Dismissible

**Test Scenario:** Verify non-dismissible modal behavior

**Given:** A non-dismissible modal is open (e.g., required action)
**When:** The user tries to close it
**Then:**
- [ ] Escape key does not close the modal
- [ ] Clicking backdrop does not close the modal
- [ ] Only explicit action buttons can close it

**Test Method:** E2E test

---

## AC-4: Page-Specific Layouts

### AC-4.1: Dashboard Home Page

**Test Scenario:** Verify dashboard home displays correctly

**Given:** An authenticated user accesses `/dashboard`
**When:** The page renders
**Then:**
- [ ] Welcome message includes user's name
- [ ] Quick stats cards are displayed (e.g., "5 Reports this month")
- [ ] Recent reports list shows last 5 reports
- [ ] Quick action buttons: "Generate Report", "Create Template"
- [ ] If user has subscription, usage meter is displayed
- [ ] On mobile, cards stack vertically
- [ ] On desktop, cards use a 2-3 column grid
- [ ] "View all reports" link navigates to `/reports`

**Test Method:** E2E test with authenticated session

### AC-4.2: Profile Page

**Test Scenario:** Verify profile page displays and updates correctly

**Given:** An authenticated user accesses `/dashboard/profile`
**When:** The page renders
**Then:**
- [ ] User avatar is displayed with "Change" button
- [ ] User name is displayed in an editable input
- [ ] User email is displayed (read-only)
- [ ] "Change email" link is present
- [ ] Account creation date is displayed
- [ ] Save button is disabled initially

**When:** The user changes their name
**Then:**
- [ ] Save button becomes enabled
- [ ] Clicking Save updates the profile
- [ ] Success toast is displayed
- [ ] Updated name is reflected in the header

**Test Method:** E2E test with form interaction

### AC-4.3: Settings Page

**Test Scenario:** Verify settings page structure

**Given:** An authenticated user accesses `/settings`
**When:** The page renders
**Then:**
- [ ] Page is divided into sections:
  - Account settings
  - Preferences
  - Subscription
  - Danger zone
- [ ] Theme toggle is present and functional
- [ ] Notification preferences are present
- [ ] Current subscription plan is displayed
- [ ] "Change password" button opens a modal
- [ ] "Delete account" button opens a confirmation modal

**Test Method:** E2E test + visual verification

---

## AC-5: Responsive Design

### AC-5.1: Mobile Viewport (320px - 767px)

**Test Scenario:** Verify layout works on mobile devices

**Given:** A user accesses the app on a mobile device
**When:** Any page loads
**Then:**
- [ ] Layout is responsive and doesn't overflow horizontally
- [ ] Text is readable without zooming
- [ ] Touch targets are minimum 44x44px
- [ ] Sidebar becomes a drawer
- [ ] Header shows hamburger menu
- [ ] Cards stack vertically
- [ ] Footer links stack vertically

**Test Method:** Responsive design testing (multiple viewports)

### AC-5.2: Tablet Viewport (768px - 1023px)

**Test Scenario:** Verify layout works on tablets

**Given:** A user accesses the app on a tablet
**When:** Any page loads
**Then:**
- [ ] Sidebar may collapse to icon-only (with tooltips)
- [ ] Layout adapts between mobile and desktop states
- [ ] Touch targets remain 44x44px
- [ ] Cards may use 2-column grid

**Test Method:** Responsive design testing

### AC-5.3: Desktop Viewport (1024px+)

**Test Scenario:** Verify layout works on desktop

**Given:** A user accesses the app on a desktop
**When:** Any page loads
**Then:**
- [ ] Sidebar is persistent and fully expanded
- [ ] Layout uses available space efficiently
- [ ] Content has max-width for readability
- [ ] Multi-column grids are used where appropriate

**Test Method:** Visual regression test

---

## AC-6: Accessibility

### AC-6.1: Keyboard Navigation

**Test Scenario:** Verify all interactive elements are keyboard accessible

**Given:** A user navigates using only the keyboard
**When:** The user presses Tab
**Then:**
- [ ] Focus moves through all interactive elements in logical order
- [ ] Focus indicators are visible and clear (outline or custom style)
- [ ] Skip to main content link is available (optional)
- [ ] Modals trap focus correctly
- [ ] Dropdowns can be opened and navigated with Enter/Space/Arrow keys

**Test Method:** Manual keyboard testing + automated accessibility test

### AC-6.2: Screen Reader Support

**Test Scenario:** Verify app is screen reader friendly

**Given:** A user uses a screen reader
**When:** The user navigates the app
**Then:**
- [ ] Page structure is semantic (header, nav, main, footer)
- [ ] Navigation links are properly labeled
- [ ] Icon-only buttons have aria-label or aria-labelledby
- [ ] Loading states announce "Loading" to screen readers
- [ ] Error messages are announced
- [ ] Modal titles are announced when opened

**Test Method:** Screen reader testing (NVDA, JAWS, VoiceOver)

### AC-6.3: Color Contrast

**Test Scenario:** Verify color contrast meets WCAG 2.1 AA

**Given:** The application is rendered
**When:** Text is displayed on backgrounds
**Then:**
- [ ] Normal text has contrast ratio ≥ 4.5:1
- [ ] Large text (18pt+) has contrast ratio ≥ 3:1
- [ ] UI components have contrast ratio ≥ 3:1
- [ ] Focus indicators have contrast ratio ≥ 3:1

**Test Method:** Automated contrast checker + Lighthouse

### AC-6.4: Reduced Motion

**Test Scenario:** Verify animations respect prefers-reduced-motion

**Given:** A user has "prefers-reduced-motion" enabled
**When:** The page loads or animations trigger
**Then:**
- [ ] Animations are disabled or reduced
- [ ] Transitions are instant or very short
- [ ] Functionality is not broken

**Test Method:** Test with prefers-reduced-motion enabled

---

## AC-7: Performance

### AC-7.1: Core Web Vitals

**Test Scenario:** Verify Core Web Vitals meet targets

**Given:** The application is deployed
**When:** PageSpeed Insights or Lighthouse is run
**Then:**
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Lighthouse Performance score ≥ 90

**Test Method:** Lighthouse CI in GitHub Actions

### AC-7.2: Navigation Performance

**Test Scenario:** Verify client-side navigation is fast

**Given:** An authenticated user on the dashboard
**When:** The user clicks a navigation link
**Then:**
- [ ] Navigation completes in < 200ms
- [ ] Page content updates smoothly
- [ ] No full page refresh occurs

**Test Method:** Performance profiling

### AC-7.3: Bundle Size

**Test Scenario:** Verify JavaScript bundle is optimized

**Given:** The application is built for production
**When:** Build completes
**Then:**
- [ ] Initial JavaScript bundle < 200KB (gzipped)
- [ ] CSS bundle < 50KB (gzipped)
- [ ] Code splitting is used for routes
- [ ] Tree shaking removes unused code

**Test Method:** Bundle analysis (next build)

---

## AC-8: Integration with Existing Features

### AC-8.1: Authentication Integration

**Test Scenario:** Verify integration with Feature 1.4 (Supabase Auth)

**Given:** The application uses Supabase Auth
**When:** A user authenticates
**Then:**
- [ ] User information is fetched from AuthProvider
- [ ] User avatar and name display correctly
- [ ] Protected routes redirect unauthenticated users
- [ ] Logout button calls Supabase signOut

**Test Method:** E2E test with authentication flow

### AC-8.2: Billing Integration (Future)

**Test Scenario:** Verify integration with Feature 1.5 (Stripe)

**Given:** A user has an active subscription
**When:** The user menu opens
**Then:**
- [ ] Subscription plan badge is displayed
- [ ] "Billing" link navigates to billing dashboard

**Given:** A user accesses the dashboard home
**When:** The page renders
**Then:**
- [ ] Usage meter displays current usage
- [ ] Warnings display if approaching limits

**Test Method:** E2E test with subscription data (mocked initially)

---

## AC-9: Cross-Browser Compatibility

### AC-9.1: Modern Browsers

**Test Scenario:** Verify app works in modern browsers

**Given:** The application is accessed in different browsers
**When:** A user interacts with the app
**Then:**
- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)

**Test Method:** Cross-browser testing (BrowserStack or manual)

---

## AC-10: Visual Regression

### AC-10.1: Component Visual Tests

**Test Scenario:** Verify components match design specifications

**Given:** Components are rendered in isolation
**When:** Visual regression tests run
**Then:**
- [ ] Header matches design
- [ ] Sidebar matches design
- [ ] Navigation items match design
- [ ] User menu matches design
- [ ] Toast notifications match design
- [ ] Modals match design
- [ ] Buttons match design
- [ ] Cards match design

**Test Method:** Percy or Chromatic visual regression testing

---

## Testing Checklist

### Manual Testing

- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Test on tablet
- [ ] Test with keyboard navigation
- [ ] Test with screen reader
- [ ] Test with zoom (up to 200%)
- [ ] Test with prefers-reduced-motion
- [ ] Test with slow network (throttled)

### Automated Testing

- [ ] Unit tests pass (components, utilities)
- [ ] Integration tests pass (layouts, navigation)
- [ ] E2E tests pass (user flows)
- [ ] Accessibility tests pass (axe, Lighthouse)
- [ ] Visual regression tests pass
- [ ] Performance tests pass (Lighthouse CI)

### Code Quality

- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no errors
- [ ] Prettier formatting applied
- [ ] All components have prop types
- [ ] Test coverage ≥ 80%

---

## Success Criteria

The feature is considered complete when:

1. ✅ All acceptance criteria pass
2. ✅ All automated tests pass
3. ✅ Manual testing checklist complete
4. ✅ Lighthouse scores meet targets (Performance ≥90, Accessibility ≥95)
5. ✅ No critical or high-priority bugs
6. ✅ Code review approved
7. ✅ Documentation updated
8. ✅ User can navigate the app seamlessly on all devices

---

## Notes

- Some tests may be deferred until Feature 1.5 (Stripe) is complete (e.g., usage meter, subscription badge)
- Visual regression tests require baseline images to be captured
- E2E tests should use a test database with seed data
- Performance tests should run on a consistent environment (CI)
