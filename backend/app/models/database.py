from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    Text,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class SatelliteImage(Base):
    """
    Stores metadata for authentic satellite imagery uploaded or ingested
    for Madurai District.
    """
    __tablename__ = "satellite_images"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    sensor = Column(String(50), nullable=False)  # SENTINEL_2, LANDSAT_8_9
    acquisition_date = Column(DateTime, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=True)

    # File Storage Paths
    red_band_path = Column(String(500), nullable=False)
    nir_band_path = Column(String(500), nullable=False)
    rgb_composite_path = Column(String(500), nullable=True)

    # Geospatial Validation Metadata
    crs = Column(String(50), nullable=False)  # e.g., EPSG:32644 or EPSG:4326
    spatial_resolution_m = Column(Float, nullable=False)
    bbox = Column(JSON, nullable=False)  # [min_lon, min_lat, max_lon, max_lat]
    is_madurai_district = Column(Boolean, default=True)
    cloud_cover_percentage = Column(Float, default=0.0)

    # Status
    is_preprocessed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ndvi_analyses = relationship("NdviAnalysis", back_populates="satellite_image", cascade="all, delete-orphan")


class NdviAnalysis(Base):
    """
    Stores results of authentic NDVI calculation and vegetation classification.
    """
    __tablename__ = "ndvi_analyses"

    id = Column(Integer, primary_key=True, index=True)
    satellite_image_id = Column(Integer, ForeignKey("satellite_images.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Output Raster GeoTIFF & Visualization PNG
    ndvi_raster_path = Column(String(500), nullable=False)
    classified_raster_path = Column(String(500), nullable=False)
    colorized_png_path = Column(String(500), nullable=False)
    histogram_path = Column(String(500), nullable=True)

    # Statistical Aggregates for Madurai
    mean_ndvi = Column(Float, nullable=False)
    min_ndvi = Column(Float, nullable=False)
    max_ndvi = Column(Float, nullable=False)
    std_ndvi = Column(Float, nullable=False)

    # Area Metrics (sq km & percentage)
    total_analyzed_area_sq_km = Column(Float, nullable=False)
    green_cover_sq_km = Column(Float, nullable=False)
    non_vegetation_sq_km = Column(Float, nullable=False)
    green_cover_percentage = Column(Float, nullable=False)

    # Categorical Breakdown (JSON structure with area and % for each class)
    # 0: Water, 1: Built-up/Barren, 2: Sparse Veg, 3: Moderate Veg, 4: Dense Veg
    classification_breakdown = Column(JSON, nullable=False)

    # Relationship
    satellite_image = relationship("SatelliteImage", back_populates="ndvi_analyses")


class TemporalComparison(Base):
    """
    Stores change detection results between two distinct years for Madurai District.
    """
    __tablename__ = "temporal_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    baseline_year = Column(Integer, nullable=False)
    target_year = Column(Integer, nullable=False)
    
    baseline_analysis_id = Column(Integer, ForeignKey("ndvi_analyses.id"), nullable=False)
    target_analysis_id = Column(Integer, ForeignKey("ndvi_analyses.id"), nullable=False)

    # Change Raster & Map
    difference_raster_path = Column(String(500), nullable=False)
    difference_map_png_path = Column(String(500), nullable=False)

    # Statistical Deltas
    green_cover_delta_sq_km = Column(Float, nullable=False)
    green_cover_delta_percentage = Column(Float, nullable=False)
    
    vegetation_gain_sq_km = Column(Float, nullable=False)
    vegetation_loss_sq_km = Column(Float, nullable=False)
    vegetation_stable_sq_km = Column(Float, nullable=False)

    transition_matrix = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
