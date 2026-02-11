#!/usr/bin/env python3
"""
Microsoft Clarity Automated Report Generator
Script untuk mengambil data dari Microsoft Clarity dan generate laporan PDF
"""

import os
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
import matplotlib.pyplot as plt
import pandas as pd
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
CLARITY_API_TOKEN = os.getenv("CLARITY_API_TOKEN")
CLARITY_PROJECT_ID = os.getenv("CLARITY_PROJECT_ID", "default")
PROJECT_NAME = os.getenv("PROJECT_NAME", "My Website")
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./reports"))


class ClarityReportGenerator:
    """Generator untuk laporan Microsoft Clarity"""

    def __init__(self, api_token, project_id, project_name):
        self.api_token = api_token
        self.project_id = project_id
        self.project_name = project_name
        self.base_url = "https://www.clarity.ms/Stats/API"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        self.data = {}

    def fetch_analytics(self, start_date=None, end_date=None):
        """
        Fetch analytics data dari Clarity

        Args:
            start_date: Start date (datetime object)
            end_date: End date (datetime object)
        """
        if not start_date:
            # Default: 7 hari terakhir
            start_date = datetime.now() - timedelta(days=7)
        if not end_date:
            end_date = datetime.now()

        print(f"Fetching data dari {start_date.strftime('%Y-%m-%d')} sampai {end_date.strftime('%Y-%m-%d')}...")

        # Format dates untuk API
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        # Clarity API endpoints yang tersedia
        # Note: Struktur API bisa berbeda, sesuaikan dengan dokumentasi resmi
        try:
            # Endpoint dasar untuk mendapatkan statistik
            stats_url = f"{self.base_url}/Query"
            payload = {
                "projectId": self.project_id,
                "startDate": start_str,
                "endDate": end_str,
                "metrics": ["pageViews", "sessions", "uniqueUsers", "bounceRate", "avgDuration"]
            }

            response = requests.post(stats_url, json=payload, headers=self.headers, timeout=30)

            if response.status_code == 200:
                self.data = response.json()
                print("Data berhasil diambil!")
                return True
            else:
                print(f"Error: {response.status_code} - {response.text}")
                # Simpan data dummy untuk testing
                self._generate_dummy_data(start_date, end_date)
                return False

        except Exception as e:
            print(f"Exception saat fetch data: {e}")
            self._generate_dummy_data(start_date, end_date)
            return False

    def _generate_dummy_data(self, start_date, end_date):
        """Generate dummy data untuk testing jika API gagal"""
        print("Menggunakan dummy data untuk testing...")

        # Generate dates range
        dates = pd.date_range(start=start_date, end=end_date, freq='D')

        self.data = {
            "period": {
                "start": start_date.strftime("%Y-%m-%d"),
                "end": end_date.strftime("%Y-%m-%d")
            },
            "metrics": {
                "pageViews": 15420,
                "sessions": 8750,
                "uniqueUsers": 5200,
                "bounceRate": 42.5,
                "avgDuration": 185  # detik
            },
            "daily": {
                "dates": [d.strftime("%Y-%m-%d") for d in dates],
                "pageViews": [1000 + i*50 + (i%3)*100 for i in range(len(dates))],
                "sessions": [500 + i*25 + (i%4)*50 for i in range(len(dates))],
                "users": [300 + i*15 + (i%5)*30 for i in range(len(dates))]
            },
            "topPages": [
                {"url": "/", "views": 5200, "avgTime": 120},
                {"url": "/blog", "views": 2100, "avgTime": 245},
                {"url": "/products", "views": 1800, "avgTime": 310},
                {"url": "/about", "views": 850, "avgTime": 95},
                {"url": "/contact", "views": 420, "avgTime": 180}
            ],
            "devices": {
                "Desktop": 55,
                "Mobile": 38,
                "Tablet": 7
            },
            "browsers": {
                "Chrome": 62,
                "Safari": 18,
                "Edge": 12,
                "Firefox": 8
            }
        }

    def create_charts(self, output_dir):
        """Buat chart visualisasi dan simpan ke file"""
        charts = []

        # 1. Line Chart - Daily Page Views & Sessions
        fig, ax = plt.subplots(figsize=(10, 5))
        x = range(len(self.data["daily"]["dates"]))

        ax.plot(x, self.data["daily"]["pageViews"], marker='o', label='Page Views', linewidth=2)
        ax.plot(x, self.data["daily"]["sessions"], marker='s', label='Sessions', linewidth=2)

        ax.set_xlabel('Tanggal')
        ax.set_ylabel('Jumlah')
        ax.set_title('Daily Performance - Page Views & Sessions')
        ax.legend()
        ax.grid(True, alpha=0.3)

        # Set x-axis labels
        step = max(1, len(x) // 7)
        ax.set_xticks(x[::step])
        ax.set_xticklabels([self.data["daily"]["dates"][i][5:] for i in x[::step]], rotation=45)

        chart1_path = output_dir / "chart_daily_performance.png"
        plt.tight_layout()
        plt.savefig(chart1_path, dpi=150, bbox_inches='tight')
        plt.close()
        charts.append(("daily_performance", chart1_path))

        # 2. Pie Chart - Devices
        fig, ax = plt.subplots(figsize=(8, 8))
        devices = self.data["devices"]
        colors_list = ['#3498db', '#e74c3c', '#2ecc71']
        wedges, texts, autotexts = ax.pie(
            devices.values(),
            labels=devices.keys(),
            autopct='%1.1f%%',
            colors=colors_list,
            startangle=90
        )
        ax.set_title('Traffic by Device Type')

        chart2_path = output_dir / "chart_devices.png"
        plt.tight_layout()
        plt.savefig(chart2_path, dpi=150, bbox_inches='tight')
        plt.close()
        charts.append(("devices", chart2_path))

        # 3. Bar Chart - Top Pages
        fig, ax = plt.subplots(figsize=(10, 6))
        top_pages = self.data["topPages"][:10]
        pages = [p["url"][:30] + "..." if len(p["url"]) > 30 else p["url"] for p in top_pages]
        views = [p["views"] for p in top_pages]

        bars = ax.barh(pages, views, color='#3498db')
        ax.set_xlabel('Page Views')
        ax.set_title('Top Pages by Views')
        ax.invert_yaxis()

        # Add value labels
        for bar, val in zip(bars, views):
            ax.text(val, bar.get_y() + bar.get_height()/2, f'{val:,}', va='center', fontsize=9)

        chart3_path = output_dir / "chart_top_pages.png"
        plt.tight_layout()
        plt.savefig(chart3_path, dpi=150, bbox_inches='tight')
        plt.close()
        charts.append(("top_pages", chart3_path))

        # 4. Pie Chart - Browsers
        fig, ax = plt.subplots(figsize=(8, 8))
        browsers = self.data["browsers"]
        colors_list = ['#4285f4', '#00d084', '#0078d4', '#ff7139']
        wedges, texts, autotexts = ax.pie(
            browsers.values(),
            labels=browsers.keys(),
            autopct='%1.1f%%',
            colors=colors_list,
            startangle=90
        )
        ax.set_title('Traffic by Browser')

        chart4_path = output_dir / "chart_browsers.png"
        plt.tight_layout()
        plt.savefig(chart4_path, dpi=150, bbox_inches='tight')
        plt.close()
        charts.append(("browsers", chart4_path))

        return charts

    def generate_pdf_report(self, output_path):
        """Generate PDF report lengkap"""
        print(f"Generating PDF report: {output_path}")

        # Create output directory
        output_path.parent.mkdir(parents=True, exist_ok=True)
        charts_dir = output_path.parent / "charts"
        charts_dir.mkdir(exist_ok=True)

        # Create charts
        charts = self.create_charts(charts_dir)

        # Setup PDF
        doc = SimpleDocTemplate(str(output_path), pagesize=A4)
        story = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#7f8c8d'),
            spaceAfter=20,
            alignment=TA_CENTER
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2c3e50'),
            spaceBefore=15,
            spaceAfter=10
        )

        # Title
        story.append(Paragraph(f"<b>{self.project_name}</b>", title_style))
        story.append(Paragraph(
            f"Microsoft Clarity Analytics Report<br/>"
            f"{self.data['period']['start']} to {self.data['period']['end']}",
            subtitle_style
        ))
        story.append(Spacer(1, 0.3*inch))

        # Summary Metrics Table
        story.append(Paragraph("<b>Key Metrics Summary</b>", heading_style))

        metrics = self.data["metrics"]
        summary_data = [
            ["Metric", "Value"],
            ["Total Page Views", f"{metrics['pageViews']:,}"],
            ["Total Sessions", f"{metrics['sessions']:,}"],
            ["Unique Users", f"{metrics['uniqueUsers']:,}"],
            ["Bounce Rate", f"{metrics['bounceRate']}%"],
            ["Avg. Duration", f"{metrics['avgDuration']}s"]
        ]

        summary_table = Table(summary_data, colWidths=[3*inch, 2.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.3*inch))

        # Daily Performance Chart
        story.append(Paragraph("<b>Daily Performance Trend</b>", heading_style))
        for name, path in charts:
            if name == "daily_performance":
                img = Image(str(path), width=6*inch, height=3*inch)
                story.append(img)
                break
        story.append(Spacer(1, 0.2*inch))

        # Device Breakdown
        story.append(Paragraph("<b>Traffic by Device</b>", heading_style))
        for name, path in charts:
            if name == "devices":
                img = Image(str(path), width=4*inch, height=4*inch)
                story.append(img)
                break
        story.append(Spacer(1, 0.2*inch))

        # Top Pages Chart
        story.append(Paragraph("<b>Top Pages</b>", heading_style))
        for name, path in charts:
            if name == "top_pages":
                img = Image(str(path), width=6*inch, height=3.5*inch)
                story.append(img)
                break
        story.append(Spacer(1, 0.2*inch))

        # Browser Breakdown
        story.append(Paragraph("<b>Traffic by Browser</b>", heading_style))
        for name, path in charts:
            if name == "browsers":
                img = Image(str(path), width=4*inch, height=4*inch)
                story.append(img)
                break
        story.append(Spacer(1, 0.2*inch))

        # Top Pages Table
        story.append(PageBreak())
        story.append(Paragraph("<b>Top Pages Details</b>", heading_style))

        top_pages_data = [["URL", "Views", "Avg Time"]]
        for page in self.data["topPages"]:
            top_pages_data.append([
                page["url"],
                f"{page['views']:,}",
                f"{page['avgTime']}s"
            ])

        top_pages_table = Table(top_pages_data, colWidths=[3.5*inch, 1.5*inch, 1*inch])
        top_pages_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9)
        ]))
        story.append(top_pages_table)

        # Footer
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(
            f"<font size='8' color='gray'>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</font>",
            ParagraphStyle('Footer', parent=styles['Normal'], alignment=TA_CENTER)
        ))

        # Build PDF
        doc.build(story)
        print(f"PDF report berhasil dibuat: {output_path}")
        return output_path


def main():
    """Main function untuk menjalankan report generator"""
    print("=" * 60)
    print("Microsoft Clarity Automated Report Generator")
    print("=" * 60)

    # Validate config
    if not CLARITY_API_TOKEN:
        print("Warning: CLARITY_API_TOKEN tidak ditemukan di .env")
        print("Menggunakan dummy data untuk testing...\n")

    # Setup output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Initialize generator
    generator = ClarityReportGenerator(
        api_token=CLARITY_API_TOKEN or "dummy",
        project_id=CLARITY_PROJECT_ID,
        project_name=PROJECT_NAME
    )

    # Fetch data
    generator.fetch_analytics()

    # Generate PDF
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = OUTPUT_DIR / f"clarity_report_{timestamp}.pdf"

    generator.generate_pdf_report(output_path)

    print("=" * 60)
    print("Selesai! Report tersimpan di:", output_path)
    print("=" * 60)


if __name__ == "__main__":
    main()
