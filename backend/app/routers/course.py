from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from app.agent.agent import run_workflow


router = APIRouter(prefix="/course", tags=["Course"])


class CourseRequest(BaseModel):
    prompt: str


@router.post("/generate")
def generate_course(req: CourseRequest) -> Dict[str, Any]:
    try:
        course = run_workflow(req.prompt)
        return {"course": course}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


