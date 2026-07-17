// OpsHub Calendar view (Month, Week, Agenda)

export function renderCalendar(app, store, engine) {
  const currentCompany = app.currentCompany;

  // Calendar parameters stored in app context
  app.calendarState = app.calendarState || {
    view: "month", // month, week, agenda
    currentYear: 2026,
    currentMonth: 6, // 0-indexed (July = 6)
    currentWeekOffset: 0 // offset weeks from July 16, 2026
  };

  const cState = app.calendarState;

  // Filters State
  const categoryFilter = app.activeCalendarFilters?.category || "All";
  const calCompany = app.activeCalendarFilters?.company || "All";

  // Filter out assets and tasks by company
  let assets = store.getAssets().filter(a => currentCompany === "Global" || a.company === currentCompany);
  if (calCompany !== "All") {
    assets = assets.filter(a => a.company === calCompany);
  }

  let tasks = store.getTasks().filter(t => currentCompany === "Global" || t.company === currentCompany);
  if (calCompany !== "All") {
    tasks = tasks.filter(t => t.company === calCompany);
  }

  // Filter out events
  let filteredAssets = assets;
  if (categoryFilter !== "All") {
    filteredAssets = assets.filter(a => a.category === categoryFilter);
  }

  // Compile calendar events
  // Expiries, Renewals, Tasks
  const events = [];

  filteredAssets.forEach(a => {
    if (a.renewalDate && a.status !== "Cancelled") {
      events.push({
        id: a.id,
        type: "renewal",
        date: a.renewalDate,
        title: `Renew: ${a.name} (${a.cost > 0 ? store.formatCost(a.cost, a.currency) : 'Free'})`,
        item: a
      });
    }
    if (a.expiryDate && a.status !== "Cancelled") {
      events.push({
        id: a.id,
        type: "expiry",
        date: a.expiryDate,
        title: `Expiry: ${a.name} (${a.cost > 0 ? store.formatCost(a.cost, a.currency) : 'Free'})`,
        item: a
      });
    }
  });

  tasks.forEach(t => {
    if (t.status === "Pending") {
      events.push({
        id: t.assetId,
        type: "task",
        date: t.dueDate,
        title: t.title,
        item: t
      });
    }
  });

  const categories = store.getCategories();
  const companies = store.getCompanies();

  const container = document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Operations Calendar</h2>
        <p>Dynamic schedules of renewals, expirations, and due tasks</p>
      </div>
      <div class="header-actions" style="display:flex; gap:10px; align-items: center; position: relative;">
        <div class="filters-popover-container">
          <button class="btn btn-secondary" id="filters-toggle-btn" style="display:flex; align-items:center; gap:6px; height: 38px;">
            <i data-lucide="filter" style="width:16px; height:16px"></i> Filters
          </button>

          <!-- Toggleable filters popover container using standardized styling -->
          <div id="filters-popover" class="filters-popover ${app.filtersOpen ? 'open' : ''}">
            <div class="filters-popover-title">Filter Calendar</div>
            
            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Calendar View</label>
              <select id="cal-filter-view" class="filter-select" style="width:100%; text-align:left;">
                <option value="month" ${cState.view === 'month' ? 'selected' : ''}>Month View</option>
                <option value="week" ${cState.view === 'week' ? 'selected' : ''}>Week View</option>
                <option value="agenda" ${cState.view === 'agenda' ? 'selected' : ''}>Agenda View</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Category</label>
              <select id="cal-filter-category" class="filter-select" style="width:100%; text-align:left;">
                <option value="All">All Categories</option>
                ${categories.map(c => `<option value="${c}" ${c === categoryFilter ? 'selected' : ''}>${c}</option>`).join("")}
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Organization</label>
              <select id="cal-filter-company" class="filter-select" style="width:100%; text-align:left;">
                <option value="All" ${calCompany === 'All' ? 'selected' : ''}>All Organizations</option>
                ${companies.map(c => `<option value="${c}" ${c === calCompany ? 'selected' : ''}>${c}</option>`).join("")}
              </select>
            </div>

            <div class="filters-popover-footer">
              <button class="filter-reset-btn" id="filter-reset-btn" style="width:100%; justify-content:center; height:28px;">
                <i data-lucide="x" style="width:12px; height:12px;"></i> Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Header with Date Navigation -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); border-bottom:1px solid var(--border-color); padding: 12px 0; margin-bottom: 16px;">
      <div id="calendar-date-nav-controls">
        <!-- populated dynamically based on view -->
      </div>
    </div>

    <!-- Calendar View Area -->
    <div id="calendar-view-container"></div>
  `;

  // Draw Lucide icons
  lucide.createIcons();

  // Populate nav controls & render core views
  const navContainer = document.getElementById("calendar-date-nav-controls");
  const viewContainer = document.getElementById("calendar-view-container");

  if (cState.view === "month") {
    renderMonthView(cState, events, navContainer, viewContainer);
  } else if (cState.view === "week") {
    renderWeekView(cState, events, navContainer, viewContainer);
  } else {
    renderAgendaView(events, navContainer, viewContainer);
  }

  // --- BIND EVENT HANDLERS ---
  
  // Filters bindings
  document.getElementById("cal-filter-view").addEventListener("change", (e) => {
    cState.view = e.target.value;
    renderCalendar(app, store, engine);
  });

  document.getElementById("cal-filter-category").addEventListener("change", (e) => {
    app.activeCalendarFilters = app.activeCalendarFilters || {};
    app.activeCalendarFilters.category = e.target.value;
    renderCalendar(app, store, engine);
  });

  document.getElementById("cal-filter-company").addEventListener("change", (e) => {
    app.activeCalendarFilters = app.activeCalendarFilters || {};
    app.activeCalendarFilters.company = e.target.value;
    renderCalendar(app, store, engine);
  });

  document.getElementById("filter-reset-btn").addEventListener("click", () => {
    app.activeCalendarFilters = { category: "All", company: "All" };
    cState.view = "month";
    renderCalendar(app, store, engine);
  });

  // Popover toggle binding
  const popover = document.getElementById("filters-popover");
  const toggleBtn = document.getElementById("filters-toggle-btn");
  
  if (toggleBtn && popover) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = popover.classList.contains("open");
      if (isOpen) {
        popover.classList.remove("open");
      } else {
        popover.classList.add("open");
      }
      app.filtersOpen = !isOpen;
    });

    popover.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", (e) => {
      if (popover.classList.contains("open") && !popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
        popover.classList.remove("open");
        app.filtersOpen = false;
      }
    });
  }

  // Bind clicks inside the calendars (events opening details)
  document.querySelectorAll(".calendar-event, .agenda-item").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      if (id) app.openAssetDetails(id);
    });
  });
}

// --- CALENDAR MONTH VIEW BUILDER ---
function renderMonthView(cState, events, navContainer, viewContainer) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  navContainer.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px">
      <button class="icon-btn" id="cal-prev-month-btn" style="width:34px; height:34px"><i data-lucide="chevron-left" style="width:16px; height:16px"></i></button>
      <h3 style="font-family:var(--font-heading); font-size:1.05rem; font-weight:600">${monthNames[cState.currentMonth]} ${cState.currentYear}</h3>
      <button class="icon-btn" id="cal-next-month-btn" style="width:34px; height:34px"><i data-lucide="chevron-right" style="width:16px; height:16px"></i></button>
    </div>
  `;
  lucide.createIcons();

  // Standard Month calendar layout logic
  const firstDay = new Date(cState.currentYear, cState.currentMonth, 1).getDay();
  const daysInMonth = new Date(cState.currentYear, cState.currentMonth + 1, 0).getDate();
  const prevDaysInMonth = new Date(cState.currentYear, cState.currentMonth, 0).getDate();

  let html = `
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;

  // Prepend previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = prevDaysInMonth - i;
    html += `<div class="calendar-cell inactive"><div class="calendar-cell-num">${dayNum}</div></div>`;
  }

  // Active month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${cState.currentYear}-${String(cState.currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter(e => e.date === dateStr);
    
    const isToday = (cState.currentYear === 2026 && cState.currentMonth === 6 && d === 16); // Mock date check

    html += `
      <div class="calendar-cell ${isToday ? 'today' : ''}">
        <div class="calendar-cell-num" style="${isToday ? 'color: var(--color-primary); font-weight:700;' : ''}">${d}</div>
        <div style="display:flex; flex-direction:column; gap:3px; overflow:hidden">
          ${dayEvents.map(de => `
            <div class="calendar-event event-${de.type}" data-id="${de.id}" title="${de.title}">
              ${de.title}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // Append next month days to complete grid row
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let n = 1; n <= remaining; n++) {
    html += `<div class="calendar-cell inactive"><div class="calendar-cell-num">${n}</div></div>`;
  }

  html += `</div>`;
  viewContainer.innerHTML = html;

  // Bind navigation
  document.getElementById("cal-prev-month-btn").addEventListener("click", () => {
    cState.currentMonth--;
    if (cState.currentMonth < 0) {
      cState.currentMonth = 11;
      cState.currentYear--;
    }
    renderMonthView(cState, events, navContainer, viewContainer);
    // Bind click logs
    rebindEvents();
  });

  document.getElementById("cal-next-month-btn").addEventListener("click", () => {
    cState.currentMonth++;
    if (cState.currentMonth > 11) {
      cState.currentMonth = 0;
      cState.currentYear++;
    }
    renderMonthView(cState, events, navContainer, viewContainer);
    // Bind click logs
    rebindEvents();
  });
}

// --- CALENDAR WEEK VIEW BUILDER ---
function renderWeekView(cState, events, navContainer, viewContainer) {
  const baseDate = new Date("2026-07-16T12:00:00");
  baseDate.setDate(baseDate.getDate() + (cState.currentWeekOffset * 7));

  // Find start of the week (Sunday)
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatDateShort = (d) => `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;

  navContainer.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px">
      <button class="icon-btn" id="cal-prev-week-btn" style="width:34px; height:34px"><i data-lucide="chevron-left" style="width:16px; height:16px"></i></button>
      <h3 style="font-family:var(--font-heading); font-size:1.02rem; font-weight:600">${formatDateShort(startOfWeek)} – ${formatDateShort(endOfWeek)}, 2026</h3>
      <button class="icon-btn" id="cal-next-week-btn" style="width:34px; height:34px"><i data-lucide="chevron-right" style="width:16px; height:16px"></i></button>
    </div>
  `;
  lucide.createIcons();

  let html = `<div class="calendar-grid" style="grid-template-columns: repeat(7, 1fr)">`;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDates.push(d);
  }

  // Week column headers
  weekDates.forEach((wDate, idx) => {
    const isToday = wDate.toISOString().split("T")[0] === "2026-07-16";
    html += `
      <div class="calendar-day-header" style="${isToday ? 'background-color:rgba(99,102,241,0.05); color:var(--color-primary);' : ''}">
        ${days[idx]}<br>
        <span style="font-size:1.1rem; font-weight:700">${wDate.getDate()}</span>
      </div>
    `;
  });

  // Week cells
  weekDates.forEach(wDate => {
    const dateStr = wDate.toISOString().split("T")[0];
    const dayEvents = events.filter(e => e.date === dateStr);
    const isToday = dateStr === "2026-07-16";

    html += `
      <div class="calendar-cell" style="min-height: 250px; ${isToday ? 'box-shadow: inset 0 0 0 2px var(--color-primary);' : ''}">
        <div style="display:flex; flex-direction:column; gap:4px; overflow:hidden">
          ${dayEvents.map(de => `
            <div class="calendar-event event-${de.type}" data-id="${de.id}" title="${de.title}" style="white-space:normal; font-size:0.72rem; padding: 6px">
              <strong>${de.title}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  viewContainer.innerHTML = html;

  // Bind navigation
  document.getElementById("cal-prev-week-btn").addEventListener("click", () => {
    cState.currentWeekOffset--;
    renderWeekView(cState, events, navContainer, viewContainer);
    rebindEvents();
  });
  document.getElementById("cal-next-week-btn").addEventListener("click", () => {
    cState.currentWeekOffset++;
    renderWeekView(cState, events, navContainer, viewContainer);
    rebindEvents();
  });
}

// --- CALENDAR AGENDA VIEW BUILDER ---
function renderAgendaView(events, navContainer, viewContainer) {
  navContainer.innerHTML = `
    <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600">Timeline Schedule</span>
  `;

  // Sort upcoming events chronologically from current date
  const todayStr = "2026-07-16";
  const agendaEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (agendaEvents.length === 0) {
    viewContainer.innerHTML = `
      <div class="card" style="padding: 40px; text-align:center; color:var(--text-muted)">
        <i data-lucide="check" style="width:36px; height:36px; margin-bottom:8px; opacity:0.5; color:var(--color-success)"></i>
        <h4 style="font-weight:600">No upcoming events scheduled</h4>
      </div>
    `;
    return;
  }

  let html = `<div class="agenda-list">`;
  agendaEvents.forEach(ae => {
    const dObj = new Date(ae.date);
    const day = dObj.getDate();
    const month = dObj.toLocaleString('default', { month: 'short' });
    
    let typeLabel = "Renewal Date";
    let typeClass = "status-active";
    if (ae.type === "expiry") {
      typeLabel = "Expiry Date";
      typeClass = "status-expired";
    } else if (ae.type === "task") {
      typeLabel = "Task Deadline";
      typeClass = "status-renew";
    }

    const companyName = ae.item.company || "";

    html += `
      <div class="agenda-item" data-id="${ae.id}">
        <div style="display:flex; align-items:center; gap:16px">
          <div class="agenda-date-badge">
            <span class="day">${day}</span>
            <span class="month">${month}</span>
          </div>
          <div>
            <h4 style="font-family:var(--font-heading); font-size:1rem; font-weight:600">${ae.item.name || ae.item.title}</h4>
            <span style="font-size:0.75rem; color:var(--text-muted)">${companyName} • ${ae.title}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px">
          <span class="badge ${typeClass}">${typeLabel}</span>
          <i data-lucide="chevron-right" style="width:16px; height:16px; color:var(--text-muted)"></i>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  viewContainer.innerHTML = html;
  lucide.createIcons();
}

// Rebind active view events to app details
function rebindEvents() {
  document.querySelectorAll(".calendar-event, .agenda-item").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      // Access global app controller from routing triggers
      const appRef = window.opshubApp;
      if (id && appRef) appRef.openAssetDetails(id);
    });
  });
}
