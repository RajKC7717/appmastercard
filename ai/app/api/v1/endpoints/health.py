"""Health check endpoint."""
import time
from fastapi import APIRouter

router = APIRouter()
_start_time = time.time()


@router.get("/")
async def health():
    """Returns service health status."""
    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - _start_time, 2),
    }
