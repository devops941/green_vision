from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import logger
from app.models.database import SatelliteImage, NdviAnalysis, TemporalComparison
from app.models.schemas import ComparisonCreateRequest, ComparisonResponse
from app.services.change_service import ChangeService, ChangeServiceError

router = APIRouter(prefix="/comparison", tags=["Temporal Change & Multi-Year Comparison"])


@router.post("/compare", response_model=ComparisonResponse)
def compare_scenes(payload: ComparisonCreateRequest, db: Session = Depends(get_db)):
    """
    Executes bi-temporal vegetation change detection between two observation years for Madurai District.
    """
    baseline = db.query(NdviAnalysis).filter(NdviAnalysis.id == payload.baseline_analysis_id).first()
    if not baseline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Baseline NDVI Analysis #{payload.baseline_analysis_id} not found."
        )

    target = db.query(NdviAnalysis).filter(NdviAnalysis.id == payload.target_analysis_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target NDVI Analysis #{payload.target_analysis_id} not found."
        )

    if baseline.id == target.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Baseline and target analyses must be distinct observation scenes."
        )

    base_scene = db.query(SatelliteImage).filter(SatelliteImage.id == baseline.satellite_image_id).first()
    target_scene = db.query(SatelliteImage).filter(SatelliteImage.id == target.satellite_image_id).first()

    base_year = base_scene.year if base_scene else 2020
    targ_year = target_scene.year if target_scene else 2024

    # Ensure chronology (baseline is earlier or equal)
    if base_year > targ_year:
        # Swap or allow user choice
        pass

    try:
        result = ChangeService.compare_ndvi_rasters(
            baseline_id=baseline.id,
            target_id=target.id,
            baseline_raster_path=Path(baseline.ndvi_raster_path),
            target_raster_path=Path(target.ndvi_raster_path),
            baseline_year=base_year,
            target_year=targ_year,
            baseline_green_pct=baseline.green_cover_percentage,
            target_green_pct=target.green_cover_percentage,
            baseline_green_sq_km=baseline.green_cover_sq_km,
            target_green_sq_km=target.green_cover_sq_km,
            resolution_m=base_scene.spatial_resolution_m if base_scene else 10.0,
        )

        title = payload.title or result["title"]

        comparison = TemporalComparison(
            title=title,
            baseline_year=result["baseline_year"],
            target_year=result["target_year"],
            baseline_analysis_id=baseline.id,
            target_analysis_id=target.id,
            difference_raster_path=result["difference_raster_path"],
            difference_map_png_path=result["difference_map_png_path"],
            green_cover_delta_sq_km=result["green_cover_delta_sq_km"],
            green_cover_delta_percentage=result["green_cover_delta_percentage"],
            vegetation_gain_sq_km=result["vegetation_gain_sq_km"],
            vegetation_loss_sq_km=result["vegetation_loss_sq_km"],
            vegetation_stable_sq_km=result["vegetation_stable_sq_km"],
            transition_matrix=result["transition_matrix"],
            created_at=datetime.now(timezone.utc),
        )

        db.add(comparison)
        db.commit()
        db.refresh(comparison)

        logger.info(f"Temporal Comparison #{comparison.id} recorded: {comparison.title}")

        return ComparisonResponse(
            id=comparison.id,
            title=comparison.title,
            baseline_year=comparison.baseline_year,
            target_year=comparison.target_year,
            baseline_analysis_id=comparison.baseline_analysis_id,
            target_analysis_id=comparison.target_analysis_id,
            green_cover_delta_sq_km=comparison.green_cover_delta_sq_km,
            green_cover_delta_percentage=comparison.green_cover_delta_percentage,
            vegetation_gain_sq_km=comparison.vegetation_gain_sq_km,
            vegetation_loss_sq_km=comparison.vegetation_loss_sq_km,
            vegetation_stable_sq_km=comparison.vegetation_stable_sq_km,
            transition_matrix=comparison.transition_matrix,
            difference_map_url=result["difference_map_url"],
            created_at=comparison.created_at,
        )

    except ChangeServiceError as cse:
        logger.error(f"Change detection error: {str(cse)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(cse))
    except Exception as e:
        logger.error(f"Unexpected change analysis failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Change detection failure: {str(e)}"
        )


@router.get("/list", response_model=List[ComparisonResponse])
def list_comparisons(db: Session = Depends(get_db)):
    """Lists all temporal comparisons ordered by created_at desc."""
    records = db.query(TemporalComparison).order_by(TemporalComparison.created_at.desc()).all()
    results = []
    for r in records:
        diff_file = Path(r.difference_map_png_path).name if r.difference_map_png_path else ""
        results.append(
            ComparisonResponse(
                id=r.id,
                title=r.title,
                baseline_year=r.baseline_year,
                target_year=r.target_year,
                baseline_analysis_id=r.baseline_analysis_id,
                target_analysis_id=r.target_analysis_id,
                green_cover_delta_sq_km=r.green_cover_delta_sq_km,
                green_cover_delta_percentage=r.green_cover_delta_percentage,
                vegetation_gain_sq_km=r.vegetation_gain_sq_km,
                vegetation_loss_sq_km=r.vegetation_loss_sq_km,
                vegetation_stable_sq_km=r.vegetation_stable_sq_km,
                transition_matrix=r.transition_matrix,
                difference_map_url=f"/static/ndvi/{diff_file}",
                created_at=r.created_at,
            )
        )
    return results


@router.get("/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(comparison_id: int, db: Session = Depends(get_db)):
    """Retrieves full comparison details by ID."""
    r = db.query(TemporalComparison).filter(TemporalComparison.id == comparison_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Comparison #{comparison_id} not found.")

    diff_file = Path(r.difference_map_png_path).name if r.difference_map_png_path else ""
    return ComparisonResponse(
        id=r.id,
        title=r.title,
        baseline_year=r.baseline_year,
        target_year=r.target_year,
        baseline_analysis_id=r.baseline_analysis_id,
        target_analysis_id=r.target_analysis_id,
        green_cover_delta_sq_km=r.green_cover_delta_sq_km,
        green_cover_delta_percentage=r.green_cover_delta_percentage,
        vegetation_gain_sq_km=r.vegetation_gain_sq_km,
        vegetation_loss_sq_km=r.vegetation_loss_sq_km,
        vegetation_stable_sq_km=r.vegetation_stable_sq_km,
        transition_matrix=r.transition_matrix,
        difference_map_url=f"/static/ndvi/{diff_file}",
        created_at=r.created_at,
    )
