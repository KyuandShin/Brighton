# Task Progress Tracker

## Issues to Fix

### 1. 🧭 Sidebar Nav Bug
- [ ] Fix admin Dashboard lighting up when clicking Tutor Approvals
- [ ] Make nav highlight logic more robust

### 2. 🚫 Delete → Ban (Tutors & Students)
- [ ] Add `PATCH /api/admin/tutors/[id]/ban` endpoint (or add ban action to existing PATCH)
- [ ] Add `PATCH /api/admin/students/[id]/ban` endpoint
- [ ] Update admin tutors page: Delete → Ban button
- [ ] Update admin students page: Delete → Ban button
- [ ] Update sidebar and API routes to check `isBanned` status

### 3. 🎨 Reduce Pastel Colors (Professional UI)
- [ ] Replace pastel palette with professional-neutral colors in globals.css
- [ ] Update all admin pages to use professional styling
- [ ] Update sidebar styling

### 4. 🧪 Test Accounts Seed Script
- [ ] Create seed that generates:
  - [ ] Admin account (admin@brighton.com / password123)
  - [ ] Tutor account (tutor@brighton.com / password123) with profile, subjects, availability
  - [ ] Student account (student@brighton.com / password123) with profile

### 5. 🔧 Booking System Polish
- [ ] Verify booking flow works end-to-end
- [ ] Ensure proper notifications and status transitions