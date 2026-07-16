// OpsHub Asset Detail Drawer Renderer - Phase 2 Premium Updates
import { getCategoryIcon } from "./assets.js";

export function renderDetailDrawer(assetId, store, app, engine) {
  const asset = store.getAssets().find(a => a.id === assetId);
  const drawer = document.getElementById("detail-drawer");
  
  if (!asset) {
    drawer.innerHTML = `<div style="padding: 24px; color:var(--text-muted)">Asset not found.</div>`;
    return;
  }

  let activeTab = drawer.dataset.activeTab || "overview";
  drawer.dataset.activeTab = activeTab;

  drawer.innerHTML = `
    <!-- Header Actions -->
    <div class="drawer-header">
      <div style="display:flex; align-items:center; gap: 10px;">
        <button class="icon-btn" id="drawer-pin-btn" title="${asset.isPinned ? 'Unpin Asset' : 'Pin Asset'}">
          <i data-lucide="pin" style="width: 18px; height: 18px; ${asset.isPinned ? 'color: var(--color-primary); fill: var(--color-primary);' : ''}"></i>
        </button>
        <button class="icon-btn" id="drawer-fav-btn" title="${asset.isFavorite ? 'Unfavorite Asset' : 'Favorite Asset'}">
          <i data-lucide="star" style="width: 18px; height: 18px; ${asset.isFavorite ? 'color: var(--color-warning); fill: var(--color-warning);' : ''}"></i>
        </button>
        <button class="icon-btn" id="drawer-dup-btn" title="Duplicate Asset">
          <i data-lucide="copy" style="width: 18px; height: 18px;"></i>
        </button>
      </div>

      <div style="display:flex; align-items:center; gap: 8px;">
        <button class="btn btn-secondary btn-sm" id="drawer-edit-btn">
          <i data-lucide="edit-3"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" id="drawer-delete-btn" title="Delete Asset">
          <i data-lucide="trash-2"></i>
        </button>
        <button class="close-btn" id="close-drawer-btn" style="margin-left: 8px;"><i data-lucide="x"></i></button>
      </div>
    </div>

    <!-- Info Banner -->
    <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display:flex; align-items:center; gap: 16px; background-color: rgba(255,255,255,0.01)">
      <div class="asset-icon-box" style="width:48px; height:48px;">
        <i data-lucide="${getCategoryIcon(asset.category)}" style="width:24px; height:24px"></i>
      </div>
      <div>
        <h3 style="font-family:var(--font-heading); font-size:1.2rem; font-weight:700">${asset.name}</h3>
        <span style="font-size:0.8rem; color:var(--text-muted)">${asset.company} • ${asset.category}</span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="drawer-tabs">
      <button class="drawer-tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
      <button class="drawer-tab ${activeTab === 'payments' ? 'active' : ''}" data-tab="payments">Billing & History</button>
      <button class="drawer-tab ${activeTab === 'files' ? 'active' : ''}" data-tab="files">Attachments (${asset.attachments?.length || 0})</button>
      <button class="drawer-tab ${activeTab === 'logs' ? 'active' : ''}" data-tab="logs">Activity</button>
    </div>

    <!-- Drawer Body -->
    <div class="drawer-body" id="drawer-body-content">
      <!-- Loaded dynamically -->
    </div>
  `;

  // Render tab content
  const bodyContent = drawer.querySelector("#drawer-body-content");
  
  if (activeTab === "overview") {
    renderOverviewTab(asset, bodyContent, store);
  } else if (activeTab === "payments") {
    renderPaymentsTab(asset, bodyContent, store, engine, app);
  } else if (activeTab === "files") {
    renderFilesTab(asset, bodyContent, store, app);
  } else if (activeTab === "logs") {
    renderLogsTab(asset, bodyContent);
  }

  // Draw Lucide icons
  lucide.createIcons();

  // --- BIND DRAWER BUTTON EVENTS ---
  
  drawer.querySelectorAll(".drawer-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      drawer.dataset.activeTab = tab.dataset.tab;
      renderDetailDrawer(assetId, store, app, engine);
    });
  });

  document.getElementById("drawer-pin-btn").addEventListener("click", () => {
    asset.isPinned = !asset.isPinned;
    store.updateAsset(asset);
    store.logActivity(asset.isPinned ? "Pinned Asset" : "Unpinned Asset", `Asset ${asset.name} was ${asset.isPinned ? 'pinned' : 'unpinned'}`, asset.company);
    app.renderActiveView();
    renderDetailDrawer(assetId, store, app, engine);
  });

  document.getElementById("drawer-fav-btn").addEventListener("click", () => {
    asset.isFavorite = !asset.isFavorite;
    store.updateAsset(asset);
    store.logActivity(asset.isFavorite ? "Favorited Asset" : "Unfavorited Asset", `Asset ${asset.name} was ${asset.isFavorite ? 'marked' : 'unmarked'} as favorite`, asset.company);
    app.renderActiveView();
    renderDetailDrawer(assetId, store, app, engine);
  });

  document.getElementById("drawer-edit-btn").addEventListener("click", () => {
    app.openAssetForm(assetId);
  });

  document.getElementById("drawer-dup-btn").addEventListener("click", () => {
    const copy = JSON.parse(JSON.stringify(asset));
    copy.name = copy.name + " (Copy)";
    copy.id = "";
    copy.isPinned = false;
    copy.isFavorite = false;
    const added = store.addAsset(copy);
    engine.run();
    app.renderActiveView();
    app.updateGlobalCounters();
    app.openAssetDetails(added.id);
    alert(`Duplicated: "${asset.name}" duplicated successfully!`);
  });

  document.getElementById("drawer-delete-btn").addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete ${asset.name}?`)) {
      store.deleteAsset(asset.id);
      engine.run();
      app.closeAssetDetails();
      app.renderActiveView();
      app.updateGlobalCounters();
    }
  });

  document.getElementById("close-drawer-btn").addEventListener("click", () => {
    app.closeAssetDetails();
  });
}

// --- TAB SUB-RENDERERS ---

function renderOverviewTab(asset, container, store) {
  let statusClass = "status-active";
  if (asset.status === "Expired") statusClass = "status-expired";
  else if (asset.status === "Renew Soon") statusClass = "status-renew";
  else if (asset.status === "Cancelled") statusClass = "status-cancelled";

  container.innerHTML = `
    <!-- Status & Basic Fields -->
    <div style="display:flex; justify-content:space-between; align-items:center; background-color: var(--bg-hover); padding: 14px 20px; border-radius: var(--radius-md); border:1px solid var(--border-color)">
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted); display:block; font-weight:600">STATUS</span>
        <span class="badge ${statusClass}" style="margin-top: 4px;">${asset.status}</span>
      </div>
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted); display:block; font-weight:600">OWNER</span>
        <span style="font-weight:600; font-size:0.9rem; display:block; margin-top: 4px;">${asset.owner || 'Unassigned'}</span>
      </div>
    </div>

    <!-- Provider & Links Group -->
    <div class="agenda-list" style="margin-top: 8px;">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted)">PROVIDER PORTAL & RECOVERY</h4>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px">
        <div style="background-color:var(--bg-hover); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-color)">
          <span style="font-size:0.7rem; color:var(--text-muted); display:block">PROVIDER</span>
          <span style="font-weight:500; font-size:0.85rem">${asset.provider || 'N/A'}</span>
        </div>
        <div style="background-color:var(--bg-hover); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-color)">
          <span style="font-size:0.7rem; color:var(--text-muted); display:block">BILLING ACCOUNT</span>
          <span style="font-weight:500; font-size:0.85rem">${asset.billingAccount || 'N/A'}</span>
        </div>
      </div>

      <div style="background-color:var(--bg-hover); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; flex-direction:column; gap:8px">
        ${asset.providerWebsite ? `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
            <span style="color:var(--text-muted)"><i data-lucide="globe" style="width:14px; height:14px; vertical-align:middle; margin-right:6px"></i> Website</span>
            <a href="${asset.providerWebsite}" target="_blank" class="btn-text" style="color:var(--color-primary); font-weight:600; text-decoration:underline">Go to Provider</a>
          </div>
        ` : ''}
        ${asset.loginUrl ? `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
            <span style="color:var(--text-muted)"><i data-lucide="log-in" style="width:14px; height:14px; vertical-align:middle; margin-right:6px"></i> Login URL</span>
            <a href="${asset.loginUrl}" target="_blank" class="btn-text" style="color:var(--color-primary); font-weight:600; text-decoration:underline">Sign In Portal</a>
          </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
          <span style="color:var(--text-muted)"><i data-lucide="mail" style="width:14px; height:14px; vertical-align:middle; margin-right:6px"></i> Account Email</span>
          <span style="font-weight:500">${asset.accountEmail || 'N/A'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; border-top:1px dashed var(--border-color); padding-top:8px; margin-top:4px">
          <span style="color:var(--text-muted)"><i data-lucide="shield-check" style="width:14px; height:14px; vertical-align:middle; margin-right:6px"></i> 2FA Enabled</span>
          <span class="badge ${asset.twoFactorEnabled !== false ? 'status-active' : 'status-expired'}">${asset.twoFactorEnabled !== false ? 'Yes' : 'No'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
          <span style="color:var(--text-muted)"><i data-lucide="mail-warning" style="width:14px; height:14px; vertical-align:middle; margin-right:6px"></i> Recovery Email</span>
          <span style="font-weight:500">${asset.providerRecovery || 'N/A'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
          <span style="color:var(--text-muted)"><i data-lucide="phone" style="width:14px; height:14px; vertical-align:middle; margin-right:6px"></i> Support Contact</span>
          <span style="font-weight:500">${asset.providerSupport || 'N/A'}</span>
        </div>
        ${asset.project ? `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; border-top:1px dashed var(--border-color); padding-top:8px">
            <span style="color:var(--text-muted)"><i data-lucide="folder-git-2" style="width:14px; height:14px; vertical-align:middle; margin-right:6px"></i> Project Link</span>
            <span style="font-weight:600; color:var(--color-primary)">${asset.project}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Description -->
    <div style="display:flex; flex-direction:column; gap:6px">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted)">DESCRIPTION</h4>
      <p style="font-size:0.9rem; line-height:1.5; background-color: var(--bg-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px">
        ${asset.description || 'No description provided.'}
      </p>
    </div>

    <!-- Tags System -->
    <div style="display:flex; flex-direction:column; gap:8px">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted)">TAGS</h4>
      <div style="display:flex; flex-wrap:wrap; gap:6px;" id="drawer-tags-container">
        ${(asset.tags || []).map(t => `<span class="badge" style="background-color:var(--bg-hover); border:1px solid var(--border-color); padding: 4px 10px">${t}</span>`).join("")}
      </div>
    </div>

    <!-- Custom Fields -->
    <div style="display:flex; flex-direction:column; gap:8px">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted)">CUSTOM METADATA</h4>
      <div style="display:flex; flex-direction:column; gap: 6px;">
        ${(!asset.customFields || asset.customFields.length === 0) ? `
          <span style="font-size:0.85rem; color:var(--text-muted); font-style:italic">No custom fields.</span>
        ` : asset.customFields.map(f => `
          <div style="display:flex; justify-content:space-between; background-color: var(--bg-hover); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-color); font-size:0.85rem">
            <span style="font-weight:600; color:var(--text-muted)">${f.label}</span>
            <span style="font-weight:500">${f.value}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Notes Section -->
    <div style="display:flex; flex-direction:column; gap:6px">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted)">INTERNAL NOTES</h4>
      <div style="font-size:0.9rem; line-height:1.5; background-color: rgba(245, 158, 11, 0.03); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-md); padding: 12px; white-space: pre-wrap">
        ${asset.internalNotes || 'No notes compiled.'}
      </div>
    </div>
  `;
}

function renderPaymentsTab(asset, container, store, engine, app) {
  // Localization formatting preference
  const settings = store.getSettings();
  const pref = settings.preferences || { currency: "USD" };
  const rates = settings.currencyRates || { USD: 1.0, INR: 83.5, EUR: 0.92, GBP: 0.78 };

  const convertAmount = (val, fromCur, toCur) => {
    if (!val) return 0;
    const usdVal = val / (rates[fromCur] || 1.0);
    return usdVal * (rates[toCur] || 1.0);
  };
  const userCurrency = pref.currency || "USD";

  const formatValue = (amount) => {
    const symbolMap = { USD: "$", INR: "₹", EUR: "€", GBP: "£", AED: "AED ", SAR: "SAR " };
    const sym = symbolMap[userCurrency] || userCurrency + " ";
    return sym + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const convertedCost = convertAmount(asset.cost, asset.currency, userCurrency);

  container.innerHTML = `
    <!-- Costs Cards Converted to Preference -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
      <div style="background-color:var(--bg-hover); border:1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md)">
        <span style="font-size:0.75rem; color:var(--text-muted); display:block; font-weight:600">RECURRING COST</span>
        <span style="font-family:var(--font-heading); font-size:1.3rem; font-weight:700; display:block; margin-top:4px">${formatValue(convertedCost)}</span>
        <span style="font-size:0.75rem; color:var(--text-muted)">Every ${asset.renewalType} (${asset.currency} ${asset.cost.toFixed(2)})</span>
      </div>
      <div style="background-color:var(--bg-hover); border:1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md)">
        <span style="font-size:0.75rem; color:var(--text-muted); display:block; font-weight:600">AUTO RENEW</span>
        <span style="font-family:var(--font-heading); font-size:1.3rem; font-weight:700; display:block; margin-top:4px; color:${asset.autoRenew ? 'var(--color-success)' : 'var(--text-muted)'}">${asset.autoRenew ? 'Enabled' : 'Disabled'}</span>
        <span style="font-size:0.75rem; color:var(--text-muted)">Cycle: ${asset.renewalDate || 'Manual'}</span>
      </div>
    </div>

    <!-- Quick Renewal logger form -->
    <div class="card" style="padding:16px; background-color: rgba(255,255,255,0.015);">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; margin-bottom:12px">Log Manual Renewal / Payment</h4>
      <form id="record-renewal-form" style="display:flex; flex-direction:column; gap:10px">
        <div style="display:flex; gap:8px">
          <input type="number" id="rec-cost" step="0.01" value="${asset.cost}" required placeholder="Cost" class="filter-select" style="text-align:left; flex:1">
          <input type="text" id="rec-invoice" placeholder="Invoice No" class="filter-select" style="text-align:left; flex:1.2">
        </div>
        <div style="display:flex; gap:8px">
          <input type="text" id="rec-method" value="${asset.paymentMethod || ''}" placeholder="Payment Method" class="filter-select" style="text-align:left; flex:1">
          <button type="submit" class="btn btn-primary btn-sm" style="flex: 0.8">Renew Cycle</button>
        </div>
      </form>
    </div>

    <!-- Payment History -->
    <div style="display:flex; flex-direction:column; gap:8px">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted)">PAYMENT HISTORY ($ PREFERRED)</h4>
      <div class="tasks-table-wrapper" style="max-height: 200px; overflow-y:auto">
        <table class="tasks-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Cost Paid</th>
              <th>Converted</th>
              <th>Invoice</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            ${(!asset.paymentHistory || asset.paymentHistory.length === 0) ? `
              <tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No payments recorded.</td></tr>
            ` : asset.paymentHistory.map(ph => `
              <tr>
                <td>${ph.date}</td>
                <td>${ph.currency} ${ph.cost.toFixed(2)}</td>
                <td style="font-weight:600">${formatValue(convertAmount(ph.cost, ph.currency, userCurrency))}</td>
                <td>${ph.invoiceNumber || 'N/A'}</td>
                <td>${ph.paymentMethod || 'N/A'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind manual payment logging
  const recForm = document.getElementById("record-renewal-form");
  if (recForm) {
    recForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const rCost = parseFloat(document.getElementById("rec-cost").value) || asset.cost;
      const rInvoice = document.getElementById("rec-invoice").value;
      const rMethod = document.getElementById("rec-method").value;
      
      const success = engine.renewAsset(asset.id, rCost, rMethod, rInvoice, "Recorded manually in detail panel.");
      if (success) {
        alert("Renewal logged successfully!");
        app.renderActiveView();
        app.updateGlobalCounters();
        renderDetailDrawer(asset.id, store, app, engine);
      }
    });
  }
}

function renderFilesTab(asset, container, store, app) {
  container.innerHTML = `
    <!-- Dropzone -->
    <div class="file-dropzone" id="file-dropzone-uploader">
      <i data-lucide="cloud-lightning"></i>
      <p style="font-weight:600; font-size:0.9rem">Simulate Document Upload</p>
      <p style="font-size:0.75rem; color:var(--text-muted)">Drop invoices, receipts, screenshots, license files</p>
    </div>

    <!-- Parameter selectors -->
    <div class="card" id="sim-upload-card" style="display:none; padding:14px; margin-bottom:16px;">
      <h5 style="font-family:var(--font-heading); font-weight:600; font-size:0.85rem; margin-bottom:8px">Upload Simulator Parameters</h5>
      <div style="display:flex; flex-direction:column; gap:8px">
        <input type="text" id="sim-file-name" placeholder="File Display Name" class="filter-select" style="text-align:left">
        <div style="display:flex; gap:8px">
          <select id="sim-file-type" class="filter-select" style="flex:1">
            <option value="PDF Invoice">PDF Invoice</option>
            <option value="Receipt">Receipt</option>
            <option value="Screenshot">Screenshot</option>
            <option value="License Key">License File</option>
          </select>
          <button type="button" class="btn btn-primary btn-sm" id="sim-upload-submit">Simulate Add</button>
        </div>
      </div>
    </div>

    <!-- Files listing -->
    <div style="display:flex; flex-direction:column; gap:6px;">
      <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted)">ATTACHED DOCUMENTS</h4>
      <div id="drawer-attachments-list">
        ${(!asset.attachments || asset.attachments.length === 0) ? `
          <span style="font-size:0.85rem; color:var(--text-muted); font-style:italic">No attachments.</span>
        ` : asset.attachments.map(att => `
          <div class="attachment-card">
            <div class="attachment-info">
              <i data-lucide="${getFileIcon(att.type)}" style="color:var(--color-primary); width:18px; height:18px"></i>
              <div>
                <span style="font-size:0.85rem; font-weight:600; display:block">${att.name}</span>
                <span style="font-size:0.75rem; color:var(--text-muted)">${att.size} • Uploaded ${att.date}</span>
              </div>
            </div>
            <div style="display:flex; gap:6px">
              <button class="icon-btn download-att-btn" style="width:32px; height:32px" data-name="${att.name}" data-size="${att.size}" title="Download">
                <i data-lucide="download" style="width:14px; height:14px"></i>
              </button>
              <button class="icon-btn remove-att-btn" style="width:32px; height:32px" data-id="${att.id}" title="Remove">
                <i data-lucide="trash-2" style="width:14px; height:14px"></i>
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  lucide.createIcons();

  const dropzone = document.getElementById("file-dropzone-uploader");
  const simCard = document.getElementById("sim-upload-card");
  if (dropzone && simCard) {
    dropzone.addEventListener("click", () => {
      simCard.style.display = simCard.style.display === "none" ? "block" : "none";
    });
  }

  const simSubmit = document.getElementById("sim-upload-submit");
  if (simSubmit) {
    simSubmit.addEventListener("click", () => {
      const fileNameInput = document.getElementById("sim-file-name");
      const name = fileNameInput.value.trim() || "File_" + Date.now().toString().substr(-4);
      const typeSel = document.getElementById("sim-file-type").value;
      const extension = typeSel === "PDF Invoice" ? "pdf" : (typeSel === "Screenshot" ? "png" : "txt");
      
      const newFile = {
        id: "att-" + Date.now(),
        name: name.indexOf(".") === -1 ? `${name}.${extension}` : name,
        type: extension,
        size: Math.floor(Math.random() * 200 + 40) + " KB",
        date: new Date().toISOString().split("T")[0]
      };

      asset.attachments = asset.attachments || [];
      asset.attachments.push(newFile);
      
      store.updateAsset(asset);
      store.logActivity("Uploaded Attachment", `Attached document: ${newFile.name}`, asset.company);
      
      fileNameInput.value = "";
      simCard.style.display = "none";
      alert(`"${newFile.name}" attached!`);
      
      renderDetailDrawer(asset.id, store, app, null);
    });
  }

  document.querySelectorAll(".download-att-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      alert(`[OpsHub Download Simulator]\n\nFile "${btn.dataset.name}" (${btn.dataset.size}) downloaded successfully!`);
    });
  });

  document.querySelectorAll(".remove-att-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const attId = btn.dataset.id;
      if (confirm("Remove this document?")) {
        asset.attachments = asset.attachments.filter(f => f.id !== attId);
        store.updateAsset(asset);
        store.logActivity("Removed Attachment", `Deleted attachment record`, asset.company);
        renderDetailDrawer(asset.id, store, app, null);
      }
    });
  });
}

function renderLogsTab(asset, container) {
  const history = asset.activityLog || [];
  container.innerHTML = `
    <h4 style="font-family:var(--font-heading); font-size:0.95rem; font-weight:600; color:var(--text-muted); margin-bottom:8px">ASSET AUDIT TIMELINE</h4>
    <div class="timeline">
      ${history.length === 0 ? `
        <div style="color:var(--text-muted); text-align:center; padding: 20px;">No audit timelines registered.</div>
      ` : history.map(h => `
        <div class="timeline-item">
          <span class="timeline-time">${h.date} - ${h.user}</span>
          <span class="timeline-desc"><strong>${h.action}</strong>: ${h.details}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function getFileIcon(ext) {
  if (ext === "pdf") return "file-text";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "file-image";
  return "file";
}
