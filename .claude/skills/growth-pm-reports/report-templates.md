# Report Templates — Bahasa Indonesia

Template laporan lengkap untuk setiap tipe. Gunakan placeholder `{value}` untuk data dinamis.

---

## 1. Daily Pulse

```markdown
# Laporan Harian — {nama_bisnis}
**Tanggal:** {tanggal}
**Periode data:** {periode}
**Disiapkan oleh:** Growth Analytics AI

---

## Ringkasan Cepat

| Metrik | Nilai | Status |
|--------|-------|--------|
| Total sessions | {sessions} | {status} |
| Page views | {page_views} | {status} |
| Unique users | {unique_users} | {status} |
| Dead clicks | {dead_clicks_pct}% | {status} |
| Rage clicks | {rage_clicks_pct}% | {status} |
| Quick-back rate | {quick_back_pct}% | {status} |

## Skor Performa

| Kategori | Skor | Status |
|----------|------|--------|
| Performance (mobile) | {perf_score} | {status} |
| SEO | {seo_score} | {status} |
| Accessibility | {a11y_score} | {status} |

## Core Web Vitals

| Metrik | Nilai | Threshold | Status |
|--------|-------|-----------|--------|
| LCP (waktu loading utama) | {lcp} | < 2.5s | {status} |
| FCP (konten pertama muncul) | {fcp} | < 1.8s | {status} |
| CLS (stabilitas layout) | {cls} | < 0.1 | {status} |
| TBT (waktu terblokir) | {tbt} | < 200ms | {status} |

## Masalah UX Teratas

{tabel_ux_issues_jika_ada}

> Jika tidak ada masalah UX signifikan: "Tidak ada masalah UX kritis terdeteksi hari ini."

## Langkah Selanjutnya

| # | Rekomendasi | ICE | Effort |
|---|-------------|-----|--------|
| 1 | {rekomendasi_1} | {ice_1} | {effort_1} |
| 2 | {rekomendasi_2} | {ice_2} | {effort_2} |
| 3 | {rekomendasi_3} | {ice_3} | {effort_3} |

---
*Laporan otomatis — Growth Analytics AI untuk {nama_bisnis}*
*Data Clarity: snapshot {clarity_days} hari terakhir | PageSpeed: real-time*
```

---

## 2. Weekly Growth Report

```markdown
# Laporan Mingguan Growth — {nama_bisnis}
**Tanggal:** {tanggal}
**Periode:** {periode}
**Disiapkan oleh:** Growth Analytics AI

---

## Ringkasan Eksekutif

{narasi_ringkasan_2_3_kalimat}

## 1. Acquisition — Traffic Masuk

### Google Search (GSC, 7 hari)

| Query | Clicks | Impressions | CTR | Posisi | Status |
|-------|--------|-------------|-----|--------|--------|
| {query_1} | {clicks} | {impressions} | {ctr} | {pos} | {status} |
| ... | ... | ... | ... | ... | ... |

### Halaman Teratas (GSC)

| Halaman | Clicks | Impressions | CTR | Status |
|---------|--------|-------------|-----|--------|
| {page_1} | {clicks} | {impressions} | {ctr} | {status} |
| ... | ... | ... | ... | ... |

### Bing Search

| Query | Clicks | Impressions | Posisi |
|-------|--------|-------------|--------|
| {query_1} | {clicks} | {impressions} | {pos} |
| ... | ... | ... | ... |

## 2. Activation — Engagement Pengguna

### Overview Clarity ({clarity_days} hari)

| Metrik | Nilai | Status |
|--------|-------|--------|
| Sessions | {sessions} | {status} |
| Page views | {page_views} | {status} |
| Dead clicks | {dead_clicks_pct}% | {status} |
| Rage clicks | {rage_clicks_pct}% | {status} |
| Quick-back | {quick_back_pct}% | {status} |
| Excessive scrolling | {scroll_pct}% | {status} |

### Halaman Teratas (Clarity)

| Halaman | Views | Sessions | Status |
|---------|-------|----------|--------|
| {page_1} | {views} | {sessions} | {status} |
| ... | ... | ... | ... |

### Masalah UX per Halaman

| Halaman | Dead Clicks | Rage Clicks | Quick-back | Total Issues |
|---------|-------------|-------------|------------|-------------|
| {page_1} | {dead} | {rage} | {qb} | {total} |
| ... | ... | ... | ... | ... |

## 3. Profil Pengguna

### Device Breakdown

| Device | Share | Status |
|--------|-------|--------|
| Mobile | {mobile_pct}% | {status} |
| Desktop | {desktop_pct}% | {status} |
| Tablet | {tablet_pct}% | {status} |

### Browser Breakdown

| Browser | Share |
|---------|-------|
| {browser_1} | {share_1}% |
| ... | ... |

## 4. Technical Health

### Core Web Vitals (Mobile)

| Metrik | Nilai | Threshold | Status |
|--------|-------|-----------|--------|
| LCP | {lcp} | < 2.5s | {status} |
| FCP | {fcp} | < 1.8s | {status} |
| CLS | {cls} | < 0.1 | {status} |
| TBT | {tbt} | < 200ms | {status} |

### Backlinks (Bing)

| Metrik | Nilai |
|--------|-------|
| Total inbound links | {total_links} |

## 5. Cross-Source Insights

{insight_1_narasi}

{insight_2_narasi}

{insight_3_narasi}

## 6. Langkah Selanjutnya

| # | Rekomendasi | Impact | Confidence | Ease | ICE | Effort |
|---|-------------|--------|------------|------|-----|--------|
| 1 | {rekomendasi_1} | {i} | {c} | {e} | {ice} | {effort} |
| 2 | {rekomendasi_2} | {i} | {c} | {e} | {ice} | {effort} |
| 3 | {rekomendasi_3} | {i} | {c} | {e} | {ice} | {effort} |
| 4 | {rekomendasi_4} | {i} | {c} | {e} | {ice} | {effort} |
| 5 | {rekomendasi_5} | {i} | {c} | {e} | {ice} | {effort} |

---
*Laporan otomatis — Growth Analytics AI untuk {nama_bisnis}*
*Data Clarity: snapshot {clarity_days} hari | GSC: {gsc_days} hari | PageSpeed: real-time | Bing: default period*
```

---

## 3. Content Performance Audit

```markdown
# Audit Performa Konten — {nama_bisnis}
**Tanggal:** {tanggal}
**Periode:** GSC {gsc_days} hari, Clarity {clarity_days} hari
**Disiapkan oleh:** Growth Analytics AI

---

## Ringkasan

{narasi_ringkasan}

## 1. Performa Halaman — Google Search

| Halaman | Clicks | Impressions | CTR | Posisi | Status |
|---------|--------|-------------|-----|--------|--------|
| {page_1} | {clicks} | {impressions} | {ctr} | {pos} | {status} |
| ... | ... | ... | ... | ... | ... |

## 2. Engagement Halaman — Clarity

| Halaman | Views | Sessions | Dead Clicks | Rage Clicks | Quick-back |
|---------|-------|----------|-------------|-------------|------------|
| {page_1} | {views} | {sessions} | {dead} | {rage} | {qb} |
| ... | ... | ... | ... | ... | ... |

## 3. Performa di Bing

| Halaman | Clicks | Impressions |
|---------|--------|-------------|
| {page_1} | {clicks} | {impressions} |
| ... | ... | ... |

## 4. Gap Analysis: Google vs Bing

| Halaman | Google Clicks | Bing Clicks | Gap | Catatan |
|---------|--------------|-------------|-----|---------|
| {page_1} | {g_clicks} | {b_clicks} | {gap} | {catatan} |
| ... | ... | ... | ... | ... |

## 5. Korelasi Traffic vs UX

| Halaman | GSC Clicks | UX Issues | Diagnosis |
|---------|-----------|-----------|-----------|
| {page_1} | {clicks} | {issues} | {diagnosis} |
| ... | ... | ... | ... |

> Halaman dengan traffic tinggi + UX issues tinggi = prioritas perbaikan tertinggi.

## 6. Investigasi URL (jika dilakukan)

{hasil_bing_url_index_per_url}

## 7. Langkah Selanjutnya

| # | Rekomendasi | ICE | Effort |
|---|-------------|-----|--------|
| 1 | {rekomendasi_1} | {ice_1} | {effort_1} |
| 2 | {rekomendasi_2} | {ice_2} | {effort_2} |
| 3 | {rekomendasi_3} | {ice_3} | {effort_3} |
| 4 | {rekomendasi_4} | {ice_4} | {effort_4} |
| 5 | {rekomendasi_5} | {ice_5} | {effort_5} |

---
*Laporan otomatis — Growth Analytics AI untuk {nama_bisnis}*
```

---

## 4. Technical SEO Audit

```markdown
# Audit Teknis SEO — {nama_bisnis}
**Tanggal:** {tanggal}
**Disiapkan oleh:** Growth Analytics AI

---

## Ringkasan

{narasi_ringkasan}

## 1. Core Web Vitals

### Mobile

| Metrik | Nilai | Threshold | Status |
|--------|-------|-----------|--------|
| Performance Score | {perf} | >= 90 | {status} |
| LCP (waktu loading utama) | {lcp} | < 2.5s | {status} |
| FCP (konten pertama muncul) | {fcp} | < 1.8s | {status} |
| CLS (stabilitas layout) | {cls} | < 0.1 | {status} |
| TBT (waktu terblokir) | {tbt} | < 200ms | {status} |
| SEO Score | {seo} | >= 90 | {status} |
| Accessibility Score | {a11y} | >= 90 | {status} |

### Desktop

| Metrik | Nilai | Threshold | Status |
|--------|-------|-----------|--------|
| Performance Score | {perf} | >= 90 | {status} |
| LCP | {lcp} | < 2.5s | {status} |
| FCP | {fcp} | < 1.8s | {status} |
| CLS | {cls} | < 0.1 | {status} |
| TBT | {tbt} | < 200ms | {status} |

### Perbandingan Mobile vs Desktop

| Metrik | Mobile | Desktop | Delta | Status |
|--------|--------|---------|-------|--------|
| Performance | {m_perf} | {d_perf} | {delta} | {status} |
| LCP | {m_lcp} | {d_lcp} | {delta} | {status} |
| CLS | {m_cls} | {d_cls} | {delta} | {status} |

## 2. Bing Crawl Health

| Tanggal | Pages Crawled | Pages Indexed | Crawl Errors | Status |
|---------|--------------|---------------|-------------|--------|
| {date_1} | {crawled} | {indexed} | {errors} | {status} |
| ... | ... | ... | ... | ... |

**Index Rate:** {index_rate}% {status}

## 3. URL Index Status

| URL | Status Index | Last Crawl | HTTP Status | Size |
|-----|-------------|------------|-------------|------|
| {url_1} | {indexed} | {last_crawl} | {http} | {size} |
| {url_2} | {indexed} | {last_crawl} | {http} | {size} |

## 4. Backlink Profile

| Metrik | Nilai | Status |
|--------|-------|--------|
| Total inbound links | {total_links} | {status} |

## 5. SEO Issues Ditemukan

{daftar_isu_dari_pagespeed}

## 6. Langkah Selanjutnya

| # | Rekomendasi | ICE | Effort |
|---|-------------|-----|--------|
| 1 | {rekomendasi_1} | {ice_1} | {effort_1} |
| 2 | {rekomendasi_2} | {ice_2} | {effort_2} |
| 3 | {rekomendasi_3} | {ice_3} | {effort_3} |
| 4 | {rekomendasi_4} | {ice_4} | {effort_4} |
| 5 | {rekomendasi_5} | {ice_5} | {effort_5} |

---
*Laporan otomatis — Growth Analytics AI untuk {nama_bisnis}*
```

---

## 5. Keyword Strategy Brief

```markdown
# Strategi Keyword — {nama_bisnis}
**Tanggal:** {tanggal}
**Periode data:** GSC {gsc_days} hari
**Disiapkan oleh:** Growth Analytics AI

---

## Ringkasan

{narasi_ringkasan}

## 1. Keyword Landscape — Google

| Query | Clicks | Impressions | CTR | Posisi | Status |
|-------|--------|-------------|-----|--------|--------|
| {query_1} | {clicks} | {impressions} | {ctr} | {pos} | {status} |
| ... | ... | ... | ... | ... | ... |

## 2. Keyword Landscape — Bing

| Query | Clicks | Impressions | Posisi |
|-------|--------|-------------|--------|
| {query_1} | {clicks} | {impressions} | {pos} |
| ... | ... | ... | ... |

## 3. Google vs Bing Keyword Comparison

| Keyword | Google Pos | Bing Pos | Google CTR | Bing Clicks | Catatan |
|---------|-----------|----------|-----------|-------------|---------|
| {kw_1} | {g_pos} | {b_pos} | {g_ctr} | {b_clicks} | {catatan} |
| ... | ... | ... | ... | ... | ... |

## 4. Target Keyword Tracking

{untuk_setiap_keyword_yang_ditrack}

### "{keyword}"

| Metrik | Nilai |
|--------|-------|
| Clicks (28d) | {clicks} |
| Impressions (28d) | {impressions} |
| CTR | {ctr} |
| Average Position | {pos} |
| Trend | {trend_narasi} |

## 5. Peluang Keyword

### Quick Wins (posisi 4-15, CTR rendah)
Keyword yang sudah dekat halaman 1 tapi CTR di bawah benchmark:

| Keyword | Posisi | CTR Saat Ini | CTR Target | Aksi |
|---------|--------|-------------|-----------|------|
| {kw_1} | {pos} | {ctr} | {target} | {aksi} |

### Keyword Baru Potensial
Keyword dengan impressions tinggi tapi clicks rendah — peluang optimasi:

| Keyword | Impressions | Clicks | CTR | Posisi | Potensi |
|---------|------------|--------|-----|--------|---------|
| {kw_1} | {imp} | {clicks} | {ctr} | {pos} | {potensi} |

## 6. Langkah Selanjutnya

| # | Rekomendasi | ICE | Effort |
|---|-------------|-----|--------|
| 1 | {rekomendasi_1} | {ice_1} | {effort_1} |
| 2 | {rekomendasi_2} | {ice_2} | {effort_2} |
| 3 | {rekomendasi_3} | {ice_3} | {effort_3} |
| 4 | {rekomendasi_4} | {ice_4} | {effort_4} |
| 5 | {rekomendasi_5} | {ice_5} | {effort_5} |

---
*Laporan otomatis — Growth Analytics AI untuk {nama_bisnis}*
```

---

## 6. Executive Summary

```markdown
# Ringkasan Eksekutif — {nama_bisnis}
**Tanggal:** {tanggal}
**Periode:** {periode}
**Disiapkan oleh:** Growth Analytics AI

---

## Kesehatan Keseluruhan

| Area | Status | Ringkasan |
|------|--------|-----------|
| Traffic & SEO | {status} | {ringkasan_1_kalimat} |
| User Experience | {status} | {ringkasan_1_kalimat} |
| Technical Performance | {status} | {ringkasan_1_kalimat} |

## Angka Utama

| Metrik | Nilai | Catatan |
|--------|-------|---------|
| Sessions ({clarity_days}d) | {sessions} | {catatan} |
| Page views ({clarity_days}d) | {page_views} | {catatan} |
| Performance score (mobile) | {perf_score} | {catatan} |
| SEO score | {seo_score} | {catatan} |

## Temuan Penting

1. {temuan_1}
2. {temuan_2}
3. {temuan_3}

## 3 Prioritas Utama

| # | Prioritas | Mengapa | ICE |
|---|-----------|---------|-----|
| 1 | {prioritas_1} | {alasan_1} | {ice_1} |
| 2 | {prioritas_2} | {alasan_2} | {ice_2} |
| 3 | {prioritas_3} | {alasan_3} | {ice_3} |

---
*Laporan otomatis — Growth Analytics AI untuk {nama_bisnis}*
*Untuk detail lebih lanjut, jalankan `/growth-report weekly` atau audit spesifik.*
```
