# 📊 Microsoft Clarity Automated Reports

Project ini untuk membuat automasi laporan harian/mingguan dari Microsoft Clarity analytics.

## 📁 Struktur Folder

```
analytic-learner/
├── clarity_report.py      # Script utama generate laporan
├── requirements.txt       # Python dependencies
├── .env.example          # Template environment variables
├── .env                  # Your API token (buat dari example)
├── reports/              # Output folder untuk PDF reports
│   └── charts/           # Chart images
└── run_report.sh         # Script untuk running manual
```

## 🚀 Setup Awal

### 1. Install Dependencies

```bash
cd ~/analytic-learner
pip install -r requirements.txt
```

### 2. Dapatkan Clarity API Token

1. Login ke [Microsoft Clarity](https://clarity.microsoft.com/)
2. Pilih project kamu
3. Go to **Settings → Data Export**
4. Click **Generate new API token**
5. Copy token tersebut

### 3. Setup Environment Variables

```bash
cp .env.example .env
nano .env  # Edit dan isi API token
```

Isi nilai berikut:
- `CLARITY_API_TOKEN` - Token dari Clarity
- `CLARITY_PROJECT_ID` - ID project Clarity kamu
- `PROJECT_NAME` - Nama website/project

### 4. Test Run

```bash
python clarity_report.py
```

Report akan tersimpan di `reports/` folder.

## ⏰ Setup Automasi (Cron Job)

### Run Setiap Hari Rabu Pagi

```bash
# Edit crontab
crontab -e
```

Tambahkan baris ini:

```cron
# Run setiap hari Rabu jam 9 pagi
0 9 * * 3 cd /home/ibrahim/analytic-learner && /usr/bin/python3 clarity_report.py >> logs/cron.log 2>&1
```

### Run Setiap Hari Sabtu (Weekend Report)

```cron
# Run setiap hari Sabtu jam 10 pagi
0 10 * * 6 cd /home/ibrahim/analytic-learner && /usr/bin/python3 clarity_report.py >> logs/cron.log 2>&1
```

### Multiple Schedule (Rabu + Sabtu)

```cron
# Rabu - Weekly report
0 9 * * 3 cd /home/ibrahim/analytic-learner && /usr/bin/python3 clarity_report.py >> logs/cron.log 2>&1

# Sabtu - Weekend report
0 10 * * 6 cd /home/ibrahim/analytic-learner && /usr/bin/python3 clarity_report.py >> logs/cron.log 2>&1
```

## 📋 Format Cron

```
* * * * * command
│ │ │ │ │
│ │ │ │ └── Hari (0-7, Minggu=0 atau 7)
│ │ │ └──── Bulan (1-12)
│ │ └────── Hari dalam bulan (1-31)
│ └──────── Jam (0-23)
└────────── Menit (0-59)
```

Contoh:
- `0 9 * * 3` = Setiap hari Rabu jam 09:00
- `0 10 * * 6` = Setiap hari Sabtu jam 10:00
- `0 8 * * 1-5` = Setiap hari kerja (Senin-Jumat) jam 08:00
- `0 6 * * 0` = Setiap Minggu jam 06:00

## 🔍 Mengecek Cron Log

```bash
# Lihat log
tail -f ~/analytic-learner/logs/cron.log

# Cek cron aktif
crontab -l
```

## 📦 Output Report

Setiap run akan generate:
1. **PDF Report** - `clarity_report_YYYYMMDD_HHMMSS.pdf`
2. **Charts** - PNG images di `reports/charts/`

## 🛠️ Troubleshooting

### API Error
Cek apakah API token valid di dashboard Clarity.

### Cron tidak jalan
```bash
# Cek cron service
sudo systemctl status cron

# Cek log sistem
grep CRON /var/log/syslog
```

### Python module not found
Pastikan install dengan python versi yang sama:
```bash
which python3  # Cek path
/usr/bin/python3 -m pip install -r requirements.txt
```
