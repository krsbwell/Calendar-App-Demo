'use strict';

const STORAGE_KEY = 'calendar_events';
const MAX_PILLS = 3;
const MOBILE_MAX_DOTS = 5;
const MOBILE_BREAKPOINT = 767;

let currentYear;
let currentMonth;
let events = [];
let editingId = null;

// ===== LocalStorage =====

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    events = Array.isArray(parsed) ? parsed : [];
  } catch {
    events = [];
  }
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function generateId() {
  return 'evt_' + Date.now() + '_' + (Math.floor(Math.random() * 9000) + 1000);
}

// ===== Calendar Math =====

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function getEventsForDate(dateStr) {
  return events
    .filter(e => e.date === dateStr)
    .sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
}

function buildGridCells(year, month, strict = false) {
  const firstDay = getFirstDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const cells = [];

  // Pad start with trailing days of previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ year: prevYear, month: prevMonth, day: daysInPrev - i, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, isCurrentMonth: true });
  }

  // Pad end with leading days of next month — variable rows (5 or 6 weeks)
  const totalCells = strict
    ? Math.ceil((firstDay + daysInMonth) / 7) * 7
    : 42;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear  = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < totalCells) {
    cells.push({ year: nextYear, month: nextMonth, day: nextDay++, isCurrentMonth: false });
  }

  return cells;
}

// ===== Rendering =====

function isMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function getTodayStr() {
  const t = new Date();
  return formatDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  document.getElementById('month-label').textContent = formatMonthLabel(currentYear, currentMonth);

  const todayStr = getTodayStr();
  const cells = buildGridCells(currentYear, currentMonth, true);

  cells.forEach(({ year, month, day, isCurrentMonth }) => {
    const dateStr = formatDateStr(year, month, day);
    grid.appendChild(buildDayCell(dateStr, day, isCurrentMonth, dateStr === todayStr));
  });

  renderMiniCalendar();
}

function renderMiniCalendar() {
  const labelEl = document.getElementById('mini-cal-label');
  const gridEl  = document.getElementById('mini-cal-grid');
  if (!labelEl || !gridEl) return;

  labelEl.textContent = new Date(currentYear, currentMonth, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });

  gridEl.innerHTML = '';
  const todayStr = getTodayStr();
  const cells = buildGridCells(currentYear, currentMonth);

  cells.forEach(({ year, month, day, isCurrentMonth }) => {
    const dateStr = formatDateStr(year, month, day);
    const cell = document.createElement('div');
    cell.className = 'mini-day';
    if (!isCurrentMonth) cell.classList.add('mini-outside');
    if (dateStr === todayStr) cell.classList.add('mini-today');
    cell.textContent = day;
    cell.setAttribute('aria-label', dateStr);
    cell.addEventListener('click', () => {
      currentYear  = year;
      currentMonth = month;
      renderCalendar();
      if (isCurrentMonth) openAddModal(dateStr);
    });
    gridEl.appendChild(cell);
  });
}

function buildDayCell(dateStr, day, isCurrentMonth, isToday) {
  const cell = document.createElement('div');
  cell.className = 'day-cell';
  cell.setAttribute('role', 'gridcell');
  cell.setAttribute('aria-label', dateStr);

  if (!isCurrentMonth) cell.classList.add('outside');
  if (isToday) cell.classList.add('today');

  // Weekend detection from the date string itself (avoids any month ambiguity)
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  if (dow === 0 || dow === 6) cell.classList.add('weekend');

  const numEl = document.createElement('span');
  numEl.className = 'day-number';
  if (day === 1) {
    const [y, m] = dateStr.split('-').map(Number);
    const abbr = new Date(y, m - 1, 1).toLocaleString('default', { month: 'short' });
    numEl.textContent = abbr + ' ' + day;
    numEl.classList.add('day-number--month');
  } else {
    numEl.textContent = day;
  }
  cell.appendChild(numEl);

  renderEventPills(cell, dateStr);

  if (isCurrentMonth) {
    cell.addEventListener('click', () => openAddModal(dateStr));
  }

  return cell;
}

function renderEventPills(cell, dateStr) {
  const dayEvents = getEventsForDate(dateStr);
  if (dayEvents.length === 0) return;

  const mobile = isMobile();
  const maxShow = mobile ? MOBILE_MAX_DOTS : MAX_PILLS;
  const shown = dayEvents.slice(0, maxShow);
  const overflow = dayEvents.length - shown.length;

  const container = document.createElement('div');
  container.className = 'event-pills-container';

  shown.forEach(ev => {
    const pill = document.createElement('div');
    pill.className = `event-pill evt-${ev.color}`;

    if (!mobile) {
      const prefix = ev.startTime ? ev.startTime + ' ' : '';
      pill.textContent = prefix + ev.title;
    }

    pill.setAttribute('title', ev.title);
    pill.setAttribute('role', 'button');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('aria-label', `Edit: ${ev.title}`);

    pill.addEventListener('click', e => { e.stopPropagation(); openEditModal(ev); });
    pill.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openEditModal(ev); }
    });

    container.appendChild(pill);
  });

  if (overflow > 0) {
    const more = document.createElement('div');
    more.className = 'evt-overflow';
    more.textContent = `+${overflow} more`;
    container.appendChild(more);
  }

  cell.appendChild(container);
}

// ===== Modal =====

function openAddModal(dateStr) {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Event';
  resetForm();
  document.getElementById('event-date').value = dateStr;
  document.getElementById('btn-delete').classList.add('hidden');
  showModal();
  document.getElementById('event-title').focus();
}

function openEditModal(ev) {
  editingId = ev.id;
  document.getElementById('modal-title').textContent = 'Edit Event';
  resetForm();
  document.getElementById('event-id').value = ev.id;
  document.getElementById('event-title').value = ev.title;
  document.getElementById('event-date').value = ev.date;
  document.getElementById('event-start').value = ev.startTime || '';
  document.getElementById('event-end').value = ev.endTime || '';
  document.getElementById('event-desc').value = ev.description || '';

  const colorInput = document.querySelector(`input[name="event-color"][value="${ev.color}"]`);
  if (colorInput) colorInput.checked = true;

  document.getElementById('btn-delete').classList.remove('hidden');
  showModal();
  document.getElementById('event-title').focus();
}

function showModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  clearErrors();
  resetForm();
  editingId = null;
}

function resetForm() {
  document.getElementById('event-form').reset();
  // form.reset() restores the checked attribute from HTML (blue is default)
}

// ===== Focus Trap =====

function trapFocus(e) {
  const modal = document.getElementById('modal');
  const focusableSelectors = 'button, input, textarea, [tabindex="0"]';
  const focusable = Array.from(modal.querySelectorAll(focusableSelectors)).filter(el => {
    return !el.classList.contains('hidden') && !el.closest('.hidden');
  });

  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

// ===== Validation =====

function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

function validateForm() {
  const title     = document.getElementById('event-title').value.trim();
  const date      = document.getElementById('event-date').value;
  const startTime = document.getElementById('event-start').value;
  const endTime   = document.getElementById('event-end').value;
  const errors    = {};

  if (!title) {
    errors.title = 'Title is required';
  }

  if (!date) {
    errors.date = 'Date is required';
  } else if (!isValidDate(date)) {
    errors.date = 'Please enter a valid date';
  }

  if (startTime && endTime && endTime <= startTime) {
    errors.time = 'End time must be after start time';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function showErrors(errors) {
  document.getElementById('err-title').textContent = errors.title || '';
  document.getElementById('err-date').textContent  = errors.date  || '';
  document.getElementById('err-time').textContent  = errors.time  || '';

  if (errors.title) document.getElementById('event-title').classList.add('invalid');
  else              document.getElementById('event-title').classList.remove('invalid');

  if (errors.date)  document.getElementById('event-date').classList.add('invalid');
  else              document.getElementById('event-date').classList.remove('invalid');
}

function clearErrors() {
  ['err-title', 'err-date', 'err-time'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  ['event-title', 'event-date'].forEach(id => {
    document.getElementById(id).classList.remove('invalid');
  });
}

// ===== Event CRUD =====

function buildEventFromForm() {
  const color = (document.querySelector('input[name="event-color"]:checked') || {}).value || 'blue';
  return {
    title:       document.getElementById('event-title').value.trim(),
    date:        document.getElementById('event-date').value,
    startTime:   document.getElementById('event-start').value || null,
    endTime:     document.getElementById('event-end').value   || null,
    description: document.getElementById('event-desc').value.trim(),
    color,
  };
}

function createEvent(data) {
  events.push({ id: generateId(), ...data });
  saveEvents();
}

function updateEvent(id, data) {
  const idx = events.findIndex(e => e.id === id);
  if (idx !== -1) {
    events[idx] = { id, ...data };
    saveEvents();
  }
}

function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  saveEvents();
  closeModal();
  renderCalendar();
}

function handleFormSubmit(e) {
  e.preventDefault();
  const { valid, errors } = validateForm();
  if (!valid) {
    showErrors(errors);
    return;
  }
  clearErrors();
  const data = buildEventFromForm();
  if (editingId) {
    updateEvent(editingId, data);
  } else {
    createEvent(data);
  }
  closeModal();
  renderCalendar();
}

// ===== Seed Demo Data =====

function seedDemoData() {
  if (localStorage.getItem('calendar_seeded')) return;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const seeds = [
    { day: 3,  title: 'Team standup',         color: 'blue',   startTime: '09:00', endTime: '09:30',  description: '' },
    { day: 7,  title: 'Dentist appointment',  color: 'red',    startTime: '14:00', endTime: '15:00',  description: '' },
    { day: 10, title: 'Project deadline',     color: 'orange', startTime: null,    endTime: null,     description: 'Final deliverable due' },
    { day: 14, title: 'Lunch with Sarah',     color: 'green',  startTime: '12:30', endTime: '13:30',  description: '' },
    { day: 18, title: 'Code review',          color: 'purple', startTime: '15:00', endTime: '16:00',  description: '' },
    { day: 22, title: 'Weekly retrospective', color: 'teal',   startTime: '10:00', endTime: '11:00',  description: '' },
  ];

  seeds.forEach(({ day, ...data }) => {
    events.push({
      id: generateId(),
      date: formatDateStr(currentYear, currentMonth, Math.min(day, daysInMonth)),
      ...data,
    });
  });

  saveEvents();
  localStorage.setItem('calendar_seeded', '1');
}

// ===== Theme =====

function loadTheme() {
  // Dark is default (no attribute). Light is opt-in via data-theme="light".
  if (localStorage.getItem('calendar_theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  syncThemeButton();
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('calendar_theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('calendar_theme', 'light');
  }
  syncThemeButton();
}

function syncThemeButton() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  btn.textContent = isLight ? '☽' : '☀';
  btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
}

// ===== Navigation =====

function prevMonth() {
  if (currentMonth === 0) { currentMonth = 11; currentYear--; }
  else { currentMonth--; }
  renderCalendar();
}

function nextMonth() {
  if (currentMonth === 11) { currentMonth = 0; currentYear++; }
  else { currentMonth++; }
  renderCalendar();
}

function goToToday() {
  const today = new Date();
  currentYear  = today.getFullYear();
  currentMonth = today.getMonth();
  renderCalendar();
}

// ===== Init =====

function init() {
  loadEvents();

  const today = new Date();
  currentYear  = today.getFullYear();
  currentMonth = today.getMonth();

  // Populate the logo badge with today's date
  const logoDateEl = document.getElementById('logo-date');
  if (logoDateEl) logoDateEl.textContent = today.getDate();

  seedDemoData();
  loadTheme();
  renderCalendar();

  document.getElementById('btn-prev').addEventListener('click', prevMonth);
  document.getElementById('btn-next').addEventListener('click', nextMonth);
  document.getElementById('btn-today').addEventListener('click', goToToday);
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('mini-prev').addEventListener('click', prevMonth);
  document.getElementById('mini-next').addEventListener('click', nextMonth);

  // + Create opens add modal for today
  const btnCreate = document.getElementById('btn-create');
  if (btnCreate) btnCreate.addEventListener('click', () => openAddModal(getTodayStr()));

  document.getElementById('event-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-delete').addEventListener('click', () => {
    if (editingId) deleteEvent(editingId);
  });

  // Close on backdrop click
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Escape closes modal; focus trap on Tab
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
  document.getElementById('modal').addEventListener('keydown', e => {
    if (e.key === 'Tab') trapFocus(e);
  });

  // Re-render on resize to swap between pills and dots
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCalendar, 150);
  });
}

document.addEventListener('DOMContentLoaded', init);
