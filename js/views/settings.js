// OpsHub Settings & Database Management view - Reorganized Layout
import { convertSelects } from "../components/dropdown.js";

export function renderSettings(app, store, engine) {
  const categories = store.getCategories();
  const companies = store.getCompanies();
  
  // Settings & Preferences system preferences
  const settings = store.getSettings();
  const pref = settings.preferences || {
    language: "en",
    timezone: "UTC",
    firstDayOfWeek: "Sunday",
    currency: "USD",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "12 Hour",
    numberFormat: "International",
    defaultCompany: "Global",
    defaultLandingPage: "dashboard",
    animationsEnabled: true,
    compactMode: false,
    notifications: { push: true, renewals: true, tasks: true, sound: false }
  };

  const container = document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Settings</h2>
        <p>Manage organizations, categories, and system preferences</p>
      </div>
    </div>

    <!-- Reorganized sections widgets grid layout -->
    <div class="widget-grid">

      <!-- 1. Organizations Settings (Top Row) -->
      <div class="card widget-span-4" style="height:fit-content">
        <div class="widget-header">
          <h3 class="widget-title">Organizations</h3>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px">
          <form id="add-company-form" style="display:flex; gap:6px">
            <input type="text" id="new-company-name" placeholder="Add organization..." required class="filter-select" style="text-align:left; flex:1; height:36px; padding:0 10px; background:var(--bg-input);">
            <button type="submit" class="btn btn-primary btn-sm">Add</button>
          </form>
          <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:160px; overflow-y:auto; padding:2px">
            ${companies.map(org => `
              <span class="badge" style="background-color:var(--bg-hover); border:1px solid var(--border-color); padding:5px 10px; font-size:0.8rem; display:inline-flex; align-items:center; gap:6px">
                <i data-lucide="building-2" style="width:12px; height:12px; color:var(--text-muted);"></i>
                ${org}
                <button type="button" class="delete-org-btn" data-name="${org}" style="font-size:0.85rem; color:var(--color-danger); font-weight:700; line-height:1;">×</button>
              </span>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 2. Categories Settings (Top Row) -->
      <div class="card widget-span-4" style="height:fit-content">
        <div class="widget-header">
          <h3 class="widget-title">Asset Categories</h3>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px">
          <form id="add-category-form" style="display:flex; gap:6px">
            <input type="text" id="new-category-name" placeholder="Add category..." required class="filter-select" style="text-align:left; flex:1; height:36px; padding:0 10px; background:var(--bg-input);">
            <button type="submit" class="btn btn-primary btn-sm">Add</button>
          </form>
          <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:160px; overflow-y:auto; padding:2px">
            ${categories.map(c => `
              <span class="badge" style="background-color:var(--bg-hover); border:1px solid var(--border-color); padding:5px 10px; font-size:0.8rem; display:inline-flex; align-items:center; gap:6px">
                <i data-lucide="tag" style="width:12px; height:12px; color:var(--text-muted);"></i>
                ${c}
                <button type="button" class="delete-cat-btn" data-name="${c}" style="font-size:0.85rem; color:var(--color-danger); font-weight:700; line-height:1;">×</button>
              </span>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 3. Custom Tags Settings (Top Row Placeholder) -->
      <div class="card widget-span-4" style="height:fit-content; opacity: 0.75;">
        <div class="widget-header">
          <h3 class="widget-title">Custom Tags (Future)</h3>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px">
          <form style="display:flex; gap:6px" disabled>
            <input type="text" placeholder="Tags (coming soon)..." disabled class="filter-select" style="text-align:left; flex:1; height:36px; padding:0 10px; background:var(--bg-hover); border-color:transparent; cursor:not-allowed;">
            <button type="button" disabled class="btn btn-secondary btn-sm" style="cursor:not-allowed;">Add</button>
          </form>
          <div style="font-size:0.78rem; color:var(--text-muted); font-style:italic; padding-top:4px;">
            Tag-based operational tracking is planned for a future release.
          </div>
        </div>
      </div>

      <!-- 4. General Preferences (Localization & UI Theme) -->
      <div class="card widget-span-8">
        <div class="widget-header">
          <h3 class="widget-title">General Preferences</h3>
        </div>
        <form class="modal-body form-grid" id="pref-system-settings-form" style="padding:0">
          
          <div class="form-group">
            <label for="pref-language">Language</label>
            <select id="pref-language">
              <option value="en" ${pref.language === 'en' ? 'selected' : ''}>English (EN)</option>
              <option value="es" ${pref.language === 'es' ? 'selected' : ''}>Español (ES)</option>
              <option value="de" ${pref.language === 'de' ? 'selected' : ''}>Deutsch (DE)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-timezone">Timezone</label>
            <select id="pref-timezone">
              <option value="UTC" ${pref.timezone === 'UTC' ? 'selected' : ''}>UTC / GMT</option>
              <option value="IST" ${pref.timezone === 'IST' ? 'selected' : ''}>IST (UTC +5:30)</option>
              <option value="EST" ${pref.timezone === 'EST' ? 'selected' : ''}>EST (UTC -5:00)</option>
              <option value="PST" ${pref.timezone === 'PST' ? 'selected' : ''}>PST (UTC -8:00)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-weekstart">First Day of Week</label>
            <select id="pref-weekstart">
              <option value="Sunday" ${pref.firstDayOfWeek === 'Sunday' ? 'selected' : ''}>Sunday</option>
              <option value="Monday" ${pref.firstDayOfWeek === 'Monday' ? 'selected' : ''}>Monday</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-currency">Preferred Currency</label>
            <select id="pref-currency">
              <option value="USD" ${pref.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
              <option value="INR" ${pref.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
              <option value="EUR" ${pref.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
              <option value="GBP" ${pref.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
              <option value="AED" ${pref.currency === 'AED' ? 'selected' : ''}>AED</option>
              <option value="SAR" ${pref.currency === 'SAR' ? 'selected' : ''}>SAR</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-dateformat">Date Format</label>
            <select id="pref-dateformat">
              <option value="YYYY-MM-DD" ${pref.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
              <option value="DD/MM/YYYY" ${pref.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
              <option value="MM/DD/YYYY" ${pref.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-timeformat">Time Format</label>
            <select id="pref-timeformat">
              <option value="12 Hour" ${pref.timeFormat === '12 Hour' ? 'selected' : ''}>12-Hour (05:16 PM)</option>
              <option value="24 Hour" ${pref.timeFormat === '24 Hour' ? 'selected' : ''}>24-Hour (17:16)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-numformat">Number Format</label>
            <select id="pref-numformat">
              <option value="International" ${pref.numberFormat === 'International' ? 'selected' : ''}>International (100,000.00)</option>
              <option value="Indian" ${pref.numberFormat === 'Indian' ? 'selected' : ''}>Indian Lakhs (1,00,000.00)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-theme">Theme</label>
            <select id="pref-theme">
              <option value="dark" ${settings.theme !== 'light' ? 'selected' : ''}>Dark Mode</option>
              <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light Mode</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pref-landing">Default Landing Page</label>
            <select id="pref-landing">
              <option value="dashboard" ${pref.defaultLandingPage === 'dashboard' ? 'selected' : ''}>Dashboard</option>
              <option value="assets" ${pref.defaultLandingPage === 'assets' ? 'selected' : ''}>Assets Grid</option>
              <option value="tasks" ${pref.defaultLandingPage === 'tasks' ? 'selected' : ''}>Tasks</option>
            </select>
          </div>

          <div class="form-group col-span-2 checkbox-group" style="justify-content: flex-start; flex-direction:row; gap:16px; flex-wrap:wrap; border-top: 1px solid var(--border-color); padding-top:16px; margin-top:8px">
            <label class="custom-checkbox-container" tabindex="0">
              <input type="checkbox" id="pref-compact" ${pref.compactMode ? 'checked' : ''}>
              <span class="custom-checkbox"></span>
              <span>Compact Mode</span>
            </label>

            <label class="custom-checkbox-container" tabindex="0">
              <input type="checkbox" id="pref-animations" ${pref.animationsEnabled ? 'checked' : ''}>
              <span class="custom-checkbox"></span>
              <span>CSS Animations</span>
            </label>
          </div>

          <!-- Notifications Preferences -->
          <div class="form-group col-span-2" style="border-top:1px solid var(--border-color); padding-top:16px;">
            <label style="margin-bottom:8px; font-weight:600;">Notification Preferences</label>
            <div style="display:flex; flex-direction:column; gap:8px">
              <label class="custom-checkbox-container" tabindex="0">
                <input type="checkbox" id="pref-notif-push" ${pref.notifications?.push ? 'checked' : ''}>
                <span class="custom-checkbox"></span>
                <span>Push Notifications</span>
              </label>
              <label class="custom-checkbox-container" tabindex="0">
                <input type="checkbox" id="pref-notif-renew" ${pref.notifications?.renewals ? 'checked' : ''}>
                <span class="custom-checkbox"></span>
                <span>Renewal Expiry Alerts</span>
              </label>
              <label class="custom-checkbox-container" tabindex="0">
                <input type="checkbox" id="pref-notif-task" ${pref.notifications?.tasks ? 'checked' : ''}>
                <span class="custom-checkbox"></span>
                <span>Task Reminders</span>
              </label>
              <label class="custom-checkbox-container" tabindex="0">
                <input type="checkbox" id="pref-notif-sound" ${pref.notifications?.sound ? 'checked' : ''}>
                <span class="custom-checkbox"></span>
                <span>Sound Alerts</span>
              </label>
            </div>
          </div>

          <div class="form-group col-span-2" style="margin-top:12px">
            <button type="submit" class="btn btn-primary" style="width:100%">Save Preferences</button>
          </div>
        </form>
      </div>

      <!-- 5. Data Management (Backup, Reset) -->
      <div class="card widget-span-4" style="height:fit-content">
        <div class="widget-header">
          <h3 class="widget-title">Data Management</h3>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px">
          
          <div style="border:1px solid var(--border-color); padding:14px; border-radius:var(--radius-md);">
            <h4 style="font-size:0.88rem; font-weight:600; margin-bottom:4px;">Export Backup</h4>
            <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">Download all data as a JSON file.</p>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-export-json" style="width:100%">
              <i data-lucide="download-cloud"></i> Download (.json)
            </button>
          </div>

          <div style="border:1px solid var(--border-color); padding:14px; border-radius:var(--radius-md);">
            <h4 style="font-size:0.88rem; font-weight:600; margin-bottom:4px;">Restore Backup</h4>
            <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">Upload a JSON backup to restore data.</p>
            <div>
              <input type="file" id="import-json-file" accept=".json" style="display:none">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-trigger-import" style="width:100%">
                <i data-lucide="upload-cloud"></i> Upload JSON
              </button>
            </div>
          </div>

          <div style="border:1px solid rgba(244,63,94,0.15); padding:14px; border-radius:var(--radius-md); background:rgba(244,63,94,0.015);">
            <h4 style="font-size:0.88rem; font-weight:600; margin-bottom:4px; color:var(--color-danger);">Reset Database</h4>
            <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">Restore to demo data. All edits will be lost.</p>
            <button type="button" class="btn btn-danger btn-sm" id="btn-reset-db" style="width:100%">
              <i data-lucide="refresh-cw"></i> Reset to Demo
            </button>
          </div>

        </div>
      </div>

    </div>
  `;

  // Draw Lucide icons
  lucide.createIcons();

  // Convert elements
  convertSelects(container);

  // --- BIND EVENT HANDLERS ---
  
  // Submit Preferences
  document.getElementById("pref-system-settings-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const updatedPref = {
      language: document.getElementById("pref-language").value,
      timezone: document.getElementById("pref-timezone").value,
      firstDayOfWeek: document.getElementById("pref-weekstart").value,
      currency: document.getElementById("pref-currency").value,
      dateFormat: document.getElementById("pref-dateformat").value,
      timeFormat: document.getElementById("pref-timeformat").value,
      numberFormat: document.getElementById("pref-numformat").value,
      defaultLandingPage: document.getElementById("pref-landing").value,
      animationsEnabled: document.getElementById("pref-animations").checked,
      compactMode: document.getElementById("pref-compact").checked,
      notifications: {
        push: document.getElementById("pref-notif-push").checked,
        renewals: document.getElementById("pref-notif-renew").checked,
        tasks: document.getElementById("pref-notif-task").checked,
        sound: document.getElementById("pref-notif-sound").checked
      }
    };

    settings.preferences = updatedPref;
    settings.theme = document.getElementById("pref-theme").value;
    store.saveSettings(settings);
    store.logActivity("Preferences Saved", `Preferences configurations updated.`);

    // Apply theme
    document.documentElement.setAttribute("data-theme", settings.theme);
    const themeLabel = document.querySelector(".theme-label");
    if (themeLabel) themeLabel.textContent = settings.theme === "light" ? "Dark Mode" : "Light Mode";

    // Apply immediate compact mode changes
    if (updatedPref.compactMode) {
      document.body.classList.add("compact");
    } else {
      document.body.classList.remove("compact");
    }

    // Apply animations changes
    if (!updatedPref.animationsEnabled) {
      document.body.classList.add("no-animations");
    } else {
      document.body.classList.remove("no-animations");
    }

    alert("Preferences saved successfully!");
    renderSettings(app, store, engine);
  });

  // Keyboard space/enter checks togglers
  document.querySelectorAll(".custom-checkbox-container").forEach(el => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const cb = el.querySelector("input");
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });

  // Categories add
  document.getElementById("add-category-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("new-category-name");
    const name = nameInput.value.trim();
    if (name && !categories.includes(name)) {
      categories.push(name);
      store.saveCategories(categories);
      store.logActivity("Taxonomy Updated", `Added custom category: ${name}`);
      nameInput.value = "";
      renderSettings(app, store, engine);
      app.populateFormDropdowns();
    }
  });

  // Categories delete
  document.querySelectorAll(".delete-cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      if (confirm(`Remove category "${name}"?`)) {
        const filtered = categories.filter(c => c !== name);
        store.saveCategories(filtered);
        store.logActivity("Taxonomy Updated", `Deleted custom category: ${name}`);
        renderSettings(app, store, engine);
        app.populateFormDropdowns();
      }
    });
  });

  // Companies add
  document.getElementById("add-company-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("new-company-name");
    const name = nameInput.value.trim();
    if (name && !companies.includes(name)) {
      companies.push(name);
      store.saveCompanies(companies);
      store.logActivity("Taxonomy Updated", `Registered custom company organization: ${name}`);
      nameInput.value = "";
      renderSettings(app, store, engine);
      app.populateCompanySelectors();
      app.populateFormDropdowns();
    }
  });

  // Companies delete
  document.querySelectorAll(".delete-org-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      if (confirm(`Remove organization "${name}"?`)) {
        const filtered = companies.filter(org => org !== name);
        store.saveCompanies(filtered);
        store.logActivity("Taxonomy Updated", `Removed company organization: ${name}`);
        renderSettings(app, store, engine);
        app.populateCompanySelectors();
        app.populateFormDropdowns();
      }
    });
  });

  // Export JSON backup
  document.getElementById("btn-export-json").addEventListener("click", () => {
    const data = {
      assets: store.getAssets(),
      companies: store.getCompanies(),
      categories: store.getCategories(),
      projects: store.getProjects(),
      tasks: store.getTasks(),
      notifications: store.getNotifications(),
      logs: store.getActivityLogs(),
      settings: store.getSettings()
    };

    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OpsHub_DatabaseBackup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Import JSON triggers
  const fileInput = document.getElementById("import-json-file");
  document.getElementById("btn-trigger-import").addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.assets && parsed.companies && parsed.categories) {
          localStorage.setItem(store.keyAssets, JSON.stringify(parsed.assets));
          localStorage.setItem(store.keyCompanies, JSON.stringify(parsed.companies));
          localStorage.setItem(store.keyCategories, JSON.stringify(parsed.categories));
          if (parsed.projects) localStorage.setItem(store.keyProjects, JSON.stringify(parsed.projects));
          if (parsed.tasks) localStorage.setItem(store.keyTasks, JSON.stringify(parsed.tasks));
          if (parsed.notifications) localStorage.setItem(store.keyNotifications, JSON.stringify(parsed.notifications));
          if (parsed.logs) localStorage.setItem(store.keyActivityLogs, JSON.stringify(parsed.logs));
          if (parsed.settings) localStorage.setItem(store.keySettings, JSON.stringify(parsed.settings));

          alert("Database restored successfully from backup file!");
          
          store.init();
          engine.run();
          app.populateCompanySelectors();
          app.populateFormDropdowns();
          app.renderActiveView();
          app.updateGlobalCounters();
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Error parsing backup: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Reset database default records
  document.getElementById("btn-reset-db").addEventListener("click", () => {
    if (confirm("Reset database? All manual edits will be deleted.")) {
      store.resetDatabase();
      engine.run();
      app.populateCompanySelectors();
      app.populateFormDropdowns();
      app.renderActiveView();
      app.updateGlobalCounters();
      alert("Database reset completed successfully!");
    }
  });
}
