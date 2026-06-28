# Calendar App Demo

A clean, Google Calendar-style month view you can run straight from a single HTML file — no installs, no build step, no frameworks. Click any day to add an event, click an event to edit or delete it, and everything you create is saved automatically in your browser. It is built with plain HTML, CSS, and vanilla JavaScript so it is easy to read, tweak, and learn from.

**🔗 Live demo:** https://krsbwell.github.io/Calendar-App-Demo/

---

## 🖼️ Preview

<!-- TODO: Add your own screenshot here. Suggested: take a screenshot of the running app, save it as docs/screenshot.png, then uncomment the line below. -->
<!-- ![Calendar App Demo screenshot](docs/screenshot.png) -->

> _No screenshot yet — open the [live demo](https://krsbwell.github.io/Calendar-App-Demo/) to see it in action, or add your own image in the spot above._

---

## ✨ Features

- **Month-view calendar grid** that automatically uses 5 or 6 rows depending on the month, so there is never wasted space.
- **Add, edit, and delete events** through a simple popup form with title, date, start/end time, description, and color.
- **Optional times with validation** — add a start and end time, and the app makes sure the end time is after the start time.
- **Overflow indicator** — days with more than three events show a "+N more" label so the grid stays tidy.
- **Automatic saving** — your events stay in your browser between visits, with no account or server required.
- **Demo events pre-loaded** on your first visit so the calendar does not start empty.
- **Dark mode by default**, with a one-click light mode toggle (☀ / ☽) in the header that remembers your choice.
- **Google Calendar-style layout** — a full-width header with a logo badge showing today's date, plus a sidebar with a mini calendar, a "+ Create" button, and calendar list sections.
- **Mini calendar in the sidebar** with its own previous/next month navigation.
- **Month labels on the grid** — the first day of each month shows a short prefix (for example, "Jun 1" or "Jul 1") so month boundaries are easy to spot.
- **Six event colors** to choose from: blue, green, red, orange, purple, and teal.
- **Responsive design** — on small screens (≤767px) the sidebar hides, event pills shrink into colored dots, and the form slides up as a bottom sheet.
- **Accessibility built in** (targets WCAG 2.1 AA): a skip link, visible focus outlines, full keyboard navigation, screen-reader month announcements, focus restoration when closing the form, and human-readable labels on every date.

---

## ✅ Prerequisites

Almost none! You only need:

- A modern web browser (Chrome, Edge, Firefox, or Safari).
- _(Optional)_ [Python](https://www.python.org/downloads/) or any static file server, only if you prefer Option 2 below.

There is **no** Node.js, npm, or build tooling required.

---

## 🚀 Getting Started

This app is just static files — there is nothing to install.

### Option 1: Open the file directly (simplest)

1. Download or clone this project:
   ```bash
   git clone https://github.com/krsbwell/Calendar-App-Demo.git
   cd Calendar-App-Demo
   ```
2. Double-click **`index.html`**, or drag it into your web browser.

That's it. The calendar opens immediately and loads its demo events.

### Option 2: Run a small local server (optional)

Some browsers are stricter about files opened with `file://`. If anything looks off, serve the folder with any static server. For example, using Python:

```bash
# From the project folder:
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Just use the live version

The app is already deployed to GitHub Pages: **https://krsbwell.github.io/Calendar-App-Demo/**

---

## ⌨️ Keyboard Shortcuts

The calendar is fully usable without a mouse.

| Key | Where | What it does |
| --- | --- | --- |
| `Tab` / `Shift` + `Tab` | Anywhere | Move focus forward / backward through buttons, day cells, and events |
| `Enter` or `Space` | On a day cell | Open the "Add Event" form for that day |
| `Enter` or `Space` | On an event pill | Open the "Edit Event" form for that event |
| `Enter` or `Space` | On a mini-calendar day | Jump the calendar to that month and open the add form |
| `Tab` / `Shift` + `Tab` | Inside the form | Cycle through fields; focus is trapped so it stays inside the popup |
| `Escape` | While the form is open | Close the form without saving |

When you close the form, focus returns to wherever you were before you opened it.

---

## 📖 Example Usage

**Add an event**
1. Click any day in the grid (or press `Enter` on it).
2. Fill in a title — this is the only required field.
3. Optionally set a start and end time, a description, and a color.
4. Click **Save**. The event appears as a colored pill on that day.

**Edit or delete an event**
1. Click the event's pill in the grid (or press `Enter` on it).
2. Change any field and click **Save**, or click **Delete** to remove it.

**Switch to light mode**
- Click the ☀ button in the top-right of the header. Click it again (now ☽) to return to dark mode. Your choice is remembered.

**Jump around the calendar**
- Use the `‹` and `›` arrows or the **Today** button in the header, or the prev/next arrows on the mini calendar in the sidebar.

---

## 💾 Where Your Data Lives (localStorage)

Everything is stored in your browser's `localStorage`. Nothing is sent to a server. Clearing your browser data (or using private/incognito mode) will reset the app.

| Key | Purpose | Example value |
| --- | --- | --- |
| `calendar_events` | The full list of your events, stored as JSON | `[{"id":"evt_1719...","title":"Team standup",...}]` |
| `calendar_seeded` | A flag set after demo events are loaded, so they are only added once | `"1"` |
| `calendar_theme` | Your light/dark preference | `"light"` or `"dark"` |

> **Tip:** To start completely fresh, open your browser's developer tools, go to the localStorage panel, and delete these three keys (or run `localStorage.clear()` in the console).

---

## 🧩 Event Data Shape

Each event in `calendar_events` is an object with this structure:

```json
{
  "id": "evt_1719420000000_4821",
  "title": "Team standup",
  "date": "2026-06-03",
  "startTime": "09:00",
  "endTime": "09:30",
  "description": "Daily sync",
  "color": "blue"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Auto-generated, e.g. `evt_<timestamp>_<random>`. You do not set this. |
| `title` | string | Required. Up to 80 characters. |
| `date` | string | Required. Format `YYYY-MM-DD`. |
| `startTime` | string \| null | Format `HH:MM` (24-hour), or `null` if no time is set. |
| `endTime` | string \| null | Format `HH:MM` (24-hour), or `null`. Must be after `startTime` if both are set. |
| `description` | string | Optional. Up to 500 characters. |
| `color` | string | One of: `blue`, `green`, `red`, `orange`, `purple`, `teal`. |

---

## 📁 Project Structure

```
Calendar-App-Demo/
├── index.html        # App shell: header, sidebar, calendar grid, and the event form
├── css/
│   └── styles.css    # All styling: theme variables, 7-column grid, responsive rules
├── js/
│   └── app.js        # All logic: state, storage, rendering, CRUD, validation, theming
├── favicon.svg       # Browser tab icon (SVG calendar)
├── tasks/
│   └── todo.md       # Build checklist with acceptance criteria
├── .gitignore
└── README.md         # This file
```

---

## 🌐 Browser Support

Works in any modern, evergreen browser — Chrome, Edge, Firefox, and Safari. It relies on standard features like CSS Grid, CSS custom properties, the CSS `:has()` selector (used for color-swatch highlighting), and `localStorage`. For full support, use recent versions (Chrome 105+, Edge 105+, Firefox 121+, Safari 15.4+). Internet Explorer is not supported.

---

## 🤝 Contributing

This is a small demo project, but improvements are welcome. Because there is no build step, contributing is easy:

1. Edit `index.html`, `css/styles.css`, or `js/app.js`.
2. Refresh the page in your browser to see your changes.
3. Open a pull request describing what you changed.

---

## 📄 License

<!-- TODO: No license file was found in the project. Add one (for example, an MIT LICENSE file) if you want to set usage terms. -->

No license file is currently included. Add one if you intend to define how others may use this code.
