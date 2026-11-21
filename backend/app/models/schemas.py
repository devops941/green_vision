from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# =====================================================================
# Health & Status Schemas
# =====================================================================

class SystemStatusResponse(BaseModel):
    status: str
    service: str
    version: str
    target_scope: str
    python_version: str
    backend_time: str
    data_directories: Dict[str, bool]


# =====================================================================
# Madurai District Schemas
# =====================================================================

class GeoBBox(BaseModel):
    min_longitude: float
    min_latitude: float
    max_longitude: float
    max_latitude: float


class GeoCenter(BaseModel):
    latitude: float
    longitude: float


class MaduraiOverviewResponse(BaseModel):
    district: str
    state: str
    country: str
    center: GeoCenter
    bbox_wgs84: GeoBBox
    utm_crs: str
    area_sq_km: float
    taluks: List[str]
    description: str


# =====================================================================
# Satellite Image Schemas
# =====================================================================

class SatelliteImageBase(BaseModel):
    title: str
    sensor: str
    acquisition_date: datetime
    year: int
    month: Optional[int] = None
    notes: Optional[str] = None


class SatelliteImageCreate(SatelliteImageBase):
    pass


class SatelliteImageResponse(SatelliteImageBase):
    id: int
    red_band_path: str
    nir_band_path: str
    processed_red_path: Optional[str] = None
    processed_nir_path: Optional[str] = None
    rgb_composite_path: Optional[str] = None
    crs: str
    spatial_resolution_m: float
    bbox: Dict[str, float]
    is_madurai_district: bool
    cloud_cover_percentage: float
    is_preprocessed: bool
    processed_at: Optional[datetime] = None
    clipped_pixels_count: Optional[int] = None
    valid_pixels_count: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PreprocessingResultResponse(BaseModel):
    image_id: int
    title: str
    sensor: str
    is_preprocessed: bool
    clipped_red_path: str
    clipped_nir_path: str
    clipped_dimensions: Dict[str, int]
    target_crs: str
    spatial_resolution_m: float
    total_clipped_pixels: int
    valid_district_pixels: int
    boundary_mask_applied: bool
    message: str


# =====================================================================
# NDVI Analysis Schemas
# =====================================================================

class ClassificationBreakdownItem(BaseModel):
    class_id: int
    name: str
    area_sq_km: float
    percentage: float
    color_hex: str


class NdviAnalysisResponse(BaseModel):
    id: int
    satellite_image_id: int
    created_at: datetime
    mean_ndvi: float
    min_ndvi: float
    max_ndvi: float
    std_ndvi: float
    total_analyzed_area_sq_km: float
    green_cover_sq_km: float
    non_vegetation_sq_km: float
    green_cover_percentage: float
    classification_breakdown: List[ClassificationBreakdownItem]
    colorized_png_url: str
    histogram_url: Optional[str] = None

    class Config:
        from_attributes = True


# =====================================================================
# Temporal Comparison Schemas
# =====================================================================

class ComparisonCreateRequest(BaseModel):
    baseline_analysis_id: int
    target_analysis_id: int
    title: Optional[str] = None


class ComparisonResponse(BaseModel):
    id: int
    title: str
    baseline_year: int
    target_year: int
    baseline_analysis_id: int
    target_analysis_id: int
    green_cover_delta_sq_km: float
    green_cover_delta_percentage: float
    vegetation_gain_sq_km: float
    vegetation_loss_sq_km: float
    vegetation_stable_sq_km: float
    transition_matrix: Optional[Dict[str, Any]] = None
    difference_map_url: str
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# PDF Report Schemas (Phase 7)
# =====================================================================

class GeneratedReportInfo(BaseModel):
    report_id: str
    report_type: str  # "ndvi_assessment" | "temporal_comparison"
    title: str
    filename: str
    file_path: str
    download_url: str
    file_size_kb: float
    created_at: datetime
    analysis_id: Optional[int] = None
    comparison_id: Optional[int] = None
