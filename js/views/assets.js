// OpsHub Assets view and drawers controller

export function renderAssets(app, store, engine) {
  const currentCompany = app.currentCompany;
  let assets = store.getAssets().filter(a => currentCompany === "Global" || a.company === currentCompany);

  // Search input filter — use inline filter search (local, not global)
  const searchQuery = (app.activeFilters.search || "").toLowerCase().trim();
  if (searchQuery) {
    assets = assets.filter(a => 
      a.name.toLowerCase().includes(searchQuery) ||
      (a.provider && a.provider.toLowerCase().includes(searchQuery)) ||
      (a.category && a.category.toLowerCase().includes(searchQuery)) ||
      (a.owner && a.owner.toLowerCase().includes(searchQuery)) ||
      (a.description && a.description.toLowerCase().includes(searchQuery)) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(searchQuery)))
    );
  }

  // --- FILTERS STATE ---
  const currentCategory = app.activeFilters.category || "All";
  const currentStatus = app.activeFilters.status || "All";
  const currentRenewal = app.activeFilters.renewal || "All";
  const currentOwner = app.activeFilters.owner || "All";

  if (currentCategory !== "All") {
    assets = assets.filter(a => a.category === currentCategory);
  }
  if (currentStatus !== "All") {
    assets = assets.filter(a => a.status === currentStatus);
  }
  if (currentRenewal !== "All") {
    assets = assets.filter(a => a.renewalType === currentRenewal);
  }
  if (currentOwner !== "All") {
    assets = assets.filter(a => a.owner === currentOwner);
  }

  // Pin & Favorite Sort: Pinned first, then favorites, then alphabetical
  assets.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });

  const categories = store.getCategories();
  const owners = [...new Set(store.getAssets().map(a => a.owner).filter(Boolean))];

  const container = document.getElementById("isolated-assets-view-mount") || document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Digital Assets Repository</h2>
        <p>Single source of truth for tracking active services and subscriptions (${assets.length} items)</p>
      </div>
      <div class="header-actions" style="display:flex; gap:10px">
        <button class="btn btn-secondary" id="export-csv-btn">
          <i data-lucide="download"></i> Export CSV
        </button>
        <button class="btn btn-primary" id="add-asset-btn">
          <i data-lucide="plus"></i> Add New Asset
        </button>
      </div>
    </div>

    <!-- Subtle Filters Row -->
    <div class="filters-row">
      <div class="filters-left">
        <select id="filter-category" class="filter-select">
          <option value="All">Category</option>
          ${categories.map(c => `<option value="${c}" ${c === currentCategory ? 'selected' : ''}>${c}</option>`).join("")}
        </select>
        
        <select id="filter-status" class="filter-select">
          <option value="All">Status</option>
          <option value="Active" ${currentStatus === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Renew Soon" ${currentStatus === 'Renew Soon' ? 'selected' : ''}>Renew Soon</option>
          <option value="Expired" ${currentStatus === 'Expired' ? 'selected' : ''}>Expired</option>
          <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>

        <select id="filter-renewal" class="filter-select">
          <option value="All">Renewal</option>
          <option value="Monthly" ${currentRenewal === 'Monthly' ? 'selected' : ''}>Monthly</option>
          <option value="Quarterly" ${currentRenewal === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
          <option value="Yearly" ${currentRenewal === 'Yearly' ? 'selected' : ''}>Yearly</option>
          <option value="One Time" ${currentRenewal === 'One Time' ? 'selected' : ''}>One Time</option>
        </select>

        <select id="filter-owner" class="filter-select">
          <option value="All">Owner</option>
          ${owners.map(o => `<option value="${o}" ${o === currentOwner ? 'selected' : ''}>${o}</option>`).join("")}
        </select>

        <div class="filter-search-input">
          <i data-lucide="search"></i>
          <input type="text" id="filter-search-inline" placeholder="Search..." value="${searchQuery}">
        </div>
      </div>

      <button class="filter-reset-btn" id="filter-reset-btn">
        <i data-lucide="x" style="width:12px; height:12px;"></i> Reset
      </button>
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
  document.getElementById("filter-owner").addEventListener("change", (e) => {
    app.activeFilters.owner = e.target.value;
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

  // Clicking cards to open detail drawer
  document.querySelectorAll(".asset-card").forEach(card => {
    card.addEventListener("click", () => {
      app.openAssetDetails(card.dataset.id);
    });
  });

  // Add Asset button trigger
  document.getElementById("add-asset-btn").addEventListener("click", () => {
    app.openAssetForm();
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
