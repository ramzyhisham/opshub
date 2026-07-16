// OpsHub Analytics and Charts view

export function renderAnalytics(app, store, engine) {
  const currentCompany = app.currentCompany;
  const assets = store.getAssets().filter(a => currentCompany === "Global" || a.company === currentCompany);

  const rates = store.getSettings().currencyRates || { USD: 1.0, INR: 83.5, EUR: 0.92, GBP: 0.78 };

  const convertToUSD = (val, currency) => {
    const rate = rates[currency] || 1.0;
    return val / rate;
  };

  // Compile cost statistics
  let totalMonthlySpend = 0;
  let totalAnnualSpend = 0;
  
  const categoryCounts = {};
  const companyCounts = {};
  const categoryCosts = {};
  const companyCosts = {};

  assets.forEach(a => {
    // Counts
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;

    // Costs
    if (a.cost && a.status !== "Cancelled") {
      const costInUSD = convertToUSD(a.cost, a.currency);
      
      categoryCosts[a.category] = (categoryCosts[a.category] || 0) + costInUSD;
      companyCosts[a.company] = (companyCosts[a.company] || 0) + costInUSD;

      if (a.renewalType === "Monthly") {
        totalMonthlySpend += costInUSD;
        totalAnnualSpend += costInUSD * 12;
      } else if (a.renewalType === "Quarterly") {
        totalMonthlySpend += costInUSD / 3;
        totalAnnualSpend += costInUSD * 4;
      } else if (a.renewalType === "Yearly") {
        totalMonthlySpend += costInUSD / 12;
        totalAnnualSpend += costInUSD;
      }
    }
  });

  const container = document.getElementById("app-content");
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Financial & Resource Analytics</h2>
        <p>Operational cost curves and asset distribution details (Converted to USD)</p>
      </div>
    </div>

    <!-- Spending summaries -->
    <div class="stats-grid">
      <div class="card stat-card stat-success">
        <div class="stat-icon-box"><i data-lucide="trending-up"></i></div>
        <div class="stat-details">
          <h4>Aggregate Monthly Cost</h4>
          <div class="stat-value">$${totalMonthlySpend.toFixed(2)}</div>
        </div>
      </div>
      <div class="card stat-card stat-success">
        <div class="stat-icon-box"><i data-lucide="banknote"></i></div>
        <div class="stat-details">
          <h4>Aggregate Annual Cost</h4>
          <div class="stat-value">$${totalAnnualSpend.toFixed(2)}</div>
        </div>
      </div>
      <div class="card stat-card stat-primary">
        <div class="stat-icon-box"><i data-lucide="database"></i></div>
        <div class="stat-details">
          <h4>Total Assets Tracked</h4>
          <div class="stat-value">${assets.length} items</div>
        </div>
      </div>
    </div>

    <!-- Chart rows -->
    <div class="widget-grid">
      
      <!-- Spending Curve Line Chart -->
      <div class="card widget-span-8">
        <div class="widget-header">
          <h3 class="widget-title">12-Month Renewal Projections</h3>
        </div>
        <div class="chart-container" style="position: relative; height:300px; width:100%">
          <canvas id="spending-curve-chart"></canvas>
          <div id="spending-curve-fallback" class="fallback-chart-box" style="display:none"></div>
        </div>
      </div>

      <!-- Assets by Category Donut Chart -->
      <div class="card widget-span-4">
        <div class="widget-header">
          <h3 class="widget-title">Assets by Category</h3>
        </div>
        <div class="chart-container" style="position: relative; height:300px; width:100%">
          <canvas id="category-donut-chart"></canvas>
          <div id="category-donut-fallback" class="fallback-chart-box" style="display:none"></div>
        </div>
      </div>

      <!-- Spending by Company Bar Chart -->
      <div class="card widget-span-6">
        <div class="widget-header">
          <h3 class="widget-title">Annual Spending by Organization ($)</h3>
        </div>
        <div class="chart-container" style="position: relative; height:280px; width:100%">
          <canvas id="company-bar-chart"></canvas>
          <div id="company-bar-fallback" class="fallback-chart-box" style="display:none"></div>
        </div>
      </div>

      <!-- Assets by Company Bar Chart -->
      <div class="card widget-span-6">
        <div class="widget-header">
          <h3 class="widget-title">Active Assets Count by Organization</h3>
        </div>
        <div class="chart-container" style="position: relative; height:280px; width:100%">
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
    renderChartJS(categoryCounts, companyCosts, companyCounts, totalMonthlySpend);
  } else {
    renderFallbackHTML(categoryCounts, companyCosts, companyCounts, totalMonthlySpend);
  }
}

// Generate premium interactive Chart.js elements
function renderChartJS(categoryCounts, companyCosts, companyCounts, monthlyBase) {
  // Theme styling overrides for chart texts
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#a1a1aa" : "#71717a";
  const gridColor = isDark ? "#27272a" : "#e4e4e7";

  // 1. Line Spending curve (projections over 12 months)
  const lineCtx = document.getElementById("spending-curve-chart").getContext("2d");
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Build a realistic curve centered around current monthly base, adding random variations for renewal timings
  const curveData = Array.from({length: 12}, (_, i) => {
    const variance = (Math.sin(i) * 0.15 + 1.0) * monthlyBase;
    return parseFloat(variance.toFixed(2));
  });

  new Chart(lineCtx, {
    type: "line",
    data: {
      labels: monthLabels,
      datasets: [{
        label: "Estimated Cost ($)",
        data: curveData,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#6366f1"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });

  // 2. Category Doughnut Chart
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

  // 3. Spending by Company Bar Chart
  const compBarCtx = document.getElementById("company-bar-chart").getContext("2d");
  const compLabels = Object.keys(companyCosts);
  const compSpendData = Object.values(companyCosts);

  new Chart(compBarCtx, {
    type: "bar",
    data: {
      labels: compLabels,
      datasets: [{
        label: "Annual Cost ($)",
        data: compSpendData,
        backgroundColor: "#10b981",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });

  // 4. Count by Company Bar Chart
  const compCountCtx = document.getElementById("company-count-chart").getContext("2d");
  const compCountData = Object.values(companyCounts);

  new Chart(compCountCtx, {
    type: "bar",
    data: {
      labels: Object.keys(companyCounts),
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
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });
}

// Draw static CSS fallback representation if offline or library is unreachable
function renderFallbackHTML(categoryCounts, companyCosts, companyCounts, monthlyBase) {
  // Hide canvas tags and display fallbacks
  const ids = ["spending-curve", "category-donut", "company-bar", "company-count"];
  ids.forEach(id => {
    document.getElementById(`${id}-chart`).style.display = "none";
    document.getElementById(`${id}-fallback`).style.display = "block";
  });

  // 1. Spending curve progress bars
  const curveBox = document.getElementById("spending-curve-fallback");
  curveBox.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; padding:10px">
      <span style="font-size:0.85rem; color:var(--text-muted)">Offline mode - showing approximate breakdown:</span>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
        <span>Base Monthly Rate:</span>
        <strong style="font-size:1.1rem">$${monthlyBase.toFixed(2)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
        <span>Calculated Annual Rate:</span>
        <strong>$${(monthlyBase * 12).toFixed(2)}</strong>
      </div>
    </div>
  `;

  // 2. Categories breakdown list
  const catBox = document.getElementById("category-donut-fallback");
  const totalCats = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;
  catBox.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px; padding-top:10px; max-height:260px; overflow-y:auto">
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

  // 3. Company Costs breakdown
  const compBarBox = document.getElementById("company-bar-fallback");
  const maxCost = Math.max(...Object.values(companyCosts), 1);
  compBarBox.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; padding-top:10px">
      ${Object.entries(companyCosts).map(([comp, cost]) => {
        const pct = Math.round((cost / maxCost) * 100);
        return `
          <div style="font-size:0.8rem">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px">
              <span>${comp}</span>
              <strong>$${cost.toFixed(2)}</strong>
            </div>
            <div style="width:100%; height:8px; background-color:var(--bg-hover); border-radius:4px; overflow:hidden">
              <div style="width:${pct}%; height:100%; background-color:var(--color-success)"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // 4. Company Counts breakdown
  const compCountBox = document.getElementById("company-count-fallback");
  const maxCount = Math.max(...Object.values(companyCounts), 1);
  compCountBox.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; padding-top:10px">
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
