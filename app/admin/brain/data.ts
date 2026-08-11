// Sample/illustrative data for the /admin/brain workspace. None of this is
// wired to real Google Ads / Meta / GA / CRM APIs yet - see the design
// handoff's "Data Architecture" notes for what a real integration would read
// from instead. The AI Marketing Manager card, Content Studio generator, and
// floating Assistant chat reason over this same data via
// lib/ai/marketingProvider.ts, standing in for the real feeds later.

export type BrainTab = "b-overview" | "b-tools" | "b-workstreams" | "b-checklist" | "b-library";
export type MarketingTab =
  | "overview"
  | "chat"
  | "ai-manager"
  | "approvals"
  | "google-ads"
  | "meta"
  | "content"
  | "leads"
  | "website"
  | "calculator"
  | "campaigns"
  | "competitors"
  | "knowledge"
  | "automation"
  | "reports";

export const BRAIN_TABS: { key: BrainTab; label: string }[] = [
  { key: "b-overview", label: "Overview" },
  { key: "b-tools", label: "Tools & Infra" },
  { key: "b-workstreams", label: "Workstreams" },
  { key: "b-checklist", label: "Checklist" },
  { key: "b-library", label: "Mockup Library" },
];

export const MARKETING_TABS: { key: MarketingTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "chat", label: "Chat" },
  { key: "ai-manager", label: "AI Manager" },
  { key: "approvals", label: "Approvals" },
  { key: "google-ads", label: "Google Ads" },
  { key: "meta", label: "Meta & Instagram" },
  { key: "content", label: "Content Studio" },
  { key: "leads", label: "Leads" },
  { key: "website", label: "Website & Analytics" },
  { key: "calculator", label: "Calculator" },
  { key: "campaigns", label: "Campaigns" },
  { key: "competitors", label: "Competitors" },
  { key: "knowledge", label: "Knowledge Base" },
  { key: "automation", label: "Automation" },
  { key: "reports", label: "Reports" },
];

export const COMING_SOON: Partial<Record<MarketingTab, string>> = {
  campaigns:
    "AI-guided campaign builder — pick an objective, get a full strategy (audience, offer, budget, creative) across Google + Meta, generated as drafts.",
  competitors:
    "Competitor monitoring across search rankings, Instagram content, offers and pricing — with AI positioning suggestions.",
  knowledge:
    "Central knowledge base of business, product, customer and sales facts the AI draws on before writing anything.",
  automation:
    "Scheduled workflows — daily performance checks, weekly reviews, content pipeline, lead follow-up — each with status, last run, and an on/off switch.",
  reports: "Auto-generated daily, weekly and monthly reports with full performance breakdowns, exportable to PDF.",
};

export type ToolTile = {
  key: string;
  icon: string;
  name: string;
  desc: string;
  status: string;
  dotColor: "green" | "gold";
};

export const TOOL_TILES: ToolTile[] = [
  { key: "site", icon: "🌐", name: "Live Site", desc: "pickthebrick.com", status: "Online", dotColor: "green" },
  { key: "vercel", icon: "▲", name: "Vercel", desc: "Hosting & deployments", status: "Deployed", dotColor: "green" },
  { key: "neon", icon: "🗄️", name: "Neon", desc: "Postgres database", status: "Healthy", dotColor: "green" },
  { key: "github", icon: "📦", name: "GitHub", desc: "Repository", status: "Synced", dotColor: "green" },
  { key: "cloudflare", icon: "☁️", name: "Cloudflare", desc: "DNS · CDN · protection", status: "Active", dotColor: "green" },
  { key: "claude", icon: "🧠", name: "Claude Suite", desc: "Project · Code · Design", status: "Ready", dotColor: "green" },
  { key: "powershell", icon: "⌨️", name: "PowerShell", desc: "Local terminal", status: "Setup", dotColor: "gold" },
  { key: "domains", icon: "🚨", name: "Domains", desc: ".com live · .ae needs cleanup", status: "Action", dotColor: "gold" },
];

export type ToolModalRow = { k: string; v: string; tone: "green" | "gold" | "coral" | "ink" };
export type ToolModal =
  | { key: string; title: string; custom: true }
  | { key: string; title: string; custom?: false; rows: ToolModalRow[]; link: string; linkLabel: string; sample: boolean };

export const TOOL_MODALS: Record<string, ToolModal> = {
  site: {
    key: "site",
    title: "🌐 Live Site",
    rows: [
      { k: "Status", v: "Online", tone: "green" },
      { k: "Uptime (30d)", v: "99.97%", tone: "green" },
      { k: "Response time", v: "412 ms", tone: "green" },
      { k: "SSL", v: "Valid · auto-renew", tone: "green" },
    ],
    link: "https://www.pickthebrick.com",
    linkLabel: "Open site",
    sample: true,
  },
  vercel: {
    key: "vercel",
    title: "▲ Vercel",
    rows: [
      { k: "Last deployment", v: "Ready", tone: "green" },
      { k: "Deployed", v: "2 hrs ago", tone: "gold" },
      { k: "Commit", v: "feat: homepage v2 hero", tone: "coral" },
      { k: "Branch", v: "main", tone: "ink" },
      { k: "Build time", v: "1m 42s", tone: "ink" },
    ],
    link: "https://vercel.com/dashboard",
    linkLabel: "Open Vercel",
    sample: true,
  },
  neon: {
    key: "neon",
    title: "🗄️ Neon Postgres",
    rows: [
      { k: "Status", v: "Healthy", tone: "green" },
      { k: "Storage used", v: "0.4 / 10 GB", tone: "green" },
      { k: "Active connections", v: "3", tone: "ink" },
      { k: "Last backup", v: "Today 04:00", tone: "green" },
    ],
    link: "https://console.neon.tech",
    linkLabel: "Open Neon console",
    sample: true,
  },
  github: {
    key: "github",
    title: "📦 GitHub",
    rows: [
      { k: "Last commit", v: "2 hrs ago", tone: "gold" },
      { k: "Message", v: "feat: homepage v2 hero", tone: "coral" },
      { k: "Open PRs", v: "1", tone: "ink" },
      { k: "Branch", v: "main", tone: "ink" },
    ],
    link: "#PASTE-YOUR-REPO-URL",
    linkLabel: "Open repo (paste URL)",
    sample: true,
  },
  cloudflare: {
    key: "cloudflare",
    title: "☁️ Cloudflare",
    rows: [
      { k: "DNS", v: "Active", tone: "green" },
      { k: "Proxy / CDN", v: "Enabled", tone: "green" },
      { k: "Requests (24h)", v: "1,284", tone: "ink" },
      { k: "Threats blocked (24h)", v: "17", tone: "gold" },
    ],
    link: "https://dash.cloudflare.com",
    linkLabel: "Open Cloudflare",
    sample: true,
  },
  claude: {
    key: "claude",
    title: "🧠 Claude Suite",
    rows: [
      { k: "Project", v: "PickTheBrick — active", tone: "green" },
      { k: "Claude Code", v: "Build lane", tone: "green" },
      { k: "Claude Design", v: "Visual lane", tone: "green" },
    ],
    link: "https://claude.ai",
    linkLabel: "Open Claude",
    sample: false,
  },
  domains: {
    key: "domains",
    title: "🚨 Domain Governance",
    rows: [
      { k: "pickthebrick.com", v: "Live · primary", tone: "green" },
      { k: "pickthebrick.ae", v: "Conflicting brand", tone: "coral" },
      { k: "Action", v: "Redirect .ae → .com or take down", tone: "gold" },
    ],
    link: "https://dash.cloudflare.com",
    linkLabel: "Manage DNS",
    sample: false,
  },
  powershell: { key: "powershell", title: "⌨️ PowerShell", custom: true },
};

export const SEED_CHECKLIST: { id: string; text: string; done: boolean }[] = [
  { id: "c1", text: "Build tool live with all 10 trades", done: true },
  { id: "c2", text: "Homepage redesign shipped", done: true },
  { id: "c3", text: "Kill/redirect pickthebrick.ae", done: false },
  { id: "c4", text: "Anonymous sessions + WhatsApp capture", done: false },
  { id: "c5", text: "Calibrated catalog pricing", done: false },
  { id: "c6", text: "License 40 Style Finder images", done: false },
  { id: "c7", text: "Real case-study data", done: false },
  { id: "c8", text: "Supply+Install banner on Build", done: false },
];

export type Workstream = { name: string; note: string; status: "Live" | "In progress" | "Deciding" | "Next" | "Urgent" };

export const WORKSTREAMS: Workstream[] = [
  { name: "Build tool (10 trades)", note: "Full catalog, cart, PDF quote — production", status: "Live" },
  { name: "Homepage v2", note: "Hero, estimator, race, ledger shipped", status: "Live" },
  { name: "Anonymous sessions", note: "No login gates · WhatsApp capture at completion", status: "In progress" },
  { name: "Homepage alternate", note: '"Live marketplace" direction — deciding', status: "Deciding" },
  { name: "Style Finder", note: "Needs 40 licensed images + backend wiring", status: "Next" },
  { name: "Domain governance", note: "pickthebrick.ae — redirect or kill", status: "Urgent" },
];

export type Mockup = { icon: string; name: string; stage: "Shipped" | "Ready" | "Concept" };

export const MOCKUPS: Mockup[] = [
  { icon: "🏗️", name: "Build tool prototype — 10 categories, cart, PDF", stage: "Shipped" },
  { icon: "🏠", name: "Homepage v3 — estimator, race, case studies", stage: "Shipped" },
  { icon: "🖥️", name: "Hero in monitor + CTA parity", stage: "Ready" },
  { icon: "📡", name: "Homepage alternate — live marketplace", stage: "Ready" },
  { icon: "💰", name: "Instant estimate — recalibrated pricing", stage: "Ready" },
  { icon: "🎴", name: "Style Finder — swipe page + funnel", stage: "Ready" },
  { icon: "🚧", name: "Parallax construction scene", stage: "Shipped" },
  { icon: "📊", name: "Client dashboard concept", stage: "Concept" },
];

export const PINNED: { label: string; value: string; accent: boolean }[] = [
  { label: "Pricing anchor", value: "1,000 sqft ≈ AED 250K", accent: true },
  { label: "Estimator formula", value: "(sqft×210 + ppl×2500) ×0.92–1.15", accent: false },
  { label: "Payment chain", value: "submitted → captain → admin → paid", accent: false },
  { label: "Core promise", value: "Supply + Install. Always.", accent: true },
  { label: "Contact capture", value: "WhatsApp @ Complete Quote", accent: false },
];

export type Kpi = { label: string; value: string; delta: string; deltaGood: boolean; deltaArrow: "▲" | "▼" };

export const MARKETING_KPIS: Kpi[] = [
  { label: "Marketing Spend", value: "AED 184,200", delta: "6.2%", deltaGood: false, deltaArrow: "▲" },
  { label: "Leads", value: "312", delta: "9.1%", deltaGood: true, deltaArrow: "▲" },
  { label: "Qualified Leads", value: "96", delta: "4.8%", deltaGood: true, deltaArrow: "▲" },
  { label: "Cost / Lead", value: "AED 590", delta: "3.0%", deltaGood: true, deltaArrow: "▼" },
  { label: "Cost / Qualified", value: "AED 1,919", delta: "2.1%", deltaGood: false, deltaArrow: "▲" },
  { label: "Quotations", value: "34", delta: "12.4%", deltaGood: true, deltaArrow: "▲" },
  { label: "Won Revenue", value: "AED 1,240,000", delta: "18.6%", deltaGood: true, deltaArrow: "▲" },
  { label: "Marketing ROI", value: "6.7×", delta: "0.4×", deltaGood: true, deltaArrow: "▲" },
];

export const QUEUE_ITEMS: {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  channel: string;
  metric: string;
}[] = [
  { id: "q1", priority: "HIGH", title: "Pause expensive keyword", channel: "Google Ads", metric: "AED 380 spent / 0 qualified leads" },
  { id: "q2", priority: "HIGH", title: "Fix Meta conversion tracking", channel: "Meta Ads", metric: "Pixel firing intermittently since Tue" },
  { id: "q3", priority: "MEDIUM", title: "Approve 4 Instagram post drafts", channel: "Instagram", metric: "Queued since yesterday" },
  { id: "q4", priority: "MEDIUM", title: "Increase campaign budget", channel: "Google Ads", metric: "CPA 34% below account average" },
  { id: "q5", priority: "LOW", title: "Create landing page for \"office fit out cost Dubai\"", channel: "Website", metric: "Search demand rising +22% MoM" },
];

export const ACTIVITY_LOG: {
  time: string;
  saw: string;
  decided: string;
  why: string;
  status: "Awaiting approval" | "Approved" | "Open";
}[] = [
  {
    time: "11 Aug 2026 — 09:31",
    saw: 'Google keyword "cheap office fitout Dubai" spending AED 420 with 0 qualified leads.',
    decided: "Recommend pausing keyword.",
    why: "CPA 3.2× account average.",
    status: "Awaiting approval",
  },
  {
    time: "10 Aug 2026 — 07:02",
    saw: "Instagram Reel outperforming account average by 3.8×.",
    decided: "Recommend 5 content variations.",
    why: "Pattern match on hook + price reveal format.",
    status: "Awaiting approval",
  },
  {
    time: "09 Aug 2026 — 18:44",
    saw: 'Search campaign "Office Fit Out Dubai" CPA 34% below average.',
    decided: "Recommend +15% budget.",
    why: "Consistent 6-day trend, stable qualification rate.",
    status: "Approved",
  },
  {
    time: "08 Aug 2026 — 06:15",
    saw: "Meta CPM up 31% week-over-week.",
    decided: "Flagged for review — no auto action.",
    why: "Above autonomy threshold for auto-adjustment.",
    status: "Open",
  },
];

export const AUTONOMY_LEVELS = ["Manual", "Assisted", "Semi-Autonomous", "Autonomous"] as const;
export const AUTONOMY_DESCRIPTIONS = [
  "AI only suggests — you approve every action manually.",
  "AI drafts ads, posts, campaigns and reports — nothing publishes without your approval.",
  "AI executes predefined low-risk actions automatically; anything above threshold still needs approval.",
  "AI executes freely within its permissioned tools, reporting after the fact.",
];

export const TOOL_PERMISSIONS: { name: string; options: string[] }[] = [
  { name: "Google Ads", options: ["Read", "Draft", "Modify", "Execute"] },
  { name: "Instagram", options: ["Read", "Draft", "Schedule", "Publish"] },
  { name: "Meta Ads", options: ["Read", "Draft", "Modify", "Execute"] },
];

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  "Google Ads": ["Read", "Draft"],
  Instagram: ["Read", "Draft", "Schedule"],
  "Meta Ads": ["Read", "Draft"],
};

export const GOOGLE_KPIS: Kpi[] = [
  { label: "Spend", value: "AED 96,400", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "Leads", value: "214", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "CPL", value: "AED 450", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "Qualified", value: "71", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "CVR", value: "5.8%", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "ROAS", value: "8.4×", delta: "", deltaGood: true, deltaArrow: "▲" },
];

export type GoogleCampaign = {
  name: string;
  spend: string;
  leads: string;
  qualified: string;
  cpl: string;
  revenue: string;
  roas: string;
  status: "SCALE" | "MONITOR" | "FIX" | "LEARNING";
};

export const GOOGLE_CAMPAIGNS: GoogleCampaign[] = [
  { name: "Office Fit Out Dubai", spend: "AED 18,200", leads: "62", qualified: "28", cpl: "AED 294", revenue: "AED 412,000", roas: "22.6×", status: "SCALE" },
  { name: "Dubai SME Office Package", spend: "AED 14,900", leads: "48", qualified: "19", cpl: "AED 310", revenue: "AED 198,000", roas: "13.3×", status: "SCALE" },
  { name: "Office Furniture Dubai", spend: "AED 8,700", leads: "11", qualified: "2", cpl: "AED 791", revenue: "AED 0", roas: "0.0×", status: "FIX" },
  { name: "Commercial Fitout Cost", spend: "AED 12,300", leads: "39", qualified: "14", cpl: "AED 315", revenue: "AED 156,000", roas: "12.7×", status: "MONITOR" },
  { name: "Retail Store Fitout — New", spend: "AED 3,100", leads: "6", qualified: "1", cpl: "AED 517", revenue: "AED 0", roas: "0.0×", status: "LEARNING" },
];

export const GOOGLE_INSIGHTS: string[] = [
  '"Office fit out Dubai" is your most efficient campaign — 22.6× ROAS, room to scale budget further.',
  '"Office furniture Dubai" is wasting spend: broad match is pulling residential furniture shoppers.',
  'Search terms with "cost" or "price" convert 2.1× better than generic "fit out" terms — worth dedicated ad copy.',
  "Dubai Marina and Business Bay show the highest qualified-lead rate by location — consider a location bid modifier.",
];

export const META_KPIS: Kpi[] = [
  { label: "Spend", value: "AED 41,600", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "Reach", value: "482K", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "CPM", value: "AED 28.40", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "CTR", value: "1.8%", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "Leads", value: "98", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "CPL", value: "AED 425", delta: "", deltaGood: true, deltaArrow: "▲" },
];

export type MetaContentType = "Reel" | "Carousel" | "Story" | "Static" | "Ad";
export type MetaContent = {
  name: string;
  type: MetaContentType;
  reach: string;
  engagement: string;
  clicks: string;
  leads: string;
  revenue: string;
};

export const META_CONTENT: MetaContent[] = [
  { name: "What AED 100K gets you", type: "Reel", reach: "184,200", engagement: "12.4%", clicks: "2,940", leads: "41", revenue: "AED 88,000" },
  { name: "Before/after: Business Bay office", type: "Carousel", reach: "61,300", engagement: "6.1%", clicks: "840", leads: "12", revenue: "AED 24,000" },
  { name: "Meet the install team", type: "Story", reach: "22,100", engagement: "3.4%", clicks: "190", leads: "2", revenue: "AED 0" },
  { name: "AED 100K reel — variation 2", type: "Reel", reach: "96,800", engagement: "9.8%", clicks: "1,410", leads: "19", revenue: "AED 41,000" },
  { name: "Fit-out cost breakdown", type: "Static", reach: "18,400", engagement: "2.9%", clicks: "210", leads: "4", revenue: "AED 6,000" },
];

export const META_FILTERS = ["All", "Reels", "Carousel", "Static", "Stories", "Ads"] as const;
export const META_FILTER_TYPE_MAP: Record<string, MetaContentType> = {
  Reels: "Reel",
  Carousel: "Carousel",
  Static: "Static",
  Stories: "Story",
  Ads: "Ad",
};

export const META_INSIGHTS: string[] = [
  "Reels outperform every other format 4.6× on engagement and 3.1× on leads-per-reach.",
  '"Before/after" transformation content consistently drives the highest saves and shares.',
  "Static posts underperform across the board — consider phasing them out for Reels + Carousels.",
  "Recommended next: a Reel following the AED 100K format for a Business Bay case study.",
];

export const CONTENT_IDEAS: { source: string; idea: string }[] = [
  { source: "Search data", idea: '"What can AED 50,000 get you in a Dubai office?"' },
  { source: "Competitor activity", idea: "Fixed-price package explainer — differentiate on transparent pricing" },
  { source: "Winning post pattern", idea: "AED 100K format, applied to a warehouse fit-out case study" },
];

export const GEN_PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "TikTok", "Google Ads"] as const;
export const GEN_FORMATS = ["Reel", "Carousel", "Static", "Story", "Ad"] as const;

export type CalendarStatus = "Draft" | "Review" | "Approved" | "Scheduled" | "Published";
export const CALENDAR_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const CALENDAR_PLAN: CalendarStatus[][] = [
  ["Draft"],
  ["Review", "Draft"],
  [],
  ["Scheduled"],
  ["Approved"],
  [],
  ["Published"],
];

export const PIPELINE_STAGES: { name: string; count: string }[] = [
  { name: "New", count: "142" },
  { name: "Contacted", count: "88" },
  { name: "Qualified", count: "34" },
  { name: "Quotation", count: "19" },
  { name: "Negotiation", count: "9" },
  { name: "Won", count: "5" },
];

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Quotation" | "Negotiation" | "Won" | "Lost";
export type Lead = { name: string; source: string; campaign: string; budget: string; status: LeadStatus };

export const LEADS: Lead[] = [
  { name: "ABC Trading", source: "Google Ads", campaign: "Office Fit Out Dubai", budget: "AED 280,000", status: "Quotation" },
  { name: "Meridian Legal", source: "Instagram", campaign: "AED 100K Reel", budget: "AED 95,000", status: "Qualified" },
  { name: "Northwind Logistics", source: "Google Ads", campaign: "Dubai SME Package", budget: "AED 410,000", status: "Won" },
  { name: "Falcon Capital", source: "Website (organic)", campaign: "—", budget: "AED 620,000", status: "Negotiation" },
  { name: "Bright Dental Group", source: "Instagram", campaign: "Before/After Carousel", budget: "AED 68,000", status: "Contacted" },
  { name: "Vantage Coworking", source: "Google Ads", campaign: "Commercial Fitout Cost", budget: "AED 340,000", status: "Lost" },
];

export const CHANNEL_REVENUE: string[] = [
  "Google: 100 leads → 25 qualified → 8 quotations → 3 wins → AED 420,000 revenue.",
  "Instagram: 80 leads → 8 qualified → 2 quotations → 1 win → AED 75,000 revenue.",
  "Google is producing fewer leads than Instagram but 5.6× more revenue per lead.",
];

export const WEBSITE_KPIS: Kpi[] = [
  { label: "Visitors (30d)", value: "28,400", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "Sessions", value: "34,900", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "Avg. conv. rate", value: "3.9%", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "Bounce rate", value: "52%", delta: "", deltaGood: true, deltaArrow: "▲" },
  { label: "New keywords ranking", value: "34", delta: "", deltaGood: true, deltaArrow: "▲" },
];

export const TOP_PAGES: { page: string; sessions: string; cvr: string; bounce: string }[] = [
  { page: "/office-fit-out-dubai", sessions: "6,240", cvr: "7.4%", bounce: "38%" },
  { page: "/instant-estimate", sessions: "4,180", cvr: "11.2%", bounce: "29%" },
  { page: "/build-tool", sessions: "3,920", cvr: "6.8%", bounce: "41%" },
  { page: "/pricing", sessions: "2,610", cvr: "2.1%", bounce: "61%" },
  { page: "/blog/office-cost-guide", sessions: "2,040", cvr: "1.4%", bounce: "68%" },
];

export const CONVERSION_INSIGHTS: string[] = [
  "/pricing has high traffic but low conversion — visitors want a number, not a range. Calculator would fix this.",
  "/instant-estimate converts 2.9× better than site average — expand its placement across top landing pages.",
  "Mobile bounce rate is 19pts higher than desktop — form is likely too long on small screens.",
  "Blog traffic rarely converts directly — best used as a top-of-funnel retargeting audience.",
];

export const CALC_QUALITY_MULTIPLIER: Record<string, number> = { Standard: 0.92, Premium: 1.0, Luxury: 1.15 };
export const CALC_PER_SQFT = 210;
export const CALC_PER_EMPLOYEE = 2500;
export const CALC_BREAKDOWN_PCT: [string, number][] = [
  ["Design", 8],
  ["Partitions", 18],
  ["Ceiling", 10],
  ["Flooring", 9],
  ["Electrical", 12],
  ["Lighting", 7],
  ["Furniture", 20],
  ["Joinery", 9],
  ["Pantry", 4],
  ["Other", 3],
];
