// OpsHub SPA Coordinator Entrypoint - Phase 2 Premium Updates
import { OpsHubStore } from "./store.js";
import { OpsHubEngine } from "./engine.js";
import { convertSelects } from "./components/dropdown.js";

// Import Views
import { renderDashboard } from "./views/dashboard.js";
import { renderAssets } from "./views/assets.js";
import { renderProjects } from "./views/projects.js";
import { renderTimeline } from "./views/timeline.js";
import { renderTasks } from "./views/tasks.js";
import { renderCalendar } from "./views/calendar.js";
import { renderAnalytics } from "./views/analytics.js";
import { renderSettings } from "./views/settings.js";
import { renderDetailDrawer } from "./views/detail.js";

class OpsHubApp {
  constructor() {
    this.store = new OpsHubStore();
    this.engine = new OpsHubEngine(this.store);

    // Initial state
    this.currentView = "#dashboard";
    this.currentCompany = "Global";
    this.activeFilters = { category: "All", status: "All", renewal: "All", owner: "All" };
    this.activeProject = "";
    this.activeCalendarFilters = { category: "All" };
    this.activeTaskFilters = { status: "Pending", priority: "All" };

    // Register global window reference
    window.opshubApp = this;
  }

  boot() {
    // 1. Register Service Worker for PWA Offline Caching
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
          .then(reg => console.log("[OpsHub PWA] Service Worker registered:", reg.scope))
          .catch(err => console.error("[OpsHub PWA] Service Worker registration failed:", err));
      });
    }

    // 2. Load settings & preferences
    const settings = this.store.getSettings();
    document.documentElement.setAttribute("data-theme", settings.theme || "dark");
    
    // Apply preferences
    const pref = settings.preferences || {};
    if (pref.compactMode) {
      document.body.classList.add("compact");
    }
    if (!pref.animationsEnabled) {
      document.body.classList.add("no-animations");
    }

    const themeLabel = document.querySelector(".theme-label");
    if (themeLabel) themeLabel.textContent = settings.theme === "light" ? "Dark Mode" : "Light Mode";

    // 3. Initialize tasks alignment
    this.engine.run();

    // 4. Bind DOM Navigation Shell & Toggles
    this.bindNavigation();
    
    // 5. Populate dropdowns
    this.populateCompanySelectors();
    this.populateFormDropdowns();

    // 6. Start Router
    this.handleRouting();
    window.addEventListener("hashchange", () => this.handleRouting());

    // 7. Update header badges
    this.updateGlobalCounters();

    // 8. Convert Header dropdowns
    convertSelects(document.querySelector(".app-header"), { triggerIcon: "building-2" });
  }

  bindNavigation() {
    // Collapsible Sidebar handler
    const collapseBtn = document.getElementById("sidebar-collapse-btn");
    const sidebar = document.getElementById("app-sidebar");
    if (collapseBtn && sidebar) {
      const settings = this.store.getSettings();
      if (settings.sidebarCollapsed) {
        sidebar.classList.add("collapsed");
      }

      collapseBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        const isCollapsed = sidebar.classList.contains("collapsed");
        
        settings.sidebarCollapsed = isCollapsed;
        this.store.saveSettings(settings);
      });
    }

    const navs = document.querySelectorAll(".sidebar-nav a, .app-bottom-nav a, .drawer-links a");
    navs.forEach(link => {
      link.addEventListener("click", (e) => {
        const view = link.getAttribute("data-view");
        if (view === "more" || link.id === "more-menu-btn") {
          e.preventDefault();
          this.toggleMobileMoreDrawer(true);
          return;
        }
        this.toggleMobileMoreDrawer(false);
      });
    });

    document.getElementById("close-more-drawer")?.addEventListener("click", () => this.toggleMobileMoreDrawer(false));
    document.getElementById("mobile-more-overlay")?.addEventListener("click", () => this.toggleMobileMoreDrawer(false));

    // Company filter selection
    const orgSelector = document.getElementById("company-selector");
    if (orgSelector) {
      orgSelector.addEventListener("change", (e) => {
        this.currentCompany = e.target.value;
        this.store.logActivity("Organization Changed", `Swapped viewport context to: ${this.currentCompany}`);
        this.renderActiveView();
      });
    }

    // Header Search
    const searchInput = document.getElementById("global-search-input");
    const clearSearch = document.getElementById("search-clear-btn");
    const shortcutBadge = document.getElementById("search-shortcut-badge");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (clearSearch) {
          clearSearch.classList.toggle("visible", val.length > 0);
        }
        if (shortcutBadge) {
          shortcutBadge.style.display = val.length > 0 ? "none" : "block";
        }
        this.renderActiveView();
      });
    }
    
    if (clearSearch) {
      clearSearch.addEventListener("click", () => {
        searchInput.value = "";
        clearSearch.classList.remove("visible");
        if (shortcutBadge) {
          shortcutBadge.style.display = "block";
        }
        this.renderActiveView();
      });
    }

    // Keyboard shortcut (Ctrl + K / Cmd + K) to focus search
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }
    });

    // Toggler and buttons
    document.getElementById("theme-toggle-btn")?.addEventListener("click", () => this.toggleTheme());

    const notifBtn = document.getElementById("notification-bell-btn");
    const closeNotif = document.getElementById("close-notif-btn");
    const notifOverlay = document.getElementById("notification-overlay");
    if (notifBtn) notifBtn.addEventListener("click", () => this.toggleNotificationSidebar(true));
    if (closeNotif) closeNotif.addEventListener("click", () => this.toggleNotificationSidebar(false));
    if (notifOverlay) notifOverlay.addEventListener("click", () => this.toggleNotificationSidebar(false));

    document.getElementById("notif-mark-all-read")?.addEventListener("click", () => this.markAllNotificationsRead());
    document.getElementById("quick-add-asset-btn")?.addEventListener("click", () => this.openAssetForm());
    document.getElementById("detail-drawer-overlay")?.addEventListener("click", () => this.closeAssetDetails());

    // Mobile Sidebar - Drawer Toggle
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileSidebarOverlay = document.getElementById("mobile-sidebar-overlay");
    
    const openMobileSidebar = () => {
      sidebar?.classList.add("mobile-open");
      mobileSidebarOverlay?.classList.add("active");
      document.body.style.overflow = "hidden";
    };
    const closeMobileSidebar = () => {
      sidebar?.classList.remove("mobile-open");
      mobileSidebarOverlay?.classList.remove("active");
      document.body.style.overflow = "";
    };
    
    mobileMenuBtn?.addEventListener("click", openMobileSidebar);
    mobileSidebarOverlay?.addEventListener("click", closeMobileSidebar);
    
    // Close mobile sidebar when a nav link is clicked
    document.querySelectorAll(".sidebar-nav a").forEach(link => {
      link.addEventListener("click", () => closeMobileSidebar());
    });

    // Form modals
    document.getElementById("cancel-asset-modal-btn")?.addEventListener("click", () => this.closeAssetForm());
    document.getElementById("close-asset-modal-btn")?.addEventListener("click", () => this.closeAssetForm());
    document.getElementById("asset-modal-overlay")?.addEventListener("click", () => this.closeAssetForm());
    document.getElementById("asset-form")?.addEventListener("submit", (e) => this.saveAssetForm(e));
    document.getElementById("add-custom-field-btn")?.addEventListener("click", () => this.appendCustomFieldRow());

    // Keyboard support on checkbox inside forms
    document.querySelectorAll(".custom-checkbox-container").forEach(el => {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const input = el.querySelector("input");
          input.checked = !input.checked;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }

  handleRouting() {
    const hash = window.location.hash || "#dashboard";
    this.currentView = hash;

    const navs = document.querySelectorAll(".sidebar-nav a, .app-bottom-nav a, .drawer-links a");
    navs.forEach(link => {
      const href = link.getAttribute("href");
      if (href === hash) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    this.renderActiveView();
  }

  renderActiveView() {
    document.getElementById("app-content").scrollTop = 0;
    
    // Check if there is an active search query. If so, render global search page!
    const searchQuery = (document.getElementById("global-search-input")?.value || "").toLowerCase().trim();
    if (searchQuery.length > 0) {
      this.renderGlobalSearchResults(searchQuery);
      return;
    }

    switch (this.currentView) {
      case "#dashboard":
        renderDashboard(this, this.store, this.engine);
        break;
      case "#assets":
        renderAssets(this, this.store, this.engine);
        break;
      case "#projects":
        renderProjects(this, this.store, this.engine);
        break;
      case "#timeline":
        renderTimeline(this, this.store, this.engine);
        break;
      case "#tasks":
        renderTasks(this, this.store, this.engine);
        break;
      case "#calendar":
        renderCalendar(this, this.store, this.engine);
        break;
      case "#analytics":
        renderAnalytics(this, this.store, this.engine);
        break;
      case "#settings":
        renderSettings(this, this.store, this.engine);
        break;
      default:
        renderDashboard(this, this.store, this.engine);
    }

    // Convert Select dropdowns inside the view content dynamically!
    convertSelects(document.getElementById("app-content"));
  }

  // --- RENDER DEDICATED GLOBAL SEARCH PAGE ---
  renderGlobalSearchResults(query) {
    const assets = this.store.getAssets().filter(a => 
      a.name.toLowerCase().includes(query) ||
      (a.provider && a.provider.toLowerCase().includes(query)) ||
      (a.description && a.description.toLowerCase().includes(query)) ||
      (a.internalNotes && a.internalNotes.toLowerCase().includes(query))
    );

    const projects = this.store.getProjects().filter(p => p.toLowerCase().includes(query));
    const tasks = this.store.getTasks().filter(t => t.title.toLowerCase().includes(query) || (t.notes && t.notes.toLowerCase().includes(query)));

    // Group matching invoices from assets billing logs
    const invoices = [];
    this.store.getAssets().forEach(a => {
      if (a.paymentHistory) {
        a.paymentHistory.forEach(ph => {
          if (ph.invoiceNumber && ph.invoiceNumber.toLowerCase().includes(query)) {
            invoices.push({
              invoice: ph.invoiceNumber,
              assetName: a.name,
              date: ph.date,
              cost: ph.cost,
              currency: ph.currency
            });
          }
        });
      }
    });

    const container = document.getElementById("app-content");
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>Global Search Results</h2>
          <p>Displaying search results matching "<strong>${query}</strong>"</p>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:20px">
        
        <!-- Matching Assets -->
        <div class="card">
          <h3 class="widget-title" style="margin-bottom:12px; display:flex; align-items:center; gap:8px">
            <i data-lucide="database" style="color:var(--color-primary); width:18px; height:18px"></i> Assets (${assets.length})
          </h3>
          ${assets.length === 0 ? '<p style="font-size:0.85rem; color:var(--text-muted)">No matching assets found.</p>' : `
            <div style="display:flex; flex-direction:column; gap:8px">
              ${assets.map(a => `
                <div class="agenda-item search-result-asset-row" data-id="${a.id}" style="padding:10px 14px; border:1px solid var(--border-color); cursor:pointer">
                  <div>
                    <strong style="font-size:0.9rem">${a.name}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px">${a.company} • ${a.category}</span>
                  </div>
                  <i data-lucide="chevron-right" style="width:14px; height:14px; color:var(--text-muted)"></i>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Matching Tasks -->
        <div class="card">
          <h3 class="widget-title" style="margin-bottom:12px; display:flex; align-items:center; gap:8px">
            <i data-lucide="check-square" style="color:var(--color-success); width:18px; height:18px"></i> Tasks (${tasks.length})
          </h3>
          ${tasks.length === 0 ? '<p style="font-size:0.85rem; color:var(--text-muted)">No matching tasks found.</p>' : `
            <div style="display:flex; flex-direction:column; gap:8px">
              ${tasks.map(t => `
                <div class="agenda-item search-result-task-row" data-assetid="${t.assetId}" style="padding:10px 14px; border:1px solid var(--border-color); cursor:pointer">
                  <div>
                    <strong style="font-size:0.9rem; ${t.status === 'Completed' ? 'text-decoration:line-through; opacity:0.6' : ''}">${t.title}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px">Due: ${t.dueDate} • Assigned: ${t.assignedTo}</span>
                  </div>
                  <span class="badge ${t.status === 'Completed' ? 'status-active' : 'status-renew'}" style="font-size:0.65rem">${t.status}</span>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Matching Projects -->
        <div class="card">
          <h3 class="widget-title" style="margin-bottom:12px; display:flex; align-items:center; gap:8px">
            <i data-lucide="folder-git-2" style="color:var(--color-info); width:18px; height:18px"></i> Projects Workspace (${projects.length})
          </h3>
          ${projects.length === 0 ? '<p style="font-size:0.85rem; color:var(--text-muted)">No matching projects found.</p>' : `
            <div style="display:flex; gap:8px; flex-wrap:wrap">
              ${projects.map(p => `
                <div class="badge search-result-project-badge" data-name="${p}" style="background-color:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.2); padding:8px 12px; font-size:0.8rem; cursor:pointer">
                  ${p}
                </div>
              `).join("")}
            </div>
          `}
        </div>

        </div>

        <!-- Matching Invoices -->
        <div class="card">
          <h3 class="widget-title" style="margin-bottom:12px; display:flex; align-items:center; gap:8px">
            <i data-lucide="file-text" style="color:var(--color-danger); width:18px; height:18px"></i> Invoices (${invoices.length})
          </h3>
          ${invoices.length === 0 ? '<p style="font-size:0.85rem; color:var(--text-muted)">No matching invoices found.</p>' : `
            <div style="display:flex; flex-direction:column; gap:8px">
              ${invoices.map(inv => `
                <div class="agenda-item search-result-invoice-row" style="padding:10px 14px; border:1px solid var(--border-color)">
                  <div>
                    <strong style="font-size:0.9rem">INV: ${inv.invoice}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px">Asset: ${inv.assetName} • Paid on: ${inv.date}</span>
                  </div>
                  <strong style="font-size:0.85rem">${inv.currency} ${inv.cost.toFixed(2)}</strong>
                </div>
              `).join("")}
            </div>
          `}
        </div>

      </div>
    `;

    lucide.createIcons();

    // Bind click events
    document.querySelectorAll(".search-result-asset-row").forEach(row => {
      row.addEventListener("click", () => {
        // Clear search input and open detail
        document.getElementById("global-search-input").value = "";
        document.getElementById("search-clear-btn").style.display = "none";
        this.openAssetDetails(row.dataset.id);
      });
    });

    document.querySelectorAll(".search-result-task-row").forEach(row => {
      row.addEventListener("click", () => {
        document.getElementById("global-search-input").value = "";
        document.getElementById("search-clear-btn").style.display = "none";
        this.openAssetDetails(row.dataset.assetid);
      });
    });

    document.querySelectorAll(".search-result-project-badge").forEach(badge => {
      badge.addEventListener("click", () => {
        document.getElementById("global-search-input").value = "";
        document.getElementById("search-clear-btn").style.display = "none";
        this.activeProject = badge.dataset.name;
        window.location.hash = "#projects";
      });
    });
  }

  // --- COMPILER POPULATORS ---
  populateCompanySelectors() {
    const dropdown = document.getElementById("company-selector");
    if (!dropdown) return;
    
    const companies = this.store.getCompanies();
    const currentSel = this.currentCompany;

    dropdown.innerHTML = `
      <option value="Global">Global Operations</option>
      ${companies.map(c => `<option value="${c}">${c}</option>`).join("")}
    `;
    dropdown.value = currentSel;
  }

  populateFormDropdowns() {
    const companyDrop = document.getElementById("form-asset-company");
    const catDrop = document.getElementById("form-asset-category");
    const projDrop = document.getElementById("form-asset-project");

    if (companyDrop) {
      const companies = this.store.getCompanies();
      companyDrop.innerHTML = companies.map(c => `<option value="${c}">${c}</option>`).join("");
    }
    if (catDrop) {
      const categories = this.store.getCategories();
      catDrop.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
    }
    if (projDrop) {
      const projects = this.store.getProjects();
      projDrop.innerHTML = `
        <option value="">No Project</option>
        ${projects.map(p => `<option value="${p}">${p}</option>`).join("")}
      `;
    }
  }

  // --- NOTIFICATIONS BADGES ---
  updateGlobalCounters() {
    const list = this.store.getNotifications();
    const unread = list.filter(n => !n.isRead);
    
    const badge = document.getElementById("notification-badge");
    if (badge) {
      badge.style.display = unread.length > 0 ? "block" : "none";
    }

    const pendingTasks = this.store.getTasks().filter(t => t.status === "Pending");
    const taskBadge = document.getElementById("sidebar-pending-tasks-badge");
    if (taskBadge) {
      if (pendingTasks.length > 0) {
        taskBadge.textContent = pendingTasks.length;
        taskBadge.style.display = "inline-flex";
      } else {
        taskBadge.style.display = "none";
      }
    }

    this.renderNotificationsList();
  }

  toggleNotificationSidebar(show) {
    const sidebar = document.getElementById("notification-sidebar");
    const overlay = document.getElementById("notification-overlay");
    if (!sidebar || !overlay) return;

    if (show) {
      this.renderNotificationsList();
      sidebar.classList.add("open");
      overlay.style.display = "block";
      setTimeout(() => overlay.style.opacity = "1", 50);
    } else {
      sidebar.classList.remove("open");
      overlay.style.opacity = "0";
      setTimeout(() => overlay.style.display = "none", 300);
    }
  }

  renderNotificationsList() {
    const container = document.getElementById("notif-list-container");
    if (!container) return;

    const list = this.store.getNotifications();
    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color:var(--text-muted)">
          <i data-lucide="bell-off" style="width:32px; height:32px; margin-bottom:8px; opacity:0.5"></i>
          <p style="font-size:0.85rem">No notifications found.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(n => `
      <div class="notif-item ${n.isRead ? '' : 'unread'}" data-id="${n.id}" data-assetid="${n.assetId}">
        <div class="notif-item-msg">${n.message}</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="notif-item-time">${n.date}</span>
          ${n.isRead ? '' : `<span class="badge status-expired" style="font-size:0.65rem; border-radius:4px; padding:1px 4px">Unread</span>`}
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".notif-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.dataset.id;
        const assetId = item.dataset.assetid;

        const nList = this.store.getNotifications();
        const idx = nList.findIndex(n => n.id === id);
        if (idx !== -1) {
          nList[idx].isRead = true;
          this.store.saveNotifications(nList);
        }

        this.toggleNotificationSidebar(false);
        this.updateGlobalCounters();
        this.openAssetDetails(assetId);
      });
    });
  }

  markAllNotificationsRead() {
    const list = this.store.getNotifications();
    list.forEach(n => n.isRead = true);
    this.store.saveNotifications(list);
    this.updateGlobalCounters();
    alert("All notifications marked as read.");
  }

  toggleTheme() {
    const settings = this.store.getSettings();
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    
    document.documentElement.setAttribute("data-theme", next);
    settings.theme = next;
    this.store.saveSettings(settings);

    const themeLabel = document.querySelector(".theme-label");
    if (themeLabel) themeLabel.textContent = next === "light" ? "Dark Mode" : "Light Mode";
    
    if (this.currentView === "#analytics") {
      this.renderActiveView();
    }
  }

  openAssetDetails(id) {
    const overlay = document.getElementById("detail-drawer-overlay");
    const drawer = document.getElementById("detail-drawer");
    if (!overlay || !drawer) return;

    drawer.dataset.activeTab = "overview";
    renderDetailDrawer(id, this.store, this, this.engine);

    overlay.style.display = "block";
    drawer.style.display = "flex";
    setTimeout(() => {
      overlay.style.opacity = "1";
      drawer.classList.add("open");
    }, 50);
  }

  closeAssetDetails() {
    const overlay = document.getElementById("detail-drawer-overlay");
    const drawer = document.getElementById("detail-drawer");
    if (!overlay || !drawer) return;

    drawer.classList.remove("open");
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
      drawer.style.display = "none";
    }, 300);
  }

  openAssetForm(id = null) {
    const overlay = document.getElementById("asset-modal-overlay");
    const modal = document.getElementById("asset-modal");
    const form = document.getElementById("asset-form");
    const title = document.getElementById("asset-modal-title");
    
    if (!overlay || !modal || !form) return;

    document.getElementById("custom-fields-container").innerHTML = "";
    this.closeAssetDetails();
    
    if (id) {
      const asset = this.store.getAssets().find(a => a.id === id);
      if (!asset) return;

      title.textContent = "Edit Asset: " + asset.name;
      document.getElementById("form-asset-id").value = asset.id;
      document.getElementById("form-asset-name").value = asset.name;
      document.getElementById("form-asset-company").value = asset.company;
      document.getElementById("form-asset-category").value = asset.category;
      document.getElementById("form-asset-provider").value = asset.provider || "";
      document.getElementById("form-asset-provider-url").value = asset.providerWebsite || "";
      document.getElementById("form-asset-login-url").value = asset.loginUrl || "";
      document.getElementById("form-asset-email").value = asset.accountEmail || "";
      document.getElementById("form-asset-billing").value = asset.billingAccount || "";
      document.getElementById("form-asset-provider-support").value = asset.providerSupport || "";
      document.getElementById("form-asset-provider-recovery").value = asset.providerRecovery || "";
      document.getElementById("form-asset-provider-2fa").checked = asset.twoFactorEnabled !== false;
      document.getElementById("form-asset-renewal-type").value = asset.renewalType || "Yearly";
      document.getElementById("form-asset-purchase-date").value = asset.purchaseDate || "";
      document.getElementById("form-asset-renewal-date").value = asset.renewalDate || "";
      document.getElementById("form-asset-expiry-date").value = asset.expiryDate || "";
      document.getElementById("form-asset-cost").value = asset.cost || 0;
      document.getElementById("form-asset-currency").value = asset.currency || "USD";
      document.getElementById("form-asset-gst").checked = asset.gstEnabled || false;
      document.getElementById("form-asset-invoice").value = asset.invoiceNumber || "";
      document.getElementById("form-asset-payment-method").value = asset.paymentMethod || "";
      document.getElementById("form-asset-auto-renew").checked = asset.autoRenew;
      document.getElementById("form-asset-status").value = asset.status || "Active";
      document.getElementById("form-asset-owner").value = asset.owner || "";
      document.getElementById("form-asset-project").value = asset.project || "";
      document.getElementById("form-asset-tags").value = (asset.tags || []).join(", ");
      document.getElementById("form-asset-description").value = asset.description || "";
      document.getElementById("form-asset-notes").value = asset.internalNotes || "";

      if (asset.customFields) {
        asset.customFields.forEach(f => this.appendCustomFieldRow(f.label, f.value));
      }
    } else {
      title.textContent = "Track New Digital Asset";
      form.reset();
      document.getElementById("form-asset-id").value = "";
      document.getElementById("form-asset-provider-support").value = "";
      document.getElementById("form-asset-provider-recovery").value = "";
      document.getElementById("form-asset-provider-2fa").checked = true;
      document.getElementById("form-asset-renewal-type").value = "Yearly";
      document.getElementById("form-asset-currency").value = "USD";
      document.getElementById("form-asset-auto-renew").checked = true;
      document.getElementById("form-asset-status").value = "Active";
      document.getElementById("form-asset-gst").checked = false;
    }

    overlay.style.display = "block";
    modal.style.display = "flex";
    
    // Convert selects inside modal form
    convertSelects(modal);

    setTimeout(() => {
      overlay.style.opacity = "1";
      modal.classList.add("open");
    }, 50);
  }

  closeAssetForm() {
    const overlay = document.getElementById("asset-modal-overlay");
    const modal = document.getElementById("asset-modal");
    if (!overlay || !modal) return;

    modal.classList.remove("open");
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
      modal.style.display = "none";
    }, 300);
  }

  appendCustomFieldRow(label = "", val = "") {
    const container = document.getElementById("custom-fields-container");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "custom-field-row";
    row.innerHTML = `
      <input type="text" placeholder="Key (e.g. Host IP)" value="${label}" required class="filter-select" style="text-align:left; flex:1">
      <input type="text" placeholder="Value" value="${val}" required class="filter-select" style="text-align:left; flex:1.5">
      <button type="button" class="btn-text delete-custom-field" style="color:var(--color-danger); padding:0 8px; font-size:1.4rem; font-weight:700">×</button>
    `;

    row.querySelector(".delete-custom-field").addEventListener("click", () => {
      row.remove();
    });

    container.appendChild(row);
  }

  saveAssetForm(e) {
    e.preventDefault();

    const id = document.getElementById("form-asset-id").value;
    const name = document.getElementById("form-asset-name").value;
    const company = document.getElementById("form-asset-company").value;
    const category = document.getElementById("form-asset-category").value;
    const cost = parseFloat(document.getElementById("form-asset-cost").value) || 0;
    const isGst = document.getElementById("form-asset-gst").checked;
    
    const customFields = [];
    document.querySelectorAll(".custom-field-row").forEach(row => {
      const inputs = row.querySelectorAll("input");
      if (inputs.length >= 2) {
        const k = inputs[0].value.trim();
        const v = inputs[1].value.trim();
        if (k && v) {
          customFields.push({ label: k, value: v });
        }
      }
    });

    const tagsVal = document.getElementById("form-asset-tags").value;
    const tags = tagsVal.split(",").map(t => t.trim()).filter(Boolean);

    const assetData = {
      name,
      company,
      category,
      provider: document.getElementById("form-asset-provider").value,
      providerWebsite: document.getElementById("form-asset-provider-url").value,
      loginUrl: document.getElementById("form-asset-login-url").value,
      accountEmail: document.getElementById("form-asset-email").value,
      billingAccount: document.getElementById("form-asset-billing").value,
      providerSupport: document.getElementById("form-asset-provider-support").value,
      providerRecovery: document.getElementById("form-asset-provider-recovery").value,
      twoFactorEnabled: document.getElementById("form-asset-provider-2fa").checked,
      renewalType: document.getElementById("form-asset-renewal-type").value,
      purchaseDate: document.getElementById("form-asset-purchase-date").value,
      renewalDate: document.getElementById("form-asset-renewal-date").value,
      expiryDate: document.getElementById("form-asset-expiry-date").value,
      cost,
      currency: document.getElementById("form-asset-currency").value,
      gstEnabled: isGst,
      gstRate: isGst ? 18 : 0,
      gstAmount: isGst ? parseFloat((cost * 0.18).toFixed(2)) : 0,
      invoiceNumber: document.getElementById("form-asset-invoice").value,
      paymentMethod: document.getElementById("form-asset-payment-method").value,
      autoRenew: document.getElementById("form-asset-auto-renew").checked,
      status: document.getElementById("form-asset-status").value,
      owner: document.getElementById("form-asset-owner").value,
      project: document.getElementById("form-asset-project").value,
      tags,
      description: document.getElementById("form-asset-description").value,
      internalNotes: document.getElementById("form-asset-notes").value,
      customFields
    };

    if (id) {
      assetData.id = id;
      this.store.updateAsset(assetData);
    } else {
      this.store.addAsset(assetData);
    }

    this.engine.run();
    this.closeAssetForm();
    this.renderActiveView();
    this.updateGlobalCounters();

    alert(`Asset "${name}" successfully saved!`);
  }

  toggleMobileMoreDrawer(show) {
    const drawer = document.getElementById("mobile-more-drawer");
    const overlay = document.getElementById("mobile-more-overlay");
    if (!drawer || !overlay) return;

    if (show) {
      drawer.classList.add("open");
      overlay.classList.add("open");
    } else {
      drawer.classList.remove("open");
      overlay.classList.remove("open");
    }
  }
}

const app = new OpsHubApp();
window.addEventListener("DOMContentLoaded", () => app.boot());
