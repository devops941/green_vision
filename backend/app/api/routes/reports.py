from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.database import get_db
from app.core.logging import logger
from app.models.database import SatelliteImage, NdviAnalysis, TemporalComparison
from app.models.schemas import GeneratedReportInfo
from app.services.report_service import ReportService, ReportServiceError

settings = get_settings()
router = APIRouter(prefix="/reports", tags=["PDF Reports & Environmental Documentation"])


@router.post("/generate/{analysis_id}", response_model=GeneratedReportInfo)
def generate_ndvi_report(analysis_id: int, db: Session = Depends(get_db)):
    """
    Generates an official publication-quality PDF assessment report for a single NDVI analysis.
    """
    analysis = db.query(NdviAnalysis).filter(NdviAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"NDVI Analysis #{analysis_id} not found."
        )

    scene = db.query(SatelliteImage).filter(SatelliteImage.id == analysis.satellite_image_id).first()
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent Satellite Scene #{analysis.satellite_image_id} not found."
        )

    analysis_dict = {
        "id": analysis.id,
        "mean_ndvi": analysis.mean_ndvi,
        "min_ndvi": analysis.min_ndvi,
        "max_ndvi": analysis.max_ndvi,
        "std_ndvi": analysis.std_ndvi,
        "total_analyzed_area_sq_km": analysis.total_analyzed_area_sq_km,
        "green_cover_sq_km": analysis.green_cover_sq_km,
        "non_vegetation_sq_km": analysis.non_vegetation_sq_km,
        "green_cover_percentage": analysis.green_cover_percentage,
        "classification_breakdown": analysis.classification_breakdown,
        "colorized_png_path": analysis.colorized_png_path,
        "histogram_path": analysis.histogram_path,
    }

    scene_dict = {
        "id": scene.id,
        "title": scene.title,
        "sensor": scene.sensor,
        "acquisition_date": scene.acquisition_date,
        "year": scene.year,
        "spatial_resolution_m": scene.spatial_resolution_m,
        "cloud_cover_percentage": scene.cloud_cover_percentage,
    }

    try:
        report_meta = ReportService.generate_ndvi_assessment_report(
            analysis_id=analysis.id,
            analysis_dict=analysis_dict,
            scene_dict=scene_dict,
        )
        return GeneratedReportInfo(**report_meta)
    except Exception as e:
        logger.error(f"Failed to compile PDF for Analysis #{analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF Report compilation failed: {str(e)}"
        )


@router.post("/generate-comparison/{comparison_id}", response_model=GeneratedReportInfo)
def generate_comparison_report(comparison_id: int, db: Session = Depends(get_db)):
    """
    Generates a dedicated bi-temporal vegetation change audit PDF report.
    """
    comp = db.query(TemporalComparison).filter(TemporalComparison.id == comparison_id).first()
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Temporal Comparison #{comparison_id} not found."
        )

    base_analysis = db.query(NdviAnalysis).filter(NdviAnalysis.id == comp.baseline_analysis_id).first()
    targ_analysis = db.query(NdviAnalysis).filter(NdviAnalysis.id == comp.target_analysis_id).first()

    base_scene = db.query(SatelliteImage).filter(SatelliteImage.id == base_analysis.satellite_image_id).first() if base_analysis else None
    targ_scene = db.query(SatelliteImage).filter(SatelliteImage.id == targ_analysis.satellite_image_id).first() if targ_analysis else None

    comp_dict = {
        "id": comp.id,
        "title": comp.title,
        "baseline_year": comp.baseline_year,
        "target_year": comp.target_year,
        "green_cover_delta_sq_km": comp.green_cover_delta_sq_km,
        "green_cover_delta_percentage": comp.green_cover_delta_percentage,
        "vegetation_gain_sq_km": comp.vegetation_gain_sq_km,
        "vegetation_loss_sq_km": comp.vegetation_loss_sq_km,
        "vegetation_stable_sq_km": comp.vegetation_stable_sq_km,
        "difference_map_png_path": comp.difference_map_png_path,
        "transition_matrix": comp.transition_matrix,
    }

    try:
        report_meta = ReportService.generate_comparison_report(
            comparison_id=comp.id,
            comp_dict=comp_dict,
            baseline_scene={"title": base_scene.title, "year": base_scene.year} if base_scene else {},
            target_scene={"title": targ_scene.title, "year": targ_scene.year} if targ_scene else {},
        )
        return GeneratedReportInfo(**report_meta)
    except Exception as e:
        logger.error(f"Failed to compile Comparison PDF for #{comparison_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison PDF Report compilation failed: {str(e)}"
        )


@router.get("/list", response_model=List[GeneratedReportInfo])
def list_reports():
    """
    Lists all generated PDF assessment reports currently stored in the reports directory.
    """
    reports_dir = settings.REPORTS_DIR
    if not reports_dir.exists():
        return []

    reports = []
    for f in sorted(reports_dir.glob("*.pdf"), key=os.path.getmtime, reverse=True):
        mtime = datetime.fromtimestamp(os.path.getmtime(f), tz=timezone.utc)
        size_kb = round(f.stat().st_size / 1024.0, 2)

        is_diff = "Temporal_Change" in f.name or "DIFF" in f.name
        report_type = "temporal_comparison" if is_diff else "ndvi_assessment"
        title = f.stem.replace("_", " ")

        reports.append(
            GeneratedReportInfo(
                report_id=f.stem,
                report_type=report_type,
                title=title,
                filename=f.name,
                file_path=str(f),
                download_url=f"/static/reports/{f.name}",
                file_size_kb=size_kb,
                created_at=mtime,
            )
        )
    return reports


@router.get("/download/{filename}")
def download_report(filename: str):
    """
    Streams the requested PDF file for download or direct browser viewing.
    """
    file_path = settings.REPORTS_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Report file '{filename}' not found.")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.delete("/{filename}")
def delete_report(filename: str):
    """
    Deletes a generated report from the file system.
    """
    file_path = settings.REPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Report '{filename}' not found.")

    try:
        file_path.unlink()
        logger.info(f"Deleted report file: {filename}")
        return {"message": f"Report '{filename}' deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")
