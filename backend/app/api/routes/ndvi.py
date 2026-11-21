from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import logger
from app.models.database import SatelliteImage, NdviAnalysis
from app.models.schemas import NdviAnalysisResponse
from app.services.ndvi_service import NdviService, NdviServiceError
from app.services.classification_service import ClassificationService
from app.services.preprocessor import SatellitePreprocessor

router = APIRouter(prefix="/ndvi", tags=["NDVI Calculation & Vegetation Classification"])


@router.post("/calculate/{image_id}", response_model=NdviAnalysisResponse)
def calculate_ndvi_for_scene(image_id: int, db: Session = Depends(get_db)):
    """
    Executes authentic NDVI calculation and vegetation classification for an ingested scene:
    1. Validates that the scene is preprocessed and clipped to Madurai District.
    2. Runs vectorized Float32 NDVI arithmetic: (NIR - RED) / (NIR + RED).
    3. Categorizes pixels into Water, Built-up, Sparse, Moderate, and Dense vegetation.
    4. Calculates exact square kilometers, hectares, and green-cover percentage.
    5. Generates high-res colorized PNG and distribution histogram plots.
    6. Persists analysis to SQLite and returns full metrics.
    """
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satellite image #{image_id} not found."
        )

    # If the scene was not preprocessed yet, automatically preprocess and clip it now
    if not image.is_preprocessed or not image.processed_red_path or not image.processed_nir_path:
        logger.info(f"Scene #{image_id} is not yet preprocessed. Running Madurai boundary clip first...")
        prep_result = SatellitePreprocessor.preprocess_scene(
            image_id=image.id,
            red_path=Path(image.red_band_path),
            nir_path=Path(image.nir_band_path),
            sensor=image.sensor,
        )
        image.is_preprocessed = True
        image.processed_red_path = prep_result["clipped_red_path"]
        image.processed_nir_path = prep_result["clipped_nir_path"]
        image.clipped_pixels_count = prep_result["total_clipped_pixels"]
        image.valid_pixels_count = prep_result["valid_district_pixels"]
        image.processed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(image)

    red_clipped = Path(image.processed_red_path)
    nir_clipped = Path(image.processed_nir_path)

    if not red_clipped.exists() or not nir_clipped.exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preprocessed band files were not found on disk."
        )

    try:
        # Step 1: Compute Authentic NDVI
        ndvi_result = NdviService.compute_ndvi(
            image_id=image.id,
            red_path=red_clipped,
            nir_path=nir_clipped,
        )

        # Step 2: Classify Vegetation & Quantify Areas
        class_result = ClassificationService.classify_and_quantify(
            image_id=image.id,
            ndvi_array=ndvi_result["ndvi_array"],
            resolution_m=ndvi_result["resolution_m"],
        )

        # Step 3: Check if existing analysis exists for this image, or create new
        existing_analysis = db.query(NdviAnalysis).filter(NdviAnalysis.satellite_image_id == image.id).first()
        if existing_analysis:
            analysis = existing_analysis
            analysis.created_at = datetime.now(timezone.utc)
        else:
            analysis = NdviAnalysis(satellite_image_id=image.id)
            db.add(analysis)

        analysis.ndvi_raster_path = ndvi_result["ndvi_raster_path"]
        analysis.classified_raster_path = class_result["classified_raster_path"]
        analysis.colorized_png_path = class_result["colorized_png_path"]
        analysis.histogram_path = class_result["histogram_path"]

        analysis.mean_ndvi = ndvi_result["mean_ndvi"]
        analysis.min_ndvi = ndvi_result["min_ndvi"]
        analysis.max_ndvi = ndvi_result["max_ndvi"]
        analysis.std_ndvi = ndvi_result["std_ndvi"]

        analysis.total_analyzed_area_sq_km = class_result["total_analyzed_area_sq_km"]
        analysis.green_cover_sq_km = class_result["green_cover_sq_km"]
        analysis.non_vegetation_sq_km = class_result["non_vegetation_sq_km"]
        analysis.green_cover_percentage = class_result["green_cover_percentage"]
        analysis.classification_breakdown = class_result["classification_breakdown"]

        db.commit()
        db.refresh(analysis)

        logger.info(
            f"NDVI Analysis #{analysis.id} saved for Scene #{image.id}: "
            f"Green Cover = {analysis.green_cover_percentage}%"
        )

        return NdviAnalysisResponse(
            id=analysis.id,
            satellite_image_id=image.id,
            created_at=analysis.created_at,
            mean_ndvi=analysis.mean_ndvi,
            min_ndvi=analysis.min_ndvi,
            max_ndvi=analysis.max_ndvi,
            std_ndvi=analysis.std_ndvi,
            total_analyzed_area_sq_km=analysis.total_analyzed_area_sq_km,
            green_cover_sq_km=analysis.green_cover_sq_km,
            non_vegetation_sq_km=analysis.non_vegetation_sq_km,
            green_cover_percentage=analysis.green_cover_percentage,
            classification_breakdown=analysis.classification_breakdown,
            colorized_png_url=f"/static/ndvi/{class_result['classified_filename'].replace('NDVI_classified_', 'NDVI_colorized_').replace('.tif', '.png')}",
            histogram_url=f"/static/ndvi/{class_result['classified_filename'].replace('NDVI_classified_', 'NDVI_histogram_').replace('.tif', '.png')}",
        )

    except NdviServiceError as nse:
        logger.error(f"NDVI service error for Scene #{image.id}: {str(nse)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(nse))
    except Exception as e:
        logger.error(f"Unexpected NDVI computation error for Scene #{image.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NDVI computation failure: {str(e)}"
        )


@router.get("/analyses", response_model=List[NdviAnalysisResponse])
def list_ndvi_analyses(db: Session = Depends(get_db)):
    """Lists all computed NDVI analyses ordered by creation date desc."""
    analyses = db.query(NdviAnalysis).order_by(NdviAnalysis.created_at.desc()).all()
    results = []
    for a in analyses:
        colorized_file = Path(a.colorized_png_path).name if a.colorized_png_path else ""
        hist_file = Path(a.histogram_path).name if a.histogram_path else ""
        results.append(
            NdviAnalysisResponse(
                id=a.id,
                satellite_image_id=a.satellite_image_id,
                created_at=a.created_at,
                mean_ndvi=a.mean_ndvi,
                min_ndvi=a.min_ndvi,
                max_ndvi=a.max_ndvi,
                std_ndvi=a.std_ndvi,
                total_analyzed_area_sq_km=a.total_analyzed_area_sq_km,
                green_cover_sq_km=a.green_cover_sq_km,
                non_vegetation_sq_km=a.non_vegetation_sq_km,
                green_cover_percentage=a.green_cover_percentage,
                classification_breakdown=a.classification_breakdown,
                colorized_png_url=f"/static/ndvi/{colorized_file}",
                histogram_url=f"/static/ndvi/{hist_file}" if hist_file else None,
            )
        )
    return results


@router.get("/analyses/{analysis_id}", response_model=NdviAnalysisResponse)
def get_ndvi_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Retrieves full NDVI analysis results by analysis ID."""
    a = db.query(NdviAnalysis).filter(NdviAnalysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail=f"NDVI Analysis #{analysis_id} not found.")

    colorized_file = Path(a.colorized_png_path).name if a.colorized_png_path else ""
    hist_file = Path(a.histogram_path).name if a.histogram_path else ""

    return NdviAnalysisResponse(
        id=a.id,
        satellite_image_id=a.satellite_image_id,
        created_at=a.created_at,
        mean_ndvi=a.mean_ndvi,
        min_ndvi=a.min_ndvi,
        max_ndvi=a.max_ndvi,
        std_ndvi=a.std_ndvi,
        total_analyzed_area_sq_km=a.total_analyzed_area_sq_km,
        green_cover_sq_km=a.green_cover_sq_km,
        non_vegetation_sq_km=a.non_vegetation_sq_km,
        green_cover_percentage=a.green_cover_percentage,
        classification_breakdown=a.classification_breakdown,
        colorized_png_url=f"/static/ndvi/{colorized_file}",
        histogram_url=f"/static/ndvi/{hist_file}" if hist_file else None,
    )


@router.get("/probe/{image_id}")
def probe_ndvi_pixel(
    image_id: int,
    lat: float,
    lon: float,
    db: Session = Depends(get_db),
):
    """
    Samples the exact Float32 NDVI value and vegetation category at given (lat, lon) coordinates.
    """
    analysis = db.query(NdviAnalysis).filter(NdviAnalysis.satellite_image_id == image_id).order_by(NdviAnalysis.created_at.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No NDVI analysis found for this scene.")

    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Satellite image not found.")

    raster_path = Path(analysis.ndvi_raster_path)
    if not raster_path.exists():
        raise HTTPException(status_code=404, detail="NDVI raster file missing on disk.")

    import tifffile
    import numpy as np

    with tifffile.TiffFile(str(raster_path)) as tf:
        arr = tf.pages[0].asarray()
        height, width = arr.shape

    bbox = image.bbox or {}
    min_lon = bbox.get("min_longitude", 77.68)
    max_lon = bbox.get("max_longitude", 78.52)
    min_lat = bbox.get("min_latitude", 9.53)
    max_lat = bbox.get("max_latitude", 10.35)

    if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
        return {
            "status": "outside_extent",
            "lat": lat,
            "lon": lon,
            "message": "Coordinate is outside satellite scene bounds for Madurai District.",
        }

    px = int(round(((lon - min_lon) / (max_lon - min_lon)) * (width - 1)))
    py = int(round(((max_lat - lat) / (max_lat - min_lat)) * (height - 1)))

    px = max(0, min(width - 1, px))
    py = max(0, min(height - 1, py))

    val = float(arr[py, px])

    if val <= -9000.0 or np.isnan(val) or val < -1.0 or val > 1.0:
        return {
            "status": "nodata",
            "lat": lat,
            "lon": lon,
            "message": "Location is outside Madurai administrative boundary or masked nodata.",
        }

    if val < 0.0:
        cid, cname, col = 0, "Water Body", "#0D47A1"
    elif val < 0.2:
        cid, cname, col = 1, "Built-up / Barren Land", "#BDBDBD"
    elif val < 0.4:
        cid, cname, col = 2, "Sparse Vegetation", "#FFF59D"
    elif val < 0.6:
        cid, cname, col = 3, "Moderate Vegetation", "#66BB6A"
    else:
        cid, cname, col = 4, "Dense Vegetation", "#1B5E20"

    return {
        "status": "success",
        "lat": lat,
        "lon": lon,
        "pixel": {"x": px, "y": py},
        "ndvi": round(val, 4),
        "class_id": cid,
        "class_name": cname,
        "color_hex": col,
        "is_vegetation": cid >= 2,
    }


@router.get("/analyses/image/{image_id}", response_model=NdviAnalysisResponse)
def get_ndvi_analysis_by_image(image_id: int, db: Session = Depends(get_db)):
    """Retrieves the latest NDVI analysis for a given satellite image ID."""
    a = db.query(NdviAnalysis).filter(NdviAnalysis.satellite_image_id == image_id).order_by(NdviAnalysis.created_at.desc()).first()
    if not a:
        raise HTTPException(
            status_code=404,
            detail=f"No NDVI analysis has been computed for Satellite Image #{image_id} yet."
        )

    colorized_file = Path(a.colorized_png_path).name if a.colorized_png_path else ""
    hist_file = Path(a.histogram_path).name if a.histogram_path else ""

    return NdviAnalysisResponse(
        id=a.id,
        satellite_image_id=a.satellite_image_id,
        created_at=a.created_at,
        mean_ndvi=a.mean_ndvi,
        min_ndvi=a.min_ndvi,
        max_ndvi=a.max_ndvi,
        std_ndvi=a.std_ndvi,
        total_analyzed_area_sq_km=a.total_analyzed_area_sq_km,
        green_cover_sq_km=a.green_cover_sq_km,
        non_vegetation_sq_km=a.non_vegetation_sq_km,
        green_cover_percentage=a.green_cover_percentage,
        classification_breakdown=a.classification_breakdown,
        colorized_png_url=f"/static/ndvi/{colorized_file}",
        histogram_url=f"/static/ndvi/{hist_file}" if hist_file else None,
    )


@router.get("/probe/{image_id}")
def probe_ndvi_pixel(
    image_id: int,
    lat: float,
    lon: float,
    db: Session = Depends(get_db),
):
    """
    Samples the exact Float32 NDVI value and vegetation category at given (lat, lon) coordinates.
    """
    analysis = db.query(NdviAnalysis).filter(NdviAnalysis.satellite_image_id == image_id).order_by(NdviAnalysis.created_at.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No NDVI analysis found for this scene.")

    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Satellite image not found.")

    raster_path = Path(analysis.ndvi_raster_path)
    if not raster_path.exists():
        raise HTTPException(status_code=404, detail="NDVI raster file missing on disk.")

    import tifffile
    import numpy as np

    with tifffile.TiffFile(str(raster_path)) as tf:
        arr = tf.pages[0].asarray()
        height, width = arr.shape

    bbox = image.bbox or {}
    min_lon = bbox.get("min_longitude", 77.68)
    max_lon = bbox.get("max_longitude", 78.52)
    min_lat = bbox.get("min_latitude", 9.53)
    max_lat = bbox.get("max_latitude", 10.35)

    if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
        return {
            "status": "outside_extent",
            "lat": lat,
            "lon": lon,
            "message": "Coordinate is outside satellite scene bounds for Madurai District.",
        }

    px = int(round(((lon - min_lon) / (max_lon - min_lon)) * (width - 1)))
    py = int(round(((max_lat - lat) / (max_lat - min_lat)) * (height - 1)))

    px = max(0, min(width - 1, px))
    py = max(0, min(height - 1, py))

    val = float(arr[py, px])

    if val <= -9000.0 or np.isnan(val) or val < -1.0 or val > 1.0:
        return {
            "status": "nodata",
            "lat": lat,
            "lon": lon,
            "message": "Location is outside Madurai administrative boundary or masked nodata.",
        }

    if val < 0.0:
        cid, cname, col = 0, "Water Body", "#0D47A1"
    elif val < 0.2:
        cid, cname, col = 1, "Built-up / Barren Land", "#BDBDBD"
    elif val < 0.4:
        cid, cname, col = 2, "Sparse Vegetation", "#FFF59D"
    elif val < 0.6:
        cid, cname, col = 3, "Moderate Vegetation", "#66BB6A"
    else:
        cid, cname, col = 4, "Dense Vegetation", "#1B5E20"

    return {
        "status": "success",
        "lat": lat,
        "lon": lon,
        "pixel": {"x": px, "y": py},
        "ndvi": round(val, 4),
        "class_id": cid,
        "class_name": cname,
        "color_hex": col,
        "is_vegetation": cid >= 2,
    }
