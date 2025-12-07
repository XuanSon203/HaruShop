# 404 Error Pages

## Client 404 Page (`NotFound.jsx`)

This component handles 404 errors for client-side routes that don't exist.

### Features:
- Clean, user-friendly design
- Navigation options (Home, Back, Search)
- Contact support link
- Responsive design

### Usage:
Automatically displayed when a client route doesn't exist.

## Admin 404 Page (`AdminNotFound.jsx`)

This component handles 404 errors for admin-side routes that don't exist.

### Features:
- Professional admin-style design
- Navigation options (Dashboard, Back, Settings)
- Helpful suggestions for admin users
- Card-based layout

### Usage:
Automatically displayed when an admin route doesn't exist.

## Route Configuration

Both 404 pages are configured in `src/routes/index.route.jsx` with catch-all routes (`path: "*"`):

- Client routes: Shows `NotFound` component
- Admin routes: Shows `AdminNotFound` component
- Global fallback: Shows `NotFound` component for any unmatched routes
