// OpsHub Assets Grid & Filtering view
import { convertSelects } from "../components/dropdown.js";

export function renderAssets(app, store, engine) {
  const currentCategory = app.activeFilters.category || "All";
  const currentStatus = app.activeFilters.status || "All";
  const currentRenewal = app.activeFilters.renewal || "All";
  const searchQuery = (app.activeFilters.search || "").toLowerCase();

  // Filter assets based on the active criteria
  let assets = store.getAssets().filter(a => {
    // Category match
    if (currentCategory !== "All" && a.category !== currentCategory) return false;
    // Status match
    if (currentStatus !== "All" && a.status !== currentStatus) return false;
    // Renewal match
    if (currentRenewal !== "All" && a.renewalType !== currentRenewal) return false;
    
    // Search match (name, provider, or notes)
    if (searchQuery) {
      const matchName = a.name.toLowerCase().includes(searchQuery);
      const matchProvider = (a.provider || "").toLowerCase().includes(searchQuery);
      const matchNotes = (a.internalNotes || "").toLowerCase().includes(searchQuery);
      if (!matchName && !matchProvider && !matchNotes) return false;
    }
    
    // ISO Organization Workspace isolation
    if (app.currentCompany !== "Global" && a.company !== app.currentCompany) return false;
    
    return true;
  });

  // Sort: Pinned first, then Favorites, then Alphabetical
  assets.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });

  const categories = store.getCategories();

  const container = document.getElementById("isolated-assets-view-mount") || document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Digital Assets Repository</h2>
        <p>Single source of truth for tracking active services and subscriptions (${assets.length} items)</p>
      </div>
      <div class="header-actions" style="display:flex; gap:10px; align-items: center; position: relative;">
        <button class="btn btn-secondary" id="export-csv-btn">
          <i data-lucide="download"></i> Export CSV
        </button>
        <button class="btn btn-secondary" id="filters-toggle-btn" style="display:flex; align-items:center; gap:6px;">
          <i data-lucide="filter" style="width:16px; height:16px"></i> Filters
        </button>

        <!-- Toggleable filters popover container -->
        <div id="filters-popover" class="filters-popover" style="display: none; position: absolute; top: calc(100% + 8px); right: 0; z-index: 1000; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; width: 280px; box-shadow: var(--shadow-lg); flex-direction: column; gap: 12px;">
          <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main); margin-bottom: 4px;">Filter Assets</div>
          
          <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Category</label>
            <select id="filter-category" class="filter-select" style="width:100%; text-align:left;">
              <option value="All">All Categories</option>
              ${categories.map(c => `<option value="${c}" ${c === currentCategory ? 'selected' : ''}>${c}</option>`).join("")}
            </select>
          </div>
          
          <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Status</label>
            <select id="filter-status" class="filter-select" style="width:100%; text-align:left;">
              <option value="All">All Statuses</option>
              <option value="Active" ${currentStatus === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Renew Soon" ${currentStatus === 'Renew Soon' ? 'selected' : ''}>Renew Soon</option>
              <option value="Expired" ${currentStatus === 'Expired' ? 'selected' : ''}>Expired</option>
              <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Renewal Type</label>
            <select id="filter-renewal" class="filter-select" style="width:100%; text-align:left;">
              <option value="All">All Renewal Types</option>
              <option value="Monthly" ${currentRenewal === 'Monthly' ? 'selected' : ''}>Monthly</option>
              <option value="Quarterly" ${currentRenewal === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
              <option value="Yearly" ${currentRenewal === 'Yearly' ? 'selected' : ''}>Yearly</option>
              <option value="One Time" ${currentRenewal === 'One Time' ? 'selected' : ''}>One Time</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Search</label>
            <div class="filter-search-input" style="max-width:100%; width:100%; margin-left:0;">
              <i data-lucide="search" style="left:8px;"></i>
              <input type="text" id="filter-search-inline" placeholder="Search name, provider..." value="${searchQuery}" style="width:100%; padding-left:26px;">
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:8px; border-top:1px solid var(--border-color); padding-top:12px">
            <button class="filter-reset-btn" id="filter-reset-btn" style="width:100%; justify-content:center; height:28px;">
              <i data-lucide="x" style="width:12px; height:12px;"></i> Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assets Grid -->
    <div class="assets-grid" id="assets-grid-container">
      ${assets.length === 0 ? `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 60px 0;">
          <i data-lucide="folder-open" style="width:48px; height:48px; margin-bottom:12px; opacity:0.5"></i>
          <p style="font-size:1.1rem; font-weight:600">No assets found matching the criteria</p>
          <p style="font-size:0.9rem">Try adjusting your filters or search terms.</p>
        </div>
      ` : assets.map(a => {
        let statusClass = "status-active";
        if (a.status === "Expired") statusClass = "status-expired";
        else if (a.status === "Renew Soon") statusClass = "status-renew";
        else if (a.status === "Cancelled") statusClass = "status-cancelled";

        return `
          <div class="card asset-card" data-id="${a.id}">
            <div class="asset-card-header">
              <div style="display:flex; align-items:center; gap:12px">
                <div class="asset-icon-box">
                  <i data-lucide="${getCategoryIcon(a.category)}"></i>
                </div>
                <div>
                  <h3 class="asset-card-title">${a.name}</h3>
                  <span class="asset-card-company">${a.company}</span>
                </div>
              </div>
              <div style="display:flex; gap: 4px;">
                ${a.isPinned ? `<i data-lucide="pin" style="width:14px; height:14px; color:var(--color-primary)"></i>` : ''}
                ${a.isFavorite ? `<i data-lucide="star" style="width:14px; height:14px; color:var(--color-warning); fill:var(--color-warning)"></i>` : ''}
              </div>
            </div>
            
            <p style="font-size: 0.85rem; color: var(--text-muted); line-height:1.4; margin-bottom:12px; height:38px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical">
              ${a.description || 'No description provided.'}
            </p>

            <div class="asset-card-meta">
              <div class="meta-row">
                <span class="meta-label">Category</span>
                <span class="meta-value">${a.category}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Provider</span>
                <span class="meta-value">${a.provider || 'N/A'}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Renewal</span>
                <span class="meta-value">${a.renewalType}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Next Renewal</span>
                <span class="meta-value" style="font-weight:600">${a.renewalDate || 'N/A'}</span>
              </div>
            </div>

            <div class="asset-card-footer">
              <div>
                <span class="cost-amount">${a.cost > 0 ? `${a.currency} ${a.cost.toFixed(2)}` : 'Free'}</span>
                <span style="font-size:0.75rem; color:var(--text-muted)">/${a.renewalType === 'Monthly' ? 'mo' : (a.renewalType === 'Yearly' ? 'yr' : 'cycle')}</span>
              </div>
              <span class="badge ${statusClass}">${a.status}</span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // Render newly inserted templates
  lucide.createIcons();

  // --- BIND EVENT HANDLERS ---

  // Filters binding
  document.getElementById("filter-category").addEventListener("change", (e) => {
    app.activeFilters.category = e.target.value;
    renderAssets(app, store, engine);
  });
  document.getElementById("filter-status").addEventListener("change", (e) => {
    app.activeFilters.status = e.target.value;
    renderAssets(app, store, engine);
  });
  document.getElementById("filter-renewal").addEventListener("change", (e) => {
    app.activeFilters.renewal = e.target.value;
    renderAssets(app, store, engine);
  });

  document.getElementById("filter-reset-btn").addEventListener("click", () => {
    app.activeFilters = { category: "All", status: "All", renewal: "All", owner: "All", search: "" };
    renderAssets(app, store, engine);
  });

  // Inline search filter
  const inlineSearch = document.getElementById("filter-search-inline");
  if (inlineSearch) {
    inlineSearch.addEventListener("input", (e) => {
      app.activeFilters.search = e.target.value;
      renderAssets(app, store, engine);
    });
  }

  // Popover toggle binding
  const popover = document.getElementById("filters-popover");
  const toggleBtn = document.getElementById("filters-toggle-btn");
  
  if (toggleBtn && popover) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = popover.style.display === "flex";
      popover.style.display = isOpen ? "none" : "flex";
      
      // Auto focus search field when opening filters
      if (!isOpen) {
        setTimeout(() => {
          document.getElementById("filter-search-inline")?.focus();
        }, 50);
      }
    });

    popover.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", (e) => {
      if (popover.style.display === "flex" && !popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
        popover.style.display = "none";
      }
    });
  }

  // Clicking cards to open detail drawer
  document.querySelectorAll(".asset-card").forEach(card => {
    card.addEventListener("click", () => {
      app.openAssetDetails(card.dataset.id);
    });
  });

  // Export CSV handler
  document.getElementById("export-csv-btn").addEventListener("click", () => {
    exportToCSV(assets);
  });
}

// Map categories to modern Lucide icon names
export function getCategoryIcon(cat) {
  switch (cat) {
    case "Domain": return "globe";
    case "Hosting": return "server";
    case "VPS": return "hard-drive";
    case "Business Mail": return "mail";
    case "SSL": return "shield-check";
    case "Cloud Storage": return "cloud";
    case "Developer Account": return "code-2";
    case "API": return "key-round";
    case "Subscription": return "credit-card";
    case "License": return "file-key-2";
    case "Database": return "database";
    case "Backup": return "archive";
    case "CDN": return "zap";
    case "Payment Gateway": return "wallet";
    case "Marketing Tool": return "megaphone";
    case "Analytics": return "line-chart";
    case "Communication": return "message-square-more";
    case "Security": return "lock";
    default: return "box";
  }
}

// Detailed CSV download compiler
function exportToCSV(assets) {
  const headers = ["Asset Name", "Company", "Category", "Provider", "Renewal Cycle", "Cost", "Currency", "Next Renewal", "Auto Renew", "Status", "Owner"];
  const rows = assets.map(a => [
    a.name,
    a.company,
    a.category,
    a.provider || "",
    a.renewalType,
    a.cost,
    a.currency,
    a.renewalDate || "",
    a.autoRenew ? "Yes" : "No",
    a.status,
    a.owner || ""
  ]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `OpsHub_Assets_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
