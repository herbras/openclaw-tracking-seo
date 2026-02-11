# Growth Metrics Guide — Benchmark & Threshold Reference

Referensi threshold untuk menentukan status `[OK]`, `[!]`, `[X]` pada setiap metrik.

---

## Microsoft Clarity Metrics

### Session & Engagement

| Metrik | [OK] | [!] Warning | [X] Kritis | Catatan |
|--------|------|-------------|------------|---------|
| Dead clicks (klik tanpa respons) | < 3% dari sessions | 3-8% | > 8% | Indikasi elemen UI tidak responsif |
| Rage clicks (klik berulang frustasi) | < 2% dari sessions | 2-5% | > 5% | Indikasi frustasi tinggi pengguna |
| Quick-back (kembali < 5 detik) | < 10% dari sessions | 10-20% | > 20% | Indikasi konten tidak sesuai ekspektasi |
| Excessive scrolling | < 5% dari sessions | 5-12% | > 12% | Konten terlalu panjang atau navigasi buruk |

### UX Issues per Halaman

| Kondisi | Interpretasi |
|---------|-------------|
| Total UX issues < 5% traffic halaman | Halaman sehat |
| Total UX issues 5-15% traffic | Perlu investigasi |
| Total UX issues > 15% traffic | Perbaikan mendesak |
| Rage clicks + Dead clicks tinggi bersamaan | Masalah interaktivitas (tombol rusak, loading lambat) |
| Quick-back tinggi sendiri | Masalah konten/intent mismatch, bukan UX teknis |

---

## Google Search Console Metrics

### Query Performance

| Metrik | [OK] | [!] Warning | [X] Kritis | Catatan |
|--------|------|-------------|------------|---------|
| CTR (Click-Through Rate) | > 3% | 1-3% | < 1% | Tergantung posisi; posisi 1-3 harusnya > 5% |
| Average Position | < 15 | 15-30 | > 30 | Target halaman 1-2 Google |
| Impressions trend | Stabil/naik | Turun < 10% WoW | Turun > 20% WoW | Bandingkan week-over-week |
| Clicks trend | Stabil/naik | Turun < 15% WoW | Turun > 25% WoW | Korelasikan dengan position changes |

### CTR Benchmark per Posisi

| Posisi Google | CTR Normal | Di bawah normal jika |
|---------------|-----------|---------------------|
| 1 | 25-35% | < 15% |
| 2 | 12-18% | < 8% |
| 3 | 8-12% | < 5% |
| 4-5 | 4-8% | < 3% |
| 6-10 | 1-4% | < 1% |
| 11-20 | 0.5-2% | < 0.3% |

### Page Performance

| Metrik | [OK] | [!] Warning | [X] Kritis |
|--------|------|-------------|------------|
| Clicks per page (28d) | > 50 | 10-50 | < 10 |
| Halaman dengan 0 clicks | < 10% total pages | 10-30% | > 30% |
| Pages dengan high impressions, low CTR | < 20% pages | 20-40% | > 40% |

---

## PageSpeed Insights / Core Web Vitals

### Lighthouse Scores

| Kategori | [OK] | [!] Warning | [X] Kritis |
|----------|------|-------------|------------|
| Performance | 90-100 | 50-89 | < 50 |
| SEO | 90-100 | 70-89 | < 70 |
| Accessibility | 90-100 | 70-89 | < 70 |

### Core Web Vitals

| Metrik | [OK] | [!] Warning | [X] Kritis | Apa ini |
|--------|------|-------------|------------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4.0s | > 4.0s | Waktu loading elemen terbesar |
| FCP (First Contentful Paint) | < 1.8s | 1.8-3.0s | > 3.0s | Waktu konten pertama muncul |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 | Stabilitas layout halaman |
| TBT (Total Blocking Time) | < 200ms | 200-600ms | > 600ms | Waktu main thread terblokir |

### Mobile vs Desktop

| Kondisi | Interpretasi |
|---------|-------------|
| Mobile score < Desktop score - 20 | Mobile experience perlu optimasi khusus |
| Mobile LCP > 2x Desktop LCP | Asset optimization untuk mobile diperlukan |
| Mobile CLS > Desktop CLS | Layout shift khusus mobile (biasanya iklan/images) |

---

## Bing Webmaster Tools Metrics

### Crawl Health

| Metrik | [OK] | [!] Warning | [X] Kritis |
|--------|------|-------------|------------|
| Crawl errors | 0 | 1-5 per hari | > 5 per hari |
| Index rate (indexed/crawled) | > 90% | 70-90% | < 70% |
| Pages crawled trend | Stabil/naik | Turun < 20% | Turun > 40% |

### Search Performance (Bing)

| Metrik | [OK] | [!] Warning | [X] Kritis | Catatan |
|--------|------|-------------|------------|---------|
| Bing clicks | > 5% dari Google clicks | 2-5% | < 2% | Bing biasanya 5-10% dari Google traffic |
| Bing impressions | Terdaftar | Rendah | Tidak ada | Pastikan site di-submit ke Bing |
| Bing position | < 20 | 20-40 | > 40 | Bing ranking berbeda dari Google |

### Backlinks

| Metrik | [OK] | [!] Warning | [X] Kritis |
|--------|------|-------------|------------|
| Total inbound links | > 100 | 20-100 | < 20 |
| Link trend | Stabil/naik | Turun | Turun drastis (possible disavow/penalty) |

### URL Index Status

| Status | Interpretasi |
|--------|-------------|
| Indexed, crawled recently (< 7 hari) | [OK] Sehat |
| Indexed, crawled > 14 hari lalu | [!] Crawl frequency rendah |
| Not indexed | [X] Perlu investigasi (robots.txt, noindex, quality) |
| HTTP status != 200 | [X] Ada masalah server/redirect |

---

## Konteks Ed-Tech Indonesia

### Device & Browser Baseline

| Metrik | Expected Range | Sumber |
|--------|---------------|--------|
| Mobile traffic share | 65-75% | Typical Indonesia |
| Chrome browser share | 70-80% | Dominan di Indonesia |
| Safari share | 8-15% | Pengguna iOS |
| Samsung Internet | 3-8% | Pengguna Samsung |

Jika mobile traffic < 60% atau > 80%, flagging sebagai `[!]` — distribusi tidak biasa untuk pasar Indonesia.

### Peak Hours (WIB)

| Waktu | Traffic Pattern |
|-------|----------------|
| 07:00-09:00 WIB | Morning commute browsing |
| 12:00-13:00 WIB | Lunch break peak |
| 19:00-22:00 WIB | Evening prime time (tertinggi) |
| Weekend | Biasanya 20-30% lebih rendah dari weekday |

### Seasonal Patterns Indonesia

| Periode | Impact pada Ed-Tech |
|---------|-------------------|
| Januari | Resolusi tahun baru — traffic naik untuk skill baru |
| Maret-April (Ramadan) | Traffic turun 15-25% selama puasa, naik di akhir Ramadan |
| Mei (Idul Fitri) | Drop tajam 1 minggu, recovery cepat |
| Juli-Agustus | Back to school mindset — potensial traffic naik |
| September-Oktober | Budget season perusahaan — corporate training naik |
| November-Desember | Year-end rush, promo akhir tahun, tax planning courses |

### Indonesian Ed-Tech Search Behavior

| Pattern | Detail |
|---------|--------|
| Bahasa campuran | User search dalam campuran Indonesia-Inggris: "belajar digital marketing", "cara buat website" |
| Long-tail dominan | Query ed-tech Indonesia cenderung long-tail (4+ kata) |
| Brand + generic | "kursus online terbaik", "[brand] review" |
| Harga-sensitive | Query sering include "gratis", "murah", "diskon" |
