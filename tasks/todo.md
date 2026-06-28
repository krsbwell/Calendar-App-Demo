# Calendar App — Tasks & Acceptance Criteria

## Task 1: HTML Skeleton & CSS Foundation

### Sub-tasks
- [x] Create `index.html` with HTML5 boilerplate and viewport meta tag
- [x] Create `css/styles.css` with CSS custom properties (color tokens)
- [x] Add semantic HTML: `<header>`, `#day-headers`, `#calendar-grid`
- [x] Add modal structure: overlay, dialog, form fields, color swatches, action buttons
- [x] Apply CSS reset, flex header, 7-column CSS Grid for calendar and day-header row

### Acceptance Criteria
- [ ] Opening `index.html` in Chrome/Firefox shows a page with no console errors
- [ ] The header renders with Today, ‹, and › buttons and a title area
- [ ] A 7-column grid area is visible below the day-of-week header row
- [ ] The CSS file loads (Network tab shows 200 for `styles.css`)

---

## Task 2: Calendar Grid Rendering

### Sub-tasks
- [x] Implement `getDaysInMonth(year, month)`
- [x] Implement `getFirstDayOfWeek(year, month)`
- [x] Implement `formatDateStr(year, month, day)` (zero-padded, no `toISOString`)
- [x] Implement `buildGridCells(year, month)` — always 42 cells, pads prev/next month days
- [x] Implement `renderCalendar()` — clears grid, renders cells, updates month label
- [x] Highlight today's cell distinctly (colored day number circle)
- [x] Dim outside-month days

### Acceptance Criteria
- [ ] Current month renders with the correct number of days
- [ ] Day 1 falls on the correct day of the week (cross-check with a real calendar)
- [ ] Today's date shows a filled circle on the day number
- [ ] Days from the previous and next month appear in the first/last rows, visually dimmed
- [ ] Grid always has exactly 6 rows (42 cells)

---

## Task 3: Month Navigation

### Sub-tasks
- [x] Implement `prevMonth()` with Jan→Dec year-wrap
- [x] Implement `nextMonth()` with Dec→Jan year-wrap
- [x] Implement `goToToday()` resetting to current month
- [x] Wire buttons: `#btn-prev`, `#btn-next`, `#btn-today`

### Acceptance Criteria
- [ ] Clicking `›` advances to the next month; month label updates
- [ ] Clicking `‹` goes back one month; clicking it 12 times from any month returns to the same month one year prior
- [ ] January → ‹ → shows December of the previous year
- [ ] Clicking "Today" from any month returns to the current month and year
- [ ] Day-of-week alignment is correct in every navigated month

---

## Task 4: localStorage Persistence

### Sub-tasks
- [x] Implement `loadEvents()` — reads and parses `calendar_events` from localStorage; falls back to `[]`
- [x] Implement `saveEvents()` — serializes events array to JSON in localStorage
- [x] Implement `generateId()` — returns `"evt_" + timestamp + random 4-digit suffix`
- [x] Call `loadEvents()` on app startup

### Acceptance Criteria
- [ ] App loads without errors when localStorage has no data
- [ ] After adding an event, DevTools → Application → Local Storage shows `calendar_events` with valid JSON
- [ ] The data survives a hard page refresh (F5)
- [ ] Closing and reopening `index.html` (same browser) retains all events
- [ ] Corrupt localStorage data (manually break the JSON) does not crash the app — it silently resets to empty

---

## Task 5: Add-Event Modal (Open/Close)

### Sub-tasks
- [x] Implement `openAddModal(dateStr)` — resets form, pre-fills date, shows overlay, focuses title
- [x] Implement `closeModal()` — hides overlay, clears errors, resets form
- [x] Wire cell click → `openAddModal(dateStr)`
- [x] Wire Cancel button, backdrop click, and Escape key → `closeModal()`

### Acceptance Criteria
- [ ] Clicking any current-month day cell opens the modal
- [ ] The Date field is pre-filled with the clicked day's date in `YYYY-MM-DD` format
- [ ] Clicking Cancel closes the modal and clears all fields
- [ ] Clicking the grey backdrop (outside the white dialog box) closes the modal
- [ ] Pressing Escape closes the modal from anywhere on the page
- [ ] The Title field receives focus when the modal opens

---

## Task 6: Form Validation & Create Event

### Sub-tasks
- [x] Implement `validateForm()` returning `{ valid, errors }`
- [x] Implement `isValidDate(str)` with round-trip check (catches Feb 30, Apr 31, etc.)
- [x] Validate: title non-empty, date non-empty + valid, end time > start time (when both set)
- [x] Implement `showErrors(errors)` and `clearErrors()`
- [x] Implement `buildEventFromForm()` and `createEvent(data)`
- [x] Implement `handleFormSubmit(e)` wired to form submit

### Acceptance Criteria
- [ ] Submitting the form with no title shows "Title is required" under the title field
- [ ] Submitting with no date shows "Date is required"
- [ ] Setting end time equal to or before start time shows a time error message
- [ ] Setting the date field to `2025-02-30` shows an invalid-date error
- [ ] All errors appear simultaneously when multiple fields are invalid
- [ ] A valid submission closes the modal with no error messages shown
- [ ] After a valid submission, the new event appears in localStorage

---

## Task 7: Event Pills in Calendar

### Sub-tasks
- [x] Implement `getEventsForDate(dateStr)` — filter + sort by start time (all-day events last)
- [x] Implement `renderEventPills(cell, dateStr)` — up to `MAX_PILLS = 3` pills, then "+N more"
- [x] On desktop: show time prefix + title in each pill; truncate with ellipsis
- [x] Apply 6 color classes: `.evt-blue`, `.evt-green`, `.evt-red`, `.evt-orange`, `.evt-purple`, `.evt-teal`

### Acceptance Criteria
- [ ] A saved event appears as a colored pill on its correct calendar day
- [ ] The pill shows the start time (if set) followed by the event title
- [ ] Long titles are truncated with `…` and do not overflow the cell
- [ ] Adding 4 events to the same day shows 3 pills + "+1 more"
- [ ] Adding 6 events shows 3 pills + "+3 more"
- [ ] Each of the 6 color options renders a visually distinct pill

---

## Task 8: Edit & Delete Events

### Sub-tasks
- [x] Implement `openEditModal(ev)` — populates all fields, shows Delete button
- [x] Implement `updateEvent(id, data)` — finds by id, replaces in array, saves
- [x] Implement `deleteEvent(id)` — filters out by id, saves, closes modal, re-renders
- [x] Wire pill click → `openEditModal(ev)`
- [x] Wire Delete button → `deleteEvent(editingId)`

### Acceptance Criteria
- [ ] Clicking an event pill opens the modal with all fields pre-populated (title, date, times, color, description)
- [ ] The modal title reads "Edit Event" (not "Add Event")
- [ ] The Delete button is visible in edit mode and hidden in add mode
- [ ] Editing the title and clicking Save shows the updated title in the calendar
- [ ] Clicking Delete removes the event from both the calendar grid and localStorage immediately
- [ ] After deleting the last event on a day, no pill container is shown for that cell

---

## Task 9: Responsive UI (Mobile)

### Sub-tasks
- [x] Add `@media (max-width: 767px)` breakpoint
- [x] Reduce cell `min-height` (64px at ≤767px, 52px at ≤480px)
- [x] Convert event pills to 8×8 px colored dot circles on mobile
- [x] Modal slides up from bottom on mobile (`align-items: flex-end`; `border-radius: 14px 14px 0 0`)
- [x] Collapse two-column time row to single column on mobile

### Acceptance Criteria
- [ ] At 375px viewport width (iPhone SE), calendar cells show colored dots instead of text pills
- [ ] The modal appears as a bottom sheet on mobile (slides up, rounded top corners)
- [ ] Start time and End time fields stack vertically on mobile
- [ ] All form fields are fully usable without horizontal scrolling on a 375px screen
- [ ] On desktop (≥768px), text pills with title and time are visible in cells

---

## Task 10: Accessibility & Keyboard Support

### Sub-tasks
- [x] Implement `trapFocus(e)` — Tab/Shift+Tab cycles only within modal focusable elements
- [x] Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"` to modal overlay
- [x] Add `role="grid"` and `aria-label` to calendar grid
- [x] Add `role="button"`, `tabindex="0"`, and `aria-label` to event pills
- [x] Add keyboard handler (`Enter`/`Space`) to event pills
- [x] Add `aria-label` to `#btn-prev` and `#btn-next`

### Acceptance Criteria
- [ ] Pressing Tab while the modal is open cycles through modal fields only — focus does not escape to the page behind
- [ ] Pressing Shift+Tab from the first focusable element in the modal moves focus to the last
- [ ] Event pills in the calendar are reachable and activatable via keyboard (Tab → Enter)
- [ ] Screen reader announces the modal dialog title when it opens
- [ ] Screen reader announces validation errors (via `role="alert"` on error spans)

---

## Task 11: Demo Seed Data

### Sub-tasks
- [x] Implement `seedDemoData()` in `js/app.js`
- [x] Guard with `localStorage.getItem('calendar_seeded')` — skip if already run
- [x] 6 hardcoded sample events (title, color, times) spread across days 3, 7, 10, 14, 18, 22
- [x] Clamp each day to `getDaysInMonth()` so short months (e.g. February) don't produce invalid dates
- [x] Call `seedDemoData()` in `init()` after `currentYear`/`currentMonth` are set
- [x] Set `localStorage.setItem('calendar_seeded', '1')` after seeding

### Acceptance Criteria
- [ ] Opening `index.html` for the first time (no prior localStorage) shows 6 events across the current month
- [ ] Refreshing the page keeps the seed events without duplicating them
- [ ] Manually deleting all seed events and refreshing does **not** re-add them
- [ ] Opening the app in February (28 days) correctly clamps days 22 and below without error
- [ ] DevTools shows `calendar_seeded = "1"` in localStorage after first load

---

## Task 12: Dark Mode Toggle

### Sub-tasks
- [x] Add `<button id="btn-theme" aria-label="Switch to dark mode">☽</button>` to `#calendar-header` in `index.html`
- [x] Add `[data-theme="dark"]` CSS variable overrides in `css/styles.css` (`--color-bg`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-today-bg`, `--color-weekend`, `--color-outside`)
- [x] Add dark-mode selector overrides for hardcoded hover/input colors in `css/styles.css`
- [x] Add `#btn-theme` styles (pill shape, `margin-left: auto` to push to far right)
- [x] Implement `loadTheme()` — reads `calendar_theme` from localStorage, sets `data-theme` on `<html>`, syncs button icon
- [x] Implement `toggleTheme()` — flips `data-theme`, saves to localStorage
- [x] Implement `syncThemeButton()` — sets button text to ☀ (dark mode) or ☽ (light mode) and updates `aria-label`
- [x] Wire `#btn-theme` click → `toggleTheme()` in `init()`
- [x] Call `loadTheme()` in `init()` before `renderCalendar()`

### Acceptance Criteria
- [ ] A ☽ button appears at the far right of the header in light mode
- [ ] Clicking it switches the entire page to dark mode; button changes to ☀
- [ ] Dark mode provides legible contrast for calendar cells, event pills, modal, and form inputs
- [ ] Form inputs (`date`, `time`, `text`, `textarea`) use dark styling (no white flash)
- [ ] Refreshing in dark mode stays in dark mode (preference read from localStorage)
- [ ] Clicking ☀ returns to light mode; button changes back to ☽
- [ ] `aria-label` on the button reads the correct next action ("Switch to dark mode" / "Switch to light mode")

---

## Task 13: Favicon & README

### Sub-tasks
- [x] Create `favicon.svg` — SVG calendar icon with blue header strip and day dots
- [x] Add `<link rel="icon" href="favicon.svg" type="image/svg+xml">` to `<head>` in `index.html`
- [x] Create `README.md` with: project description, feature list, how to run (open `index.html`), keyboard shortcuts table, localStorage key reference, event object shape, file structure tree, browser support section

### Acceptance Criteria
- [ ] Browser tab shows the calendar icon (blue header, dots)
- [ ] `README.md` renders cleanly in GitHub markdown or a local markdown viewer
- [ ] README feature list includes dark mode and demo seed data
- [ ] README keyboard shortcuts table covers Escape, Tab/Shift+Tab, and Enter/Space on pills
- [ ] README localStorage section documents all three keys: `calendar_events`, `calendar_seeded`, `calendar_theme`

---

## Summary Checklist

| #  | Task                             | Implemented | Verified |
|----|----------------------------------|-------------|----------|
|  1 | HTML Skeleton & CSS Foundation   | ✅           | [ ]      |
|  2 | Calendar Grid Rendering          | ✅           | [ ]      |
|  3 | Month Navigation                 | ✅           | [ ]      |
|  4 | localStorage Persistence         | ✅           | [ ]      |
|  5 | Add-Event Modal (Open/Close)     | ✅           | [ ]      |
|  6 | Form Validation & Create Event   | ✅           | [ ]      |
|  7 | Event Pills in Calendar          | ✅           | [ ]      |
|  8 | Edit & Delete Events             | ✅           | [ ]      |
|  9 | Responsive UI (Mobile)           | ✅           | [ ]      |
| 10 | Accessibility & Keyboard Support | ✅           | [ ]      |
| 11 | Demo Seed Data                   | ✅           | [ ]      |
| 12 | Dark Mode Toggle                 | ✅           | [ ]      |
| 13 | Favicon & README                 | ✅           | [ ]      |
