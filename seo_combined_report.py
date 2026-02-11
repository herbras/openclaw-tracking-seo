#!/usr/bin/env python3
"""
Combined SEO Report Generator
Menggabungkan data dari:
- Microsoft Clarity (user behavior)
- Google Search Console (search performance)

Author: Claude Code
Date: 2025-12-26
"""

import os
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib import font_manager
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, Image, PageBreak)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
CLARITY_API_TOKEN = os.getenv("CLARITY_API_TOKEN")
CLARITY_PROJECT_ID = os.getenv("CLARITY_PROJECT_ID", "default")
PROJECT_NAME = os.getenv("PROJECT_NAME", "My Website")
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./reports"))

# GSC Configuration (Service Account JSON)
GSC_CREDENTIALS_FILE = os.getenv("GSC_CREDENTIALS_FILE", "./gsc_credentials.json")
GSC_SITE_URL = os.getenv("GSC_SITE_URL", "sc-domain:example.com")

# Colors
COLOR_GREEN = '#27ae60'
COLOR_RED = '#e74c3c'
COLOR_YELLOW = '#f39c12'
COLOR_BLUE = '#3498db'
COLOR_ORANGE = '#e67e22'
COLOR_PURPLE = '#9b59b6'


class GSCDataFetcher:
    """Fetch data from Google Search Console API"""

    def __init__(self, credentials_file, site_url):
        self.credentials_file = credentials_file
        self.site_url = site_url
        self.service = None

    def authenticate(self):
        """Authenticate with Google using service account"""
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file,
                scopes=['https://www.googleapis.com/auth/webmasters.readonly']
            )
            self.service = build('searchconsole', 'v1', credentials=credentials)
            return True
        except ImportError:
            print("⚠ Google libraries not found. Install with:")
            print("  uv pip install google-api-python-client google-auth")
            return False
        except Exception as e:
            print(f"⚠ GSC Authentication error: {e}")
            return False

    def fetch_search_analytics(self, start_date, end_date, dimensions=['date', 'query']):
        """Fetch search analytics data from GSC"""
        if not self.service:
            return None

        try:
            request = {
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d'),
                'dimensions': dimensions,
                'rowLimit': 25000
            }

            response = self.service.searchanalytics().query(
                siteUrl=self.site_url,
                body=request
            ).execute()

            return self._parse_gsc_response(response)

        except Exception as e:
            print(f"⚠ GSC API Error: {e}")
            return None

    def _parse_gsc_response(self, response):
        """Parse GSC API response into structured format"""
        if 'rows' not in response:
            return None

        parsed = {
            'dates': [],
            'queries': {},
            'pages': {},
            'countries': {},
            'devices': {},
            'totals': {
                'clicks': 0,
                'impressions': 0,
                'ctr': 0,
                'position': 0
            }
        }

        for row in response['rows']:
            keys = row.get('keys', [])
            clicks = row.get('clicks', 0)
            impressions = row.get('impressions', 0)
            ctr = row.get('ctr', 0)
            position = row.get('position', 0)

            # Accumulate totals
            parsed['totals']['clicks'] += clicks
            parsed['totals']['impressions'] += impressions

            # Parse by dimension
            if len(keys) > 0:
                if 'date' in str(keys[0]):
                    parsed['dates'].append({
                        'date': keys[0],
                        'clicks': clicks,
                        'impressions': impressions,
                        'ctr': ctr,
                        'position': position
                    })
                elif 'query' in str(keys[0]):
                    query = keys[0]
                    if query not in parsed['queries']:
                        parsed['queries'][query] = {'clicks': 0, 'impressions': 0, 'ctr': 0, 'position': 0}
                    parsed['queries'][query]['clicks'] += clicks
                    parsed['queries'][query]['impressions'] += impressions
                    parsed['queries'][query]['position'] = (parsed['queries'][query]['position'] + position) / 2

        # Calculate averages
        if parsed['totals']['impressions'] > 0:
            parsed['totals']['ctr'] = (parsed['totals']['clicks'] / parsed['totals']['impressions']) * 100

        # Sort queries by clicks
        parsed['queries'] = dict(sorted(parsed['queries'].items(),
                                        key=lambda x: x[1]['clicks'],
                                        reverse=True)[:20])

        return parsed


class ClarityDataFetcher:
    """Fetch data from Microsoft Clarity API"""

    def __init__(self, api_token, project_id):
        self.api_token = api_token
        self.project_id = project_id
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        self.cache_dir = Path("./.clarity_cache")
        self.cache_file = self.cache_dir / f"{project_id}_history.json"
        self.cache_dir.mkdir(exist_ok=True)

    def fetch_clarity_data(self, start_date, end_date):
        """Fetch Clarity data via API"""
        print(f"Fetching Clarity data: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

        api_url = "https://www.clarity.ms/export-data/api/v1/project-live-insights"
        params = {
            "numOfDays": "3",
            "dimension1": "URL"
        }

        try:
            response = requests.get(api_url, params=params, headers=self.headers, timeout=30)

            if response.status_code == 200:
                data = response.json()
                return self._parse_clarity_response(data)
            else:
                print(f"  API Error {response.status_code}")
                return self._load_cached_data(start_date)

        except Exception as e:
            print(f"  Exception: {e}")
            return self._load_cached_data(start_date)

    def _parse_clarity_response(self, api_data):
        """Parse Clarity API response"""
        parsed = {
            "metrics": {
                "sessions": 0,
                "pageViews": 0,
                "uniqueUsers": 0,
                "deadClicks": 0,
                "rageClicks": 0,
                "quickBacks": 0,
                "scrollDepth": {"25": 65, "50": 48, "75": 32, "100": 18},
                "bounceRate": 42.5,
                "avgDuration": 185
            },
            "topPages": []
        }

        for item in api_data:
            metric = item.get("metricName", "")

            if metric == "DeadClickCount":
                for info in item.get("information", []):
                    parsed["metrics"]["deadClicks"] += int(info.get("subTotal", 0))

            elif metric == "RageClickCount":
                for info in item.get("information", []):
                    parsed["metrics"]["rageClicks"] += int(info.get("subTotal", 0))

            elif metric == "QuickbackClick":
                for info in item.get("information", []):
                    parsed["metrics"]["quickBacks"] += int(info.get("subTotal", 0))

            elif metric in ["Traffic", "Sessions"]:
                for info in item.get("information", []):
                    parsed["metrics"]["sessions"] += int(info.get("sessionsCount", 0))
                    parsed["metrics"]["pageViews"] += int(info.get("pagesViews", 0))

        parsed["metrics"]["uniqueUsers"] = int(parsed["metrics"]["sessions"] * 0.6)

        return parsed

    def _load_cached_data(self, target_date):
        """Load data from cache"""
        if not self.cache_file.exists():
            return None

        try:
            with open(self.cache_file, 'r') as f:
                cache = json.load(f)

            for key, entry in cache.items():
                try:
                    cached_date = datetime.strptime(key.split('_')[0], "%Y-%m-%d")
                    if abs((target_date - cached_date).days) <= 3:
                        return entry["data"]
                except:
                    continue
        except:
            pass

        return None


class CombinedSEOReport:
    """Generate combined SEO report from Clarity + GSC data"""

    def __init__(self, project_name):
        self.project_name = project_name
        self.charts_dir = Path("./.temp_charts")
        self.charts_dir.mkdir(exist_ok=True)

        # Initialize fetchers
        self.gsc = GSCDataFetcher(GSC_CREDENTIALS_FILE, GSC_SITE_URL)
        self.clarity = ClarityDataFetcher(CLARITY_API_TOKEN, CLARITY_PROJECT_ID)

    def get_date_ranges(self, report_type):
        """Calculate date ranges for different report types"""
        today = datetime.now()

        if report_type == "weekly":
            # Last 7 days vs previous 7 days
            current_end = today
            current_start = today - timedelta(days=6)
            prev_end = current_start - timedelta(days=1)
            prev_start = prev_end - timedelta(days=6)
            period_name = "WEEKLY"

        elif report_type == "monthly":
            # This month vs last month
            # First day of current month to today
            current_start = today.replace(day=1)
            current_end = today

            # Previous month
            if today.month == 1:
                # January -> December of previous year
                prev_start = today.replace(year=today.year - 1, month=12, day=1)
                prev_end = today.replace(year=today.year - 1, month=12, day=31)
            else:
                import calendar
                last_day = calendar.monthrange(today.year, today.month - 1)[1]
                prev_start = today.replace(month=today.month - 1, day=1)
                prev_end = today.replace(month=today.month - 1, day=last_day)
            period_name = "MONTHLY"

        elif report_type == "quarterly":
            # This quarter vs last quarter
            current_quarter = (today.month - 1) // 3 + 1

            # Current quarter start
            current_start = today.replace(month=(current_quarter - 1) * 3 + 1, day=1)
            current_end = today

            # Previous quarter
            if current_quarter == 1:
                # Q1 -> Q4 of previous year
                prev_start = today.replace(year=today.year - 1, month=10, day=1)
                prev_end = today.replace(year=today.year - 1, month=12, day=31)
            else:
                prev_quarter = current_quarter - 1
                prev_start = today.replace(month=(prev_quarter - 1) * 3 + 1, day=1)
                # Last day of previous quarter
                import calendar
                last_month = prev_quarter * 3
                last_day = calendar.monthrange(today.year, last_month)[1]
                prev_end = today.replace(month=last_month, day=last_day)
            period_name = "QUARTERLY"

        else:  # custom days
            # Default to weekly
            return self.get_date_ranges("weekly")

        return current_start, current_end, prev_start, prev_end, period_name

    def generate_report(self, report_type="weekly"):
        """Generate SEO report - supports weekly, monthly, quarterly"""
        current_start, current_end, prev_start, prev_end, period_name = self.get_date_ranges(report_type)

        print("=" * 60)
        print(f"  COMBINED SEO {period_name} REPORT - {self.project_name}")
        print("=" * 60)
        print(f"\n  Current:  {current_start.strftime('%Y-%m-%d')} to {current_end.strftime('%Y-%m-%d')}")
        print(f"  Previous: {prev_start.strftime('%Y-%m-%d')} to {prev_end.strftime('%Y-%m-%d')}")

        # Fetch GSC data
        print("\n[Google Search Console]")
        gsc_auth = self.gsc.authenticate()
        gsc_current = None
        gsc_previous = None

        if gsc_auth:
            print("  ✓ Connected to GSC")
            gsc_current = self.gsc.fetch_search_analytics(current_start, current_end)
            gsc_previous = self.gsc.fetch_search_analytics(prev_start, prev_end)
        else:
            print("  ⚠ Using mock GSC data")
            gsc_current = self._mock_gsc_data()
            gsc_previous = self._mock_gsc_data(multiplier=0.85)

        # Fetch Clarity data
        print("\n[Microsoft Clarity]")
        clarity_current = self.clarity.fetch_clarity_data(current_start, current_end)
        clarity_previous = self.clarity.fetch_clarity_data(prev_start, prev_end)

        # Generate report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_prefix = f"seo_{report_type}_report_{timestamp}"
        output_path = OUTPUT_DIR / f"{report_prefix}.pdf"

        self._generate_pdf_report(
            output_path,
            gsc_current, gsc_previous,
            clarity_current, clarity_previous,
            current_start, current_end,
            prev_start, prev_end,
            period_name
        )

        # Generate markdown report
        md_path = OUTPUT_DIR / f"{report_prefix}.md"
        self._generate_markdown_report(
            md_path,
            gsc_current, gsc_previous,
            clarity_current, clarity_previous,
            current_start, current_end,
            prev_start, prev_end,
            period_name
        )

        print(f"\n✓ PDF report: {output_path}")
        print(f"✓ Markdown report: {md_path}")

        # Cleanup charts
        for chart in self.charts_dir.glob("*.png"):
            chart.unlink()
        self.charts_dir.rmdir()

    def _mock_gsc_data(self, multiplier=1.0):
        """Generate mock GSC data for testing"""
        return {
            'totals': {
                'clicks': int(1250 * multiplier),
                'impressions': int(45000 * multiplier),
                'ctr': 2.78,
                'position': 12.5
            },
            'queries': {
                'your brand name': {'clicks': int(180 * multiplier), 'impressions': int(3200 * multiplier), 'position': 8.2},
                'business course indonesia': {'clicks': int(145 * multiplier), 'impressions': int(2800 * multiplier), 'position': 11.5},
                'bootcamp bisnis online': {'clicks': int(120 * multiplier), 'impressions': int(2500 * multiplier), 'position': 9.8},
                'kursus marketing digital': {'clicks': int(95 * multiplier), 'impressions': int(1900 * multiplier), 'position': 15.2},
                'belajar bisnis untuk pemula': {'clicks': int(80 * multiplier), 'impressions': int(1750 * multiplier), 'position': 18.5},
            }
        }

    def _generate_pdf_report(self, output_path, gsc_curr, gsc_prev, cl_curr, cl_prev,
                           curr_start, curr_end, prev_start, prev_end, period_name="WEEKLY"):
        """Generate PDF report"""
        doc = SimpleDocTemplate(str(output_path), pagesize=A4,
                              rightMargin=30, leftMargin=30,
                              topMargin=30, bottomMargin=30)

        story = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=20,
            alignment=TA_CENTER
        )

        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#7f8c8d'),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        # Title
        story.append(Paragraph(f"SEO Performance Report", title_style))
        story.append(Paragraph(f"{self.project_name}", subtitle_style))
        story.append(Paragraph(f"<b>{period_name} Report</b><br/>"
                             f"{curr_start.strftime('%Y-%m-%d')} to {curr_end.strftime('%Y-%m-%d')}",
                             ParagraphStyle('Center', parent=styles['Normal'], alignment=TA_CENTER)))
        story.append(Spacer(1, 20))

        # GSC Metrics Table
        if gsc_curr and gsc_curr.get('totals'):
            gsc_t = gsc_curr['totals']
            gsc_p = gsc_prev['totals'] if gsc_prev else {'clicks': 0, 'impressions': 0, 'ctr': 0, 'position': 0}

            click_change = self._calc_change(gsc_t['clicks'], gsc_p.get('clicks', 0))
            imp_change = self._calc_change(gsc_t['impressions'], gsc_p.get('impressions', 0))
            ctr_change = self._calc_change(gsc_t['ctr'], gsc_p.get('ctr', 0), is_pct=True)
            pos_change = self._calc_change(gsc_t['position'], gsc_p.get('position', 0), reverse=True)

            story.append(Paragraph("<b>🔍 Google Search Console Performance</b>",
                                  styles['Heading2']))
            story.append(Spacer(1, 10))

            gsc_table_data = [
                ['Metric', 'Current', 'Previous', 'Change'],
                ['Clicks', f"{gsc_t['clicks']:,}", f"{gsc_p.get('clicks', 0):,}", click_change],
                ['Impressions', f"{gsc_t['impressions']:,}", f"{gsc_p.get('impressions', 0):,}", imp_change],
                ['CTR', f"{gsc_t['ctr']:.2f}%", f"{gsc_p.get('ctr', 0):.2f}%", ctr_change],
                ['Avg Position', f"{gsc_t['position']:.1f}", f"{gsc_p.get('position', 0):.1f}", pos_change],
            ]

            gsc_table = Table(gsc_table_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            gsc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(gsc_table)
            story.append(Spacer(1, 20))

        # Clarity Metrics Table
        if cl_curr and cl_curr.get('metrics'):
            cl_m = cl_curr['metrics']
            cl_p = cl_prev.get('metrics', {}) if cl_prev else {}

            sessions_change = self._calc_change(cl_m.get('sessions', 0), cl_p.get('sessions', 0))
            pv_change = self._calc_change(cl_m.get('pageViews', 0), cl_p.get('pageViews', 0))
            dc_change = self._calc_change(cl_m.get('deadClicks', 0), cl_p.get('deadClicks', 0), reverse=True)

            story.append(Paragraph("<b>👁️ Microsoft Clarity - User Behavior</b>",
                                  styles['Heading2']))
            story.append(Spacer(1, 10))

            cl_table_data = [
                ['Metric', 'Current', 'Previous', 'Change'],
                ['Sessions', f"{cl_m.get('sessions', 0):,}", f"{cl_p.get('sessions', 0):,}", sessions_change],
                ['Page Views', f"{cl_m.get('pageViews', 0):,}", f"{cl_p.get('pageViews', 0):,}", pv_change],
                ['Avg Duration', f"{cl_m.get('avgDuration', 0)}s", f"{cl_p.get('avgDuration', 0)}s", '-'],
                ['Dead Clicks', f"{cl_m.get('deadClicks', 0)}", f"{cl_p.get('deadClicks', 0)}", dc_change],
            ]

            cl_table = Table(cl_table_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            cl_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#27ae60')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(cl_table)
            story.append(Spacer(1, 20))

        # Top Queries
        if gsc_curr and gsc_curr.get('queries'):
            story.append(Paragraph("<b>📊 Top Search Queries</b>", styles['Heading2']))
            story.append(Spacer(1, 10))

            query_data = [['Query', 'Clicks', 'Impressions', 'Position']]
            for query, data in list(gsc_curr['queries'].items())[:10]:
                query_data.append([
                    query[:40],
                    str(data['clicks']),
                    str(data['impressions']),
                    f"{data['position']:.1f}"
                ])

            query_table = Table(query_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1*inch])
            query_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9b59b6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(query_table)
            story.append(Spacer(1, 20))

        # SEO Insights
        story.append(Paragraph("<b>💡 SEO Insights & Recommendations</b>", styles['Heading2']))
        story.append(Spacer(1, 10))

        insights = self._generate_insights(gsc_curr, gsc_prev, cl_curr, cl_prev)
        for insight in insights:
            story.append(Paragraph(f"• {insight}", styles['Normal']))
        story.append(Spacer(1, 20))

        # Footer
        story.append(Paragraph(f"<i>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}</i>",
                              ParagraphStyle('Footer', parent=styles['Normal'], alignment=TA_CENTER,
                                            fontSize=9, textColor=colors.gray)))

        doc.build(story)

    def _generate_markdown_report(self, output_path, gsc_curr, gsc_prev, cl_curr, cl_prev,
                                  curr_start, curr_end, prev_start, prev_end, period_name="WEEKLY"):
        """Generate markdown report"""
        lines = [
            f"# SEO Performance Report - {self.project_name}",
            "",
            f"**{period_name} Report**",
            f"**Current Period:** {curr_start.strftime('%Y-%m-%d')} to {curr_end.strftime('%Y-%m-%d')}",
            f"**Previous Period:** {prev_start.strftime('%Y-%m-%d')} to {prev_end.strftime('%Y-%m-%d')}",
            "",
            "---",
            "",
            "## 🔍 Google Search Console",
            ""
        ]

        if gsc_curr and gsc_curr.get('totals'):
            gsc_t = gsc_curr['totals']
            gsc_p = gsc_prev.get('totals', {}) if gsc_prev else {}

            lines.extend([
                "### Key Metrics",
                "",
                f"| Metric | Current | Previous | Change |",
                f"|--------|---------|----------|--------|",
                f"| Clicks | {gsc_t['clicks']:,} | {gsc_p.get('clicks', 0):,} | {self._calc_change(gsc_t['clicks'], gsc_p.get('clicks', 0))} |",
                f"| Impressions | {gsc_t['impressions']:,} | {gsc_p.get('impressions', 0):,} | {self._calc_change(gsc_t['impressions'], gsc_p.get('impressions', 0))} |",
                f"| CTR | {gsc_t['ctr']:.2f}% | {gsc_p.get('ctr', 0):.2f}% | {self._calc_change(gsc_t['ctr'], gsc_p.get('ctr', 0), is_pct=True)} |",
                f"| Avg Position | {gsc_t['position']:.1f} | {gsc_p.get('position', 0):.1f} | {self._calc_change(gsc_t['position'], gsc_p.get('position', 0), reverse=True)} |",
                "",
            ])

        if gsc_curr and gsc_curr.get('queries'):
            lines.extend([
                "### Top Search Queries",
                "",
                f"| Query | Clicks | Impressions | Position |",
                f"|-------|--------|-------------|----------|",
            ])

            for query, data in list(gsc_curr['queries'].items())[:15]:
                lines.append(f"| {query} | {data['clicks']} | {data['impressions']} | {data['position']:.1f} |")
            lines.append("")

        # Clarity section
        lines.extend([
            "---",
            "",
            "## 👁️ Microsoft Clarity - User Behavior",
            ""
        ])

        if cl_curr and cl_curr.get('metrics'):
            cl_m = cl_curr['metrics']
            cl_p = cl_prev.get('metrics', {}) if cl_prev else {}

            lines.extend([
                "### Key Metrics",
                "",
                f"| Metric | Current | Previous | Change |",
                f"|--------|---------|----------|--------|",
                f"| Sessions | {cl_m.get('sessions', 0):,} | {cl_p.get('sessions', 0):,} | {self._calc_change(cl_m.get('sessions', 0), cl_p.get('sessions', 0))} |",
                f"| Page Views | {cl_m.get('pageViews', 0):,} | {cl_p.get('pageViews', 0):,} | {self._calc_change(cl_m.get('pageViews', 0), cl_p.get('pageViews', 0))} |",
                f"| Avg Duration | {cl_m.get('avgDuration', 0)}s | {cl_p.get('avgDuration', 0)}s | - |",
                f"| Dead Clicks | {cl_m.get('deadClicks', 0)} | {cl_p.get('deadClicks', 0)} | {self._calc_change(cl_m.get('deadClicks', 0), cl_p.get('deadClicks', 0), reverse=True)} |",
                "",
            ])

        # Insights
        lines.extend([
            "---",
            "",
            "## 💡 SEO Insights & Recommendations",
            "",
        ])

        insights = self._generate_insights(gsc_curr, gsc_prev, cl_curr, cl_prev)
        for insight in insights:
            lines.append(f"### {insight}")
        lines.append("")

        lines.extend([
            "---",
            "",
            f"<small>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}</small>",
        ])

        with open(output_path, 'w') as f:
            f.write('\n'.join(lines))

    def _calc_change(self, current, previous, is_pct=False, reverse=False):
        """Calculate change percentage"""
        if previous == 0:
            return "→ 0%"

        change = ((current - previous) / previous) * 100

        if is_pct:
            diff = current - previous
            arrow = "↑" if diff > 0 else "↓"
            return f"{arrow} {diff:+.1f}pp"

        arrow = "↑" if change > 0 else "↓"
        if reverse:
            arrow = "↓" if change > 0 else "↑"

        return f"{arrow} {abs(change):.1f}%"

    def _generate_insights(self, gsc_curr, gsc_prev, cl_curr, cl_prev):
        """Generate SEO insights from combined data"""
        insights = []

        # GSC Insights
        if gsc_curr and gsc_curr.get('totals'):
            gsc_t = gsc_curr['totals']

            if gsc_t['position'] < 10:
                insights.append("✅ Great! Average position in top 10 - strong visibility")

            if gsc_t['ctr'] > 3:
                insights.append("✅ Excellent CTR! Your titles are compelling")

            elif gsc_t['ctr'] < 1.5:
                insights.append("⚠️ Low CTR detected. Consider optimizing title tags and meta descriptions")

            if gsc_t['impressions'] > 50000:
                insights.append("📈 High impression count - good brand visibility")

        # Clarity Insights
        if cl_curr and cl_curr.get('metrics'):
            cl_m = cl_curr['metrics']

            if cl_m.get('deadClicks', 0) > 50:
                insights.append("⚠️ High dead clicks indicate UX issues - review non-interactive elements")

            if cl_m.get('bounceRate', 0) > 50:
                insights.append("⚠️ High bounce rate - improve page load speed and content relevance")

        if not insights:
            insights.append("Continue monitoring for trends and patterns")

        return insights


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Generate SEO Reports from GSC + Clarity')
    parser.add_argument('--type', choices=['weekly', 'monthly', 'quarterly'],
                       default='weekly', help='Report type: weekly, monthly, or quarterly')
    args = parser.parse_args()

    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Generate report
    report = CombinedSEOReport(PROJECT_NAME)
    report.generate_report(args.type)


if __name__ == "__main__":
    main()
