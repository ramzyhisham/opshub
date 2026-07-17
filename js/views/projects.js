// OpsHub Projects Workspace view - Simplified Dependency Flow
import { convertSelects } from "../components/dropdown.js";

export function renderProjects(app, store, engine) {
  const currentCompany = app.currentCompany;
  const assets = store.getAssets().filter(a => currentCompany === "Global" || a.company === currentCompany);
  const projects = store.getProjects();

  let selectedProject = app.activeProject || projects[0];
  app.activeProject = selectedProject;

  const projectAssets = assets.filter(a => a.project === selectedProject);

  // Check if parent node (Domain) is expired
  const domainNode = projectAssets.find(a => a.category === "Domain");
  const isDomainExpired = domainNode && (domainNode.status === "Expired" || domainNode.status === "Cancelled");

  const userCurrency = store.getUserCurrency();
  const settings = store.getSettings();
  const numFormat = settings.preferences?.numberFormat || "International";
  const formatStatVal = (amount) => {
    const symbol = store.getCurrencySymbol(userCurrency);
    let formattedVal;
    if (numFormat === "Indian") {
      formattedVal = amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    } else {
      formattedVal = amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return `${symbol}${formattedVal}`;
  };
  let projectMonthlySpend = 0;
  let projectAnnualSpend = 0;
  let expiredNodes = 0;
  let warningNodes = 0;

  projectAssets.forEach(a => {
    if (a.status === "Expired") expiredNodes++;
    else if (a.status === "Renew Soon") warningNodes++;

    if (a.cost && a.status !== "Cancelled") {
      const convertedCost = store.convertCost(a.cost, a.currency, userCurrency);
      if (a.renewalType === "Monthly") {
        projectMonthlySpend += convertedCost;
        projectAnnualSpend += convertedCost * 12;
      } else if (a.renewalType === "Quarterly") {
        projectMonthlySpend += convertedCost / 3;
        projectAnnualSpend += convertedCost * 4;
      } else if (a.renewalType === "Yearly") {
        projectMonthlySpend += convertedCost / 12;
        projectAnnualSpend += convertedCost;
      }
    }
  });

  // Sort project assets in logical dependency order
  const categoryOrder = ["Domain", "CDN", "Hosting", "VPS", "Database", "Backup", "Business Mail", "SSL", "API", "Payment Gateway"];
  const sortedAssets = [...projectAssets].sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category);
    const bi = categoryOrder.indexOf(b.category);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const container = document.getElementById("isolated-projects-view-mount") || document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Projects</h2>
        <p>Infrastructure relationships and asset dependencies</p>
      </div>
      <div class="header-actions">
        <select id="project-workspace-selector" class="filter-select" style="font-size:0.9rem; font-weight:600; padding: 8px 14px; height:40px;">
          ${projects.map(p => `<option value="${p}" ${p === selectedProject ? 'selected' : ''}>${p}</option>`).join("")}
        </select>
      </div>
    </div>

    <!-- Summary Row -->
    <div class="stats-grid" style="margin-bottom: 24px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
      <div class="card stat-card stat-info">
        <div class="stat-icon-box"><i data-lucide="layers-3"></i></div>
        <div class="stat-details">
          <h4>Assets</h4>
          <div class="stat-value">${projectAssets.length}</div>
        </div>
      </div>
      <div class="card stat-card stat-success">
        <div class="stat-icon-box"><i data-lucide="credit-card"></i></div>
        <div class="stat-details">
          <h4>Monthly Cost</h4>
          <div class="stat-value">${formatStatVal(projectMonthlySpend)}</div>
        </div>
      </div>
      <div class="card stat-card stat-success">
        <div class="stat-icon-box"><i data-lucide="calendar"></i></div>
        <div class="stat-details">
          <h4>Annual Cost</h4>
          <div class="stat-value">${formatStatVal(projectAnnualSpend)}</div>
        </div>
      </div>
      <div class="card stat-card ${isDomainExpired || expiredNodes > 0 ? 'stat-danger' : (warningNodes > 0 ? 'stat-warning' : 'stat-success')}">
        <div class="stat-icon-box"><i data-lucide="activity"></i></div>
        <div class="stat-details">
          <h4>Health</h4>
          <div class="stat-value">
            ${isDomainExpired ? 'Downtime' : (expiredNodes > 0 ? 'Action Needed' : (warningNodes > 0 ? 'Warning' : 'Healthy'))}
          </div>
        </div>
      </div>
    </div>

    <div class="project-details-grid">
      
      <!-- Dependency Flow Column -->
      <div class="card" style="padding: 20px;">
        <h3 class="widget-title" style="margin-bottom: 20px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Dependency Flow</h3>
        
        ${projectAssets.length === 0 ? `
          <div style="text-align:center; color:var(--text-muted); padding:20px; font-size:0.85rem;">
            <i data-lucide="layers" style="width:28px; height:28px; margin-bottom:8px; opacity:0.4;"></i>
            <p>No assets linked to this project yet.</p>
          </div>
        ` : `
          ${isDomainExpired ? `
            <div style="margin-bottom:16px; padding:10px 12px; background-color:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); border-radius:var(--radius-md); font-size:0.78rem; color:var(--color-danger); display:flex; align-items:center; gap:8px;">
              <i data-lucide="alert-triangle" style="width:14px; height:14px; flex-shrink:0;"></i>
              Primary domain expired — downstream services impacted.
            </div>
          ` : ''}

          <div class="dep-flow-list">
            <!-- Project Root Node -->
            <div class="dep-flow-item" style="width:100%">
              <div class="dep-flow-node" style="border-color: var(--border-color); background-color: var(--bg-hover); padding: 12px; text-align: center; border-radius: var(--radius-md);">
                <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                  <i data-lucide="folder-git-2" style="width:16px; height:16px; color:var(--color-primary);"></i>
                  <span style="font-family:var(--font-heading); font-size:0.9rem; font-weight:700; color:var(--text-main);">${selectedProject}</span>
                </div>
              </div>
              ${sortedAssets.length > 0 ? `
                <div class="dep-flow-arrow">
                  <i data-lucide="arrow-down" style="width:14px; height:14px; color:var(--border-color);"></i>
                </div>
              ` : ''}
            </div>

            ${sortedAssets.map((a, idx) => {
              let statusColor = "var(--color-success)";
              let statusBg = "rgba(16,185,129,0.08)";
              let statusBorder = "rgba(16,185,129,0.2)";
              
              if (a.status === "Expired" || (isDomainExpired && a.category !== "Domain" && a.status !== "Cancelled")) {
                statusColor = "var(--color-danger)";
                statusBg = "rgba(244,63,94,0.08)";
                statusBorder = "rgba(244,63,94,0.2)";
              } else if (a.status === "Renew Soon") {
                statusColor = "var(--color-warning)";
                statusBg = "rgba(245,158,11,0.08)";
                statusBorder = "rgba(245,158,11,0.2)";
              } else if (a.status === "Cancelled") {
                statusColor = "var(--text-muted)";
                statusBg = "transparent";
                statusBorder = "var(--border-color)";
              }

              return `
                <div class="dep-flow-item project-asset-row" data-id="${a.id}">
                  <div class="dep-flow-node" style="border-color: ${statusBorder}; background-color: ${statusBg};">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                      <i data-lucide="${getCategoryIcon(a.category)}" style="width:14px; height:14px; color:${statusColor}; flex-shrink:0;"></i>
                      <div style="overflow:hidden; flex:1; min-width:0;">
                        <div style="font-size:0.85rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.name}</div>
                        <div style="font-size:0.72rem; color:var(--text-muted);">${a.category}${a.provider ? ` · ${a.provider}` : ''}</div>
                      </div>
                    </div>
                    ${a.renewalDate ? `<div style="font-size:0.7rem; color:${statusColor}; margin-top:4px; font-weight:500;">${a.renewalDate}</div>` : ''}
                  </div>
                  ${idx < sortedAssets.length - 1 ? `
                    <div class="dep-flow-arrow">
                      <i data-lucide="arrow-down" style="width:14px; height:14px; color:var(--border-color);"></i>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <!-- Asset Details Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color);">
          <h3 class="widget-title" style="font-size:0.9rem;">Linked Assets</h3>
        </div>
        <div style="overflow-x: auto;">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Renews</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${projectAssets.length === 0 ? `
                <tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">No assets linked yet.</td></tr>
              ` : sortedAssets.map(a => {
                let statusClass = "status-active";
                let statusLabel = a.status;
                if (a.status === "Expired" || (isDomainExpired && a.category !== "Domain" && a.status !== "Cancelled")) {
                  statusClass = "status-expired";
                  statusLabel = a.status === "Expired" ? "Expired" : "Impacted";
                } else if (a.status === "Renew Soon") {
                  statusClass = "status-renew";
                } else if (a.status === "Cancelled") {
                  statusClass = "status-cancelled";
                }
                return `
                  <tr class="project-asset-row clickable-row" data-id="${a.id}">
                    <td data-label="Asset"><strong>${a.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${a.provider || a.company}</span></td>
                    <td data-label="Category">${a.category}</td>
                    <td data-label="Cost" style="font-weight:600;">${a.cost > 0 ? store.formatCost(a.cost, a.currency) : 'Free'}</td>
                    <td data-label="Renews">${a.renewalDate || 'N/A'}</td>
                    <td data-label="Status"><span class="badge ${statusClass}">${statusLabel}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  lucide.createIcons();
  convertSelects(container);

  document.getElementById("project-workspace-selector")?.addEventListener("change", (e) => {
    app.activeProject = e.target.value;
    renderProjects(app, store, engine);
  });

  document.querySelectorAll(".project-asset-row").forEach(row => {
    row.addEventListener("click", () => app.openAssetDetails(row.dataset.id));
  });
}

function getCategoryIcon(cat) {
  const icons = {
    "Domain": "globe", "Hosting": "server", "VPS": "hard-drive",
    "Business Mail": "mail", "SSL": "shield-check", "Cloud Storage": "cloud",
    "Developer Account": "code-2", "API": "key-round", "Subscription": "credit-card",
    "License": "file-key-2", "Database": "database", "Backup": "archive",
    "CDN": "zap", "Payment Gateway": "wallet", "Marketing Tool": "megaphone",
    "Analytics": "line-chart", "Communication": "message-square-more", "Security": "lock"
  };
  return icons[cat] || "box";
}
