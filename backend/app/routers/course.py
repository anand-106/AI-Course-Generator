from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, AsyncGenerator
import json

from app.agent.agent import run_workflow_stream
from app.core.security import get_current_user


router = APIRouter(prefix="/course", tags=["Course"])


class CourseRequest(BaseModel):
    prompt: str


@router.post("/generate")
async def generate_course(
    req: CourseRequest,
    current_user: str = Depends(get_current_user)
):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Generating course stream for user: {current_user}, prompt: {req.prompt[:50]}...")

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Yield initial status
            yield json.dumps({"type": "status", "message": "Enhancing prompt..."}) + "\n"
            
            sent_topics = set()
            
            async for chunk in run_workflow_stream(req.prompt):
                # chunk is like {"node_name": {state_updates}}
                for node_name, updates in chunk.items():
                    
                    if node_name == "enhance_prompt":
                        title = updates.get("enhanced_prompt", "")
                        yield json.dumps({
                            "type": "status", 
                            "message": f"Designing curriculum for: {title}"
                        }) + "\n"
                        
                    elif node_name == "generate_topics":
                        yield json.dumps({
                            "type": "meta",
                            "data": {
                                "title": updates.get("enhanced_prompt", ""),
                                "topics": updates.get("topics", [])
                            }
                        }) + "\n"
                        
                    elif node_name == "generate_module":
                        modules = updates.get("generated_modules", {})
                        for topic, content in modules.items():
                            if topic not in sent_topics:
                                yield json.dumps({
                                    "type": "module",
                                    "data": content
                                }) + "\n"
                                sent_topics.add(topic)
                                
                    elif node_name == "finalize_course":
                        yield json.dumps({
                            "type": "complete",
                            "data": updates.get("course", {})
                        }) + "\n"
                        
        except Exception as exc:
            logger.error(f"Stream error: {str(exc)}")
            import traceback
            logger.error(traceback.format_exc())
            yield json.dumps({"type": "error", "message": str(exc)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


