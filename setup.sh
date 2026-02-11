#!/bin/bash
# Setup script untuk Clarity MCP Server dan Python dependencies

echo "======================================"
echo "Clarity Analytics Learner Setup"
echo "======================================"

# Check if UV is installed
if ! command -v uv &> /dev/null; then
    echo "UV tidak ditemukan. Installing UV..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Install Python dependencies with UV
echo ""
echo "Installing Python dependencies dengan UV..."
uv pip install -r requirements.txt

# Check if Node.js/npx is available
if ! command -v npx &> /dev/null; then
    echo ""
    echo "WARNING: npx tidak ditemukan."
    echo "Install Node.js terlebih dahulu untuk menggunakan Clarity MCP Server."
    echo ""
    echo "Untuk Arch Linux:"
    echo "  sudo pacman -S nodejs npm"
fi

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p reports logs

# Setup .env file if not exists
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  SILAKAN EDIT .env dan masukkan API TOKEN CLARITY KAMU!"
    echo "   nano .env"
fi

echo ""
echo "======================================"
echo "Setup Selesai!"
echo "======================================"
echo ""
echo "Langkah selanjutnya:"
echo "1. Edit .env dan isi CLARITY_API_TOKEN"
echo "2. Test run: ./run_report.sh"
echo "3. Setup cron job untuk automasi"
echo ""
