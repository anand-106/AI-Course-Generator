from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any

from app.agent.agent import run_workflow
from app.core.security import get_current_user


router = APIRouter(prefix="/course", tags=["Course"])


class CourseRequest(BaseModel):
    prompt: str


@router.post("/generate")
def generate_course(
    req: CourseRequest,
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Generating course for user: {current_user}, prompt: {req.prompt[:50]}...")
        course = run_workflow(req.prompt)
        return {"course": course}
    except Exception as exc:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Course generation error: {str(exc)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Course generation failed: {str(exc)}")


