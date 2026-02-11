# OpenClaw Tracking SEO

OpenClaw plugin + Claude Code skill system untuk SEO & analytics tracking. Menggabungkan 4 data source — Microsoft Clarity, Google Search Console, PageSpeed Insights, dan Bing Webmaster Tools — menjadi satu toolkit terintegrasi dengan AI-powered reporting.

## Apa Ini?

**2 komponen utama:**

1. **Plugin** (`plugin/`) — OpenClaw plugin dengan 14 MCP tools untuk mengambil data dari Clarity, GSC, PageSpeed, dan Bing
2. **Skill System** (`.claude/`) — Growth PM reporting skill yang mengubah raw data jadi laporan terstruktur dalam Bahasa Indonesia

## Struktur

```
plugin/                          # OpenClaw clarity-tracker plugin
  src/index.ts                   #   14 MCP tools (Clarity, GSC, PageSpeed, Bing)
  openclaw.plugin.json           #   Plugin config schema
  package.json

.claude/                         # Claude Code skill system
  commands/
    growth-report.md             #   Slash command: /growth-report [type]
  skills/growth-pm-reports/
    SKILL.md                     #   Main skill — role, workflow, frameworks
    growth-metrics-guide.md      #   Threshold & benchmark reference
    report-templates.md          #   6 report templates (Bahasa Indonesia)
    analysis-playbook.md         #   Decision trees & recommendations

scripts/                         # Standalone report scripts (legacy)
  clarity_report.py
  clarity_advanced_report.py
  seo_combined_report.py
  run_report.sh
  install_cron.sh
  setup.sh
  requirements.txt

config/                          # Configuration examples
  .env.example
  mcp-config.json

tests/
  test_all_apis.ts
```

## 14 Tools

| # | Tool | Source | Fungsi |
|---|------|--------|--------|
| 1 | `clarity_overview` | Clarity | Sessions, page views, dead/rage clicks |
| 2 | `clarity_ux_issues` | Clarity | UX problems per halaman |
| 3 | `clarity_top_pages` | Clarity | Top pages by views |
| 4 | `clarity_traffic_breakdown` | Clarity | Device & browser breakdown |
| 5 | `seo_top_queries` | GSC | Top search queries + CTR + position |
| 6 | `seo_top_pages` | GSC | Top landing pages by clicks |
| 7 | `seo_keyword_ranking` | GSC | Track posisi keyword spesifik |
| 8 | `seo_pagespeed` | PageSpeed | Core Web Vitals + Lighthouse scores |
| 9 | `seo_health_check` | Combined | All-in-one SEO pulse check |
| 10 | `bing_query_stats` | Bing | Top Bing search queries |
| 11 | `bing_crawl_stats` | Bing | Crawl health & index rate |
| 12 | `bing_page_stats` | Bing | Top pages by Bing traffic |
| 13 | `bing_url_index` | Bing | URL index status & crawl date |
| 14 | `bing_inbound_links` | Bing | Backlink count |

## 6 Report Types

Semua laporan dalam Bahasa Indonesia dengan ICE-scored recommendations.

| Command | Tipe | Tools | Waktu Baca |
|---------|------|-------|------------|
| `/growth-report daily` | Daily Pulse | 2-3 | 3 menit |
| `/growth-report weekly` | Weekly Growth | 10 | 15 menit |
| `/growth-report audit konten` | Content Audit | 4-6 | 10 menit |
| `/growth-report audit teknis` | Technical SEO | 6 | 10 menit |
| `/growth-report keyword` | Keyword Strategy | 5-7 | 10 menit |
| `/growth-report eksekutif` | Executive Summary | 2 | 5 menit |

## Setup

### 1. Plugin

Copy `plugin/` ke OpenClaw extensions directory:

```bash
cp -r plugin/ ~/.openclaw/extensions/clarity-tracker/
```

Konfigurasi minimum (Clarity saja):

| Key | Wajib | Keterangan |
|-----|-------|------------|
| `clarityApiToken` | Ya | Clarity API token (Settings > Data Export) |
| `clarityProjectId` | Ya | Clarity project ID |
| `siteUrl` | Tidak | URL untuk PageSpeed test |
| `gscCredentialsFile` | Tidak | Path ke GSC service account JSON |
| `gscSiteUrl` | Tidak | GSC site URL (e.g. `sc-domain:yourdomain.com`) |
| `bingApiKey` | Tidak | Bing Webmaster API key |

Semakin banyak yang dikonfigurasi, semakin banyak tools yang tersedia.

### 2. Skill System

Copy `.claude/` ke root project kamu:

```bash
cp -r .claude/ /path/to/your/project/.claude/
```

Ganti `{nama_bisnis}` di file skill dengan nama bisnis kamu:

```bash
# Contoh
grep -rl '{nama_bisnis}' .claude/ | xargs sed -i 's/{nama_bisnis}/Acme Academy/g'
```

### 3. Legacy Scripts (opsional)

Jika mau pakai Python scripts standalone:

```bash
cd scripts/
pip install -r requirements.txt
cp ../config/.env.example ../.env
# Edit .env dengan credentials kamu
```

## Frameworks

- **AARRR Funnel** — Setiap metrik dipetakan ke Acquisition, Activation, Retention, Revenue, atau Referral
- **ICE Scoring** — Setiap rekomendasi dinilai Impact x Confidence x Ease, max 5 per laporan
- **Status Indicators** — `[OK]` `[!]` `[X]` saja, tanpa emoji

## Requirements

**Plugin:**
- Bun.js atau Node.js
- Python 3 + `google-auth` (untuk GSC)

**Skill system:**
- Claude Code

**Legacy scripts:**
- Python 3.8+
- Dependencies di `scripts/requirements.txt`

## License

MIT
