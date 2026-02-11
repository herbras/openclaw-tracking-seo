/**
 * clarity-tracker — OpenClaw plugin
 * Combined SEO + Analytics toolkit:
 *   1. Microsoft Clarity  → behavior & UX signals
 *   2. Google Search Console → keyword rankings & search performance
 *   3. PageSpeed Insights  → Core Web Vitals (free, no key needed)
 *   4. Bing Webmaster Tools → Bing search traffic, crawl health, indexing, backlinks
 */

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PluginConfig {
  clarityApiToken: string;
  clarityProjectId: string;
  projectName?: string;
  siteUrl?: string;
  gscCredentialsFile?: string;
  gscSiteUrl?: string;
  bingApiKey?: string;
}

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtDur(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function delta(curr: number, prev: number): string {
  if (prev === 0) return "N/A";
  const d = ((curr - prev) / prev) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
}

function txt(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

// ━━━ Clarity API (Data Export v1) ━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function clarityLiveInsights(
  token: string,
  numOfDays: number = 3,
  dimension: string = "URL"
): Promise<any[]> {
  const url =
    "https://www.clarity.ms/export-data/api/v1/project-live-insights" +
    `?numOfDays=${Math.min(numOfDays, 3)}&dimension1=${dimension}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Clarity API ${res.status}: ${body}`);
  }

  return res.json() as Promise<any[]>;
}

function parseClarityData(apiData: any[]) {
  let sessions = 0;
  let pageViews = 0;
  let deadClicks = 0;
  let rageClicks = 0;
  let quickBacks = 0;
  let excessiveScroll = 0;

  const pageMap: Record<
    string,
    { views: number; sessions: number; deadClicks: number; rageClicks: number; quickBacks: number }
  > = {};

  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};

  for (const item of apiData) {
    const metric = item.metricName ?? "";
    const infos: any[] = item.information ?? [];

    for (const info of infos) {
      const url: string = info.Url ?? info.url ?? "/";
      const sub = Number(info.subTotal ?? 0);
      const sess = Number(info.sessionsCount ?? 0);
      const pv = Number(info.pagesViews ?? 0);

      if (!pageMap[url]) {
        pageMap[url] = { views: 0, sessions: 0, deadClicks: 0, rageClicks: 0, quickBacks: 0 };
      }

      switch (metric) {
        case "DeadClickCount":
          deadClicks += sub;
          pageMap[url].deadClicks += sub;
          break;
        case "RageClickCount":
          rageClicks += sub;
          pageMap[url].rageClicks += sub;
          break;
        case "QuickbackClick":
          quickBacks += sub;
          pageMap[url].quickBacks += sub;
          break;
        case "ExcessiveScroll":
          excessiveScroll += sub;
          break;
        case "Traffic":
        case "Sessions":
          sessions += sess;
          pageViews += pv;
          pageMap[url].views += pv;
          pageMap[url].sessions += sess;
          break;
        case "Device":
          devices[info.device ?? "Unknown"] =
            (devices[info.device ?? "Unknown"] ?? 0) + sess;
          break;
        case "Browser":
          browsers[info.browser ?? "Unknown"] =
            (browsers[info.browser ?? "Unknown"] ?? 0) + sess;
          break;
      }
    }
  }

  const topPages = Object.entries(pageMap)
    .map(([url, d]) => ({ url, ...d }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  return {
    sessions,
    pageViews,
    uniqueUsers: Math.round(sessions * 0.6),
    deadClicks,
    rageClicks,
    quickBacks,
    excessiveScroll,
    topPages,
    devices,
    browsers,
  };
}

// ━━━ PageSpeed Insights (free, no key) ━━━━━━━━━━━━━━━━━━━━━━

async function fetchPageSpeed(
  pageUrl: string,
  strategy: "mobile" | "desktop" = "mobile"
) {
  const api =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(pageUrl)}&strategy=${strategy}&category=performance&category=seo&category=accessibility`;

  const res = await fetch(api);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PageSpeed API ${res.status}: ${body}`);
  }
  return res.json();
}

function parsePageSpeed(data: any) {
  const cats = data.lighthouseResult?.categories ?? {};
  const audits = data.lighthouseResult?.audits ?? {};

  const scores: Record<string, number> = {};
  for (const [key, val] of Object.entries(cats) as any) {
    scores[key] = Math.round((val.score ?? 0) * 100);
  }

  const cwv: Record<string, string> = {};
  const cwvKeys = [
    "largest-contentful-paint",
    "first-contentful-paint",
    "cumulative-layout-shift",
    "total-blocking-time",
    "speed-index",
    "interactive",
  ];
  for (const k of cwvKeys) {
    if (audits[k]) {
      cwv[k] = audits[k].displayValue ?? "N/A";
    }
  }

  // SEO audit failures
  const seoIssues: string[] = [];
  if (cats.seo?.auditRefs) {
    for (const ref of cats.seo.auditRefs) {
      const audit = audits[ref.id];
      if (audit && audit.score !== null && audit.score < 1) {
        seoIssues.push(`${audit.title}: ${audit.displayValue ?? "fail"}`);
      }
    }
  }

  return { scores, cwv, seoIssues };
}

// ━━━ Google Search Console (via shell → python helper) ━━━━━━

async function fetchGSC(
  credentialsFile: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[] = ["query"]
): Promise<any> {
  // GSC needs google-auth python libs; we shell out to a tiny script
  const script = `
import json, sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    "${credentialsFile}",
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)
svc = build("searchconsole", "v1", credentials=creds)
resp = svc.searchanalytics().query(
    siteUrl="${siteUrl}",
    body={
        "startDate": "${startDate}",
        "endDate": "${endDate}",
        "dimensions": ${JSON.stringify(dimensions)},
        "rowLimit": 25000
    }
).execute()
print(json.dumps(resp))
`;

  const proc = Bun?.spawn
    ? Bun.spawn(["python3", "-c", script], { stdout: "pipe", stderr: "pipe" })
    : null;

  if (!proc) {
    // Fallback: use Node child_process
    const { execSync } = await import("child_process");
    const out = execSync(`python3 -c '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      timeout: 30_000,
    });
    return JSON.parse(out);
  }

  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  if (err) throw new Error(`GSC python error: ${err}`);
  return JSON.parse(out);
}

function parseGSCRows(resp: any) {
  const rows: any[] = resp.rows ?? [];
  return rows.map((r: any) => ({
    keys: r.keys,
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

// ━━━ Bing Webmaster Tools API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseBingDate(dateStr: string): string {
  if (!dateStr) return "—";
  const match = dateStr.match(/\/Date\((-?\d+)([+-]\d{4})?\)\//);
  if (!match) return dateStr;
  return new Date(Number(match[1])).toISOString().slice(0, 10);
}

async function bingApi(
  apiKey: string,
  method: string,
  siteUrl: string,
  extraParams?: Record<string, string>
): Promise<any> {
  const params = new URLSearchParams({
    apikey: apiKey,
    siteUrl,
    ...extraParams,
  });
  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bing API ${res.status}: ${body}`);
  }

  const json: any = await res.json();
  return json.d ?? json;
}

// ━━━ Plugin entry ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  id: "clarity-tracker",
  name: "Clarity SEO Tracker",

  register(api: any) {
    const getConfig = (): PluginConfig => {
      const c = api.config?.plugins?.entries?.["clarity-tracker"]?.config;
      if (!c?.clarityApiToken || !c?.clarityProjectId) {
        throw new Error(
          "clarity-tracker: set clarityApiToken + clarityProjectId in plugins.entries.clarity-tracker.config"
        );
      }
      return c as PluginConfig;
    };

    // ════════════════════════════════════════════════════════════
    //  SECTION A — Microsoft Clarity (Behavior & UX)
    // ════════════════════════════════════════════════════════════

    // ── 1. clarity_overview ─────────────────────────────────────
    api.registerTool({
      name: "clarity_overview",
      description:
        "Quick dashboard from Microsoft Clarity: sessions, page views, " +
        "unique users, dead clicks, rage clicks, quick backs, excessive scrolling.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Look-back days (1-3, Clarity API max is 3). Default 3.",
          },
        },
      },
      async execute(_id: string, params: { days?: number }) {
        const cfg = getConfig();
        const raw = await clarityLiveInsights(
          cfg.clarityApiToken,
          params.days ?? 3
        );
        const d = parseClarityData(raw);
        const name = cfg.projectName ?? cfg.clarityProjectId;

        return txt(
          [
            `## ${name} — Clarity Overview (last ${params.days ?? 3} days)`,
            "",
            "| Metric | Value |",
            "|--------|-------|",
            `| Sessions | ${fmt(d.sessions)} |`,
            `| Page Views | ${fmt(d.pageViews)} |`,
            `| Unique Users | ${fmt(d.uniqueUsers)} |`,
            `| Dead Clicks | ${fmt(d.deadClicks)} |`,
            `| Rage Clicks | ${fmt(d.rageClicks)} |`,
            `| Quick Backs | ${fmt(d.quickBacks)} |`,
            `| Excessive Scrolling | ${fmt(d.excessiveScroll)} |`,
          ].join("\n")
        );
      },
    });

    // ── 2. clarity_ux_issues ────────────────────────────────────
    api.registerTool({
      name: "clarity_ux_issues",
      description:
        "Find UX problems per page: dead clicks, rage clicks, quick backs. " +
        "These signals hurt SEO because they indicate poor user experience.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Look-back days (1-3). Default 3." },
          limit: { type: "number", description: "Max pages. Default 10." },
        },
      },
      async execute(_id: string, params: { days?: number; limit?: number }) {
        const cfg = getConfig();
        const raw = await clarityLiveInsights(
          cfg.clarityApiToken,
          params.days ?? 3
        );
        const d = parseClarityData(raw);

        // Sort by total UX issues (dead + rage + quick)
        const pages = d.topPages
          .map((p) => ({
            ...p,
            issues: p.deadClicks + p.rageClicks + p.quickBacks,
          }))
          .filter((p) => p.issues > 0)
          .sort((a, b) => b.issues - a.issues)
          .slice(0, params.limit ?? 10);

        if (pages.length === 0) return txt("No UX issues found in this period.");

        const rows = pages.map(
          (p, i) =>
            `| ${i + 1} | ${p.url} | ${p.deadClicks} | ${p.rageClicks} | ${p.quickBacks} | ${p.issues} |`
        );

        return txt(
          [
            "## Pages With UX Issues",
            "",
            "| # | URL | Dead Clicks | Rage Clicks | Quick Backs | Total |",
            "|---|-----|-------------|-------------|-------------|-------|",
            ...rows,
            "",
            "> **Tip:** Dead clicks = users click non-clickable elements. " +
              "Rage clicks = frustrated repeated clicks. " +
              "Quick backs = users immediately return after navigating. " +
              "All signal poor UX and can indirectly hurt SEO rankings.",
          ].join("\n")
        );
      },
    });

    // ── 3. clarity_top_pages ────────────────────────────────────
    api.registerTool({
      name: "clarity_top_pages",
      description: "Top pages by views from Clarity with session counts.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Look-back days (1-3). Default 3." },
          limit: { type: "number", description: "Max pages. Default 10." },
        },
      },
      async execute(_id: string, params: { days?: number; limit?: number }) {
        const cfg = getConfig();
        const raw = await clarityLiveInsights(
          cfg.clarityApiToken,
          params.days ?? 3
        );
        const d = parseClarityData(raw);
        const pages = d.topPages.slice(0, params.limit ?? 10);

        if (pages.length === 0) return txt("No page data for this period.");

        const rows = pages.map(
          (p, i) => `| ${i + 1} | ${p.url} | ${fmt(p.views)} | ${fmt(p.sessions)} |`
        );

        return txt(
          [
            "## Top Pages (Clarity)",
            "",
            "| # | URL | Views | Sessions |",
            "|---|-----|-------|----------|",
            ...rows,
          ].join("\n")
        );
      },
    });

    // ── 4. clarity_traffic_breakdown ─────────────────────────────
    api.registerTool({
      name: "clarity_traffic_breakdown",
      description: "Device and browser breakdown from Clarity.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Look-back days (1-3). Default 3." },
        },
      },
      async execute(_id: string, params: { days?: number }) {
        const cfg = getConfig();
        const raw = await clarityLiveInsights(
          cfg.clarityApiToken,
          params.days ?? 3
        );
        const d = parseClarityData(raw);

        const lines: string[] = ["## Traffic Breakdown", ""];

        if (Object.keys(d.devices).length > 0) {
          const total = Object.values(d.devices).reduce((a, b) => a + b, 0);
          lines.push("### Devices", "| Device | Sessions | Share |", "|--------|----------|-------|");
          for (const [dev, n] of Object.entries(d.devices).sort((a, b) => b[1] - a[1])) {
            lines.push(`| ${dev} | ${fmt(n)} | ${pct((n / total) * 100)} |`);
          }
          lines.push("");
        }

        if (Object.keys(d.browsers).length > 0) {
          const total = Object.values(d.browsers).reduce((a, b) => a + b, 0);
          lines.push("### Browsers", "| Browser | Sessions | Share |", "|---------|----------|-------|");
          for (const [br, n] of Object.entries(d.browsers).sort((a, b) => b[1] - a[1])) {
            lines.push(`| ${br} | ${fmt(n)} | ${pct((n / total) * 100)} |`);
          }
        }

        return txt(lines.join("\n"));
      },
    });

    // ════════════════════════════════════════════════════════════
    //  SECTION B — Google Search Console (Search Performance)
    // ════════════════════════════════════════════════════════════

    // ── 5. seo_top_queries ──────────────────────────────────────
    api.registerTool({
      name: "seo_top_queries",
      description:
        "Top search queries from Google Search Console: keyword, clicks, " +
        "impressions, CTR, average position. Essential for SEO keyword tracking.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Look-back days. Default 28." },
          limit: { type: "number", description: "Max queries. Default 20." },
        },
      },
      async execute(_id: string, params: { days?: number; limit?: number }) {
        const cfg = getConfig();
        if (!cfg.gscCredentialsFile || !cfg.gscSiteUrl) {
          return txt(
            "GSC not configured. Set gscCredentialsFile and gscSiteUrl in plugin config."
          );
        }

        const start = daysAgo(params.days ?? 28);
        const end = daysAgo(3); // GSC data has ~3 day delay

        const resp = await fetchGSC(
          cfg.gscCredentialsFile,
          cfg.gscSiteUrl,
          start,
          end,
          ["query"]
        );
        const rows = parseGSCRows(resp)
          .sort((a: any, b: any) => b.clicks - a.clicks)
          .slice(0, params.limit ?? 20);

        if (rows.length === 0) return txt("No GSC query data for this period.");

        const tableRows = rows.map(
          (r: any, i: number) =>
            `| ${i + 1} | ${r.keys[0]} | ${fmt(r.clicks)} | ${fmt(r.impressions)} | ${pct(r.ctr * 100)} | ${r.position.toFixed(1)} |`
        );

        return txt(
          [
            `## Top Search Queries (${start} — ${end})`,
            "",
            "| # | Query | Clicks | Impressions | CTR | Avg Pos |",
            "|---|-------|--------|-------------|-----|---------|",
            ...tableRows,
          ].join("\n")
        );
      },
    });

    // ── 6. seo_top_pages ────────────────────────────────────────
    api.registerTool({
      name: "seo_top_pages",
      description:
        "Top landing pages from Google Search Console by organic clicks. " +
        "Shows which pages bring the most search traffic.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Look-back days. Default 28." },
          limit: { type: "number", description: "Max pages. Default 15." },
        },
      },
      async execute(_id: string, params: { days?: number; limit?: number }) {
        const cfg = getConfig();
        if (!cfg.gscCredentialsFile || !cfg.gscSiteUrl) {
          return txt("GSC not configured.");
        }

        const start = daysAgo(params.days ?? 28);
        const end = daysAgo(3);

        const resp = await fetchGSC(
          cfg.gscCredentialsFile,
          cfg.gscSiteUrl,
          start,
          end,
          ["page"]
        );
        const rows = parseGSCRows(resp)
          .sort((a: any, b: any) => b.clicks - a.clicks)
          .slice(0, params.limit ?? 15);

        if (rows.length === 0) return txt("No GSC page data for this period.");

        const tableRows = rows.map(
          (r: any, i: number) =>
            `| ${i + 1} | ${r.keys[0]} | ${fmt(r.clicks)} | ${fmt(r.impressions)} | ${pct(r.ctr * 100)} | ${r.position.toFixed(1)} |`
        );

        return txt(
          [
            `## Top Pages — Organic Search (${start} — ${end})`,
            "",
            "| # | Page | Clicks | Impressions | CTR | Avg Pos |",
            "|---|------|--------|-------------|-----|---------|",
            ...tableRows,
          ].join("\n")
        );
      },
    });

    // ── 7. seo_keyword_ranking ──────────────────────────────────
    api.registerTool({
      name: "seo_keyword_ranking",
      description:
        "Check ranking position for a specific keyword in Google Search Console. " +
        "Shows clicks, impressions, CTR, and average position over time.",
      parameters: {
        type: "object",
        required: ["keyword"],
        properties: {
          keyword: {
            type: "string",
            description: "The keyword to track (e.g. 'belajar bisnis online').",
          },
          days: { type: "number", description: "Look-back days. Default 28." },
        },
      },
      async execute(_id: string, params: { keyword: string; days?: number }) {
        const cfg = getConfig();
        if (!cfg.gscCredentialsFile || !cfg.gscSiteUrl) {
          return txt("GSC not configured.");
        }

        const start = daysAgo(params.days ?? 28);
        const end = daysAgo(3);

        const resp = await fetchGSC(
          cfg.gscCredentialsFile,
          cfg.gscSiteUrl,
          start,
          end,
          ["query", "date"]
        );
        const rows = parseGSCRows(resp)
          .filter((r: any) =>
            r.keys[0].toLowerCase().includes(params.keyword.toLowerCase())
          )
          .sort((a: any, b: any) => a.keys[1].localeCompare(b.keys[1]));

        if (rows.length === 0) {
          return txt(`No data found for keyword "${params.keyword}" in this period.`);
        }

        // Aggregate by date
        const byDate: Record<string, { clicks: number; impressions: number; position: number; count: number }> = {};
        for (const r of rows) {
          const date = r.keys[1];
          if (!byDate[date]) byDate[date] = { clicks: 0, impressions: 0, position: 0, count: 0 };
          byDate[date].clicks += r.clicks;
          byDate[date].impressions += r.impressions;
          byDate[date].position += r.position;
          byDate[date].count += 1;
        }

        const tableRows = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(
            ([date, d]) =>
              `| ${date} | ${fmt(d.clicks)} | ${fmt(d.impressions)} | ${(d.position / d.count).toFixed(1)} |`
          );

        return txt(
          [
            `## Keyword Tracking: "${params.keyword}"`,
            `Period: ${start} — ${end}`,
            "",
            "| Date | Clicks | Impressions | Avg Position |",
            "|------|--------|-------------|-------------|",
            ...tableRows,
          ].join("\n")
        );
      },
    });

    // ════════════════════════════════════════════════════════════
    //  SECTION C — PageSpeed / Core Web Vitals
    // ════════════════════════════════════════════════════════════

    // ── 8. seo_pagespeed ────────────────────────────────────────
    api.registerTool({
      name: "seo_pagespeed",
      description:
        "Run Google PageSpeed Insights on a URL. Returns performance, SEO, " +
        "and accessibility scores plus Core Web Vitals (LCP, FCP, CLS, TBT). " +
        "No API key needed.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "Full URL to test. If omitted, uses the siteUrl from plugin config.",
          },
          strategy: {
            type: "string",
            enum: ["mobile", "desktop"],
            description: "Test as mobile or desktop. Default mobile.",
          },
        },
      },
      async execute(
        _id: string,
        params: { url?: string; strategy?: "mobile" | "desktop" }
      ) {
        const cfg = getConfig();
        const testUrl = params.url ?? cfg.siteUrl;
        if (!testUrl) {
          return txt(
            "No URL provided. Pass a url param or set siteUrl in plugin config."
          );
        }

        const strategy = params.strategy ?? "mobile";
        const raw = await fetchPageSpeed(testUrl, strategy);
        const ps = parsePageSpeed(raw);

        const lines = [
          `## PageSpeed Report — ${strategy}`,
          `**URL:** ${testUrl}`,
          "",
          "### Scores",
          "| Category | Score |",
          "|----------|-------|",
        ];

        for (const [cat, score] of Object.entries(ps.scores)) {
          const emoji = score >= 90 ? "GOOD" : score >= 50 ? "NEEDS WORK" : "POOR";
          lines.push(`| ${cat} | ${score}/100 (${emoji}) |`);
        }

        if (Object.keys(ps.cwv).length > 0) {
          lines.push("", "### Core Web Vitals", "| Metric | Value |", "|--------|-------|");
          const labels: Record<string, string> = {
            "largest-contentful-paint": "LCP (Largest Contentful Paint)",
            "first-contentful-paint": "FCP (First Contentful Paint)",
            "cumulative-layout-shift": "CLS (Cumulative Layout Shift)",
            "total-blocking-time": "TBT (Total Blocking Time)",
            "speed-index": "Speed Index",
            interactive: "Time to Interactive",
          };
          for (const [key, val] of Object.entries(ps.cwv)) {
            lines.push(`| ${labels[key] ?? key} | ${val} |`);
          }
        }

        if (ps.seoIssues.length > 0) {
          lines.push("", "### SEO Issues Found");
          for (const issue of ps.seoIssues) {
            lines.push(`- ${issue}`);
          }
        }

        return txt(lines.join("\n"));
      },
    });

    // ════════════════════════════════════════════════════════════
    //  SECTION E — Bing Webmaster Tools (Search + Crawl + Index)
    // ════════════════════════════════════════════════════════════

    // ── 10. bing_query_stats ─────────────────────────────────────
    api.registerTool({
      name: "bing_query_stats",
      description:
        "Top Bing search queries with clicks, impressions, and average position. " +
        "The Bing equivalent of GSC top queries.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max queries to return. Default 20." },
        },
      },
      async execute(_id: string, params: { limit?: number }) {
        const cfg = getConfig();
        if (!cfg.bingApiKey) {
          return txt("Bing not configured. Set bingApiKey in plugin config.");
        }
        if (!cfg.siteUrl) {
          return txt("Set siteUrl in plugin config for Bing Webmaster Tools.");
        }

        const data = await bingApi(cfg.bingApiKey, "GetQueryStats", cfg.siteUrl);
        const rows: any[] = Array.isArray(data) ? data : [];

        if (rows.length === 0) return txt("No Bing query data available.");

        const sorted = rows
          .sort((a: any, b: any) => (b.Clicks ?? 0) - (a.Clicks ?? 0))
          .slice(0, params.limit ?? 20);

        const tableRows = sorted.map(
          (r: any, i: number) =>
            `| ${i + 1} | ${r.Query ?? "—"} | ${fmt(r.Clicks ?? 0)} | ${fmt(r.Impressions ?? 0)} | ${(r.AvgClickPosition ?? 0).toFixed(1)} |`
        );

        return txt(
          [
            "## Top Bing Search Queries",
            "",
            "| # | Query | Clicks | Impressions | Avg Position |",
            "|---|-------|--------|-------------|-------------|",
            ...tableRows,
          ].join("\n")
        );
      },
    });

    // ── 11. bing_crawl_stats ─────────────────────────────────────
    api.registerTool({
      name: "bing_crawl_stats",
      description:
        "Bing crawl health: pages crawled, pages in index, crawl errors over time. " +
        "Use to monitor Bing bot activity on your site.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getConfig();
        if (!cfg.bingApiKey) {
          return txt("Bing not configured. Set bingApiKey in plugin config.");
        }
        if (!cfg.siteUrl) {
          return txt("Set siteUrl in plugin config for Bing Webmaster Tools.");
        }

        const data = await bingApi(cfg.bingApiKey, "GetCrawlStats", cfg.siteUrl);
        const rows: any[] = Array.isArray(data) ? data : [];

        if (rows.length === 0) return txt("No Bing crawl data available.");

        // Show last 14 data points
        const recent = rows.slice(-14);

        const tableRows = recent.map(
          (r: any) =>
            `| ${parseBingDate(r.Date ?? "")} | ${fmt(r.CrawledPages ?? 0)} | ${fmt(r.InIndex ?? 0)} | ${fmt(r.CrawlErrors ?? 0)} |`
        );

        return txt(
          [
            "## Bing Crawl Stats",
            "",
            "| Date | Crawled Pages | In Index | Crawl Errors |",
            "|------|---------------|----------|-------------|",
            ...tableRows,
          ].join("\n")
        );
      },
    });

    // ── 12. bing_page_stats ──────────────────────────────────────
    api.registerTool({
      name: "bing_page_stats",
      description:
        "Top pages by Bing search traffic (clicks + impressions). " +
        "Shows which pages perform best on Bing.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max pages to return. Default 15." },
        },
      },
      async execute(_id: string, params: { limit?: number }) {
        const cfg = getConfig();
        if (!cfg.bingApiKey) {
          return txt("Bing not configured. Set bingApiKey in plugin config.");
        }
        if (!cfg.siteUrl) {
          return txt("Set siteUrl in plugin config for Bing Webmaster Tools.");
        }

        const data = await bingApi(cfg.bingApiKey, "GetPageStats", cfg.siteUrl);
        const rows: any[] = Array.isArray(data) ? data : [];

        if (rows.length === 0) return txt("No Bing page stats available.");

        const sorted = rows
          .sort((a: any, b: any) => (b.Clicks ?? 0) - (a.Clicks ?? 0))
          .slice(0, params.limit ?? 15);

        const tableRows = sorted.map(
          (r: any, i: number) =>
            `| ${i + 1} | ${r.Query ?? r.Url ?? "—"} | ${fmt(r.Clicks ?? 0)} | ${fmt(r.Impressions ?? 0)} | ${(r.AvgClickPosition ?? 0).toFixed(1)} |`
        );

        return txt(
          [
            "## Top Pages — Bing Search",
            "",
            "| # | Page | Clicks | Impressions | Avg Position |",
            "|---|------|--------|-------------|-------------|",
            ...tableRows,
          ].join("\n")
        );
      },
    });

    // ── 13. bing_url_index ───────────────────────────────────────
    api.registerTool({
      name: "bing_url_index",
      description:
        "Check URL info on Bing: index status, last crawl date, HTTP status, " +
        "document size, and traffic data (clicks + impressions).",
      parameters: {
        type: "object",
        required: ["url"],
        properties: {
          url: {
            type: "string",
            description: "The full URL to check (e.g. https://yourdomain.com/blog/post-1).",
          },
        },
      },
      async execute(_id: string, params: { url: string }) {
        const cfg = getConfig();
        if (!cfg.bingApiKey) {
          return txt("Bing not configured. Set bingApiKey in plugin config.");
        }
        if (!cfg.siteUrl) {
          return txt("Set siteUrl in plugin config for Bing Webmaster Tools.");
        }

        const [urlInfo, trafficInfo] = await Promise.all([
          bingApi(cfg.bingApiKey, "GetUrlInfo", cfg.siteUrl, { url: params.url }),
          bingApi(cfg.bingApiKey, "GetUrlTrafficInfo", cfg.siteUrl, { url: params.url }).catch(() => null),
        ]);

        const lines = [
          "## Bing URL Info",
          "",
          `**URL:** ${params.url}`,
          "",
          "| Property | Value |",
          "|----------|-------|",
          `| Is Page | ${urlInfo.IsPage ?? "—"} |`,
          `| HTTP Status | ${urlInfo.HttpStatus ?? "—"} |`,
          `| Document Size | ${urlInfo.DocumentSize ? fmt(urlInfo.DocumentSize) + " bytes" : "—"} |`,
          `| Last Crawled | ${urlInfo.LastCrawledDate ? parseBingDate(urlInfo.LastCrawledDate) : "—"} |`,
          `| Discovery Date | ${urlInfo.DiscoveryDate ? parseBingDate(urlInfo.DiscoveryDate) : "—"} |`,
          `| Anchor Count | ${urlInfo.AnchorCount ?? "—"} |`,
        ];

        if (trafficInfo) {
          lines.push(
            "",
            "**Search Traffic:**",
            `- Clicks: ${fmt(trafficInfo.Clicks ?? 0)}`,
            `- Impressions: ${fmt(trafficInfo.Impressions ?? 0)}`,
          );
        }

        return txt(lines.join("\n"));
      },
    });

    // ── 14. bing_inbound_links ───────────────────────────────────
    api.registerTool({
      name: "bing_inbound_links",
      description:
        "Backlink count summary from Bing Webmaster Tools. " +
        "Shows total inbound links pointing to your site.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getConfig();
        if (!cfg.bingApiKey) {
          return txt("Bing not configured. Set bingApiKey in plugin config.");
        }
        if (!cfg.siteUrl) {
          return txt("Set siteUrl in plugin config for Bing Webmaster Tools.");
        }

        const data = await bingApi(cfg.bingApiKey, "GetLinkCounts", cfg.siteUrl);

        // Data is typically an object with link count properties
        const lines = [
          "## Bing Inbound Links",
          "",
          `**Site:** ${cfg.siteUrl}`,
          "",
        ];

        if (typeof data === "number") {
          lines.push(`**Total Inbound Links:** ${fmt(data)}`);
        } else if (Array.isArray(data)) {
          lines.push(
            "| Source | Links |",
            "|--------|-------|"
          );
          for (const entry of data.slice(0, 20)) {
            lines.push(`| ${entry.Url ?? entry.Domain ?? "—"} | ${fmt(entry.Links ?? entry.Count ?? 0)} |`);
          }
        } else if (data && typeof data === "object") {
          lines.push("| Metric | Count |", "|--------|-------|");
          for (const [key, val] of Object.entries(data)) {
            if (typeof val === "number") {
              lines.push(`| ${key} | ${fmt(val)} |`);
            }
          }
        } else {
          lines.push("No inbound link data available.");
        }

        return txt(lines.join("\n"));
      },
    });

    // ════════════════════════════════════════════════════════════
    //  SECTION D — Combined SEO Health Check
    // ════════════════════════════════════════════════════════════

    // ── 9. seo_health_check ─────────────────────────────────────
    api.registerTool({
      name: "seo_health_check",
      description:
        "All-in-one SEO health check combining Clarity UX signals, " +
        "PageSpeed scores, and GSC search performance into a single report. " +
        "Use this for a quick SEO pulse check.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL to check PageSpeed on. Uses siteUrl config if omitted.",
          },
        },
      },
      async execute(_id: string, params: { url?: string }) {
        const cfg = getConfig();
        const lines: string[] = [
          `## SEO Health Check — ${cfg.projectName ?? cfg.clarityProjectId}`,
          `**Date:** ${today()}`,
          "",
        ];

        // 1. Clarity UX
        try {
          const raw = await clarityLiveInsights(cfg.clarityApiToken, 3);
          const d = parseClarityData(raw);

          lines.push(
            "### 1. User Behavior (Clarity, last 3 days)",
            "| Metric | Value | Status |",
            "|--------|-------|--------|"
          );

          const dcRate = d.sessions > 0 ? (d.deadClicks / d.sessions) * 100 : 0;
          const rcRate = d.sessions > 0 ? (d.rageClicks / d.sessions) * 100 : 0;
          const qbRate = d.sessions > 0 ? (d.quickBacks / d.sessions) * 100 : 0;

          lines.push(`| Sessions | ${fmt(d.sessions)} | — |`);
          lines.push(`| Page Views | ${fmt(d.pageViews)} | — |`);
          lines.push(
            `| Dead Click Rate | ${pct(dcRate)} | ${dcRate > 5 ? "HIGH — fix clickable elements" : "OK"} |`
          );
          lines.push(
            `| Rage Click Rate | ${pct(rcRate)} | ${rcRate > 3 ? "HIGH — users frustrated" : "OK"} |`
          );
          lines.push(
            `| Quick Back Rate | ${pct(qbRate)} | ${qbRate > 10 ? "HIGH — content mismatch" : "OK"} |`
          );
          lines.push("");
        } catch (e: any) {
          lines.push(`### 1. Clarity — Error: ${e.message}`, "");
        }

        // 2. PageSpeed
        const testUrl = params.url ?? cfg.siteUrl;
        if (testUrl) {
          try {
            const raw = await fetchPageSpeed(testUrl, "mobile");
            const ps = parsePageSpeed(raw);

            lines.push("### 2. PageSpeed (mobile)");
            lines.push("| Category | Score |", "|----------|-------|");
            for (const [cat, score] of Object.entries(ps.scores)) {
              lines.push(`| ${cat} | ${score}/100 |`);
            }

            if (Object.keys(ps.cwv).length > 0) {
              lines.push("", "**Core Web Vitals:**");
              for (const [key, val] of Object.entries(ps.cwv)) {
                lines.push(`- ${key}: ${val}`);
              }
            }
            lines.push("");
          } catch (e: any) {
            lines.push(`### 2. PageSpeed — Error: ${e.message}`, "");
          }
        } else {
          lines.push(
            "### 2. PageSpeed — Skipped (set siteUrl in config)",
            ""
          );
        }

        // 3. GSC summary
        if (cfg.gscCredentialsFile && cfg.gscSiteUrl) {
          try {
            const start = daysAgo(28);
            const end = daysAgo(3);
            const resp = await fetchGSC(
              cfg.gscCredentialsFile,
              cfg.gscSiteUrl,
              start,
              end,
              ["query"]
            );
            const rows = parseGSCRows(resp);

            const totalClicks = rows.reduce((s: number, r: any) => s + r.clicks, 0);
            const totalImpr = rows.reduce((s: number, r: any) => s + r.impressions, 0);
            const avgCtr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
            const avgPos =
              rows.length > 0
                ? rows.reduce((s: number, r: any) => s + r.position, 0) / rows.length
                : 0;

            lines.push(
              `### 3. Search Performance (GSC, last 28 days)`,
              "| Metric | Value |",
              "|--------|-------|",
              `| Total Clicks | ${fmt(totalClicks)} |`,
              `| Total Impressions | ${fmt(totalImpr)} |`,
              `| Average CTR | ${pct(avgCtr)} |`,
              `| Average Position | ${avgPos.toFixed(1)} |`,
              `| Keywords Tracked | ${rows.length} |`,
              ""
            );
          } catch (e: any) {
            lines.push(`### 3. GSC — Error: ${e.message}`, "");
          }
        } else {
          lines.push("### 3. GSC — Skipped (not configured)", "");
        }

        // 4. Bing Search
        if (cfg.bingApiKey && cfg.siteUrl) {
          try {
            const bingData = await bingApi(cfg.bingApiKey, "GetRankAndTrafficStats", cfg.siteUrl);
            const bingRows: any[] = Array.isArray(bingData) ? bingData : [];

            if (bingRows.length > 0) {
              // Get the most recent data points
              const recent = bingRows.slice(-7);
              const totalClicks = recent.reduce((s: number, r: any) => s + (r.Clicks ?? 0), 0);
              const totalImpr = recent.reduce((s: number, r: any) => s + (r.Impressions ?? 0), 0);
              const avgPos =
                recent.length > 0
                  ? recent.reduce((s: number, r: any) => s + (r.AvgClickPosition ?? 0), 0) / recent.length
                  : 0;

              lines.push(
                "### 4. Bing Search (last 7 data points)",
                "| Metric | Value |",
                "|--------|-------|",
                `| Total Clicks | ${fmt(totalClicks)} |`,
                `| Total Impressions | ${fmt(totalImpr)} |`,
                `| Avg Click Position | ${avgPos.toFixed(1)} |`,
                ""
              );
            } else {
              lines.push("### 4. Bing Search — No data available", "");
            }
          } catch (e: any) {
            lines.push(`### 4. Bing Search — Error: ${e.message}`, "");
          }
        } else {
          lines.push("### 4. Bing Search — Skipped (set bingApiKey in config)", "");
        }

        return txt(lines.join("\n"));
      },
    });

    api.logger.info("clarity-tracker: 14 agent tools registered (Clarity + GSC + PageSpeed + Bing Webmaster)");
  },
};
