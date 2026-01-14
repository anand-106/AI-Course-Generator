from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, AsyncGenerator, List
import json
from datetime import datetime
import uuid

from agent.agent import run_workflow_stream
from core.security import get_current_user
from db import courses_collection


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
    course_id = str(uuid.uuid4())
    logger.info(f"Generating course stream for user: {current_user}, prompt: {req.prompt[:50]}...")

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Yield initial status
            yield json.dumps({"type": "status", "message": "Validating prompt..."}) + "\n"
            
            sent_topics = set()
            validation_processed = False
            
            async for chunk in run_workflow_stream(req.prompt):
                # chunk is like {"node_name": {state_updates}}
                logger.debug(f"Received chunk: {list(chunk.keys())}")
                for node_name, updates in chunk.items():
                    
                    # Handle validation node
                    if node_name == "validate_prompt":
                        validation_processed = True
                        logger.info(f"Validation node update: {updates}")
                        is_valid = updates.get("is_valid", True)
                        if not is_valid:
                            validation_error = updates.get("validation_error", 
                                "This prompt is not suitable for course generation. Please provide a topic, subject, or skill that can be taught. Examples: 'Python programming', 'Machine Learning basics', 'Web development'.")
                            logger.info(f"Sending validation error: {validation_error}")
                            yield json.dumps({
                                "type": "error",
                                "message": validation_error,
                                "code": "INVALID_PROMPT"
                            }) + "\n"
                            return  # Stop streaming if validation fails
                        # If valid, continue to next step
                        logger.info("Validation passed, continuing...")
                        yield json.dumps({"type": "status", "message": "Prompt validated. Enhancing prompt..."}) + "\n"
                    
                    elif node_name == "enhance_prompt":
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
                        full_course = updates.get("course", {})
                        # Save to DB
                        if courses_collection is not None:
                            try:
                                courses_collection.insert_one({
                                    "course_id": course_id,
                                    "user_id": current_user,
                                    "prompt": req.prompt,
                                    "title": full_course.get("title", "Untitled Course"),
                                    "course_data": full_course,
                                    "created_at": datetime.utcnow()
                                })
                                logger.info(f"Course {course_id} saved to DB")
                            except Exception as e:
                                logger.error(f"Failed to save course to DB: {e}")

                        yield json.dumps({
                            "type": "complete",
                            "data": full_course
                        }) + "\n"
                        
        except Exception as exc:
            logger.error(f"Stream error: {str(exc)}")
            import traceback
            logger.error(traceback.format_exc())
            yield json.dumps({"type": "error", "message": str(exc)}) + "\n"
        finally:
            # Ensure we always send something if validation wasn't processed
            if not validation_processed:
                logger.warning("Validation node was not processed, sending timeout error")
                yield json.dumps({
                    "type": "error",
                    "message": "Validation timed out. Please try again with a valid course topic.",
                    "code": "VALIDATION_TIMEOUT"
                }) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


@router.get("/list")
async def get_user_courses(current_user: str = Depends(get_current_user)) -> List[Dict[str, Any]]:
    if courses_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    cursor = courses_collection.find({"user_id": current_user}).sort("created_at", -1)
    courses = []
    
    # helper to serialise id
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        courses.append(doc)
        
    return courses


