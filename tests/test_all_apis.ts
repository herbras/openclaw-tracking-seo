/**
 * E2E Feature Check — Test all clarity-tracker plugin APIs
 * Run: bun test_all_apis.ts
 */

const env = await Bun.file(".env").text();
const config: Record<string, string> = {};
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const [key, ...rest] = line.split("=");
  config[key.trim()] = rest.join("=").trim();
}

const CLARITY_TOKEN = config.CLARITY_API_TOKEN;
const SITE_URL = "https://yourdomain.com";
const BING_KEY = config.BING_WEBMASTER_API_KEY;

let passed = 0;
let failed = 0;
let skipped = 0;

async function test(name: string, fn: () => Promise<string>) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    console.log(`  ✅ ${name} (${ms}ms) — ${result}`);
    passed++;
  } catch (e: any) {
    const ms = Date.now() - start;
    console.log(`  ❌ ${name} (${ms}ms) — ${e.message}`);
    failed++;
  }
}

function skip(name: string, reason: string) {
  console.log(`  ⏭️  ${name} — SKIPPED: ${reason}`);
  skipped++;
}

// ── Bing helper ──
async function bingApi(method: string, extra?: Record<string, string>): Promise<any> {
  const params = new URLSearchParams({ apikey: BING_KEY, siteUrl: SITE_URL, ...extra });
  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  return json.d ?? json;
}

console.log("\n🔍 clarity-tracker E2E Feature Check");
console.log("=".repeat(50));

// ━━━ Section 1: Microsoft Clarity ━━━
console.log("\n📊 Section 1: Microsoft Clarity");
if (CLARITY_TOKEN) {
  await test("Clarity Live Insights API", async () => {
    const url = "https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3&dimension1=URL";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CLARITY_TOKEN}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return `${Array.isArray(data) ? data.length : 0} metric groups returned`;
  });
} else {
  skip("Clarity API", "CLARITY_API_TOKEN not set");
}

// ━━━ Section 2: PageSpeed Insights ━━━
console.log("\n⚡ Section 2: PageSpeed Insights");
await test("PageSpeed mobile", async () => {
  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(SITE_URL)}&strategy=mobile&category=performance`;
  const res = await fetch(url);
  if (res.status === 429) return "Rate limited by Google (not a bug — try again later)";
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: any = await res.json();
  const score = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
  return `Performance score: ${score}/100`;
});

// ━━━ Section 3: Google Search Console ━━━
console.log("\n🔎 Section 3: Google Search Console");
skip("GSC API", "Requires python + service account (tested separately)");

// ━━━ Section 4: Bing Webmaster Tools ━━━
console.log("\n🅱️  Section 4: Bing Webmaster Tools");
if (BING_KEY) {
  await test("GetQueryStats (bing_query_stats)", async () => {
    const data = await bingApi("GetQueryStats");
    const rows = Array.isArray(data) ? data : [];
    return `${rows.length} queries returned`;
  });

  await test("GetCrawlStats (bing_crawl_stats)", async () => {
    const data = await bingApi("GetCrawlStats");
    const rows = Array.isArray(data) ? data : [];
    return `${rows.length} crawl data points`;
  });

  await test("GetPageStats (bing_page_stats)", async () => {
    const data = await bingApi("GetPageStats");
    const rows = Array.isArray(data) ? data : [];
    return `${rows.length} page entries`;
  });

  await test("GetUrlInfo (bing_url_index)", async () => {
    const data = await bingApi("GetUrlInfo", { url: SITE_URL });
    return `IsPage: ${data.IsPage}, HTTP: ${data.HttpStatus}, LastCrawled: ${data.LastCrawledDate?.slice(0, 20)}...`;
  });

  await test("GetUrlTrafficInfo (bing_url_index traffic)", async () => {
    const data = await bingApi("GetUrlTrafficInfo", { url: SITE_URL });
    return `Clicks: ${data.Clicks}, Impressions: ${data.Impressions}`;
  });

  await test("GetLinkCounts (bing_inbound_links)", async () => {
    const data = await bingApi("GetLinkCounts");
    if (typeof data === "number") return `${data} inbound links`;
    if (Array.isArray(data)) return `${data.length} link sources`;
    return `Response type: ${typeof data}`;
  });

  await test("GetRankAndTrafficStats (seo_health_check Bing section)", async () => {
    const data = await bingApi("GetRankAndTrafficStats");
    const rows = Array.isArray(data) ? data : [];
    return `${rows.length} traffic data points`;
  });
} else {
  skip("Bing API (all 5 tools)", "BING_WEBMASTER_API_KEY not set");
}

// ━━━ Summary ━━━
console.log("\n" + "=".repeat(50));
console.log(`📋 Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
console.log("=".repeat(50) + "\n");

process.exit(failed > 0 ? 1 : 0);
