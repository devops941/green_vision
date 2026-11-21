from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.core.database import engine, Base
from app.core.logging import logger
from app.api.routes import health, madurai, satellite, preprocessing, ndvi, comparison, reports

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
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
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
    app.include_router(preprocessing.router, prefix="/api")
    app.include_router(ndvi.router, prefix="/api")
    app.include_router(comparison.router, prefix="/api")
    app.include_router(reports.router, prefix="/api")

    # Mount Built Frontend SPA if available
    frontend_build = (settings.BASE_DIR.parent / "frontend" / "build").resolve()
    if frontend_build.exists() and (frontend_build / "index.html").exists():
        from fastapi.responses import FileResponse

        static_dir = frontend_build / "static"
        if (static_dir / "js").exists():
            app.mount("/static/js", StaticFiles(directory=str(static_dir / "js")), name="react_js")
        if (static_dir / "css").exists():
            app.mount("/static/css", StaticFiles(directory=str(static_dir / "css")), name="react_css")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            if full_path.startswith("api/") or full_path.startswith("docs") or full_path == "openapi.json":
                return None
            target = frontend_build / full_path
            if full_path and target.exists() and target.is_file():
                return FileResponse(target)
            return FileResponse(frontend_build / "index.html")
    else:
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
