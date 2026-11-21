from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import logger
from app.models.database import SatelliteImage
from app.models.schemas import PreprocessingResultResponse
from app.services.preprocessor import SatellitePreprocessor, PreprocessorError

router = APIRouter(prefix="/preprocessing", tags=["Preprocessing & Boundary Masking"])


@router.post("/process/{image_id}", response_model=PreprocessingResultResponse)
def preprocess_satellite_image(image_id: int, db: Session = Depends(get_db)):
    """
    Executes spatial clipping along Madurai District GeoJSON boundary,
    grid alignment, and nodata masking for an authentic satellite scene.
    """
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satellite image #{image_id} not found."
        )

    red_path = Path(image.red_band_path)
    nir_path = Path(image.nir_band_path)

    if not red_path.exists() or not nir_path.exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Raw satellite band files for image #{image_id} are missing on disk."
        )

    try:
        result = SatellitePreprocessor.preprocess_scene(
            image_id=image.id,
            red_path=red_path,
            nir_path=nir_path,
            sensor=image.sensor,
        )

        # Update database record
        image.is_preprocessed = True
        image.processed_red_path = result["clipped_red_path"]
        image.processed_nir_path = result["clipped_nir_path"]
        image.clipped_pixels_count = result["total_clipped_pixels"]
        image.valid_pixels_count = result["valid_district_pixels"]
        image.processed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(image)

        logger.info(f"Image #{image_id} successfully preprocessed and masked to Madurai District.")

        return PreprocessingResultResponse(
            image_id=image.id,
            title=image.title,
            sensor=image.sensor,
            is_preprocessed=True,
            clipped_red_path=result["clipped_red_path"],
            clipped_nir_path=result["clipped_nir_path"],
            clipped_dimensions=result["dimensions"],
            target_crs=result["target_crs"],
            spatial_resolution_m=result["spatial_resolution_m"],
            total_clipped_pixels=result["total_clipped_pixels"],
            valid_district_pixels=result["valid_district_pixels"],
            boundary_mask_applied=result["boundary_mask_applied"],
            message="Scene successfully clipped and masked to Madurai District administrative boundary.",
        )

    except PreprocessorError as pe:
        logger.error(f"Preprocessing error for #{image_id}: {str(pe)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(pe))
    except Exception as e:
        logger.error(f"Unexpected preprocessing failure for #{image_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preprocessing failure: {str(e)}"
        )


@router.get("/status/{image_id}")
def get_preprocessing_status(image_id: int, db: Session = Depends(get_db)):
    """
    Checks preprocessing status and clipped pixel metrics for an image.
    """
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satellite image #{image_id} not found."
        )

    return {
        "image_id": image.id,
        "title": image.title,
        "is_preprocessed": image.is_preprocessed,
        "processed_at": image.processed_at,
        "processed_red_path": image.processed_red_path,
        "processed_nir_path": image.processed_nir_path,
        "clipped_pixels_count": image.clipped_pixels_count,
        "valid_pixels_count": image.valid_pixels_count,
    }
