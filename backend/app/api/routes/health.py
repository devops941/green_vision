import sys
from datetime import datetime
from fastapi import APIRouter
from app.config import get_settings
from app.models.schemas import SystemStatusResponse

router = APIRouter(prefix="/health", tags=["Health & Status"])


@router.get("", response_model=SystemStatusResponse)
def get_system_status():
    """
    Returns system status, environment configuration, and target scope.
    """
    settings = get_settings()
    data_dirs_exist = {
        "data": settings.DATA_DIR.exists(),
        "raw": settings.RAW_DIR.exists(),
        "processed": settings.PROCESSED_DIR.exists(),
        "ndvi_outputs": settings.NDVI_OUTPUT_DIR.exists(),
        "reports": settings.REPORTS_DIR.exists(),
        "boundaries": settings.BOUNDARIES_DIR.exists(),
    }

    return SystemStatusResponse(
        status="operational",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        target_scope="Madurai District, Tamil Nadu, India",
        python_version=sys.version.split()[0],
        backend_time=datetime.utcnow().isoformat() + "Z",
        data_directories=data_dirs_exist,
    )
