// OpsHub Local Store Layer - Phase 2 Premium Updates

const DEFAULT_COMPANIES = [
  "Dotco",
  "Health with ATP",
  "ATP Institute",
  "Sweatsquad Lifestyle",
  "Grandma Rituals",
  "Kindled",
  "HAPS"
];

const DEFAULT_CATEGORIES = [
  "Domain",
  "Hosting",
  "VPS",
  "Business Mail",
  "SSL",
  "Cloud Storage",
  "Developer Account",
  "API",
  "Subscription",
  "License",
  "Database",
  "Backup",
  "CDN",
  "Payment Gateway",
  "Marketing Tool",
  "Analytics",
  "Communication",
  "Security",
  "Other"
];

const DEFAULT_PROJECTS = [
  "Health with ATP Website",
  "Sweatsquad Mobile App",
  "Dotco Corporate Portal",
  "Grandma Rituals E-Shop",
  "HAPS Security Audit"
];



// Helper to construct dynamic dates relative to current date (July 16, 2026)
const getRelativeDate = (offsetDays) => {
  const baseDate = new Date("2026-07-16T12:00:00");
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return baseDate.toISOString().split("T")[0];
};

const INITIAL_ASSETS = [
  {
    id: "asset-1",
    name: "healthwithatp.com",
    company: "Health with ATP",
    category: "Domain",
    provider: "GoDaddy",
    providerWebsite: "https://godaddy.com",
    loginUrl: "https://sso.godaddy.com",
    accountEmail: "admin@healthwithatp.com",
    billingAccount: "ATP Main Card",
    renewalType: "Yearly",
    purchaseDate: "2022-07-16",
    renewalDate: getRelativeDate(5), // 5 days from now (July 21, 2026)
    expiryDate: getRelativeDate(5),
    reminderSettings: [30, 15, 7, 3, 1, 0],
    cost: 15.99,
    currency: "USD",
    gstEnabled: true,
    gstRate: 18,
    gstAmount: 2.88,
    invoiceNumber: "INV-2025-0899",
    paymentMethod: "Credit Card (Visa - 4242)",
    autoRenew: true,
    status: "Renew Soon",
    owner: "Ramz H.",
    vendorContact: "GoDaddy Support",
    supportContact: "https://godaddy.com/contact-us",
    description: "Primary domain for the Health with ATP web application. Essential parent mapping node.",
    internalNotes: "Auto-renew is active but check payment card status before renewal.",
    tags: ["production", "critical", "website"],
    isFavorite: true,
    isPinned: true,
    project: "Health with ATP Website",
    customFields: [
      { label: "DNS Host", value: "Cloudflare" }
    ],
    attachments: [
      { id: "att-1", name: "DomainPurchase_Receipt.pdf", type: "pdf", size: "142 KB", date: "2025-07-16" }
    ],
    paymentHistory: [
      { id: "ph-1", date: "2025-07-16", cost: 15.99, currency: "USD", invoiceNumber: "INV-2025-0899", paymentMethod: "Credit Card (Visa - 4242)", notes: "Regular yearly renewal" },
      { id: "ph-2", date: "2024-07-16", cost: 14.99, currency: "USD", invoiceNumber: "INV-2024-0412", paymentMethod: "Credit Card (Visa - 4242)", notes: "Regular yearly renewal" }
    ],
    renewalHistory: [
      { id: "rh-1", date: "2025-07-16", cost: 15.99, renewalDate: "2026-07-21", updatedBy: "System" }
    ],
    activityLog: [
      { id: "al-1", date: "2026-07-10 14:00", user: "Ramz H.", action: "Updated notes", details: "Checked Cloudflare DNS configuration" }
    ]
  },
  {
    id: "asset-2",
    name: "AWS Production VPS",
    company: "Health with ATP",
    category: "VPS",
    provider: "AWS EC2",
    providerWebsite: "https://aws.amazon.com",
    loginUrl: "https://console.aws.amazon.com",
    accountEmail: "tech-aws@healthwithatp.com",
    billingAccount: "Corporate AWS Consolidate",
    renewalType: "Monthly",
    purchaseDate: "2024-01-10",
    renewalDate: getRelativeDate(15),
    expiryDate: getRelativeDate(15),
    reminderSettings: [7, 3, 1, 0],
    cost: 145.00,
    currency: "USD",
    gstEnabled: true,
    gstRate: 18,
    gstAmount: 26.10,
    invoiceNumber: "AWS-INV-998811",
    paymentMethod: "AWS Billing Agreement",
    autoRenew: true,
    status: "Active",
    owner: "DevOps Team",
    vendorContact: "AWS Premium Enterprise Support",
    supportContact: "https://console.aws.amazon.com/support",
    description: "Main EC2 instance hosting production APIs and database replicas. Linked to healthwithatp.com domain.",
    internalNotes: "Running a t3.xlarge instance. Requires parent domain active.",
    tags: ["production", "infrastructure", "backend"],
    isFavorite: false,
    isPinned: true,
    project: "Health with ATP Website",
    customFields: [
      { label: "Instance ID", value: "i-0987123abcd" },
      { label: "IP Address", value: "44.201.88.91" }
    ],
    attachments: [],
    paymentHistory: [
      { id: "ph-3", date: "2026-06-30", cost: 145.00, currency: "USD", invoiceNumber: "AWS-INV-998811", paymentMethod: "AWS Billing Agreement", notes: "Monthly server bill" }
    ],
    renewalHistory: [],
    activityLog: []
  },
  {
    id: "asset-3",
    name: "Google Workspace Business Email",
    company: "Dotco",
    category: "Business Mail",
    provider: "Google Cloud",
    providerWebsite: "https://workspace.google.com",
    loginUrl: "https://admin.google.com",
    accountEmail: "billing@dotco.com",
    billingAccount: "Dotco CC",
    renewalType: "Monthly",
    purchaseDate: "2021-03-01",
    renewalDate: getRelativeDate(14),
    expiryDate: getRelativeDate(14),
    reminderSettings: [7, 1],
    cost: 72.00,
    currency: "USD",
    gstEnabled: false,
    gstRate: 0,
    gstAmount: 0.00,
    invoiceNumber: "GWS-2026-JULY",
    paymentMethod: "Credit Card (Amex - 1007)",
    autoRenew: true,
    status: "Active",
    owner: "Admin HR",
    vendorContact: "Google Workspace Help",
    supportContact: "https://support.google.com/a",
    description: "Email inbox and drive access for 12 core users at Dotco.",
    internalNotes: "Plan is business starter ($6/user/month for 12 users).",
    tags: ["internal-tools", "email", "office"],
    isFavorite: true,
    isPinned: false,
    project: "Dotco Corporate Portal",
    customFields: [
      { label: "User Count", value: "12" }
    ],
    attachments: [],
    paymentHistory: [],
    renewalHistory: [],
    activityLog: []
  },
  {
    id: "asset-4",
    name: "Apple Developer Account",
    company: "Sweatsquad Lifestyle",
    category: "Developer Account",
    provider: "Apple Inc.",
    providerWebsite: "https://developer.apple.com",
    loginUrl: "https://developer.apple.com/account",
    accountEmail: "ios-dev@sweatsquad.com",
    billingAccount: "Sweatsquad LLC Card",
    renewalType: "Yearly",
    purchaseDate: "2025-07-15",
    renewalDate: getRelativeDate(-1), // Expired yesterday
    expiryDate: getRelativeDate(-1),
    reminderSettings: [30, 15, 7, 1, 0, -1],
    cost: 99.00,
    currency: "USD",
    gstEnabled: false,
    gstRate: 0,
    gstAmount: 0.00,
    invoiceNumber: "APL-DEV-9812",
    paymentMethod: "Credit Card (Visa - 8812)",
    autoRenew: false,
    status: "Expired",
    owner: "Lead iOS Dev",
    vendorContact: "Apple Developer Relations",
    supportContact: "https://developer.apple.com/contact/",
    description: "App store publishing license for Sweatsquad fitness app.",
    internalNotes: "CRITICAL: The card registered expired. Needs update immediately to restore app submission privileges.",
    tags: ["production", "ios", "publishing"],
    isFavorite: true,
    isPinned: true,
    project: "Sweatsquad Mobile App",
    customFields: [
      { label: "Team ID", value: "AB12CD34EF" }
    ],
    attachments: [],
    paymentHistory: [
      { id: "ph-4", date: "2025-07-15", cost: 99.00, currency: "USD", invoiceNumber: "APL-DEV-9812", paymentMethod: "Credit Card (Visa - 8812)", notes: "Initial creation" }
    ],
    renewalHistory: [],
    activityLog: []
  },
  {
    id: "asset-5",
    name: "Razorpay Production Keys",
    company: "ATP Institute",
    category: "Payment Gateway",
    provider: "Razorpay",
    providerWebsite: "https://razorpay.com",
    loginUrl: "https://dashboard.razorpay.com",
    accountEmail: "finance@atpinstitute.com",
    billingAccount: "ATP Corporate Account",
    renewalType: "One Time",
    purchaseDate: "2023-11-20",
    renewalDate: "",
    expiryDate: "",
    reminderSettings: [],
    cost: 0.00,
    currency: "INR",
    gstEnabled: true,
    gstRate: 18,
    gstAmount: 0.00,
    invoiceNumber: "N/A",
    paymentMethod: "Transaction Percentage Cut",
    autoRenew: false,
    status: "Active",
    owner: "Finance Team",
    vendorContact: "Razorpay Corporate Relationship Manager",
    supportContact: "https://support.razorpay.com",
    description: "Payment integration API keys for student enrollment collections.",
    internalNotes: "Keys are updated yearly for security rotation. Expiry date is empty since it's a one-time API setup.",
    tags: ["finance", "integrations", "payments"],
    isFavorite: false,
    isPinned: false,
    project: "",
    customFields: [
      { label: "Merchant ID", value: "mid_92817281" }
    ],
    attachments: [],
    paymentHistory: [],
    renewalHistory: [],
    activityLog: []
  },
  {
    id: "asset-6",
    name: "Wildcard SSL Certificate",
    company: "Grandma Rituals",
    category: "SSL",
    provider: "Namecheap SSL",
    providerWebsite: "https://namecheap.com",
    loginUrl: "https://namecheap.com",
    accountEmail: "security@grandmarituals.com",
    billingAccount: "GR Paypal",
    renewalType: "Yearly",
    purchaseDate: "2025-07-20",
    renewalDate: getRelativeDate(4), // July 20 (4 days from now)
    expiryDate: getRelativeDate(4),
    reminderSettings: [30, 15, 7, 3, 1, 0],
    cost: 49.00,
    currency: "USD",
    gstEnabled: false,
    gstRate: 0,
    gstAmount: 0.00,
    invoiceNumber: "NC-SSL-77881",
    paymentMethod: "PayPal",
    autoRenew: true,
    status: "Renew Soon",
    owner: "Webmaster",
    vendorContact: "Namecheap SSL support",
    supportContact: "https://www.namecheap.com/help-center/",
    description: "SSL certificate protecting *.grandmarituals.com and primary domain.",
    internalNotes: "Requires manual installation on Hostinger server. Will auto-renew in Namecheap, but must download files and apply keys.",
    tags: ["security", "ssl", "ecommerce"],
    isFavorite: false,
    isPinned: false,
    project: "Grandma Rituals E-Shop",
    customFields: [
      { label: "Encryption", value: "SHA-256 with RSA" }
    ],
    attachments: [],
    paymentHistory: [
      { id: "ph-5", date: "2025-07-20", cost: 49.00, currency: "USD", invoiceNumber: "NC-SSL-77881", paymentMethod: "PayPal", notes: "Initial setup" }
    ],
    renewalHistory: [],
    activityLog: []
  },
  {
    id: "asset-7",
    name: "Bunny CDN Storage",
    company: "Health with ATP",
    category: "CDN",
    provider: "Bunny.net",
    providerWebsite: "https://bunny.net",
    loginUrl: "https://panel.bunny.net",
    accountEmail: "assets@healthwithatp.com",
    billingAccount: "ATP Main Card",
    renewalType: "Monthly",
    purchaseDate: "2024-04-05",
    renewalDate: getRelativeDate(20),
    expiryDate: getRelativeDate(20),
    reminderSettings: [3, 1, 0],
    cost: 12.50,
    currency: "USD",
    gstEnabled: false,
    gstRate: 0,
    gstAmount: 0.00,
    invoiceNumber: "BUNNY-INV-11009",
    paymentMethod: "Credit Card (Visa - 4242)",
    autoRenew: true,
    status: "Active",
    owner: "DevOps Team",
    vendorContact: "Bunny.net Support Team",
    supportContact: "https://bunny.net/contact/",
    description: "Content delivery network storing and serving instructional gym videos.",
    internalNotes: "Top-up balance system. Set to auto-recharge $15 once balance goes below $5.",
    tags: ["media", "cdn", "performance"],
    isFavorite: false,
    isPinned: false,
    project: "Health with ATP Website",
    customFields: [
      { label: "Pull Zone Name", value: "atp-gym-video" }
    ],
    attachments: [],
    paymentHistory: [],
    renewalHistory: [],
    activityLog: []
  }
];

export class OpsHubStore {
  constructor() {
    this.keyAssets = "opshub_assets";
    this.keyCompanies = "opshub_companies";
    this.keyCategories = "opshub_categories";
    this.keyProjects = "opshub_projects";
    this.keyTasks = "opshub_tasks";
    this.keyNotifications = "opshub_notifications";
    this.keyActivityLogs = "opshub_activity_logs";
    this.keySettings = "opshub_settings";

    this.init();
  }

  init() {
    if (!localStorage.getItem(this.keyCompanies)) {
      localStorage.setItem(this.keyCompanies, JSON.stringify(DEFAULT_COMPANIES));
    }
    if (!localStorage.getItem(this.keyCategories)) {
      localStorage.setItem(this.keyCategories, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(this.keyProjects)) {
      localStorage.setItem(this.keyProjects, JSON.stringify(DEFAULT_PROJECTS));
    }
    if (!localStorage.getItem(this.keyAssets)) {
      localStorage.setItem(this.keyAssets, JSON.stringify(INITIAL_ASSETS));
    }
    if (!localStorage.getItem(this.keyTasks)) {
      localStorage.setItem(this.keyTasks, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.keyNotifications)) {
      localStorage.setItem(this.keyNotifications, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.keyActivityLogs)) {
      localStorage.setItem(this.keyActivityLogs, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.keySettings)) {
      // Expanded Preferences schemas
      localStorage.setItem(this.keySettings, JSON.stringify({
        theme: "dark",
        sidebarCollapsed: false,
        currencyRates: { USD: 1.0, INR: 83.5, EUR: 0.92, GBP: 0.78, AED: 3.67, SAR: 3.75 },
        baseCurrency: "USD",
        preferences: {
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
          notifications: {
            push: true,
            renewals: true,
            tasks: true,
            sound: false
          }
        },
        dashboardLayout: ["focus", "renewals", "critical", "tasks", "timeline", "spend", "companies", "activity", "notifications", "quick"]
      }));
    }
  }

  // --- GENERAL STORAGE ACCESSORS ---
  getAssets() {
    return JSON.parse(localStorage.getItem(this.keyAssets)) || [];
  }

  saveAssets(assets) {
    localStorage.setItem(this.keyAssets, JSON.stringify(assets));
  }

  getCompanies() {
    return JSON.parse(localStorage.getItem(this.keyCompanies)) || [];
  }

  saveCompanies(companies) {
    localStorage.setItem(this.keyCompanies, JSON.stringify(companies));
  }

  getCategories() {
    return JSON.parse(localStorage.getItem(this.keyCategories)) || [];
  }

  saveCategories(categories) {
    localStorage.setItem(this.keyCategories, JSON.stringify(categories));
  }

  getProjects() {
    return JSON.parse(localStorage.getItem(this.keyProjects)) || [];
  }

  saveProjects(projects) {
    localStorage.setItem(this.keyProjects, JSON.stringify(projects));
  }

  getTasks() {
    return JSON.parse(localStorage.getItem(this.keyTasks)) || [];
  }

  saveTasks(tasks) {
    localStorage.setItem(this.keyTasks, JSON.stringify(tasks));
  }

  getNotifications() {
    return JSON.parse(localStorage.getItem(this.keyNotifications)) || [];
  }

  saveNotifications(notifications) {
    localStorage.setItem(this.keyNotifications, JSON.stringify(notifications));
  }

  getActivityLogs() {
    return JSON.parse(localStorage.getItem(this.keyActivityLogs)) || [];
  }

  saveActivityLogs(logs) {
    localStorage.setItem(this.keyActivityLogs, JSON.stringify(logs));
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(this.keySettings)) || {};
  }

  saveSettings(settings) {
    localStorage.setItem(this.keySettings, JSON.stringify(settings));
  }

  // --- CRUD HELPERS ---
  addAsset(asset) {
    const assets = this.getAssets();
    asset.id = "asset-" + Date.now();
    asset.attachments = asset.attachments || [];
    asset.paymentHistory = asset.paymentHistory || [];
    asset.renewalHistory = asset.renewalHistory || [];
    asset.activityLog = asset.activityLog || [{
      id: "al-" + Date.now(),
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      user: "Current User",
      action: "Created Asset",
      details: `Asset ${asset.name} was added to ${asset.company}.`
    }];
    assets.push(asset);
    this.saveAssets(assets);
    this.logActivity("Created Asset", `Added asset: ${asset.name}`, asset.company);
    return asset;
  }

  updateAsset(updatedAsset) {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.id === updatedAsset.id);
    if (index !== -1) {
      const old = assets[index];
      
      // Start with a clone of the old asset to preserve all existing state
      const merged = { ...old };
      
      // Update fields from updatedAsset only if they are not undefined
      for (const key in updatedAsset) {
        if (updatedAsset[key] !== undefined) {
          merged[key] = updatedAsset[key];
        }
      }
      
      // Explicitly protect and preserve system-managed properties
      const systemProperties = [
        "isPinned", "isFavorite", "pinned", "favorite", 
        "paymentHistory", "renewalHistory", "attachments", "activityLog"
      ];
      
      systemProperties.forEach(prop => {
        if (updatedAsset[prop] === undefined || updatedAsset[prop] === null) {
          merged[prop] = old[prop] !== undefined ? old[prop] : (Array.isArray(old[prop]) ? [] : (prop.startsWith("is") ? false : old[prop]));
        }
      });
      
      // Ensure arrays are initialized
      merged.paymentHistory = merged.paymentHistory || [];
      merged.renewalHistory = merged.renewalHistory || [];
      merged.attachments = merged.attachments || [];
      merged.activityLog = merged.activityLog || [];

      merged.activityLog.push({
        id: "al-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 16),
        user: "Current User",
        action: "Updated Asset",
        details: `Asset details updated.`
      });

      assets[index] = merged;
      this.saveAssets(assets);
      this.logActivity("Updated Asset", `Modified asset: ${merged.name}`, merged.company);
      return true;
    }
    return false;
  }

  deleteAsset(id) {
    const assets = this.getAssets();
    const asset = assets.find(a => a.id === id);
    if (asset) {
      const filtered = assets.filter(a => a.id !== id);
      this.saveAssets(filtered);
      this.logActivity("Deleted Asset", `Removed asset: ${asset.name}`, asset.company);
      return true;
    }
    return false;
  }

  logActivity(action, details, company = "Global") {
    const logs = this.getActivityLogs();
    logs.unshift({
      id: "log-" + Date.now(),
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      user: "Current User",
      action,
      details,
      company
    });
    if (logs.length > 200) logs.pop();
    this.saveActivityLogs(logs);
  }

  resetDatabase() {
    localStorage.removeItem(this.keyAssets);
    localStorage.removeItem(this.keyCompanies);
    localStorage.removeItem(this.keyCategories);
    localStorage.removeItem(this.keyProjects);
    localStorage.removeItem(this.keyTasks);
    localStorage.removeItem(this.keyNotifications);
    localStorage.removeItem(this.keyActivityLogs);
    localStorage.removeItem(this.keySettings);
    this.init();
  }

  // --- CURRENCY CONVERSION AND FORMATTING ---
  getUserCurrency() {
    const settings = this.getSettings();
    return settings.preferences?.currency || "USD";
  }

  getCurrencySymbol(currencyCode) {
    const symbolMap = { USD: "$", INR: "₹", EUR: "€", GBP: "£", AED: "AED ", SAR: "SAR " };
    return symbolMap[currencyCode] || currencyCode;
  }

  convertCost(val, fromCur, toCur) {
    if (!val) return 0;
    const settings = this.getSettings();
    const rates = settings.currencyRates || { USD: 1.0, INR: 83.5, EUR: 0.92, GBP: 0.78, AED: 3.67, SAR: 3.75 };
    const usdVal = val / (rates[fromCur] || 1.0);
    return usdVal * (rates[toCur] || 1.0);
  }

  formatCost(val, fromCur) {
    if (val === undefined || val === null) return "";
    const userCurrency = this.getUserCurrency();
    const converted = this.convertCost(val, fromCur, userCurrency);
    const symbol = this.getCurrencySymbol(userCurrency);
    
    const settings = this.getSettings();
    const numFormat = settings.preferences?.numberFormat || "International";
    let formattedVal;
    if (numFormat === "Indian") {
      formattedVal = converted.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      formattedVal = converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return `${symbol}${formattedVal}`;
  }
}

