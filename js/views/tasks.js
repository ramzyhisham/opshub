// OpsHub Task List view - Phase 2 Premium Updates
import { convertSelects } from "../components/dropdown.js";

export function renderTasks(app, store, engine) {
  const currentCompany = app.currentCompany;
  let tasks = store.getTasks().filter(t => currentCompany === "Global" || t.company === currentCompany);

  // Filters State
  const currentStatus = app.activeTaskFilters?.status || "Pending";
  const currentPriority = app.activeTaskFilters?.priority || "All";
  const currentDueDate = app.activeTaskFilters?.dueDate || "All";
  const currentAssignedTo = app.activeTaskFilters?.assignedTo || "All";

  // Filter tasks
  if (currentStatus !== "All") {
    tasks = tasks.filter(t => t.status === currentStatus);
  }
  if (currentPriority !== "All") {
    tasks = tasks.filter(t => t.priority === currentPriority);
  }
  if (currentAssignedTo !== "All") {
    tasks = tasks.filter(t => t.assignedTo === currentAssignedTo);
  }
  if (currentDueDate !== "All") {
    const todayStr = "2026-07-16";
    const today = new Date(todayStr);
    tasks = tasks.filter(t => {
      const dDate = new Date(t.dueDate);
      const diffTime = dDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (currentDueDate === "Overdue") {
        return t.status === "Pending" && diffDays < 0;
      } else if (currentDueDate === "Today") {
        return diffDays === 0;
      } else if (currentDueDate === "This Week") {
        return diffDays >= 0 && diffDays <= 7;
      } else if (currentDueDate === "This Month") {
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    });
  }

  // Get unique assignees
  const uniqueAssignees = [...new Set(store.getTasks().map(t => t.assignedTo).filter(Boolean))];

  // Sort Tasks: Pending tasks due first
  tasks.sort((a, b) => {
    if (a.status === "Pending" && b.status === "Completed") return -1;
    if (a.status === "Completed" && b.status === "Pending") return 1;
    
    if (a.status === "Pending") {
      return a.dueDate.localeCompare(b.dueDate);
    } else {
      return (b.completedDate || "").localeCompare(a.completedDate || "");
    }
  });

  const container = document.getElementById("isolated-tasks-view-mount") || document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Auto-Generated Renewal Tasks</h2>
        <p>Operational tasks created automatically based on asset renewal cycles</p>
      </div>
      <div class="header-actions" style="display:flex; gap:10px; align-items: center; position: relative;">
        <span class="badge status-active" style="padding: 8px 12px; font-size:0.85rem; height: 38px; display: inline-flex; align-items: center;">
          Pending Tasks: ${store.getTasks().filter(t => t.status === "Pending" && (currentCompany === "Global" || t.company === currentCompany)).length}
        </span>
        
        <div class="filters-popover-container">
          <button class="btn btn-secondary" id="filters-toggle-btn" style="display:flex; align-items:center; gap:6px; height: 38px;">
            <i data-lucide="filter" style="width:16px; height:16px"></i> Filters
          </button>

          <!-- Toggleable filters popover container using standardized styling -->
          <div id="filters-popover" class="filters-popover ${app.filtersOpen ? 'open' : ''}">
            <div class="filters-popover-title">Filter Tasks</div>
            
            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Status</label>
              <select id="task-filter-status" class="filter-select" style="width:100%; text-align:left;">
                <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                <option value="All" ${currentStatus === 'All' ? 'selected' : ''}>All Tasks</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Priority</label>
              <select id="task-filter-priority" class="filter-select" style="width:100%; text-align:left;">
                <option value="All" ${currentPriority === 'All' ? 'selected' : ''}>All Priorities</option>
                <option value="High" ${currentPriority === 'High' ? 'selected' : ''}>High Priority</option>
                <option value="Medium" ${currentPriority === 'Medium' ? 'selected' : ''}>Medium Priority</option>
                <option value="Low" ${currentPriority === 'Low' ? 'selected' : ''}>Low Priority</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Due Date</label>
              <select id="task-filter-due" class="filter-select" style="width:100%; text-align:left;">
                <option value="All" ${currentDueDate === 'All' ? 'selected' : ''}>All Due Dates</option>
                <option value="Overdue" ${currentDueDate === 'Overdue' ? 'selected' : ''}>Overdue</option>
                <option value="Today" ${currentDueDate === 'Today' ? 'selected' : ''}>Today</option>
                <option value="This Week" ${currentDueDate === 'This Week' ? 'selected' : ''}>This Week</option>
                <option value="This Month" ${currentDueDate === 'This Month' ? 'selected' : ''}>This Month</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block">Assigned To</label>
              <select id="task-filter-assigned" class="filter-select" style="width:100%; text-align:left;">
                <option value="All" ${currentAssignedTo === 'All' ? 'selected' : ''}>All Assignees</option>
                ${uniqueAssignees.map(u => `<option value="${u}" ${u === currentAssignedTo ? 'selected' : ''}>${u}</option>`).join("")}
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

    <!-- Tasks Grid / Table with Table-to-Card mobile responsiveness patterns -->
    <div class="tasks-table-wrapper">
      <table class="tasks-table">
        <thead>
          <tr>
            <th style="width: 50px;"></th>
            <th>Task Title</th>
            <th>Organization</th>
            <th>Due Date</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Completed On</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                <i data-lucide="check-circle" style="width:36px; height:36px; margin-bottom:8px; opacity:0.5; color:var(--color-success)"></i>
                <p style="font-weight:600; font-size:1rem">No tasks in this category</p>
                <p style="font-size:0.85rem">You're all caught up on system renewals!</p>
              </td>
            </tr>
          ` : tasks.map(t => `
            <tr class="${t.status === 'Completed' ? 'completed-task-row' : ''}">
              <td class="checkbox-cell">
                <label class="custom-checkbox-container" tabindex="0" title="Toggle Task Completion">
                  <input type="checkbox" class="toggle-task-status-btn" data-id="${t.id}" ${t.status === 'Completed' ? 'checked' : ''}>
                  <span class="custom-checkbox"></span>
                </label>
              </td>
              <td data-label="Task Title">
                <span class="task-title-text" style="${t.status === 'Completed' ? 'text-decoration: line-through; opacity: 0.6;' : 'font-weight: 600;'}">
                  ${t.title}
                </span>
                <br>
                <span class="view-details-task-link" data-assetid="${t.assetId}" style="font-size:0.75rem; color:var(--color-primary); cursor:pointer; text-decoration:underline">
                  View Linked Asset
                </span>
              </td>
              <td data-label="Organization">${t.company}</td>
              <td data-label="Due Date" style="font-weight:500; ${t.status === 'Pending' && new Date(t.dueDate) < new Date("2026-07-16") ? 'color: var(--color-danger); font-weight:700;' : ''}">
                ${t.dueDate}
                ${t.status === 'Pending' && new Date(t.dueDate) < new Date("2026-07-16") ? '<br><span style="font-size:0.7rem; color:var(--color-danger)">OVERDUE</span>' : ''}
              </td>
              <td data-label="Priority">
                <span class="priority-badge priority-${t.priority.toLowerCase()}">${t.priority}</span>
              </td>
              <td data-label="Assigned To">
                <span style="font-size:0.85rem; font-weight:500">${t.assignedTo}</span>
              </td>
              <td data-label="Completed On" style="font-size:0.85rem; color:var(--text-muted)">
                ${t.completedDate || '-'}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  // Draw icons
  lucide.createIcons();

  // Convert native elements
  convertSelects(container);

  // --- BIND EVENT HANDLERS ---
  
  // Status check clicks
  document.querySelectorAll(".toggle-task-status-btn").forEach(cb => {
    cb.addEventListener("change", () => {
      const taskId = cb.dataset.id;
      const tList = store.getTasks();
      const idx = tList.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        const t = tList[idx];
        t.status = cb.checked ? "Completed" : "Pending";
        t.completedDate = cb.checked ? "2026-07-16" : null;
        store.saveTasks(tList);
        store.logActivity(
          cb.checked ? "Completed Task" : "Reopened Task",
          `${cb.checked ? 'Completed' : 'Reopened'} renewal task: ${t.title}`,
          t.company
        );
        
        // Refresh
        renderTasks(app, store, engine);
        app.updateGlobalCounters();
      }
    });
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

  // Detail drawers link clicks
  document.querySelectorAll(".view-details-task-link").forEach(link => {
    link.addEventListener("click", () => {
      app.openAssetDetails(link.dataset.assetid);
    });
  });

  // Filters bindings
  document.getElementById("task-filter-status").addEventListener("change", (e) => {
    app.activeTaskFilters = app.activeTaskFilters || {};
    app.activeTaskFilters.status = e.target.value;
    renderTasks(app, store, engine);
  });
  document.getElementById("task-filter-priority").addEventListener("change", (e) => {
    app.activeTaskFilters = app.activeTaskFilters || {};
    app.activeTaskFilters.priority = e.target.value;
    renderTasks(app, store, engine);
  });
  document.getElementById("task-filter-due").addEventListener("change", (e) => {
    app.activeTaskFilters = app.activeTaskFilters || {};
    app.activeTaskFilters.dueDate = e.target.value;
    renderTasks(app, store, engine);
  });
  document.getElementById("task-filter-assigned").addEventListener("change", (e) => {
    app.activeTaskFilters = app.activeTaskFilters || {};
    app.activeTaskFilters.assignedTo = e.target.value;
    renderTasks(app, store, engine);
  });

  document.getElementById("filter-reset-btn").addEventListener("click", () => {
    app.activeTaskFilters = { status: "Pending", priority: "All", dueDate: "All", assignedTo: "All" };
    renderTasks(app, store, engine);
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
}
