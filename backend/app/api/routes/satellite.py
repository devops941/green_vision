import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.database import get_db
from app.core.logging import logger
from app.models.database import SatelliteImage
from app.models.schemas import SatelliteImageResponse
from app.services.gis_validator import GISValidator, ValidationError

router = APIRouter(prefix="/satellite", tags=["Satellite Ingestion & Validation"])
settings = get_settings()


@router.post("/validate-headers")
def validate_satellite_headers(
    sensor: str = Form(..., description="Sensor type: SENTINEL_2 or LANDSAT_8_9"),
    red_band: UploadFile = File(..., description="Red band GeoTIFF (B04 for Sentinel-2, B4 for Landsat)"),
    nir_band: UploadFile = File(..., description="NIR band GeoTIFF (B08 for Sentinel-2, B5 for Landsat)"),
):
    """
    Pre-flight inspection endpoint: Reads and validates uploaded GeoTIFF headers
    against Madurai District boundaries without persisting to the database.
    """
    temp_dir = settings.BASE_DIR / "data" / "temp" / f"validate_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    red_tmp_path = temp_dir / red_band.filename
    nir_tmp_path = temp_dir / nir_band.filename

    try:
        # Save temporary buffers to inspect headers
        with open(red_tmp_path, "wb") as f_red:
            shutil.copyfileobj(red_band.file, f_red)

        with open(nir_tmp_path, "wb") as f_nir:
            shutil.copyfileobj(nir_band.file, f_nir)

        validation_result = GISValidator.validate_satellite_pair(
            red_path=red_tmp_path,
            nir_path=nir_tmp_path,
            sensor=sensor,
        )

        return {
            "status": "success",
            "message": "Satellite band pair passed all geospatial checks for Madurai District.",
            "details": validation_result,
        }

    except ValidationError as ve:
        logger.warning(f"Satellite validation failed: {str(ve)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during satellite header inspection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inspection error: {str(e)}",
        )
    finally:
        # Clean up temporary inspection files
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/upload", response_model=SatelliteImageResponse, status_code=status.HTTP_201_CREATED)
def upload_satellite_image(
    title: str = Form(..., description="Display title for the satellite scene"),
    sensor: str = Form(..., description="Sensor type: SENTINEL_2 or LANDSAT_8_9"),
    acquisition_date: str = Form(..., description="ISO formatted date (YYYY-MM-DD)"),
    year: int = Form(..., description="Acquisition year (e.g. 2024)"),
    month: Optional[int] = Form(None, description="Acquisition month (1-12)"),
    notes: Optional[str] = Form(None, description="Optional notes or provenance description"),
    red_band: UploadFile = File(..., description="Authentic Red band GeoTIFF file"),
    nir_band: UploadFile = File(..., description="Authentic NIR band GeoTIFF file"),
    db: Session = Depends(get_db),
):
    """
    Ingests and validates authentic Red and NIR satellite bands for Madurai District.
    Stores files in authentic raw storage and registers metadata in SQLite.
    """
    # 1. Basic Extension Check
    for upload, band_name in [(red_band, "Red Band"), (nir_band, "NIR Band")]:
        ext = Path(upload.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{band_name} '{upload.filename}' has extension '{ext}'. Only GeoTIFF ({', '.join(settings.ALLOWED_EXTENSIONS)}) is permitted.",
            )

    # 2. Prepare Storage Directory
    timestamp_slug = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    target_dir = settings.RAW_DIR / f"{year}_{sensor.lower()}_{timestamp_slug}"
    target_dir.mkdir(parents=True, exist_ok=True)

    red_dest = target_dir / f"RED_{red_band.filename}"
    nir_dest = target_dir / f"NIR_{nir_band.filename}"

    try:
        # Stream files to disk
        with open(red_dest, "wb") as f_red:
            shutil.copyfileobj(red_band.file, f_red)

        with open(nir_dest, "wb") as f_nir:
            shutil.copyfileobj(nir_band.file, f_nir)

        # 3. Comprehensive GIS Validation
        validation = GISValidator.validate_satellite_pair(
            red_path=red_dest,
            nir_path=nir_dest,
            sensor=sensor,
        )

        parsed_date = datetime.fromisoformat(acquisition_date.replace("Z", "+00:00"))

        # 4. Save Record to SQLite
        image_record = SatelliteImage(
            title=title,
            sensor=validation["sensor_id"],
            acquisition_date=parsed_date,
            year=year,
            month=month or parsed_date.month,
            red_band_path=str(red_dest),
            nir_band_path=str(nir_dest),
            crs=validation["red_band"]["crs"],
            spatial_resolution_m=validation["red_band"]["resolution_m"],
            bbox=validation["red_band"]["wgs84_bounds"],
            is_madurai_district=True,
            cloud_cover_percentage=0.0,
            is_preprocessed=False,
            notes=notes,
        )

        db.add(image_record)
        db.commit()
        db.refresh(image_record)

        logger.info(f"Successfully ingested authentic satellite image #{image_record.id}: {title} ({sensor})")
        return image_record

    except ValidationError as ve:
        # Clean up files on validation failure
        if target_dir.exists():
            shutil.rmtree(target_dir, ignore_errors=True)
        logger.warning(f"Ingestion rejected for '{title}': {str(ve)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    except Exception as e:
        if target_dir.exists():
            shutil.rmtree(target_dir, ignore_errors=True)
        logger.error(f"Ingestion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process satellite bands: {str(e)}",
        )


@router.get("/images", response_model=List[SatelliteImageResponse])
def list_satellite_images(db: Session = Depends(get_db)):
    """
    Returns all registered satellite images for Madurai District ordered by year desc.
    """
    images = db.query(SatelliteImage).order_by(SatelliteImage.year.desc(), SatelliteImage.created_at.desc()).all()
    return images


@router.get("/images/{image_id}", response_model=SatelliteImageResponse)
def get_satellite_image(image_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full metadata for a specific satellite scene.
    """
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail=f"Satellite image with ID {image_id} not found.")
    return image


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_satellite_image(image_id: int, db: Session = Depends(get_db)):
    """
    Deletes a satellite scene and purges its raw raster files.
    """
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail=f"Satellite image with ID {image_id} not found.")

    # Remove raw band files
    red_file = Path(image.red_band_path)
    nir_file = Path(image.nir_band_path)

    if red_file.exists():
        try:
            parent_dir = red_file.parent
            if parent_dir.exists() and "raw" in str(parent_dir):
                shutil.rmtree(parent_dir, ignore_errors=True)
        except Exception as e:
            logger.warning(f"Could not delete raster files for image #{image_id}: {str(e)}")

    db.delete(image)
    db.commit()
    return None
