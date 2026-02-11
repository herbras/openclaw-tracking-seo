#!/bin/bash
# Script untuk setup cron job automasi laporan Clarity

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_CMD=$(which python3)

echo "======================================"
echo "Clarity Report Cron Setup"
echo "======================================"
echo ""
echo "Pilihan jadwal automasi:"
echo ""
echo "1) Setiap Hari Rabu jam 09:00 (Weekly Report)"
echo "2) Setiap Hari Sabtu jam 10:00 (Weekend Report)"
echo "3) Rabu + Sabtu (Weekly + Weekend)"
echo "4) Setiap Hari kerja (Senin-Jumat) jam 08:00"
echo "5) Custom (masukkan sendiri)"
echo "6) Hapus semua cron job"
echo ""
read -p "Pilih jadwal (1-6): " choice

# Get current crontab
current_cron=$(crontab -l 2>/dev/null || echo "")

# Remove old clarity cron entries
new_cron=$(echo "$current_cron" | grep -v "clarity_report.py" || true)

case $choice in
    1)
        # Rabu jam 9 pagi
        cron_line="0 9 * * 3 cd $SCRIPT_DIR && $PYTHON_CMD clarity_report.py >> $SCRIPT_DIR/logs/cron.log 2>&1"
        echo ""
        echo "Setting: Setiap Rabu jam 09:00"
        ;;
    2)
        # Sabtu jam 10 pagi
        cron_line="0 10 * * 6 cd $SCRIPT_DIR && $PYTHON_CMD clarity_report.py >> $SCRIPT_DIR/logs/cron.log 2>&1"
        echo ""
        echo "Setting: Setiap Sabtu jam 10:00"
        ;;
    3)
        # Rabu + Sabtu
        cron_line1="0 9 * * 3 cd $SCRIPT_DIR && $PYTHON_CMD clarity_report.py >> $SCRIPT_DIR/logs/cron.log 2>&1"
        cron_line2="0 10 * * 6 cd $SCRIPT_DIR && $PYTHON_CMD clarity_report.py >> $SCRIPT_DIR/logs/cron.log 2>&1"
        echo ""
        echo "Setting: Rabu jam 09:00 + Sabtu jam 10:00"
        ;;
    4)
        # Senin-Jumat jam 8 pagi
        cron_line="0 8 * * 1-5 cd $SCRIPT_DIR && $PYTHON_CMD clarity_report.py >> $SCRIPT_DIR/logs/cron.log 2>&1"
        echo ""
        echo "Setting: Senin-Jumat jam 08:00"
        ;;
    5)
        # Custom
        echo ""
        echo "Format cron: min hour day month weekday"
        echo "Contoh: 0 9 * * 3 (Rabu jam 9)"
        read -p "Masukkan cron expression: " custom_cron
        cron_line="$custom_cron cd $SCRIPT_DIR && $PYTHON_CMD clarity_report.py >> $SCRIPT_DIR/logs/cron.log 2>&1"
        echo ""
        echo "Setting: $custom_cron"
        ;;
    6)
        # Hapus semua
        echo ""
        echo "Menghapus semua Clarity cron job..."
        echo "$new_cron" | crontab -
        echo "Done! Semua cron job telah dihapus."
        exit 0
        ;;
    *)
        echo "Pilihan tidak valid"
        exit 1
        ;;
esac

# Add new cron line(s)
if [ -n "$cron_line" ]; then
    new_cron="$new_cron
$cron_line"
fi

if [ -n "$cron_line1" ]; then
    new_cron="$new_cron
$cron_line1
$cron_line2"
fi

# Install new crontab
echo "$new_cron" | crontab -

echo ""
echo "======================================"
echo "Cron job berhasil di-setup!"
echo "======================================"
echo ""
echo "Cron aktif:"
crontab -l | grep "clarity_report.py"
echo ""
echo "Log tersimpan di: $SCRIPT_DIR/logs/cron.log"
echo ""
echo "Cek log dengan: tail -f $SCRIPT_DIR/logs/cron.log"
echo ""
