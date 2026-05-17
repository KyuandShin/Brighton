# Task Progress

## ✅ Already Fixed (verified in code)
- [x] **Bug: Duplicate review** — `app/api/reviews/route.ts` lines 77-84 have `findFirst` check before create
- [x] **Bug: Reschedule drops status** — `app/api/bookings/[bookingId]/route.ts` lines 101-104 reset to PENDING on date change
- [x] **Bug: Auto-complete on every GET** — `app/api/bookings/route.ts` lines 23-34 only runs for TUTOR/ADMIN
- [x] **Bug: "Rate" button shows if review exists** — `app/dashboard/bookings/page.tsx` line 355 has `!booking.review` guard
- [x] **Bug: useCurrentUser skip=true** — `app/page.tsx` line 181 calls `useCurrentUser()` with no skip param
- [x] **Security: GET /api/tutors email** — User select only includes id/name/image/createdAt (no email)
- [x] **Security: GET /api/reviews auth** — Lines 7-10 have auth check, lines 27-28 conditional name exposure
- [x] **Security: Admin booking backdoor** — Lines 125-144 handle admin differently with dedicated profile
- [x] **Security: Session notes length** — Already has 5000 char limit enforced
- [x] **Performance: Stats/Featured caching** — Already has `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- [x] **Performance: Notifications polling** — `app/dashboard/layout.tsx` line 126 has `setInterval(fetchNotifications, 60_000)`
- [x] **UX: Mobile nav admin links** — `app/dashboard/layout.tsx` lines 420-435 include adminNavItems in mobile nav
- [x] **UX: Bookings tab counts** — Lines 203-204 show counts for all FILTER_TABS
- [x] **UX: alert() replaced with Toast** — Bookings page uses Toast component, ConfirmModal replaces confirm()
- [x] **UX: Hero uses router.push** — `app/page.tsx` line 433 uses `router.push()`
- [x] **UX: Classes pending bookings** — Lines 77-78 filter pending into separate section with "Awaiting Confirmation" badge
- [x] **Feature: Tutor conflict detection** — `app/api/bookings/route.ts` lines 178-188 check for double-booking
- [x] **Feature: Favorites page** — Already built out with full UI
- [x] **Feature: 24h cancellation policy** — `app/api/bookings/[bookingId]/route.ts` lines 71-78 enforce 24h buffer

## 🔧 Still Needs Implementation
- [ ] **Performance: averageRating on Tutor model** — Add `averageRating Float?` to schema, update on review create/delete
- [ ] **Performance: GET /api/tutors still loads ALL reviews** — Use averageRating field instead of loading reviews in-memory