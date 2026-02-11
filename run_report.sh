#!/bin/bash
# Script untuk menjalankan Clarity report generator

# Go to project directory
cd "$(dirname "$0")"

# Create logs directory if not exists
mkdir -p logs

# Activate UV virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Get report type (default: weekly)
REPORT_TYPE="${1:-weekly}"

# Run the report
echo "======================================"
echo "Running Clarity Report Generator"
echo "Type: $REPORT_TYPE"
echo "Date: $(date)"
echo "======================================"

python clarity_advanced_report.py --type "$REPORT_TYPE"

echo "Report completed at: $(date)"
echo "======================================"
