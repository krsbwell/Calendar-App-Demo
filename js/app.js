'use strict';

const STORAGE_KEY = 'calendar_events';
const MAX_PILLS = 3;
const MOBILE_MAX_DOTS = 5;
const MOBILE_BREAKPOINT = 767;
const HOUR_PX = 60;
const VIEW_LABELS = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', schedule: 'Schedule', '4days': '4 days' };

let currentYear;
let currentMonth;
let currentDay;
let currentView = 'month';
let defaultView = 'month';
let weekStartDay = 0; // 0=Sunday, 1=Monday
let events = [];
let editingId = null;
let modalTrigger = null;
let showWeekends  = true;
let showDeclined  = true;
let showCompleted = true;

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
    .filter(e => {
      if (e.date !== dateStr) return false;
      if (e.status === 'declined'  && !showDeclined)  return false;
      if (e.status === 'completed' && !showCompleted) return false;
      return true;
    })
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

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ year: prevYear, month: prevMonth, day: daysInPrev - i, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, isCurrentMonth: true });
  }

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

function isWeekend(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return dow === 0 || dow === 6;
}

// ===== View Management =====

function setView(view) {
  currentView = view;
  const viewBtn = document.getElementById('btn-view-month');
  viewBtn.innerHTML = `${VIEW_LABELS[view] || 'Month'} <span class="dropdown-caret">&#9662;</span>`;
  document.querySelectorAll('.view-opt').forEach(btn => {
    btn.classList.toggle('view-opt-active', btn.dataset.view === view);
  });
  renderCalendar();
}

function clearTimeView() {
  const old = document.getElementById('time-view');
  if (old) old.remove();
}

// ===== Navigation =====

function navigateBy(dir) {
  switch (currentView) {
    case 'day': {
      const d = new Date(currentYear, currentMonth, currentDay + dir);
      currentYear = d.getFullYear(); currentMonth = d.getMonth(); currentDay = d.getDate();
      break;
    }
    case 'week': {
      const d = new Date(currentYear, currentMonth, currentDay + 7 * dir);
      currentYear = d.getFullYear(); currentMonth = d.getMonth(); currentDay = d.getDate();
      break;
    }
    case '4days': {
      const d = new Date(currentYear, currentMonth, currentDay + 4 * dir);
      currentYear = d.getFullYear(); currentMonth = d.getMonth(); currentDay = d.getDate();
      break;
    }
    case 'year':
      currentYear += dir;
      break;
    default:
      currentMonth += dir;
      if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
      if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  }
  renderCalendar();
}

function prevMonth() { navigateBy(-1); }
function nextMonth() { navigateBy(1); }

function goToToday() {
  const today = new Date();
  currentYear  = today.getFullYear();
  currentMonth = today.getMonth();
  currentDay   = today.getDate();
  renderCalendar();
}

// ===== Main Render Dispatcher =====

function renderCalendar() {
  clearTimeView();
  const dayHeaders = document.getElementById('day-headers');
  const grid = document.getElementById('calendar-grid');

  if (currentView === 'month') {
    dayHeaders.style.display = '';
    grid.style.display = '';
    renderMonthView();
  } else {
    dayHeaders.style.display = 'none';
    grid.style.display = 'none';
    if      (currentView === 'day')      renderDayView();
    else if (currentView === 'week')     renderWeekView();
    else if (currentView === '4days')    renderFourDayView();
    else if (currentView === 'year')     renderYearView();
    else if (currentView === 'schedule') renderScheduleView();
  }

  renderMiniCalendar();
}

// ===== Month View =====

function renderMonthView() {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  document.getElementById('month-label').textContent = formatMonthLabel(currentYear, currentMonth);
  const liveEl = document.getElementById('cal-live');
  if (liveEl) liveEl.textContent = formatMonthLabel(currentYear, currentMonth);

  const todayStr = getTodayStr();
  const cells = buildGridCells(currentYear, currentMonth, true);
  cells.forEach(({ year, month, day, isCurrentMonth }) => {
    const dateStr = formatDateStr(year, month, day);
    grid.appendChild(buildDayCell(dateStr, day, isCurrentMonth, dateStr === todayStr));
  });
}

// ===== Day / Week / 4-Day Time Grid =====

function renderTimeGrid(dates) {
  const main = document.getElementById('main');
  const timeView = document.createElement('div');
  timeView.id = 'time-view';

  // Column header row
  const hdr = document.createElement('div');
  hdr.className = 'tv-header';
  const gutterHdr = document.createElement('div');
  gutterHdr.className = 'tv-gutter-cell';
  hdr.appendChild(gutterHdr);

  const todayStr = getTodayStr();
  dates.forEach(dateStr => {
    const dt = new Date(dateStr + 'T00:00:00');
    const col = document.createElement('div');
    col.className = 'tv-day-hdr' + (dateStr === todayStr ? ' tv-today-hdr' : '');
    const dow = document.createElement('span');
    dow.className = 'tv-dow';
    dow.textContent = dt.toLocaleString('default', { weekday: 'short' });
    const num = document.createElement('span');
    num.className = 'tv-day-num' + (dateStr === todayStr ? ' tv-today-num' : '');
    num.textContent = dt.getDate();
    col.appendChild(dow);
    col.appendChild(num);
    hdr.appendChild(col);
  });
  timeView.appendChild(hdr);

  // Scrollable body
  const body = document.createElement('div');
  body.className = 'tv-body';
  const inner = document.createElement('div');
  inner.className = 'tv-inner';

  // Time gutter
  const gutter = document.createElement('div');
  gutter.className = 'tv-gutter';
  for (let h = 0; h < 24; h++) {
    const slot = document.createElement('div');
    slot.className = 'tv-gutter-slot';
    if (h > 0) {
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 || 12;
      slot.textContent = `${h12} ${ampm}`;
    }
    gutter.appendChild(slot);
  }
  inner.appendChild(gutter);

  // Day columns
  dates.forEach(dateStr => {
    const col = document.createElement('div');
    col.className = 'tv-day-col';

    for (let h = 0; h < 24; h++) {
      const cell = document.createElement('div');
      cell.className = 'tv-hour-cell';
      cell.addEventListener('click', () => openAddModal(dateStr));
      col.appendChild(cell);
    }

    getEventsForDate(dateStr).filter(ev => ev.startTime).forEach(ev => {
      const [sh, sm] = ev.startTime.split(':').map(Number);
      const endParts = ev.endTime ? ev.endTime.split(':').map(Number) : [sh + 1, sm];
      const [eh, em] = endParts;
      const startMin = sh * 60 + sm;
      const endMin   = eh * 60 + em;
      const pill = document.createElement('div');
      const statusCls = ev.status === 'declined' ? ' status-declined' : ev.status === 'completed' ? ' status-completed' : '';
      pill.className = `tv-event evt-${ev.color}${statusCls}`;
      pill.style.top    = `${startMin * HOUR_PX / 60}px`;
      pill.style.height = `${Math.max((endMin - startMin) * HOUR_PX / 60, 22)}px`;
      pill.textContent  = ev.startTime + ' ' + ev.title;
      pill.title        = ev.title;
      pill.addEventListener('click', e => { e.stopPropagation(); openEditModal(ev); });
      col.appendChild(pill);
    });

    inner.appendChild(col);
  });

  body.appendChild(inner);
  timeView.appendChild(body);
  main.appendChild(timeView);

  requestAnimationFrame(() => { body.scrollTop = 7 * HOUR_PX; });
}

function renderDayView() {
  const date = new Date(currentYear, currentMonth, currentDay);
  document.getElementById('month-label').textContent =
    date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  renderTimeGrid([formatDateStr(currentYear, currentMonth, currentDay)]);
}

function renderWeekView() {
  const date = new Date(currentYear, currentMonth, currentDay);
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const s = weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' });
  const e = weekEnd.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('month-label').textContent = `${s} – ${e}`;

  let dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
  });
  if (!showWeekends) dates = dates.filter(ds => !isWeekend(ds));
  renderTimeGrid(dates);
}

function renderFourDayView() {
  const base = new Date(currentYear, currentMonth, currentDay);
  const dates = [];
  const cursor = new Date(base);
  while (dates.length < 4) {
    const ds = formatDateStr(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    if (showWeekends || !isWeekend(ds)) dates.push(ds);
    cursor.setDate(cursor.getDate() + 1);
  }
  const startDt = new Date(dates[0] + 'T00:00:00');
  const endDt   = new Date(dates[dates.length - 1] + 'T00:00:00');
  const s = startDt.toLocaleDateString('default', { month: 'short', day: 'numeric' });
  const e = endDt.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('month-label').textContent = `${s} – ${e}`;
  renderTimeGrid(dates);
}

// ===== Year View =====

function renderYearView() {
  document.getElementById('month-label').textContent = String(currentYear);
  const main = document.getElementById('main');
  const yearView = document.createElement('div');
  yearView.id = 'time-view';
  yearView.className = 'year-view';

  const todayStr = getTodayStr();

  for (let m = 0; m < 12; m++) {
    const wrap = document.createElement('div');
    wrap.className = 'year-mini-wrap';

    const label = document.createElement('div');
    label.className = 'year-mini-label';
    label.textContent = new Date(currentYear, m, 1).toLocaleString('default', { month: 'long' });
    label.addEventListener('click', () => { currentMonth = m; setView('month'); });
    wrap.appendChild(label);

    const miniGrid = document.createElement('div');
    miniGrid.className = 'year-mini-grid';

    ['S','M','T','W','T','F','S'].forEach(d => {
      const s = document.createElement('span');
      s.className = 'year-mini-dow';
      s.textContent = d;
      miniGrid.appendChild(s);
    });

    buildGridCells(currentYear, m).forEach(({ year, month, day, isCurrentMonth }) => {
      const ds = formatDateStr(year, month, day);
      const cell = document.createElement('div');
      cell.className = 'year-mini-day';
      if (!isCurrentMonth) cell.classList.add('year-mini-outside');
      if (ds === todayStr) cell.classList.add('year-mini-today');
      if (isCurrentMonth && getEventsForDate(ds).length > 0) cell.classList.add('year-mini-has-events');
      cell.textContent = day;
      cell.addEventListener('click', () => {
        currentYear = year; currentMonth = month; currentDay = day;
        setView('month');
      });
      miniGrid.appendChild(cell);
    });

    wrap.appendChild(miniGrid);
    yearView.appendChild(wrap);
  }

  main.appendChild(yearView);
}

// ===== Schedule View =====

function renderScheduleView() {
  document.getElementById('month-label').textContent = 'Schedule';
  const main = document.getElementById('main');
  const schedView = document.createElement('div');
  schedView.id = 'time-view';
  schedView.className = 'schedule-view';

  const today = new Date();
  let hasAny = false;

  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEvts = getEventsForDate(dateStr);
    if (dayEvts.length === 0) continue;
    hasAny = true;

    const dateLbl = document.createElement('div');
    dateLbl.className = 'sched-date-label';
    dateLbl.textContent = d.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    schedView.appendChild(dateLbl);

    dayEvts.forEach(ev => {
      const item = document.createElement('div');
      item.className = 'sched-event';
      const dot = document.createElement('span');
      dot.className = `sched-dot evt-${ev.color}`;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'sched-time';
      timeSpan.textContent = ev.startTime || 'All day';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'sched-title';
      if (ev.status === 'completed') titleSpan.classList.add('sched-completed');
      if (ev.status === 'declined')  titleSpan.classList.add('sched-declined');
      titleSpan.textContent = ev.title;
      item.appendChild(dot);
      item.appendChild(timeSpan);
      item.appendChild(titleSpan);
      item.addEventListener('click', () => openEditModal(ev));
      schedView.appendChild(item);
    });
  }

  if (!hasAny) {
    const empty = document.createElement('div');
    empty.className = 'sched-empty';
    empty.textContent = 'No upcoming events in the next 90 days';
    schedView.appendChild(empty);
  }

  main.appendChild(schedView);
}

// ===== Rendering =====

function isMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function getTodayStr() {
  const t = new Date();
  return formatDateStr(t.getFullYear(), t.getMonth(), t.getDate());
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
    const miniLabel = new Date(dateStr + 'T00:00:00')
      .toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    cell.setAttribute('aria-label', miniLabel);
    cell.setAttribute('tabindex', '0');
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cell.click(); }
    });
    cell.addEventListener('click', () => {
      currentYear  = year;
      currentMonth = month;
      currentDay   = day;
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
  const cellLabel = new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  cell.setAttribute('aria-label', cellLabel);

  if (!isCurrentMonth) cell.classList.add('outside');
  if (isToday) cell.classList.add('today');

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
    cell.setAttribute('tabindex', '0');
    cell.addEventListener('click', () => openAddModal(dateStr));
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAddModal(dateStr); }
    });
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
    const statusCls = ev.status === 'declined' ? ' status-declined' : ev.status === 'completed' ? ' status-completed' : '';
    pill.className = `event-pill evt-${ev.color}${statusCls}`;

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
  modalTrigger = document.activeElement;
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Event';
  resetForm();
  document.getElementById('event-date').value = dateStr;
  document.getElementById('event-status').value = 'normal';
  document.getElementById('btn-delete').classList.add('hidden');
  showModal();
  document.getElementById('event-title').focus();
}

function openEditModal(ev) {
  modalTrigger = document.activeElement;
  editingId = ev.id;
  document.getElementById('modal-title').textContent = 'Edit Event';
  resetForm();
  document.getElementById('event-id').value = ev.id;
  document.getElementById('event-title').value = ev.title;
  document.getElementById('event-date').value = ev.date;
  document.getElementById('event-start').value = ev.startTime || '';
  document.getElementById('event-end').value = ev.endTime || '';
  document.getElementById('event-desc').value = ev.description || '';
  document.getElementById('event-status').value = ev.status || 'normal';

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
  if (modalTrigger) { modalTrigger.focus(); modalTrigger = null; }
}

function resetForm() {
  document.getElementById('event-form').reset();
}

// ===== Settings Modal =====

function openSettingsModal() {
  const themeSelect = document.getElementById('settings-theme-select');
  themeSelect.value = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

  const dvSelect = document.getElementById('settings-default-view-select');
  dvSelect.value = defaultView;

  const wsSelect = document.getElementById('settings-week-start-select');
  wsSelect.value = String(weekStartDay);

  syncSettingsToggles();
  document.getElementById('settings-overlay').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-overlay').classList.add('hidden');
}

function syncSettingsToggles() {
  const weekendsBtn  = document.getElementById('settings-weekends-btn');
  const declinedBtn  = document.getElementById('settings-declined-btn');
  const completedBtn = document.getElementById('settings-completed-btn');

  if (weekendsBtn)  { weekendsBtn.textContent  = showWeekends  ? 'On' : 'Off'; weekendsBtn.setAttribute('aria-pressed',  showWeekends  ? 'true' : 'false'); }
  if (declinedBtn)  { declinedBtn.textContent  = showDeclined  ? 'On' : 'Off'; declinedBtn.setAttribute('aria-pressed',  showDeclined  ? 'true' : 'false'); }
  if (completedBtn) { completedBtn.textContent = showCompleted ? 'On' : 'Off'; completedBtn.setAttribute('aria-pressed', showCompleted ? 'true' : 'false'); }
}

// ===== Toast =====

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-show'));
  });
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Focus Trap =====

function trapFocus(e) {
  const modal = document.getElementById('modal');
  const focusableSelectors = 'button, input, textarea, select, [tabindex="0"]';
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

  if (!title) errors.title = 'Title is required';
  if (!date) errors.date = 'Date is required';
  else if (!isValidDate(date)) errors.date = 'Please enter a valid date';
  if (startTime && endTime && endTime <= startTime) errors.time = 'End time must be after start time';

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
    status:      document.getElementById('event-status').value || 'normal',
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
  if (!valid) { showErrors(errors); return; }
  clearErrors();
  const data = buildEventFromForm();
  if (editingId) updateEvent(editingId, data);
  else createEvent(data);
  closeModal();
  renderCalendar();
}

// ===== Seed Demo Data =====

function seedDemoData() {
  if (localStorage.getItem('calendar_seeded')) return;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const seeds = [
    { day: 3,  title: 'Team standup',         color: 'blue',   startTime: '09:00', endTime: '09:30',  status: 'normal',    description: '' },
    { day: 7,  title: 'Dentist appointment',  color: 'red',    startTime: '14:00', endTime: '15:00',  status: 'declined',  description: '' },
    { day: 10, title: 'Project deadline',     color: 'orange', startTime: null,    endTime: null,     status: 'normal',    description: 'Final deliverable due' },
    { day: 14, title: 'Lunch with Sarah',     color: 'green',  startTime: '12:30', endTime: '13:30',  status: 'normal',    description: '' },
    { day: 18, title: 'Code review',          color: 'purple', startTime: '15:00', endTime: '16:00',  status: 'completed', description: '' },
    { day: 22, title: 'Weekly retrospective', color: 'teal',   startTime: '10:00', endTime: '11:00',  status: 'normal',    description: '' },
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

// ===== Display Preference Toggles =====

function loadWeekends() {
  showWeekends = localStorage.getItem('calendar_show_weekends') !== 'false';
  applyWeekendsClass();
  syncWeekendsToggle();
}

function applyWeekendsClass() {
  document.documentElement.classList.toggle('hide-weekends', !showWeekends);
}

function syncWeekendsToggle() {
  const btn = document.getElementById('toggle-weekends');
  if (!btn) return;
  btn.classList.toggle('unchecked', !showWeekends);
  btn.setAttribute('aria-checked', showWeekends ? 'true' : 'false');
}

function toggleWeekends() {
  showWeekends = !showWeekends;
  localStorage.setItem('calendar_show_weekends', showWeekends);
  applyWeekendsClass();
  syncWeekendsToggle();
  renderCalendar();
}

function loadDeclined() {
  showDeclined = localStorage.getItem('calendar_show_declined') !== 'false';
  syncDeclinedToggle();
}

function syncDeclinedToggle() {
  const btn = document.getElementById('toggle-declined');
  if (!btn) return;
  btn.classList.toggle('unchecked', !showDeclined);
  btn.setAttribute('aria-checked', showDeclined ? 'true' : 'false');
}

function toggleDeclined() {
  showDeclined = !showDeclined;
  localStorage.setItem('calendar_show_declined', showDeclined);
  syncDeclinedToggle();
  renderCalendar();
}

function loadCompleted() {
  showCompleted = localStorage.getItem('calendar_show_completed') !== 'false';
  syncCompletedToggle();
}

function syncCompletedToggle() {
  const btn = document.getElementById('toggle-completed');
  if (!btn) return;
  btn.classList.toggle('unchecked', !showCompleted);
  btn.setAttribute('aria-checked', showCompleted ? 'true' : 'false');
}

function toggleCompleted() {
  showCompleted = !showCompleted;
  localStorage.setItem('calendar_show_completed', showCompleted);
  syncCompletedToggle();
  renderCalendar();
}

// ===== Init =====

function init() {
  loadEvents();

  // Load persisted settings
  defaultView  = localStorage.getItem('calendar_default_view')  || 'month';
  weekStartDay = parseInt(localStorage.getItem('calendar_week_start') || '0', 10);
  currentView  = defaultView;

  const today = new Date();
  currentYear  = today.getFullYear();
  currentMonth = today.getMonth();
  currentDay   = today.getDate();

  const logoDateEl = document.getElementById('logo-date');
  if (logoDateEl) logoDateEl.textContent = today.getDate();

  seedDemoData();
  loadTheme();
  loadWeekends();
  loadDeclined();
  loadCompleted();
  renderCalendar();

  // ===== View Dropdown =====
  const viewDropdown = document.getElementById('view-dropdown');
  const viewBtn = document.getElementById('btn-view-month');

  viewBtn.addEventListener('click', e => {
    e.stopPropagation();
    const opening = viewDropdown.classList.contains('hidden');
    closeAllDropdowns();
    if (opening) {
      viewDropdown.classList.remove('hidden');
      viewBtn.setAttribute('aria-expanded', 'true');
    }
  });

  viewDropdown.addEventListener('click', e => e.stopPropagation());

  document.querySelectorAll('.view-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllDropdowns();
      setView(btn.dataset.view);
    });
  });

  document.getElementById('toggle-weekends').addEventListener('click', toggleWeekends);
  document.getElementById('toggle-declined').addEventListener('click', toggleDeclined);
  document.getElementById('toggle-completed').addEventListener('click', toggleCompleted);

  // ===== Settings Dropdown =====
  const settingsDropdown = document.getElementById('settings-dropdown');
  const settingsBtn      = document.getElementById('btn-settings');

  settingsBtn.addEventListener('click', e => {
    e.stopPropagation();
    const opening = settingsDropdown.classList.contains('hidden');
    closeAllDropdowns();
    if (opening) {
      settingsDropdown.classList.remove('hidden');
      settingsBtn.setAttribute('aria-expanded', 'true');
    }
  });

  settingsDropdown.addEventListener('click', e => e.stopPropagation());

  document.getElementById('sopt-settings').addEventListener('click', () => {
    closeAllDropdowns();
    openSettingsModal();
  });
  document.getElementById('sopt-trash').addEventListener('click', () => {
    closeAllDropdowns();
    showToast('Trash is empty');
  });
  document.getElementById('sopt-appearance').addEventListener('click', () => {
    closeAllDropdowns();
    openSettingsModal();
  });
  document.getElementById('sopt-print').addEventListener('click', () => {
    closeAllDropdowns();
    window.print();
  });
  document.getElementById('sopt-addons').addEventListener('click', () => {
    closeAllDropdowns();
    showToast('Add-ons are not available in this demo');
  });

  // ===== Settings Modal =====
  document.getElementById('btn-settings-close').addEventListener('click', closeSettingsModal);
  document.getElementById('settings-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('settings-overlay')) closeSettingsModal();
  });

  document.getElementById('btn-settings-done').addEventListener('click', () => {
    // Apply theme
    const themeVal = document.getElementById('settings-theme-select').value;
    const isCurrentlyLight = document.documentElement.getAttribute('data-theme') === 'light';
    if ((themeVal === 'light') !== isCurrentlyLight) toggleTheme();

    // Apply default view
    defaultView = document.getElementById('settings-default-view-select').value;
    localStorage.setItem('calendar_default_view', defaultView);

    // Apply week start
    weekStartDay = parseInt(document.getElementById('settings-week-start-select').value, 10);
    localStorage.setItem('calendar_week_start', weekStartDay);

    closeSettingsModal();
  });

  // Settings panel toggle buttons
  document.getElementById('settings-weekends-btn').addEventListener('click', () => {
    toggleWeekends();
    syncSettingsToggles();
  });
  document.getElementById('settings-declined-btn').addEventListener('click', () => {
    toggleDeclined();
    syncSettingsToggles();
  });
  document.getElementById('settings-completed-btn').addEventListener('click', () => {
    toggleCompleted();
    syncSettingsToggles();
  });

  // ===== Global click closes all dropdowns =====
  document.addEventListener('click', closeAllDropdowns);

  // ===== Standard nav =====
  document.getElementById('btn-prev').addEventListener('click', prevMonth);
  document.getElementById('btn-next').addEventListener('click', nextMonth);
  document.getElementById('btn-today').addEventListener('click', goToToday);
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('mini-prev').addEventListener('click', prevMonth);
  document.getElementById('mini-next').addEventListener('click', nextMonth);

  const btnCreate = document.getElementById('btn-create');
  if (btnCreate) btnCreate.addEventListener('click', () => openAddModal(getTodayStr()));

  document.getElementById('event-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-delete').addEventListener('click', () => {
    if (editingId) deleteEvent(editingId);
  });

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeModal();
      closeSettingsModal();
    }
  });
  document.getElementById('modal').addEventListener('keydown', e => {
    if (e.key === 'Tab') trapFocus(e);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCalendar, 150);
  });
}

function closeAllDropdowns() {
  const viewDropdown    = document.getElementById('view-dropdown');
  const viewBtn         = document.getElementById('btn-view-month');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const settingsBtn     = document.getElementById('btn-settings');

  if (viewDropdown)     { viewDropdown.classList.add('hidden');     }
  if (viewBtn)          { viewBtn.setAttribute('aria-expanded', 'false'); }
  if (settingsDropdown) { settingsDropdown.classList.add('hidden'); }
  if (settingsBtn)      { settingsBtn.setAttribute('aria-expanded', 'false'); }
}

document.addEventListener('DOMContentLoaded', init);
