# Calendar App Demo

A lightweight month-view calendar built with plain HTML, CSS, and vanilla JavaScript. No frameworks, no build step — open `index.html` in any modern browser and start using it.

## Features

- **Month grid** — 6-row fixed grid with prev/next month navigation and a Today shortcut
- **Add events** — click any day cell to open the event modal
- **Edit & delete events** — click any event pill to edit or remove it
- **Color labels** — choose from 6 colors per event (blue, green, red, orange, purple, teal)
- **Time support** — optional start and end times with validation
- **Overflow indicator** — days with more than 3 events show "+N more"
- **Persistent storage** — all events saved to `localStorage`; survive page refresh and browser restart
- **Dark mode** — toggle via the ☾ button in the header; preference is remembered
- **Responsive** — desktop shows text pills; mobile (≤767px) shows colored dots; modal becomes a bottom sheet

## Getting Started

1. Clone or download this repository
2. Open `index.html` directly in Chrome, Firefox, Edge, or Safari
3. No server, no `npm install`, no compilation needed

The calendar pre-loads six sample events on first launch so you can immediately see it in action.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close the event modal |
| `Tab` / `Shift+Tab` | Cycle focus within the modal (trapped) |
| `Enter` or `Space` on an event pill | Open the edit modal for that event |

## LocalStorage Keys

| Key | Value |
|-----|-------|
| `calendar_events` | JSON array of all event objects |
| `calendar_seeded` | `"1"` once demo data has been seeded (prevents re-seeding) |
| `calendar_theme` | `"dark"` or `"light"` (theme preference) |

### Event object shape

```json
{
  "id": "evt_1719561600000_4827",
  "title": "Team standup",
  "date": "2026-07-03",
  "startTime": "09:00",
  "endTime": "09:30",
  "description": "",
  "color": "blue"
}
```

## Project Structure

```
Calendar-App-Demo/
├── index.html        — App shell, modal markup, accessibility attributes
├── favicon.svg       — SVG calendar icon shown in the browser tab
├── css/
│   └── styles.css    — All styles: grid, pills, modal, dark mode, responsive
├── js/
│   └── app.js        — All logic: state, storage, rendering, CRUD, validation
└── tasks/
    └── todo.md       — Implementation checklist with acceptance criteria
```

## Browser Support

Requires a modern browser (Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+).  
Uses CSS `:has()` for color swatch selection highlighting and CSS custom properties for theming.
