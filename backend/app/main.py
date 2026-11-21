from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.core.database import engine, Base
from app.core.logging import logger
from app.api.routes import health, madurai, satellite

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle management.
    """
    logger.info("Initializing GreenVision database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info(f"Target scope verified: {settings.DISTRICT_NAME} District, {settings.STATE_NAME}")
    logger.info(f"Geographic BBox: Lon[{settings.MADURAI_BBOX_MIN_LON}, {settings.MADURAI_BBOX_MAX_LON}], Lat[{settings.MADURAI_BBOX_MIN_LAT}, {settings.MADURAI_BBOX_MAX_LAT}]")
    yield
    logger.info("GreenVision backend shutting down.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Satellite-Based Urban Vegetation Intelligence & Green-Cover Analysis "
            "restricted to Madurai District, Tamil Nadu, India."
        ),
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static directories for previewing processed NDVI images and generated reports
    app.mount("/static/ndvi", StaticFiles(directory=str(settings.NDVI_OUTPUT_DIR)), name="ndvi_static")
    app.mount("/static/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports_static")

    # Register API Routers
    app.include_router(health.router, prefix="/api")
    app.include_router(madurai.router, prefix="/api")
    app.include_router(satellite.router, prefix="/api")

    @app.get("/")
    def root():
        return {
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "scope": f"{settings.DISTRICT_NAME} District, {settings.STATE_NAME}, {settings.COUNTRY}",
            "docs_url": "/docs",
            "health_url": "/api/health",
            "madurai_overview_url": "/api/madurai/overview",
        }

    return app


app = create_app()
