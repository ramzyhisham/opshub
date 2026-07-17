// OpsHub Dedicated Timeline view
import { convertSelects } from "../components/dropdown.js";

export function renderTimeline(app, store, engine) {
  const currentCompany = app.currentCompany;

  // Filters State
  const timelineCompany = app.activeTimelineFilters?.company || "All";
  const timelineCategory = app.activeTimelineFilters?.category || "All";
  const timelineEventType = app.activeTimelineFilters?.eventType || "All";
  const timelineStatus = app.activeTimelineFilters?.status || "All";

  // Filter assets and tasks by global company
  let assets = store.getAssets().filter(a => currentCompany === "Global" || a.company === currentCompany);
  let tasks = store.getTasks().filter(t => currentCompany === "Global" || t.company === currentCompany);

  const todayStr = "2026-07-16";
  const today = new Date(todayStr);

  // Compile timeline events
  const events = [];

  assets.forEach(a => {
    // Expirations
    if (a.expiryDate && a.status !== "Cancelled") {
      events.push({
        id: a.id,
        title: `Expiry: ${a.name}`,
        date: a.expiryDate,
        type: "expiry",
        company: a.company,
        label: "Expiration",
        details: `${a.provider || 'Unassigned'} • Cost: ${a.cost > 0 ? store.formatCost(a.cost, a.currency) : 'Free'}`,
        category: a.category,
        status: a.status
      });
    }

    // Payments / Renewals
    if (a.renewalDate && a.status !== "Cancelled") {
      events.push({
        id: a.id,
        title: `Payment: ${a.name}`,
        date: a.renewalDate,
        type: "payment",
        company: a.company,
        label: "Billing Payment",
        details: `Cost: ${a.cost > 0 ? store.formatCost(a.cost, a.currency) : 'Free'} (${a.renewalType})`,
        category: a.category,
        status: a.status
      });
    }
  });

  tasks.forEach(t => {
    if (t.status === "Pending") {
      const asset = assets.find(a => a.id === t.assetId);
      const cat = asset ? asset.category : "Other";
      events.push({
        id: t.assetId,
        title: t.title,
        date: t.dueDate,
        type: "task",
        company: t.company,
        label: "Renewal Task",
        details: `Priority: ${t.priority} • Assigned: ${t.assignedTo}`,
        category: cat,
        status: t.status
      });
    }
  });

  // Filter compiled events
  let filteredEvents = events;
  if (timelineCompany !== "All") {
    filteredEvents = filteredEvents.filter(e => e.company === timelineCompany);
  }
  if (timelineCategory !== "All") {
    filteredEvents = filteredEvents.filter(e => e.category === timelineCategory);
  }
  if (timelineEventType !== "All") {
    filteredEvents = filteredEvents.filter(e => e.type === timelineEventType);
  }
  if (timelineStatus !== "All") {
    filteredEvents = filteredEvents.filter(e => e.status === timelineStatus);
  }

  // Category listing
  const categories = store.getCategories();

  // Helper: map a date to categories
  const getTimelineBucket = (dateStr) => {
    if (!dateStr) return "Upcoming";
    
    const evDate = new Date(dateStr);
    const diffTime = evDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1 && diffDays <= 7) return "This Week";
    if (diffDays > 7 && diffDays <= 30) return "This Month";
    return "Upcoming";
  };

  // Group events
  const buckets = {
    "Today": [],
    "Tomorrow": [],
    "This Week": [],
    "This Month": [],
    "Upcoming": []
  };

  filteredEvents.forEach(ev => {
    const b = getTimelineBucket(ev.date);
    buckets[b].push(ev);
  });

  // Sort events inside each bucket chronologically
  Object.keys(buckets).forEach(k => {
    buckets[k].sort((a, b) => a.date.localeCompare(b.date));
  });

  const container = document.getElementById("app-content");
  const companies = store.getCompanies();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Operational Timeline</h2>
        <p>Chronological roadmap of payments, renewals, expirations, and schedules</p>
      </div>
      <div class="header-actions" style="display:flex; gap:10px; align-items: center; position: relative;">
        <div class="filters-popover-container">
          <button class="btn btn-secondary" id="filters-toggle-btn" style="display:flex; align-items:center; gap:6px; height: 38px;">
            <i data-lucide="filter" style="width:16px; height:16px"></i> Filters
          </button>

          <!-- Toggleable filters popover container using standardized styling -->
          <div id="filters-popover" class="filters-popover ${app.filtersOpen ? 'open' : ''}">
            <div class="filters-popover-title">Filter Timeline</div>
            
            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Organization</label>
              <select id="timeline-filter-company" class="filter-select" style="width:100%; text-align:left;">
                <option value="All" ${timelineCompany === 'All' ? 'selected' : ''}>All Organizations</option>
                ${companies.map(c => `<option value="${c}" ${c === timelineCompany ? 'selected' : ''}>${c}</option>`).join("")}
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Category</label>
              <select id="timeline-filter-category" class="filter-select" style="width:100%; text-align:left;">
                <option value="All">All Categories</option>
                ${categories.map(c => `<option value="${c}" ${c === timelineCategory ? 'selected' : ''}>${c}</option>`).join("")}
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Event Type</label>
              <select id="timeline-filter-eventtype" class="filter-select" style="width:100%; text-align:left;">
                <option value="All" ${timelineEventType === 'All' ? 'selected' : ''}>All Event Types</option>
                <option value="expiry" ${timelineEventType === 'expiry' ? 'selected' : ''}>Expiration</option>
                <option value="payment" ${timelineEventType === 'payment' ? 'selected' : ''}>Billing Payment</option>
                <option value="task" ${timelineEventType === 'task' ? 'selected' : ''}>Renewal Task</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Status</label>
              <select id="timeline-filter-status" class="filter-select" style="width:100%; text-align:left;">
                <option value="All" ${timelineStatus === 'All' ? 'selected' : ''}>All Statuses</option>
                <option value="Active" ${timelineStatus === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Renew Soon" ${timelineStatus === 'Renew Soon' ? 'selected' : ''}>Renew Soon</option>
                <option value="Expired" ${timelineStatus === 'Expired' ? 'selected' : ''}>Expired</option>
                <option value="Cancelled" ${timelineStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                <option value="Pending" ${timelineStatus === 'Pending' ? 'selected' : ''}>Pending</option>
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

    <!-- Timeline sections -->
    <div style="display:flex; flex-direction:column; gap:24px">
      ${Object.entries(buckets).map(([bucketName, list]) => `
        <div class="card" style="padding:20px">
          <div class="widget-header" style="border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:14px">
            <h3 class="widget-title" style="display:flex; align-items:center; gap:8px">
              <span style="width:8px; height:8px; border-radius:50%; background-color:${getBucketColor(bucketName)}"></span>
              ${bucketName}
            </h3>
            <span style="font-size:0.8rem; color:var(--text-muted)">${list.length} events</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px">
            ${list.length === 0 ? `
              <div style="color:var(--text-muted); font-size:0.85rem; font-style:italic; padding:10px 0">No events scheduled.</div>
            ` : list.map(ev => {
              let typeClass = "status-active";
              if (ev.type === "expiry") typeClass = "status-expired";
              else if (ev.type === "task") typeClass = "status-renew";
              
              return `
                <div class="agenda-item timeline-event-row" data-id="${ev.id}" style="padding: 10px 16px; align-items: center; border: 1px solid var(--border-color); background-color: var(--bg-hover)">
                  <div style="display:flex; align-items:center; gap:16px">
                    <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); min-width:80px">
                      ${ev.date}
                    </div>
                    <div>
                      <span style="font-size:0.9rem; font-weight:600; display:block">${ev.title}</span>
                      <span style="font-size:0.75rem; color:var(--text-muted)">${ev.company} • ${ev.details}</span>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:10px">
                    <span class="badge ${typeClass}">${ev.label}</span>
                    <i data-lucide="chevron-right" style="width:16px; height:16px; color:var(--text-muted)"></i>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // Draw Lucide icons
  lucide.createIcons();

  // Convert elements
  convertSelects(container);

  // Filters bindings
  document.getElementById("timeline-filter-company").addEventListener("change", (e) => {
    app.activeTimelineFilters = app.activeTimelineFilters || {};
    app.activeTimelineFilters.company = e.target.value;
    renderTimeline(app, store, engine);
  });

  document.getElementById("timeline-filter-category").addEventListener("change", (e) => {
    app.activeTimelineFilters = app.activeTimelineFilters || {};
    app.activeTimelineFilters.category = e.target.value;
    renderTimeline(app, store, engine);
  });

  document.getElementById("timeline-filter-eventtype").addEventListener("change", (e) => {
    app.activeTimelineFilters = app.activeTimelineFilters || {};
    app.activeTimelineFilters.eventType = e.target.value;
    renderTimeline(app, store, engine);
  });

  document.getElementById("timeline-filter-status").addEventListener("change", (e) => {
    app.activeTimelineFilters = app.activeTimelineFilters || {};
    app.activeTimelineFilters.status = e.target.value;
    renderTimeline(app, store, engine);
  });

  document.getElementById("filter-reset-btn").addEventListener("click", () => {
    app.activeTimelineFilters = { company: "All", category: "All", eventType: "All", status: "All" };
    renderTimeline(app, store, engine);
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

  // Details drawer links
  document.querySelectorAll(".timeline-event-row").forEach(row => {
    row.addEventListener("click", () => {
      app.openAssetDetails(row.dataset.id);
    });
  });
}

function getBucketColor(bucket) {
  switch (bucket) {
    case "Today": return "var(--color-danger)";
    case "Tomorrow": return "var(--color-warning)";
    case "This Week": return "var(--color-primary)";
    case "This Month": return "var(--color-info)";
    default: return "var(--text-muted)";
  }
}
