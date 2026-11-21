import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.config import get_settings
from app.utils.geo_constants import MADURAI_GEO_METADATA
from app.models.schemas import MaduraiOverviewResponse

router = APIRouter(prefix="/madurai", tags=["Madurai District"])


@router.get("/overview", response_model=MaduraiOverviewResponse)
def get_madurai_overview():
    """
    Returns official geospatial metadata for Madurai District.
    """
    return MaduraiOverviewResponse(
        district=MADURAI_GEO_METADATA["district"],
        state=MADURAI_GEO_METADATA["state"],
        country=MADURAI_GEO_METADATA["country"],
        center=MADURAI_GEO_METADATA["center"],
        bbox_wgs84=MADURAI_GEO_METADATA["bbox_wgs84"],
        utm_crs=MADURAI_GEO_METADATA["utm_crs"],
        area_sq_km=MADURAI_GEO_METADATA["area_sq_km"],
        taluks=MADURAI_GEO_METADATA["taluks"],
        description=(
            "Madurai is a prominent historical and urbanized cultural district in southern Tamil Nadu, "
            "traversed by the Vaigai River basin. Total district area is approximately 3,741 sq km. "
            "Satellite monitoring in GreenVision tracks urban canopy, scrubland, and agricultural green-cover."
        )
    )


@router.get("/boundary")
def get_madurai_boundary_geojson():
    """
    Returns the official GeoJSON boundary feature for Madurai District.
    """
    settings = get_settings()
    geojson_path = settings.BOUNDARIES_DIR / "madurai_boundary.geojson"

    if not geojson_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Madurai boundary GeoJSON not found in boundaries directory."
        )

    try:
        with open(geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read boundary GeoJSON: {str(e)}")
