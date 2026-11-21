from functools import lru_cache
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "GreenVision - Satellite Urban Vegetation Intelligence"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8001

    # Base Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DIR: Path = BASE_DIR / "data" / "raw"
    PROCESSED_DIR: Path = BASE_DIR / "data" / "processed"
    NDVI_OUTPUT_DIR: Path = BASE_DIR / "data" / "ndvi_outputs"
    REPORTS_DIR: Path = BASE_DIR / "data" / "reports"
    BOUNDARIES_DIR: Path = BASE_DIR / "data" / "boundaries"

    # Database (Absolute path resolving to workspace root)
    DATABASE_URL: str = f"sqlite:///{Path(__file__).resolve().parent.parent.parent / 'greenvision.db'}"

    # Satellite & File Upload Rules
    MAX_UPLOAD_SIZE_MB: int = 500
    ALLOWED_EXTENSIONS: List[str] = [".tif", ".tiff", ".jp2"]

    # Target District Geospatial Coordinates (Madurai, Tamil Nadu)
    DISTRICT_NAME: str = "Madurai"
    STATE_NAME: str = "Tamil Nadu"
    COUNTRY: str = "India"
    
    # Bounding Box (WGS84 EPSG:4326): [min_lon, min_lat, max_lon, max_lat]
    MADURAI_BBOX_MIN_LON: float = 77.68
    MADURAI_BBOX_MIN_LAT: float = 9.53
    MADURAI_BBOX_MAX_LON: float = 78.52
    MADURAI_BBOX_MAX_LAT: float = 10.35

    # Target UTM Projection for Madurai (UTM Zone 44N)
    DEFAULT_CRS: str = "EPSG:32644"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    # Ensure standard data directories exist
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    settings.RAW_DIR.mkdir(parents=True, exist_ok=True)
    settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    settings.NDVI_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    settings.BOUNDARIES_DIR.mkdir(parents=True, exist_ok=True)
    return settings
