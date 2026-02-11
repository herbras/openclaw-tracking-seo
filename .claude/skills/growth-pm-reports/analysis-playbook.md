# Analysis Playbook — Decision Trees & Recommendation Templates

Panduan analisis untuk mengubah data mentah menjadi insight actionable.

---

## Decision Tree 1: Traffic Anomaly

Gunakan ketika traffic turun atau ada perubahan signifikan.

```
Clicks turun?
├── Ya
│   ├── Cek average position
│   │   ├── Position naik (memburuk) → Ranking drop
│   │   │   ├── Banyak keyword terpengaruh → Kemungkinan algorithm update
│   │   │   │   → Rekomendasi: Audit konten, periksa Google Search Status Dashboard
│   │   │   └── 1-2 keyword saja → Kompetitor mengambil posisi
│   │   │       → Rekomendasi: Update konten keyword tersebut, tambah internal link
│   │   └── Position stabil → CTR problem
│   │       ├── Cek impressions
│   │       │   ├── Impressions turun → Seasonal/demand shift
│   │       │   │   → Rekomendasi: Cek seasonal pattern Indonesia, diversifikasi keyword
│   │       │   └── Impressions stabil, clicks turun → CTR turun
│   │       │       → Rekomendasi: Optimasi meta title & description
│   │       └── Cek Bing juga turun?
│   │           ├── Ya → Masalah sitewide (technical/content)
│   │           └── Tidak → Masalah spesifik Google (algorithm/manual action)
│   └── Cek apakah halaman spesifik atau sitewide
│       ├── Halaman spesifik → Cek halaman tersebut di bing_url_index
│       └── Sitewide → Cek bing_crawl_stats untuk error
└── Tidak (traffic stabil/naik) → Tidak ada anomaly, lanjut analisis lain
```

---

## Decision Tree 2: UX Problems

Gunakan ketika clarity_ux_issues menunjukkan masalah.

```
Rage clicks tinggi (> 2%)?
├── Ya
│   ├── Di halaman mana?
│   │   ├── Halaman kursus/course → Tombol enroll/CTA mungkin tidak responsif
│   │   │   → Rekomendasi: Cek CTA button, loading state, mobile tap target
│   │   ├── Landing page → Elemen interaktif tidak berfungsi
│   │   │   → Rekomendasi: Audit JavaScript errors, cek form functionality
│   │   └── Halaman blog/konten → User mencoba klik elemen non-clickable
│   │       → Rekomendasi: Tambah link pada elemen yang terlihat clickable
│   ├── Dead clicks juga tinggi?
│   │   ├── Ya → Masalah interaktivitas serius
│   │   │   → Rekomendasi: Audit JavaScript errors, cek console errors, TBT
│   │   └── Tidak → User frustrasi tapi elemen ada, hanya lambat
│   │       → Rekomendasi: Optimasi response time, tambah loading indicator
│   └── Quick-back juga tinggi?
│       ├── Ya → Kombinasi UX buruk + konten tidak sesuai
│       │   → Rekomendasi: Redesign halaman + review search intent
│       └── Tidak → UX issue saja, konten OK
│           → Rekomendasi: Fokus perbaikan UI/interaktivitas
└── Tidak
    ├── Dead clicks tinggi sendiri?
    │   └── Ya → Elemen visual menyesatkan (terlihat clickable tapi bukan)
    │       → Rekomendasi: Audit visual hierarchy, pastikan cursor dan hover states benar
    └── Quick-back tinggi sendiri?
        └── Ya → Content-intent mismatch
            → Rekomendasi: Review meta description vs konten actual, cek search intent
```

---

## Decision Tree 3: Content Performance

Gunakan untuk audit konten dan optimasi halaman.

```
Halaman dengan high impressions + low CTR?
├── Ya
│   ├── Posisi bagus (< 10) tapi CTR rendah?
│   │   └── Meta title/description tidak menarik
│   │       → Rekomendasi: Rewrite meta, tambah angka/power word, test variations
│   └── Posisi buruk (> 10)?
│       └── Konten perlu diperkuat untuk naik ranking
│           → Rekomendasi: Update konten, tambah depth, internal linking
├── Halaman dengan high clicks + high quick-back?
│   └── Content-search intent mismatch
│       → Rekomendasi: Analisis top queries yang membawa traffic, sesuaikan konten
├── Halaman dengan high clicks + high rage clicks?
│   └── UX halaman bermasalah meski konten menarik traffic
│       → Rekomendasi: UX audit spesifik halaman ini (prioritas tinggi karena high traffic)
└── Halaman dengan Google clicks tapi 0 Bing clicks?
    ├── Cek bing_url_index — apakah terindex?
    │   ├── Tidak terindex → Submit ke Bing
    │   └── Terindex tapi no traffic → Bing ranking rendah, content perlu Bing-specific optimization
    └── → Rekomendasi: Submit sitemap ke Bing, ensure proper indexing
```

---

## Decision Tree 4: Cross-Platform Analysis

Gunakan untuk membandingkan performa antar platform.

```
Google vs Bing gaps:
├── Google bagus, Bing jelek
│   ├── Bing tidak index halaman? → Submit sitemap, verify di Bing Webmaster
│   ├── Crawl errors di Bing? → Fix technical issues spesifik Bing bot
│   └── Ranking jauh berbeda? → Bing punya algoritma berbeda, content mungkin perlu adjustment
├── Bing bagus, Google jelek
│   └── Jarang terjadi — investigasi apakah ada manual action di Google
└── Keduanya turun bersamaan
    └── Masalah sitewide — technical (downtime, speed) atau content (quality update)

Clarity + GSC correlation:
├── GSC high traffic page + Clarity low UX issues → Halaman sehat, pertahankan
├── GSC high traffic page + Clarity high UX issues → Prioritas perbaikan UX
├── GSC low traffic page + Clarity high engagement → Konten bagus tapi SEO lemah
│   → Rekomendasi: Optimasi SEO on-page
└── GSC low traffic page + Clarity low engagement → Evaluasi apakah halaman masih relevan

PageSpeed + Engagement:
├── Low PageSpeed + High bounce/quick-back → Speed menyebabkan user pergi
│   → Rekomendasi: Prioritaskan speed optimization
├── High PageSpeed + High bounce → Bukan masalah speed, tapi konten/intent
│   → Rekomendasi: Fokus content quality
└── Low PageSpeed + Low bounce → User sabar, tapi risiko SEO ranking
    → Rekomendasi: Tetap optimasi speed untuk SEO signal
```

---

## Decision Tree 5: Seasonal Patterns (Indonesia)

```
Traffic turun tiba-tiba?
├── Apakah mendekati Ramadan/Idul Fitri?
│   ├── Ya → Normal seasonal drop 15-25%
│   │   → Rekomendasi: Siapkan konten Ramadan-themed, jangan panic
│   └── Tidak
│       ├── Apakah long weekend/libur nasional?
│       │   ├── Ya → Normal, akan recovery dalam 2-3 hari
│       │   └── Tidak → Investigasi technical atau algorithm issues
│       └── Apakah hari biasa weekend?
│           └── Weekend drop 20-30% normal untuk ed-tech Indonesia

Traffic naik tiba-tiba?
├── Januari → Resolusi tahun baru, normal untuk ed-tech
├── Juli-Agustus → Back to school, normal
├── September-Oktober → Budget season, corporate interest naik
├── November-Desember → Year-end rush, promo season
└── Tidak seasonal → Cek apakah ada konten viral atau backlink baru
    → Gunakan bing_inbound_links untuk cek backlink spike
```

---

## Standard Recommendation Templates

### Template 1: Optimasi Meta Title/Description
**Kapan:** CTR di bawah benchmark untuk posisinya
```
Optimasi meta title dan description untuk halaman "{page}".
CTR saat ini {ctr}%, di bawah benchmark {benchmark}% untuk posisi {pos}.
Saran: Tambahkan angka, power word, atau unique value proposition di meta title.
```
- **ICE:** Impact 7 | Confidence 8 | Ease 9 | **Skor: 8.0**
- **Effort:** Cepat (< 1 hari)

### Template 2: Perbaikan UX — CTA/Button
**Kapan:** Rage clicks atau dead clicks tinggi pada halaman spesifik
```
Perbaiki interaktivitas CTA/tombol di halaman "{page}".
Rage clicks: {rage}%, dead clicks: {dead}%.
Saran: Audit JavaScript errors, pastikan tombol responsif di mobile, tambah loading state.
```
- **ICE:** Impact 8 | Confidence 7 | Ease 6 | **Skor: 7.0**
- **Effort:** Sedang (1-3 hari)

### Template 3: Speed Optimization — LCP
**Kapan:** LCP di atas 2.5s
```
Optimasi Largest Contentful Paint (LCP) dari {lcp} menjadi < 2.5s.
Saran: Compress hero image, implement lazy loading, optimize server response time.
Prioritas: Mobile-first karena {mobile_pct}% traffic dari mobile.
```
- **ICE:** Impact 8 | Confidence 9 | Ease 5 | **Skor: 7.3**
- **Effort:** Sedang (1-3 hari)

### Template 4: Content Update untuk Ranking
**Kapan:** Keyword di posisi 4-15, konten sudah tua
```
Update konten untuk keyword "{keyword}" (posisi saat ini: {pos}).
Saran: Tambah depth/comprehensiveness, update data terbaru, tambah internal link dari halaman authority.
Target: Naik ke posisi 1-3 dalam 4-8 minggu.
```
- **ICE:** Impact 8 | Confidence 6 | Ease 4 | **Skor: 6.0**
- **Effort:** Sedang (1-3 hari)

### Template 5: Bing Indexing Fix
**Kapan:** Halaman penting tidak terindex di Bing
```
Submit halaman "{page}" ke Bing untuk indexing.
Status saat ini: tidak terindex / last crawl > 14 hari.
Saran: Submit URL via Bing Webmaster Tools, pastikan sitemap up-to-date.
```
- **ICE:** Impact 4 | Confidence 9 | Ease 10 | **Skor: 7.7**
- **Effort:** Cepat (< 1 hari)

### Template 6: Internal Linking
**Kapan:** Halaman dengan engagement tinggi tapi traffic rendah
```
Tambah internal link menuju halaman "{page}" dari halaman authority.
Halaman ini punya engagement baik (Clarity) tapi traffic rendah (GSC).
Saran: Link dari 3-5 halaman dengan traffic tertinggi, gunakan anchor text yang relevan.
```
- **ICE:** Impact 6 | Confidence 7 | Ease 8 | **Skor: 7.0**
- **Effort:** Cepat (< 1 hari)

### Template 7: Content-Intent Alignment
**Kapan:** Quick-back rate tinggi pada halaman dengan traffic
```
Sesuaikan konten halaman "{page}" dengan search intent.
Quick-back rate: {qb}% — user tidak menemukan apa yang dicari.
Saran: Analisis top queries dari GSC, pastikan konten menjawab intent langsung di above-the-fold.
```
- **ICE:** Impact 7 | Confidence 6 | Ease 5 | **Skor: 6.0**
- **Effort:** Sedang (1-3 hari)

### Template 8: Mobile Experience Optimization
**Kapan:** Mobile performance score jauh di bawah desktop
```
Optimasi pengalaman mobile untuk "{page}".
Delta performance: mobile {m_score} vs desktop {d_score} (selisih {delta}).
Saran: Review mobile layout, reduce render-blocking resources, optimize images untuk mobile viewport.
Konteks: {mobile_pct}% traffic {nama_bisnis} dari mobile device.
```
- **ICE:** Impact 8 | Confidence 7 | Ease 4 | **Skor: 6.3**
- **Effort:** Besar (> 3 hari)

---

## Cross-Metric Correlation Checklist

Gunakan checklist ini setelah mengumpulkan semua data untuk menemukan insight yang lebih dalam:

- [ ] Halaman dengan GSC clicks tertinggi — apakah punya UX issues di Clarity?
- [ ] Keyword dengan impressions tinggi tapi CTR rendah — apakah posisi sudah bagus?
- [ ] Halaman dengan Clarity engagement tinggi — apakah ada di GSC top pages?
- [ ] PageSpeed score rendah — apakah berkorelasi dengan quick-back rate tinggi?
- [ ] Bing crawl errors — apakah halaman yang error punya traffic di Google?
- [ ] Top Bing queries — apakah overlap dengan top Google queries?
- [ ] Backlink count — apakah berkorelasi dengan halaman ranking tertinggi?
- [ ] Device breakdown — apakah mobile experience (PageSpeed mobile) mendukung traffic share?
