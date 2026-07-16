// OpsHub Resource Analytics and Charts view

export function renderAnalytics(app, store, engine) {
  const currentCompany = app.currentCompany;
  const assets = store.getAssets().filter(a => currentCompany === "Global" || a.company === currentCompany);

  const categoryCounts = {};
  const companyCounts = {};

  assets.forEach(a => {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;
  });

  const container = document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Resource & Taxonomy Analytics</h2>
        <p>Asset category and organization distribution details</p>
      </div>
    </div>

    <!-- Analytics summaries -->
    <div class="stats-grid" style="grid-template-columns: 1fr;">
      <div class="card stat-card stat-primary" style="justify-content: center; padding: 24px;">
        <div class="stat-icon-box" style="width: 54px; height: 54px;"><i data-lucide="database" style="width: 28px; height: 28px;"></i></div>
        <div class="stat-details">
          <h4 style="font-size: 0.85rem; font-weight: 600;">Total Assets Tracked</h4>
          <div class="stat-value" style="font-size: 2rem;">${assets.length} items</div>
        </div>
      </div>
    </div>

    <!-- Chart rows -->
    <div class="widget-grid">
      
      <!-- Assets by Category Donut Chart -->
      <div class="card widget-span-6">
        <div class="widget-header">
          <h3 class="widget-title">Assets by Category</h3>
        </div>
        <div class="chart-container" style="position: relative; height:320px; width:100%">
          <canvas id="category-donut-chart"></canvas>
          <div id="category-donut-fallback" class="fallback-chart-box" style="display:none"></div>
        </div>
      </div>

      <!-- Assets by Company Bar Chart -->
      <div class="card widget-span-6">
        <div class="widget-header">
          <h3 class="widget-title">Active Assets Count by Organization</h3>
        </div>
        <div class="chart-container" style="position: relative; height:320px; width:100%">
          <canvas id="company-count-chart"></canvas>
          <div id="company-count-fallback" class="fallback-chart-box" style="display:none"></div>
        </div>
      </div>

    </div>
  `;

  // Redraw icons
  lucide.createIcons();

  // --- CHART RENDERING LOGIC ---
  const isChartAvailable = typeof Chart !== "undefined";

  if (isChartAvailable) {
    renderChartJS(categoryCounts, companyCounts);
  } else {
    renderFallbackHTML(categoryCounts, companyCounts);
  }
}

// Generate premium interactive Chart.js elements
function renderChartJS(categoryCounts, companyCounts) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#a1a1aa" : "#71717a";
  const gridColor = isDark ? "#27272a" : "#e4e4e7";

  // 1. Category Doughnut Chart
  const donutCtx = document.getElementById("category-donut-chart").getContext("2d");
  const catLabels = Object.keys(categoryCounts);
  const catData = Object.values(categoryCounts);
  const chartColors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#8b5cf6", "#ec4899", "#3b82f6", "#a1a1aa"];

  new Chart(donutCtx, {
    type: "doughnut",
    data: {
      labels: catLabels,
      datasets: [{
        data: catData,
        backgroundColor: chartColors.slice(0, catLabels.length),
        borderWidth: 1,
        borderColor: isDark ? "#18181b" : "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: textColor, boxWidth: 12, font: { size: 10 } }
        }
      }
    }
  });

  // 2. Count by Company Bar Chart
  const compCountCtx = document.getElementById("company-count-chart").getContext("2d");
  const compCountLabels = Object.keys(companyCounts);
  const compCountData = Object.values(companyCounts);

  new Chart(compCountCtx, {
    type: "bar",
    data: {
      labels: compCountLabels,
      datasets: [{
        label: "Assets Count",
        data: compCountData,
        backgroundColor: "#06b6d4",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } }
      }
    }
  });
}

// Draw static CSS fallback representation if offline or library is unreachable
function renderFallbackHTML(categoryCounts, companyCounts) {
  const ids = ["category-donut", "company-count"];
  ids.forEach(id => {
    const canvas = document.getElementById(`${id}-chart`);
    const fallback = document.getElementById(`${id}-fallback`);
    if (canvas) canvas.style.display = "none";
    if (fallback) fallback.style.display = "block";
  });

  // 1. Categories breakdown list
  const catBox = document.getElementById("category-donut-fallback");
  const totalCats = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;
  catBox.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px; padding-top:10px; max-height:280px; overflow-y:auto">
      ${Object.entries(categoryCounts).map(([cat, count]) => {
        const pct = Math.round((count / totalCats) * 100);
        return `
          <div style="font-size:0.8rem">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px">
              <span>${cat}</span>
              <strong>${count} (${pct}%)</strong>
            </div>
            <div style="width:100%; height:6px; background-color:var(--bg-hover); border-radius:4px; overflow:hidden">
              <div style="width:${pct}%; height:100%; background-color:var(--color-primary)"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // 2. Company Counts breakdown
  const compCountBox = document.getElementById("company-count-fallback");
  const maxCount = Math.max(...Object.values(companyCounts), 1);
  compCountBox.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; padding-top:10px; max-height:280px; overflow-y:auto">
      ${Object.entries(companyCounts).map(([comp, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        return `
          <div style="font-size:0.8rem">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px">
              <span>${comp}</span>
              <strong>${count} Assets</strong>
            </div>
            <div style="width:100%; height:8px; background-color:var(--bg-hover); border-radius:4px; overflow:hidden">
              <div style="width:${pct}%; height:100%; background-color:var(--color-info)"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}
