// OpsHub Dashboard View - Phase 2 Premium Updates
import { convertSelects } from "../components/dropdown.js";
import { renderAssets } from "./assets.js";
import { renderProjects } from "./projects.js";
import { renderTasks } from "./tasks.js";

export function renderDashboard(app, store, engine) {
  const currentCompany = app.currentCompany;

  // Render Sub-Navigation Workspace Hubs for Specific Company
  if (currentCompany !== "Global") {
    renderCompanyWorkspaceHub(app, store, engine);
    return;
  }

  // --- GLOBAL OPERATIONS DASHBOARD ---
  const assets = store.getAssets();
  const tasks = store.getTasks();
  const logs = store.getActivityLogs().slice(0, 5);
  const notifications = store.getNotifications().slice(0, 5);

  const todayStr = "2026-07-16";
  const today = new Date(todayStr);

  const settings = store.getSettings();
  const userCurrency = store.getUserCurrency();

  const convertAmount = (val, fromCur, toCur) => {
    return store.convertCost(val, fromCur, toCur);
  };

  const formatValue = (amount) => {
    const symbol = store.getCurrencySymbol(userCurrency);
    const numFormat = settings.preferences?.numberFormat || "International";
    let formattedVal;
    if (numFormat === "Indian") {
      formattedVal = amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      formattedVal = amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return `${symbol}${formattedVal}`;
  };


  // Compile general metrics
  let totalAssetsCount = assets.length;
  let overdueRenewals = 0;
  let expiring7Days = 0;
  let expiringThisMonth = 0;
  let monthlySpend = 0;
  let annualSpend = 0;

  assets.forEach(asset => {
    if (asset.cost && asset.status !== "Cancelled") {
      const convertedCost = convertAmount(asset.cost, asset.currency, userCurrency);
      if (asset.renewalType === "Monthly") {
        monthlySpend += convertedCost;
        annualSpend += convertedCost * 12;
      } else if (asset.renewalType === "Quarterly") {
        monthlySpend += convertedCost / 3;
        annualSpend += convertedCost * 4;
      } else if (asset.renewalType === "Yearly") {
        monthlySpend += convertedCost / 12;
        annualSpend += convertedCost;
      }
    }

    if (asset.renewalDate && asset.renewalType !== "One Time" && asset.status !== "Cancelled") {
      const rDate = new Date(asset.renewalDate);
      const diffTime = rDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdueRenewals++;
      } else if (diffDays <= 7) {
        expiring7Days++;
        expiringThisMonth++;
      } else if (diffDays <= 30) {
        expiringThisMonth++;
      }
    }
  });

  const pendingTasks = tasks.filter(t => t.status === "Pending");
  const criticalAssets = assets.filter(a => a.status === "Expired" || a.status === "Renew Soon");
  const upcomingPayments = assets
    .filter(a => a.renewalDate && a.renewalType !== "One Time" && a.status !== "Cancelled")
    .map(a => {
      const diffTime = new Date(a.renewalDate).getTime() - today.getTime();
      return {
        ...a,
        daysRemaining: Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  const container = document.getElementById("app-content");

  // Get saved widgets layout or use default
  const widgetLayout = (settings.dashboardLayout || ["spend", "renewals", "focus", "tasks", "companies", "activity", "notifications", "quick"]).filter(w => w !== "timeline");

  // Core templates of all widgets
  const widgetTemplates = {
    spend: `
      <!-- Spend Card (Monthly & Annual Spend side-by-side) -->
      <div class="card widget-span-8" data-widget="spend" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; padding: 20px 24px; min-height: 120px;">
        ${renderWidgetControls("spend", widgetLayout)}
        <div style="display:flex; align-items:center; gap: 16px; border-right: 1px solid var(--border-color); padding-right: 16px;">
          <div class="stat-icon-box" style="background-color: rgba(16, 185, 129, 0.08); color: var(--color-success); width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink:0;">
            <i data-lucide="calculator" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-details">
            <h4 style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Monthly Spend</h4>
            <div class="stat-value" style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: var(--text-main);">${formatValue(monthlySpend)}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap: 16px;">
          <div class="stat-icon-box" style="background-color: rgba(99, 102, 241, 0.08); color: var(--color-primary); width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink:0;">
            <i data-lucide="banknote" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-details">
            <h4 style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Annual Spend</h4>
            <div class="stat-value" style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: var(--text-main);">${formatValue(annualSpend)}</div>
          </div>
        </div>
      </div>
    `,
    renewals: `
      <!-- Upcoming Payments Widget -->
      <div class="card widget-span-8" data-widget="renewals">
        <div class="widget-header">
          <h3 class="widget-title">Upcoming Renewals & Bills</h3>
          <div style="display:flex; align-items:center; gap:8px">
            ${renderWidgetControls("renewals", widgetLayout)}
            <a href="#assets" class="btn btn-secondary btn-sm">View All</a>
          </div>
        </div>
        <div class="tasks-table-wrapper">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Renewal Date</th>
                <th>Cost</th>
                <th>Auto</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${upcomingPayments.length === 0 ? `
                <tr><td colspan="6" style="text-align:center; color:var(--text-muted)">No upcoming bills found.</td></tr>
              ` : upcomingPayments.map(p => `
                <tr class="clickable-row" data-id="${p.id}">
                  <td data-label="Asset Name"><strong>${p.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted)">${p.category} • ${p.company}</span></td>
                  <td data-label="Renewal Date">${p.renewalDate}</td>
                  <td data-label="Cost" style="font-weight:600">${store.formatCost(p.cost, p.currency)}</td>
                  <td data-label="Auto"><span class="badge ${p.autoRenew ? 'status-active' : 'status-cancelled'}">${p.autoRenew ? 'Yes' : 'No'}</span></td>
                  <td data-label="Status"><span class="badge ${p.status === 'Expired' ? 'status-expired' : (p.status === 'Renew Soon' ? 'status-renew' : 'status-active')}">${p.status}</span></td>
                  <td data-label="Action"><button class="btn btn-primary btn-sm renew-quick-btn" data-id="${p.id}">Renew</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `,
    focus: `
      <!-- Today's Focus Card -->
      <div class="card widget-span-4" style="background-color:rgba(244,63,94,0.015); border-color:rgba(244,63,94,0.15)" data-widget="focus">
        <div class="widget-header">
          <h3 class="widget-title" style="color:var(--color-danger)">Today's Expiry Alerts</h3>
          ${renderWidgetControls("focus", widgetLayout)}
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow-y:auto">
          ${criticalAssets.length === 0 ? `
            <div style="color:var(--text-muted); text-align:center; padding:15px; font-size:0.85rem">All digital assets are currently healthy!</div>
          ` : criticalAssets.map(ca => `
            <div class="agenda-item focus-alert-row" data-id="${ca.id}" style="padding:10px; border-radius:var(--radius-sm); border:1px solid rgba(244,63,94,0.2); background-color:var(--bg-card)">
              <div style="display:flex; gap:8px; align-items:center">
                <i data-lucide="alert-triangle" style="width:16px; height:16px; color:var(--color-danger)"></i>
                <div>
                  <span style="font-size:0.85rem; font-weight:600; display:block">${ca.name}</span>
                  <span style="font-size:0.75rem; color:var(--text-muted)">Expires: ${ca.expiryDate || 'N/A'}</span>
                </div>
              </div>
              <span class="badge status-expired" style="font-size:0.65rem">${ca.status}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `,
    tasks: `
      <!-- Tasks Checklist Widget -->
      <div class="card widget-span-4" data-widget="tasks">
        <div class="widget-header">
          <h3 class="widget-title">Renewal Checklists</h3>
          <div style="display:flex; align-items:center; gap:8px">
            ${renderWidgetControls("tasks", widgetLayout)}
            <a href="#tasks" class="btn btn-secondary btn-sm">All Tasks</a>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow-y:auto">
          ${pendingTasks.length === 0 ? `
            <div style="color:var(--text-muted); text-align:center; padding:20px; font-size:0.85rem">All checklist tasks resolved!</div>
          ` : pendingTasks.map(t => `
            <label class="custom-checkbox-container" tabindex="0" data-id="${t.assetId}">
              <input type="checkbox" class="toggle-task-checkbox quick-task-complete" data-taskid="${t.id}">
              <span class="custom-checkbox"></span>
              <div style="display:flex; flex-direction:column">
                <span class="task-title-text" style="font-size:0.85rem; font-weight:600">${t.title}</span>
                <span style="font-size:0.7rem; color:var(--text-muted)">Due: ${t.dueDate}</span>
              </div>
            </label>
          `).join("")}
        </div>
      </div>
    `,

    companies: `
      <!-- Companies Distribution -->
      <div class="card widget-span-4" data-widget="companies">
        <div class="widget-header">
          <h3 class="widget-title">Assets by Organization</h3>
          ${renderWidgetControls("companies", widgetLayout)}
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${store.getCompanies().map(c => {
            const count = assets.filter(a => a.company === c).length;
            const pct = totalAssetsCount > 0 ? Math.round((count / totalAssetsCount) * 100) : 0;
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px">
                  <span>${c}</span>
                  <strong>${count} items (${pct}%)</strong>
                </div>
                <div style="width:100%; height:5px; background-color:var(--bg-hover); border-radius:4px; overflow:hidden">
                  <div style="width:${pct}%; height:100%; background-color:var(--color-primary)"></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `,
    activity: `
      <!-- Activity Timeline -->
      <div class="card widget-span-8" data-widget="activity">
        <div class="widget-header">
          <h3 class="widget-title">Recent System Logs</h3>
          ${renderWidgetControls("activity", widgetLayout)}
        </div>
        <div class="timeline">
          ${logs.length === 0 ? `
            <div style="color:var(--text-muted); text-align:center; padding:15px">No audit timelines registered.</div>
          ` : logs.map(l => `
            <div class="timeline-item">
              <span class="timeline-time">${l.date} - ${l.user}</span>
              <span class="timeline-desc"><strong>${l.action}</strong>: ${l.details}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `,
    notifications: `
      <!-- Notifications Center Quick panel -->
      <div class="card widget-span-4" data-widget="notifications">
        <div class="widget-header">
          <h3 class="widget-title">Reminders Feed</h3>
          ${renderWidgetControls("notifications", widgetLayout)}
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto">
          ${notifications.length === 0 ? `
            <div style="color:var(--text-muted); text-align:center; padding:20px; font-size:0.85rem">No reminders feed logs.</div>
          ` : notifications.map(n => `
            <div class="notif-item ${n.isRead ? '' : 'unread'}" data-assetid="${n.assetId}" style="padding:10px; border-radius:var(--radius-sm)">
              <div style="font-size:0.8rem; line-height:1.4">${n.message}</div>
              <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-top:4px">${n.date}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `,
    quick: `
      <!-- Quick Actions Widget -->
      <div class="card widget-span-4" data-widget="quick">
        <div class="widget-header">
          <h3 class="widget-title">Quick Actions Panel</h3>
          ${renderWidgetControls("quick", widgetLayout)}
        </div>
        <div style="display:flex; flex-direction:column; gap:10px">
          <button class="btn btn-secondary btn-sm" id="btn-quick-add-domain" style="text-align:left; justify-content:flex-start">
            <i data-lucide="globe" style="width:14px; height:14px"></i> Register Domain Asset
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-quick-add-server" style="text-align:left; justify-content:flex-start">
            <i data-lucide="server" style="width:14px; height:14px"></i> Track VPS Infrastructure
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-quick-export" style="text-align:left; justify-content:flex-start">
            <i data-lucide="download" style="width:14px; height:14px"></i> Export Assets Report
          </button>
        </div>
      </div>
    `
  };

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Global Operations Dashboard</h2>
        <p>Operational health metrics, aggregated billing cost curves, and renewal tasks checklist</p>
      </div>
      <div class="header-actions">
        <span class="badge status-active" style="padding: 8px 12px; font-size:0.85rem">Viewport: Global</span>
      </div>
    </div>

    <!-- Core stats overview -->
    <div class="stats-grid">
      <div class="card stat-card stat-primary">
        <div class="stat-icon-box"><i data-lucide="database"></i></div>
        <div class="stat-details">
          <h4>Total Assets</h4>
          <div class="stat-value">${totalAssetsCount}</div>
        </div>
      </div>
      <div class="card stat-card stat-danger">
        <div class="stat-icon-box"><i data-lucide="alert-octagon"></i></div>
        <div class="stat-details">
          <h4>Overdue</h4>
          <div class="stat-value">${overdueRenewals}</div>
        </div>
      </div>
      <div class="card stat-card stat-warning">
        <div class="stat-icon-box"><i data-lucide="clock"></i></div>
        <div class="stat-details">
          <h4>Expiring in 7d</h4>
          <div class="stat-value">${expiring7Days}</div>
        </div>
      </div>
      <div class="card stat-card stat-info">
        <div class="stat-icon-box"><i data-lucide="calendar-range"></i></div>
        <div class="stat-details">
          <h4>Expiring in 30d</h4>
          <div class="stat-value">${expiringThisMonth}</div>
        </div>
      </div>
    </div>

    <!-- Widgets layout container -->
    <div class="widget-grid" id="widgets-layout-grid">
      ${widgetLayout.map(w => widgetTemplates[w] || "").join("")}
    </div>
  `;

  // Draw Lucide icons
  lucide.createIcons();

  // Convert elements
  convertSelects(container);

  // --- BIND EVENT HANDLERS ---
  
  // Widget rearranger sorting buttons click
  document.querySelectorAll(".arranger-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const widget = btn.dataset.widget;
      const dir = btn.dataset.dir; // up or down

      const layout = [...widgetLayout];
      const idx = layout.indexOf(widget);
      
      if (idx !== -1) {
        if (dir === "up" && idx > 0) {
          // Swap with previous
          [layout[idx], layout[idx - 1]] = [layout[idx - 1], layout[idx]];
        } else if (dir === "down" && idx < layout.length - 1) {
          // Swap with next
          [layout[idx], layout[idx + 1]] = [layout[idx + 1], layout[idx]];
        }
        
        settings.dashboardLayout = layout;
        store.saveSettings(settings);
        renderDashboard(app, store, engine);
      }
    });
  });

  // Table row checks
  document.querySelectorAll(".clickable-row").forEach(row => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("input")) return;
      app.openAssetDetails(row.dataset.id);
    });
  });

  // Task completes
  document.querySelectorAll(".quick-task-complete").forEach(cb => {
    cb.addEventListener("change", () => {
      const taskId = cb.dataset.taskid;
      const tList = store.getTasks();
      const idx = tList.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        tList[idx].status = "Completed";
        tList[idx].completedDate = todayStr;
        store.saveTasks(tList);
        store.logActivity("Completed Task", `Completed task: ${tList[idx].title}`, tList[idx].company);
        
        renderDashboard(app, store, engine);
        app.updateGlobalCounters();
      }
    });
  });

  // Quick action panel events
  document.getElementById("btn-quick-add-domain")?.addEventListener("click", () => {
    app.openAssetForm();
    document.getElementById("form-asset-category").value = "Domain";
    if (document.getElementById("form-asset-category").customSelectInstance) {
      document.getElementById("form-asset-category").customSelectInstance.select("Domain");
    }
  });

  document.getElementById("btn-quick-add-server")?.addEventListener("click", () => {
    app.openAssetForm();
    document.getElementById("form-asset-category").value = "VPS";
    if (document.getElementById("form-asset-category").customSelectInstance) {
      document.getElementById("form-asset-category").customSelectInstance.select("VPS");
    }
  });

  document.getElementById("btn-quick-export")?.addEventListener("click", () => {
    window.location.hash = "#assets";
    setTimeout(() => {
      document.getElementById("export-csv-btn")?.click();
    }, 150);
  });

  // Notification items click
  document.querySelectorAll(".notif-item").forEach(item => {
    item.addEventListener("click", () => {
      app.openAssetDetails(item.dataset.assetid);
    });
  });

  // Quick renew action click
  document.querySelectorAll(".renew-quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const asset = store.getAssets().find(a => a.id === btn.dataset.id);
      if (asset) {
        const cost = prompt(`Enter renewal cost for ${asset.name} in ${asset.currency}:`, asset.cost);
        if (cost !== null) {
          const vCost = parseFloat(cost) || asset.cost;
          const invoice = prompt(`Invoice No:`, "INV-" + Date.now().toString().substr(-5));
          const ok = engine.renewAsset(asset.id, vCost, asset.paymentMethod, invoice, "Quick renewed from dashboard.");
          if (ok) {
            alert(`${asset.name} renewed successfully!`);
            renderDashboard(app, store, engine);
            app.updateGlobalCounters();
          }
        }
      }
    });
  });

  // Focus alerts click
  document.querySelectorAll(".focus-alert-row").forEach(el => {
    el.addEventListener("click", () => {
      app.openAssetDetails(el.dataset.id);
    });
  });
}

// Controls panel rendering template for custom widget layouts
function renderWidgetControls(widgetName, layout) {
  const isFirst = layout.indexOf(widgetName) === 0;
  const isLast = layout.indexOf(widgetName) === layout.length - 1;

  return `
    <div class="widget-arranger-group">
      <button type="button" class="arranger-btn" data-widget="${widgetName}" data-dir="up" ${isFirst ? 'style="opacity:0.2; pointer-events:none"' : ''} title="Move Widget Up">
        <i data-lucide="arrow-up" style="width:10px; height:10px"></i>
      </button>
      <button type="button" class="arranger-btn" data-widget="${widgetName}" data-dir="down" ${isLast ? 'style="opacity:0.2; pointer-events:none"' : ''} title="Move Widget Down">
        <i data-lucide="arrow-down" style="width:10px; height:10px"></i>
      </button>
    </div>
  `;
}

// --- COMPANY HACKS AND SUB-NAV WORKSPACE HUB ---
function renderCompanyWorkspaceHub(app, store, engine) {
  const currentCompany = app.currentCompany;
  const assets = store.getAssets().filter(a => a.company === currentCompany);
  const projects = store.getProjects(); // All projects, filter inside view
  const tasks = store.getTasks().filter(t => t.company === currentCompany);
  const logs = store.getActivityLogs().filter(l => l.company === currentCompany).slice(0, 10);

  // Tab State
  app.companyHubTab = app.companyHubTab || "overview";
  const activeTab = app.companyHubTab;

  const container = document.getElementById("app-content");

  // Renders navigation header with custom tabs
  container.innerHTML = `
    <div class="view-header" style="margin-bottom: 12px">
      <div class="view-title-group">
        <h2>${currentCompany} Workspace</h2>
        <p>Operational hub and assets mapping isolation for <strong>${currentCompany}</strong></p>
      </div>
      <div class="header-actions">
        <span class="badge status-active" style="padding: 8px 12px; font-size:0.85rem">Org Workspace Active</span>
      </div>
    </div>

    <!-- Company Hub Sub Navigation tabs -->
    <div class="drawer-tabs" style="margin-bottom: 20px;">
      <button class="drawer-tab company-hub-tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
      <button class="drawer-tab company-hub-tab ${activeTab === 'assets' ? 'active' : ''}" data-tab="assets">Assets (${assets.length})</button>
      <button class="drawer-tab company-hub-tab ${activeTab === 'projects' ? 'active' : ''}" data-tab="projects">Projects</button>
      <button class="drawer-tab company-hub-tab ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Tasks (${tasks.filter(t=>t.status==='Pending').length})</button>
      <button class="drawer-tab company-hub-tab ${activeTab === 'activity' ? 'active' : ''}" data-tab="activity">Recent Activity</button>
    </div>

    <div id="company-workspace-content-body"></div>
  `;

  const hubBody = container.querySelector("#company-workspace-content-body");

  if (activeTab === "overview") {
    // Mini summary dashboard widgets isolated
    renderCompanyOverview(app, store, engine, assets, tasks, hubBody);
  } else if (activeTab === "assets") {
    // Render asset grid
    hubBody.innerHTML = `<div id="isolated-assets-view-mount"></div>`;
    renderAssets(app, store, engine);
  } else if (activeTab === "projects") {
    // Render projects list
    hubBody.innerHTML = `<div id="isolated-projects-view-mount"></div>`;
    renderProjects(app, store, engine);
  } else if (activeTab === "tasks") {
    // Render tasks list
    hubBody.innerHTML = `<div id="isolated-tasks-view-mount"></div>`;
    renderTasks(app, store, engine);
  } else if (activeTab === "activity") {
    // Activity timeline listing
    hubBody.innerHTML = `
      <div class="card">
        <h3 class="widget-title" style="margin-bottom:16px">Recent Company Audit Trails</h3>
        <div class="timeline">
          ${logs.length === 0 ? `
            <div style="color:var(--text-muted); text-align:center; padding:15px">No audit actions recorded for this company yet.</div>
          ` : logs.map(l => `
            <div class="timeline-item">
              <span class="timeline-time">${l.date} - ${l.user}</span>
              <span class="timeline-desc"><strong>${l.action}</strong>: ${l.details}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    lucide.createIcons();
  }

  // Bind tab changes
  document.querySelectorAll(".company-hub-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      app.companyHubTab = tab.dataset.tab;
      renderCompanyWorkspaceHub(app, store, engine);
    });
  });

  // Re-draw icons
  lucide.createIcons();
  convertSelects(container);
}

// Mini dashboard summary for specific company overview
function renderCompanyOverview(app, store, engine, assets, tasks, hubBody) {
  const overdueCount = assets.filter(a => a.status === "Expired").length;
  const renewSoonCount = assets.filter(a => a.status === "Renew Soon").length;
  const pendingTasks = tasks.filter(t => t.status === "Pending");

  hubBody.innerHTML = `
    <div class="stats-grid">
      <div class="card stat-card stat-primary">
        <div class="stat-icon-box"><i data-lucide="database"></i></div>
        <div class="stat-details">
          <h4>Company Assets</h4>
          <div class="stat-value">${assets.length} items</div>
        </div>
      </div>
      <div class="card stat-card stat-danger">
        <div class="stat-icon-box"><i data-lucide="alert-circle"></i></div>
        <div class="stat-details">
          <h4>Expired</h4>
          <div class="stat-value">${overdueCount}</div>
        </div>
      </div>
      <div class="card stat-card stat-warning">
        <div class="stat-icon-box"><i data-lucide="clock"></i></div>
        <div class="stat-details">
          <h4>Renew Soon</h4>
          <div class="stat-value">${renewSoonCount}</div>
        </div>
      </div>
      <div class="card stat-card stat-success">
        <div class="stat-icon-box"><i data-lucide="check-square"></i></div>
        <div class="stat-details">
          <h4>Pending Tasks</h4>
          <div class="stat-value">${pendingTasks.length} tasks</div>
        </div>
      </div>
    </div>

    <div class="widget-grid">
      <div class="card widget-span-6">
        <h3 class="widget-title" style="margin-bottom:12px">Company Expiries Schedule</h3>
        <div class="tasks-table-wrapper">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Renewal Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${assets.slice(0, 5).map(a => `
                <tr class="clickable-comp-row" data-id="${a.id}" style="cursor:pointer">
                  <td><strong>${a.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted)">${a.category}</span></td>
                  <td>${a.renewalDate || 'N/A'}</td>
                  <td><span class="badge ${a.status === 'Expired' ? 'status-expired' : (a.status === 'Renew Soon' ? 'status-renew' : 'status-active')}">${a.status}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card widget-span-6">
        <h3 class="widget-title" style="margin-bottom:12px">Company Tasks</h3>
        <div style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow-y:auto">
          ${pendingTasks.length === 0 ? `
            <div style="color:var(--text-muted); text-align:center; padding:15px; font-size:0.85rem">No pending tasks for this company!</div>
          ` : pendingTasks.map(t => `
            <label class="custom-checkbox-container" data-id="${t.assetId}">
              <input type="checkbox" class="toggle-task-checkbox quick-task-complete" data-taskid="${t.id}">
              <span class="custom-checkbox"></span>
              <div style="display:flex; flex-direction:column">
                <span class="task-title-text" style="font-size:0.85rem; font-weight:600">${t.title}</span>
                <span style="font-size:0.7rem; color:var(--text-muted)">Due: ${t.dueDate}</span>
              </div>
            </label>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  // Draw icons
  lucide.createIcons();

  // Row clicks
  document.querySelectorAll(".clickable-comp-row").forEach(row => {
    row.addEventListener("click", () => {
      app.openAssetDetails(row.dataset.id);
    });
  });

  // Task completes check
  document.querySelectorAll(".quick-task-complete").forEach(cb => {
    cb.addEventListener("change", () => {
      const taskId = cb.dataset.taskid;
      const tList = store.getTasks();
      const idx = tList.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        tList[idx].status = "Completed";
        tList[idx].completedDate = "2026-07-16";
        store.saveTasks(tList);
        store.logActivity("Completed Task", `Completed task: ${tList[idx].title}`, tList[idx].company);
        
        renderCompanyWorkspaceHub(app, store, engine);
        app.updateGlobalCounters();
      }
    });
  });
}
