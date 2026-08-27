# Task 12 — Admin Panel UI (Amar Earning)

## Agent
full-stack-developer

## Goal
Create `/home/z/my-project/src/components/admin/admin-page.tsx` — a single-file, client-side admin panel that switches sub-views based on the `route.name` prop and consumes the existing admin APIs.

## Inputs / Context reviewed
- Router (`src/lib/router.ts`) — admin routes: `admin`, `admin-users`, `admin-jobs`, `admin-submissions`, `admin-withdrawals`, `admin-categories`, `admin-settings`.
- `useI18n()` returns `{ t, lang }`; `t` is `translations[lang]`.
- `useAuth()` returns `{ user, loading }`; `user.role` is `ADMIN` for admins.
- Format helpers: `formatMoney`, `toBn`, `formatDate`, `formatDateTime`, `timeAgo`.
- Existing patterns (`dashboard.tsx`, `my-jobs.tsx`, `withdraw.tsx`) use `DashboardLayout`, `Card`, `Tabs`, `EmptyState`, `LoadingState`, `toast` from sonner.
- shadcn/ui available: Card, Button, Input, Label, Badge, Tabs, Table*, Dialog*, Select*, Switch, Checkbox.
- `CategoryIcon` + `CATEGORY_ICON_NAMES` from `src/components/shared/category-icon.tsx` (icons: Share2, Globe, Smartphone, Table, PenLine, Briefcase).

## APIs (verified return shapes)
- `GET /api/admin/stats` → 8 stat fields.
- `GET /api/admin/users?search=&status=` + `PATCH` (`userId`, `action: suspend|activate`).
- `GET /api/admin/jobs?status=` + `PATCH` (`jobId`, `action: approve|reject|pause|activate|delete`).
- `GET /api/submissions?scope=admin` + `PATCH` (`submissionId`, `action: approve|reject`, `rejectReason`).
- `GET /api/withdrawals?scope=admin` + `PATCH` (`withdrawalId`, `action: approve|paid|reject`, `rejectReason`).
- `GET /api/admin/categories` + `POST {name, icon}` + `PATCH {categoryId, action: delete|update, name, icon}`.
- `GET /api/admin/settings` + `PATCH` with any subset of `{ websiteName, primaryColor, minWithdrawal, paymentMethods[], jobApprovalRequired, maintenanceMode }`.

## Plan
1. Single file with `AdminPage` as default export and helper sub-components in same file.
2. Admin layout: desktop sidebar (sticky) + mobile horizontal scroll tab bar.
3. Sub-views:
   - Dashboard: 8 stat cards grid.
   - Users: search + status filter + Table (desktop) / cards (mobile) + suspend/activate.
   - Jobs: status filter Tabs + cards with Approve/Reject/Pause/Activate/Delete (Dialog confirm for delete).
   - Submissions: status filter Tabs + cards with Approve/Reject (prompt for reject reason).
   - Withdrawals: cards with Approve/Mark Paid/Reject.
   - Categories: list + add form (name + icon select) + edit/delete.
   - Settings: form with websiteName, primaryColor (color input), minWithdrawal, paymentMethods checkboxes, jobApprovalRequired switch, maintenanceMode switch.
4. Toast feedback on mutations + refetch.
5. Loading & empty states.

## Decisions
- Self-contained sidebar (not reusing `DashboardLayout`) because admin routes don't share the user-dashboard nav.
- Use `useAuth()` to render an "access denied" block when not admin (the parent `page.tsx` already redirects, but defensive).
- `useEffect` to fetch on mount + when filter state changes.
- Money values use `formatMoney`, counts use `toBn`.
- No new files other than `admin-page.tsx`; no other files modified.

## Status
- In progress.
