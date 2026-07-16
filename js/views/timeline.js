// OpsHub Dedicated Timeline view
import { convertSelects } from "../components/dropdown.js";

export function renderTimeline(app, store, engine) {
  const currentCompany = app.currentCompany;
  const assets = store.getAssets().filter(a => currentCompany === "Global" || a.company === currentCompany);
  const tasks = store.getTasks().filter(t => currentCompany === "Global" || t.company === currentCompany);

  // Filters State
  const currentCategory = app.activeTimelineFilters?.category || "All";
  let filteredAssets = assets;
  if (currentCategory !== "All") {
    filteredAssets = assets.filter(a => a.category === currentCategory);
  }

  const todayStr = "2026-07-16";
  const today = new Date(todayStr);

  // Compile timeline events
  const events = [];

  filteredAssets.forEach(a => {
    // Expirations
    if (a.expiryDate && a.status !== "Cancelled") {
      events.push({
        id: a.id,
        title: `Expiry: ${a.name}`,
        date: a.expiryDate,
        type: "expiry",
        company: a.company,
        label: "Expiration",
        details: `${a.provider || 'Unassigned'} • Cost: ${a.currency} ${a.cost}`
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
        details: `Cost: ${a.currency} ${a.cost} (${a.renewalType})`
      });
    }
  });

  tasks.forEach(t => {
    if (t.status === "Pending") {
      events.push({
        id: t.assetId,
        title: t.title,
        date: t.dueDate,
        type: "task",
        company: t.company,
        label: "Renewal Task",
        details: `Priority: ${t.priority} • Assigned: ${t.assignedTo}`
      });
    }
  });

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

  events.forEach(ev => {
    const b = getTimelineBucket(ev.date);
    buckets[b].push(ev);
  });

  // Sort events inside each bucket chronologically
  Object.keys(buckets).forEach(k => {
    buckets[k].sort((a, b) => a.date.localeCompare(b.date));
  });

  const container = document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Operational Timeline</h2>
        <p>Chronological roadmap of payments, renewals, expirations, and schedules</p>
      </div>
    </div>

    <!-- Filters row -->
    <div class="filters-row">
      <div class="filters-left">
        <div style="display:flex; align-items:center; gap:6px">
          <i data-lucide="filter" style="width:16px; height:16px; color:var(--text-muted)"></i>
          <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600">Filters:</span>
        </div>
        <select id="timeline-filter-category" class="filter-select">
          <option value="All">All Categories</option>
          ${categories.map(c => `<option value="${c}" ${c === currentCategory ? 'selected' : ''}>${c}</option>`).join("")}
        </select>
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

  // Filters binding
  document.getElementById("timeline-filter-category").addEventListener("change", (e) => {
    app.activeTimelineFilters = app.activeTimelineFilters || {};
    app.activeTimelineFilters.category = e.target.value;
    renderTimeline(app, store, engine);
  });

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
