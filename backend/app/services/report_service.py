"""
Professional PDF Report Generation Service for GreenVision
Restricted Scope: Madurai District, Tamil Nadu, India Only

Generates publication-quality, multi-page environmental PDF assessment reports
using ReportLab, including:
1. Executive Header & Geospatial Scope (Madurai District, EPSG:32644 UTM 44N)
2. Satellite Ingestion & Multi-Spectral Metadata
3. Executive KPI Summary Cards / Tables
4. 5-Tier Vegetation Classification Breakdown
5. Embedded High-Resolution Colorized NDVI Maps & Frequency Histograms
6. Bi-Temporal Change Detection & Transition Matrix (for multi-year audits)
7. Environmental Policy Recommendations & Urban Greening Directives
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List
import os

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    KeepTogether,
    PageBreak,
    HRFlowable,
)
from reportlab.pdfgen import canvas

from app.config import get_settings
from app.core.logging import logger

settings = get_settings()


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page count,
    running headers, and running footers with GreenVision branding.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1b5e20"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(
                40,
                815,
                "GreenVision™ – Satellite Urban Vegetation Intelligence & Green-Cover Assessment"
            )
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#546e7a"))
            self.drawRightString(
                555,
                815,
                "Madurai District, Tamil Nadu (EPSG:32644)"
            )
            self.setStrokeColor(colors.HexColor("#a5d6a7"))
            self.setLineWidth(0.75)
            self.line(40, 808, 555, 808)

        # Running Footer (all pages)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#78909c"))
        self.drawString(
            40,
            30,
            "Official Environmental Intelligence Report • Copernicus Sentinel-2 / USGS Landsat Multi-Spectral Ingestion"
        )
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 30, page_str)
        self.setStrokeColor(colors.HexColor("#cfd8dc"))
        self.setLineWidth(0.5)
        self.line(40, 42, 555, 42)

        self.restoreState()


class ReportServiceError(Exception):
    """Exception raised during PDF report compilation."""
    pass


class ReportService:
    """Orchestrates professional PDF generation for Madurai District environmental audits."""

    @classmethod
    def _get_styles(cls) -> Dict[str, ParagraphStyle]:
        """Builds custom GreenVision typography styles."""
        styles = getSampleStyleSheet()

        brand_green = colors.HexColor("#1b5e20")
        accent_green = colors.HexColor("#2e7d32")
        charcoal = colors.HexColor("#263238")
        slate = colors.HexColor("#455a64")

        return {
            "DocTitle": ParagraphStyle(
                "DocTitle",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=20,
                leading=24,
                textColor=brand_green,
                spaceAfter=4,
            ),
            "DocSubtitle": ParagraphStyle(
                "DocSubtitle",
                parent=styles["Normal"],
                fontName="Helvetica",
                fontSize=10,
                leading=14,
                textColor=slate,
                spaceAfter=12,
            ),
            "SectionHeading": ParagraphStyle(
                "SectionHeading",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=13,
                leading=17,
                textColor=brand_green,
                spaceBefore=10,
                spaceAfter=6,
                keepWithNext=True,
            ),
            "Subheading": ParagraphStyle(
                "Subheading",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=10,
                leading=13,
                textColor=accent_green,
                spaceBefore=6,
                spaceAfter=4,
                keepWithNext=True,
            ),
            "Body": ParagraphStyle(
                "Body",
                parent=styles["Normal"],
                fontName="Helvetica",
                fontSize=9,
                leading=13,
                textColor=charcoal,
                spaceAfter=6,
            ),
            "BodyBold": ParagraphStyle(
                "BodyBold",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=9,
                leading=13,
                textColor=charcoal,
            ),
            "TableHead": ParagraphStyle(
                "TableHead",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=8.5,
                leading=11,
                textColor=colors.white,
                alignment=1,  # Center
            ),
            "TableCell": ParagraphStyle(
                "TableCell",
                parent=styles["Normal"],
                fontName="Helvetica",
                fontSize=8,
                leading=11,
                textColor=charcoal,
            ),
            "TableCellCenter": ParagraphStyle(
                "TableCellCenter",
                parent=styles["Normal"],
                fontName="Helvetica",
                fontSize=8,
                leading=11,
                textColor=charcoal,
                alignment=1,
            ),
            "TableCellRight": ParagraphStyle(
                "TableCellRight",
                parent=styles["Normal"],
                fontName="Helvetica",
                fontSize=8,
                leading=11,
                textColor=charcoal,
                alignment=2,
            ),
            "KpiNumber": ParagraphStyle(
                "KpiNumber",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=16,
                leading=19,
                textColor=brand_green,
                alignment=1,
            ),
            "KpiLabel": ParagraphStyle(
                "KpiLabel",
                parent=styles["Normal"],
                fontName="Helvetica",
                fontSize=7.5,
                leading=10,
                textColor=slate,
                alignment=1,
            ),
            "Caption": ParagraphStyle(
                "Caption",
                parent=styles["Normal"],
                fontName="Helvetica-Oblique",
                fontSize=7.5,
                leading=10,
                textColor=slate,
                alignment=1,
                spaceBefore=3,
                spaceAfter=6,
            ),
            "Notice": ParagraphStyle(
                "Notice",
                parent=styles["Normal"],
                fontName="Helvetica-Oblique",
                fontSize=8,
                leading=11,
                textColor=slate,
            ),
        }

    @classmethod
    def generate_ndvi_assessment_report(
        cls,
        analysis_id: int,
        analysis_dict: Dict[str, Any],
        scene_dict: Dict[str, Any],
        output_filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive multi-page NDVI Assessment Report for Madurai District.
        """
        logger.info(f"Generating PDF Assessment Report for NDVI Analysis #{analysis_id}...")

        if not output_filename:
            output_filename = f"GreenVision_Assessment_Report_Analysis_{analysis_id}.pdf"

        report_path = settings.REPORTS_DIR / output_filename
        styles = cls._get_styles()

        doc = SimpleDocTemplate(
            str(report_path),
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=46,
            bottomMargin=46,
        )

        story = []

        # -----------------------------------------------------------------
        # 1. Title Banner
        # -----------------------------------------------------------------
        story.append(Paragraph("GREENVISION™ URBAN VEGETATION INTELLIGENCE", styles["DocTitle"]))
        sub_text = (
            f"<b>Official Satellite-Based Green-Cover Assessment Report</b> • Madurai District, Tamil Nadu, India<br/>"
            f"Document Reference: <b>GV-MDU-NDVI-{analysis_id:04d}</b> | "
            f"Generated: {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}"
        )
        story.append(Paragraph(sub_text, styles["DocSubtitle"]))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1b5e20"), spaceAfter=10))

        # -----------------------------------------------------------------
        # 2. Executive Scope & Satellite Ingestion Metadata
        # -----------------------------------------------------------------
        story.append(Paragraph("1. Geospatial Scope & Sensor Platform Ingestion", styles["SectionHeading"]))

        meta_data = [
            [
                Paragraph("<b>Administrative Target:</b>", styles["TableCell"]),
                Paragraph(f"{settings.DISTRICT_NAME} District, {settings.STATE_NAME}, {settings.COUNTRY}", styles["TableCell"]),
                Paragraph("<b>Projected CRS:</b>", styles["TableCell"]),
                Paragraph(f"{settings.DEFAULT_CRS} (WGS 84 / UTM Zone 44N)", styles["TableCell"]),
            ],
            [
                Paragraph("<b>Observation Sensor:</b>", styles["TableCell"]),
                Paragraph(f"{scene_dict.get('sensor', 'SENTINEL_2')} Multi-Spectral", styles["TableCell"]),
                Paragraph("<b>Spatial Resolution:</b>", styles["TableCell"]),
                Paragraph(f"{scene_dict.get('spatial_resolution_m', 10.0)} meters / pixel", styles["TableCell"]),
            ],
            [
                Paragraph("<b>Observation Date:</b>", styles["TableCell"]),
                Paragraph(str(scene_dict.get('acquisition_date', 'N/A'))[:10], styles["TableCell"]),
                Paragraph("<b>Observation Year:</b>", styles["TableCell"]),
                Paragraph(str(scene_dict.get('year', 'N/A')), styles["TableCell"]),
            ],
            [
                Paragraph("<b>Geographic BBox:</b>", styles["TableCell"]),
                Paragraph(f"Lon [{settings.MADURAI_BBOX_MIN_LON}°, {settings.MADURAI_BBOX_MAX_LON}°E]", styles["TableCell"]),
                Paragraph("<b>District Center:</b>", styles["TableCell"]),
                Paragraph("9.9252° N, 78.1198° E (Madurai Central)", styles["TableCell"]),
            ],
            [
                Paragraph("<b>Spectral Band Math:</b>", styles["TableCell"]),
                Paragraph("NDVI = (NIR − RED) / (NIR + RED)", styles["TableCell"]),
                Paragraph("<b>Processing Status:</b>", styles["TableCell"]),
                Paragraph("District Boundary Clipped & Geo-Referenced", styles["TableCell"]),
            ],
        ]

        meta_table = Table(meta_data, colWidths=[120, 140, 110, 150])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f8e9")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#c8e6c9")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e8f5e9")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # -----------------------------------------------------------------
        # 3. Executive KPI Dashboard (4 Summary Boxes)
        # -----------------------------------------------------------------
        story.append(Paragraph("2. Executive Green-Cover Key Performance Indicators (KPIs)", styles["SectionHeading"]))

        total_area = analysis_dict.get("total_analyzed_area_sq_km", 0.0)
        green_sq_km = analysis_dict.get("green_cover_sq_km", 0.0)
        non_veg_sq_km = analysis_dict.get("non_vegetation_sq_km", 0.0)
        green_pct = analysis_dict.get("green_cover_percentage", 0.0)
        mean_ndvi = analysis_dict.get("mean_ndvi", 0.0)
        max_ndvi = analysis_dict.get("max_ndvi", 0.0)

        kpi_cells = [
            [
                Paragraph(f"{green_pct:.1f}%", styles["KpiNumber"]),
                Paragraph(f"{green_sq_km:.2f} km²", styles["KpiNumber"]),
                Paragraph(f"{non_veg_sq_km:.2f} km²", styles["KpiNumber"]),
                Paragraph(f"{mean_ndvi:.3f}", styles["KpiNumber"]),
            ],
            [
                Paragraph("MADURAI GREEN COVER", styles["KpiLabel"]),
                Paragraph("VEGETATION AREA (ha: " + f"{green_sq_km * 100:.1f})", styles["KpiLabel"]),
                Paragraph("NON-VEGETATION / BUILT-UP", styles["KpiLabel"]),
                Paragraph(f"MEAN NDVI (Max: {max_ndvi:.2f})", styles["KpiLabel"]),
            ]
        ]

        kpi_table = Table(kpi_cells, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 1), colors.HexColor("#e8f5e9")),
            ("BACKGROUND", (1, 0), (1, 1), colors.HexColor("#f1f8e9")),
            ("BACKGROUND", (2, 0), (2, 1), colors.HexColor("#fafafa")),
            ("BACKGROUND", (3, 0), (3, 1), colors.HexColor("#e0f2f1")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#81c784")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8e6c9")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 10))

        # -----------------------------------------------------------------
        # 4. 5-Tier Vegetation Classification Breakdown Table
        # -----------------------------------------------------------------
        story.append(Paragraph("3. 5-Tier Scientific Vegetation Classification Breakdown", styles["SectionHeading"]))

        breakdown = analysis_dict.get("classification_breakdown", [])
        class_table_data = [
            [
                Paragraph("Class", styles["TableHead"]),
                Paragraph("Environmental Classification Tier", styles["TableHead"]),
                Paragraph("NDVI Range", styles["TableHead"]),
                Paragraph("Area (km²)", styles["TableHead"]),
                Paragraph("Area (ha)", styles["TableHead"]),
                Paragraph("Coverage %", styles["TableHead"]),
                Paragraph("Urban GIS Significance", styles["TableHead"]),
            ]
        ]

        significances = {
            0: "Rivers, Vaigai basin, irrigation tanks, wetlands",
            1: "Urban built-up, concrete roads, bare soil, rock outcrops",
            2: "Stressed crops, scrubland, dry grasslands, sparse canopy",
            3: "Farmlands, suburban home gardens, moderate tree canopy",
            4: "Dense urban forests, vigorous irrigated palms, parks",
        }

        ndvi_ranges = {
            0: "NDVI < 0.00",
            1: "0.00 ≤ NDVI < 0.20",
            2: "0.20 ≤ NDVI < 0.40",
            3: "0.40 ≤ NDVI < 0.60",
            4: "0.60 ≤ NDVI ≤ 1.00",
        }

        row_colors = [
            colors.HexColor("#e1f5fe"),  # Water
            colors.HexColor("#eceff1"),  # Built-up
            colors.HexColor("#fff9c4"),  # Sparse
            colors.HexColor("#dcedc8"),  # Moderate
            colors.HexColor("#c8e6c9"),  # Dense
        ]

        table_styles = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1b5e20")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b0bec5")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]

        for idx, item in enumerate(breakdown):
            cid = item.get("class_id", idx)
            sq_km = item.get("area_sq_km", 0.0)
            ha = round(sq_km * 100.0, 1)
            pct = item.get("percentage", 0.0)
            name = item.get("name", f"Class {cid}")

            row = [
                Paragraph(str(cid), styles["TableCellCenter"]),
                Paragraph(f"<b>{name}</b>", styles["TableCell"]),
                Paragraph(ndvi_ranges.get(cid, "N/A"), styles["TableCellCenter"]),
                Paragraph(f"{sq_km:.2f}", styles["TableCellRight"]),
                Paragraph(f"{ha:.1f}", styles["TableCellRight"]),
                Paragraph(f"<b>{pct:.1f}%</b>", styles["TableCellRight"]),
                Paragraph(significances.get(cid, "General Landcover"), styles["TableCell"]),
            ]
            class_table_data.append(row)
            table_styles.append(("BACKGROUND", (0, idx + 1), (-1, idx + 1), row_colors[cid % len(row_colors)]))

        cls_table = Table(class_table_data, colWidths=[30, 120, 80, 55, 55, 55, 125])
        cls_table.setStyle(TableStyle(table_styles))
        story.append(cls_table)
        story.append(Spacer(1, 10))

        # -----------------------------------------------------------------
        # 5. Visual Evidence: Colorized NDVI Map & Frequency Histogram
        # -----------------------------------------------------------------
        story.append(KeepTogether([
            Paragraph("4. High-Resolution Visual Evidence & Distribution Curve", styles["SectionHeading"]),
            Paragraph(
                "Scientific visualizations generated directly from multi-spectral 10m/30m reflectance grids:",
                styles["Body"]
            ),
        ]))

        colorized_png_path = analysis_dict.get("colorized_png_path")
        histogram_path = analysis_dict.get("histogram_path")

        image_cells = []
        if colorized_png_path and Path(colorized_png_path).exists():
            img_ndvi = RLImage(str(colorized_png_path), width=3.3 * inch, height=2.4 * inch)
            cap_ndvi = Paragraph("<b>Figure 1:</b> Madurai District Classified NDVI Map (5 Classes)", styles["Caption"])
            left_col = [img_ndvi, cap_ndvi]
        else:
            left_col = [Paragraph("<i>NDVI Classified Map image not available.</i>", styles["Notice"])]

        if histogram_path and Path(histogram_path).exists():
            img_hist = RLImage(str(histogram_path), width=3.3 * inch, height=2.4 * inch)
            cap_hist = Paragraph("<b>Figure 2:</b> Madurai Pixel Frequency Distribution Histogram", styles["Caption"])
            right_col = [img_hist, cap_hist]
        else:
            right_col = [Paragraph("<i>Pixel Histogram image not available.</i>", styles["Notice"])]

        img_table = Table([[left_col, right_col]], colWidths=[260, 260])
        img_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(img_table)
        story.append(Spacer(1, 10))

        # -----------------------------------------------------------------
        # 6. Environmental Recommendations & Governance Directives
        # -----------------------------------------------------------------
        rec_block = [
            Paragraph("5. Urban Environmental Findings & Policy Recommendations", styles["SectionHeading"]),
            Paragraph(
                f"• <b>Green-Cover Benchmark:</b> Madurai District currently registers <b>{green_pct:.1f}%</b> "
                f"({green_sq_km:.2f} km²) active vegetative cover. National urban forestry standards recommend "
                f"maintaining at least 25.0% to 33.0% green cover to curb the urban heat island effect.",
                styles["Body"]
            ),
            Paragraph(
                "• <b>Vaigai Riparian Protection Zone:</b> Water and wetland bodies register critical baseline values. "
                "Immediate buffer protection is advised to prevent urban encroachment along riverbanks and feeder kanmois.",
                styles["Body"]
            ),
            Paragraph(
                "• <b>Afforestation Target Zones:</b> Identified Class 1 (Built-up/Bare Soil) zones occupying "
                f"<b>{non_veg_sq_km:.2f} km²</b> should be prioritized for municipal avenue plantation and pocket urban parks.",
                styles["Body"]
            ),
            Paragraph(
                "• <b>Continuous Remote Sensing Auditing:</b> Quarterly multi-spectral satellite evaluations "
                "are recommended to capture post-monsoon greening vs pre-monsoon dry season canopy stress.",
                styles["Body"]
            ),
            Spacer(1, 6),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#b0bec5"), spaceAfter=6),
            Paragraph(
                "<b>Authentication Notice:</b> This report is generated programmatically by GreenVision using "
                "authentic multi-spectral NIR and RED bands. Approximations from ordinary RGB imagery are strictly excluded.",
                styles["Notice"]
            )
        ]
        story.append(KeepTogether(rec_block))

        # Build Document
        doc.build(story, canvasmaker=NumberedCanvas)
        file_size_kb = round(os.path.getsize(report_path) / 1024.0, 2)
        logger.info(f"Report compiled successfully: {report_path.name} ({file_size_kb} KB)")

        return {
            "report_id": f"GV-MDU-NDVI-{analysis_id:04d}",
            "report_type": "ndvi_assessment",
            "title": f"Madurai District Urban Green-Cover Assessment (Analysis #{analysis_id})",
            "filename": report_path.name,
            "file_path": str(report_path),
            "download_url": f"/static/reports/{report_path.name}",
            "file_size_kb": file_size_kb,
            "created_at": datetime.now(timezone.utc),
            "analysis_id": analysis_id,
        }

    @classmethod
    def generate_comparison_report(
        cls,
        comparison_id: int,
        comp_dict: Dict[str, Any],
        baseline_scene: Dict[str, Any],
        target_scene: Dict[str, Any],
        output_filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Builds a dedicated bi-temporal change detection & transition audit report for Madurai District.
        """
        logger.info(f"Generating PDF Temporal Comparison Report for Comparison #{comparison_id}...")

        base_year = comp_dict.get("baseline_year", 2020)
        targ_year = comp_dict.get("target_year", 2024)

        if not output_filename:
            output_filename = f"GreenVision_Temporal_Change_{base_year}_vs_{targ_year}_Report_{comparison_id}.pdf"

        report_path = settings.REPORTS_DIR / output_filename
        styles = cls._get_styles()

        doc = SimpleDocTemplate(
            str(report_path),
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=46,
            bottomMargin=46,
        )

        story = []

        # -----------------------------------------------------------------
        # 1. Title Banner
        # -----------------------------------------------------------------
        story.append(Paragraph("GREENVISION™ MULTI-YEAR TEMPORAL CHANGE AUDIT", styles["DocTitle"]))
        sub_text = (
            f"<b>Bi-Temporal Vegetation Dynamics & Degradation Assessment</b> • {base_year} vs {targ_year}<br/>"
            f"Document Reference: <b>GV-MDU-DIFF-{comparison_id:04d}</b> | Madurai District, Tamil Nadu (EPSG:32644)<br/>"
            f"Generated: {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}"
        )
        story.append(Paragraph(sub_text, styles["DocSubtitle"]))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1b5e20"), spaceAfter=10))

        # -----------------------------------------------------------------
        # 2. Transition KPI Highlights
        # -----------------------------------------------------------------
        story.append(Paragraph("1. Multi-Year Transition KPI Summary", styles["SectionHeading"]))

        delta_pct = comp_dict.get("green_cover_delta_percentage", 0.0)
        delta_sq_km = comp_dict.get("green_cover_delta_sq_km", 0.0)
        gain_sq_km = comp_dict.get("vegetation_gain_sq_km", 0.0)
        loss_sq_km = comp_dict.get("vegetation_loss_sq_km", 0.0)
        stable_sq_km = comp_dict.get("vegetation_stable_sq_km", 0.0)

        delta_sign = "+" if delta_pct >= 0 else ""
        delta_color = colors.HexColor("#1b5e20") if delta_pct >= 0 else colors.HexColor("#b71c1c")

        kpi_cells = [
            [
                Paragraph(f"<font color='{delta_color.hexval()}'>{delta_sign}{delta_pct:.2f}%</font>", styles["KpiNumber"]),
                Paragraph(f"<font color='#1b5e20'>+{gain_sq_km:.2f} km²</font>", styles["KpiNumber"]),
                Paragraph(f"<font color='#b71c1c'>-{loss_sq_km:.2f} km²</font>", styles["KpiNumber"]),
                Paragraph(f"{stable_sq_km:.2f} km²", styles["KpiNumber"]),
            ],
            [
                Paragraph(f"NET GREEN COVER Δ ({delta_sign}{delta_sq_km:.2f} km²)", styles["KpiLabel"]),
                Paragraph("VEGETATION GAIN / GREENING", styles["KpiLabel"]),
                Paragraph("VEGETATION LOSS / CLEARING", styles["KpiLabel"]),
                Paragraph("PERSISTENT CANOPY & BUILT-UP", styles["KpiLabel"]),
            ]
        ]

        kpi_table = Table(kpi_cells, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 1), colors.HexColor("#e8f5e9") if delta_pct >= 0 else colors.HexColor("#ffebee")),
            ("BACKGROUND", (1, 0), (1, 1), colors.HexColor("#f1f8e9")),
            ("BACKGROUND", (2, 0), (2, 1), colors.HexColor("#ffebee")),
            ("BACKGROUND", (3, 0), (3, 1), colors.HexColor("#eceff1")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#81c784")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8e6c9")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 10))

        # -----------------------------------------------------------------
        # 3. Categorical Transition Dynamics Table
        # -----------------------------------------------------------------
        story.append(Paragraph("2. Categorical Transition Dynamics (ΔNDVI Matrix)", styles["SectionHeading"]))

        trans_matrix = comp_dict.get("transition_matrix", {})
        categories = trans_matrix.get("categories", [])

        trans_data = [
            [
                Paragraph("ID", styles["TableHead"]),
                Paragraph("Transition Category", styles["TableHead"]),
                Paragraph("ΔNDVI Threshold", styles["TableHead"]),
                Paragraph("Area (km²)", styles["TableHead"]),
                Paragraph("Area (ha)", styles["TableHead"]),
                Paragraph("Coverage %", styles["TableHead"]),
                Paragraph("Environmental Impact", styles["TableHead"]),
            ]
        ]

        cat_bg_colors = [
            colors.HexColor("#ffebee"),  # Severe Loss
            colors.HexColor("#ffcdd2"),  # Moderate Loss
            colors.HexColor("#eceff1"),  # Stable
            colors.HexColor("#e8f5e9"),  # Moderate Gain
            colors.HexColor("#c8e6c9"),  # Significant Gain
        ]

        t_styles = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1b5e20")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b0bec5")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]

        for idx, cat in enumerate(categories):
            cid = cat.get("id", idx)
            name = cat.get("name", f"Class {cid}")
            min_d = cat.get("min_delta", 0.0)
            max_d = cat.get("max_delta", 0.0)
            sq_km = cat.get("area_sq_km", 0.0)
            ha = cat.get("area_hectares", round(sq_km * 100.0, 1))
            pct = cat.get("percentage", 0.0)
            desc = cat.get("description", "Landcover transition")

            threshold_str = "< -0.20" if min_d == -2.0 else ("> +0.20" if max_d == 2.0 else f"[{min_d:+.2f}, {max_d:+.2f})")

            row = [
                Paragraph(str(cid), styles["TableCellCenter"]),
                Paragraph(f"<b>{name}</b>", styles["TableCell"]),
                Paragraph(threshold_str, styles["TableCellCenter"]),
                Paragraph(f"{sq_km:.2f}", styles["TableCellRight"]),
                Paragraph(f"{ha:.1f}", styles["TableCellRight"]),
                Paragraph(f"<b>{pct:.1f}%</b>", styles["TableCellRight"]),
                Paragraph(desc, styles["TableCell"]),
            ]
            trans_data.append(row)
            t_styles.append(("BACKGROUND", (0, idx + 1), (-1, idx + 1), cat_bg_colors[cid % len(cat_bg_colors)]))

        trans_table = Table(trans_data, colWidths=[25, 125, 75, 55, 55, 55, 130])
        trans_table.setStyle(TableStyle(t_styles))
        story.append(trans_table)
        story.append(Spacer(1, 10))

        # -----------------------------------------------------------------
        # 4. High-Res Difference Map
        # -----------------------------------------------------------------
        diff_png_path = comp_dict.get("difference_map_png_path")
        if diff_png_path and Path(diff_png_path).exists():
            story.append(KeepTogether([
                Paragraph("3. Spatial Difference & Vegetation Degradation Map", styles["SectionHeading"]),
                RLImage(str(diff_png_path), width=5.5 * inch, height=3.0 * inch),
                Paragraph(
                    f"<b>Figure 1:</b> Spatial distribution of vegetation change in Madurai District ({base_year} to {targ_year}). "
                    "Red = Severe/Moderate Canopy Loss; Gray = Stable; Green = Moderate/Significant Greening.",
                    styles["Caption"]
                ),
            ]))
            story.append(Spacer(1, 8))

        # -----------------------------------------------------------------
        # 5. Strategic Directives
        # -----------------------------------------------------------------
        rec_block = [
            Paragraph("4. Strategic Environmental Intervention Directives", styles["SectionHeading"]),
            Paragraph(
                f"• <b>Net Urban Greening Balance:</b> Over the observation horizon ({base_year} → {targ_year}), "
                f"Madurai District experienced a net change of <b>{delta_sign}{delta_pct:.2f}%</b> "
                f"({delta_sign}{delta_sq_km:.2f} km²).",
                styles["Body"]
            ),
            Paragraph(
                f"• <b>Canopy Degradation Hotspots:</b> A total of <b>{loss_sq_km:.2f} km²</b> underwent significant or "
                "moderate vegetation loss. Immediate drone and field ground-truthing is advised in peripheral taluks "
                "to inspect agricultural conversion or unpermitted land clearing.",
                styles["Body"]
            ),
            Paragraph(
                f"• <b>Afforestation Achievements:</b> Greening gains of <b>+{gain_sq_km:.2f} km²</b> demonstrate positive "
                "reforestation and seasonal agricultural resilience. These zones should be fortified with sustainable water access.",
                styles["Body"]
            ),
            Spacer(1, 4),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#b0bec5"), spaceAfter=6),
            Paragraph(
                "<b>Authentication Notice:</b> Delta rasters are calculated on aligned grids via pixel-by-pixel subtraction "
                "(ΔNDVI = T₂ − T₁). Produced exclusively for Madurai District environmental governance.",
                styles["Notice"]
            )
        ]
        story.append(KeepTogether(rec_block))

        doc.build(story, canvasmaker=NumberedCanvas)
        file_size_kb = round(os.path.getsize(report_path) / 1024.0, 2)
        logger.info(f"Comparison Report compiled successfully: {report_path.name} ({file_size_kb} KB)")

        return {
            "report_id": f"GV-MDU-DIFF-{comparison_id:04d}",
            "report_type": "temporal_comparison",
            "title": f"Madurai District Temporal Change Audit: {base_year} vs {targ_year}",
            "filename": report_path.name,
            "file_path": str(report_path),
            "download_url": f"/static/reports/{report_path.name}",
            "file_size_kb": file_size_kb,
            "created_at": datetime.now(timezone.utc),
            "comparison_id": comparison_id,
        }
