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
            
            # Use single_step=True to generate only the first module initially
            async for chunk in run_workflow_stream(req.prompt, single_step=True):
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
                        # Save to DB - Include pending_topics from state (updates["course"] should have it now)
                        if courses_collection is not None:
                            try:
                                courses_collection.insert_one({
                                    "course_id": course_id,
                                    "user_id": current_user,
                                    "prompt": req.prompt,
                                    "title": full_course.get("title", "Untitled Course"),
                                    "course_data": full_course, # This now includes 'pending_topics'
                                    "created_at": datetime.utcnow()
                                })
                                logger.info(f"Course {course_id} saved to DB")
                            except Exception as e:
                                logger.error(f"Failed to save course to DB: {e}")

                        yield json.dumps({
                            "type": "complete",
                            "data": full_course,
                            "course_id": course_id # Send ID back so frontend can request next modules
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


@router.post("/{course_id}/generate_next_module")
async def generate_next_module(course_id: str, current_user: str = Depends(get_current_user)):
    """Generates the next available module for a given course."""
    if courses_collection is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    course_doc = courses_collection.find_one({"course_id": course_id, "user_id": current_user})
    if not course_doc:
        raise HTTPException(status_code=404, detail="Course not found")
        
    course_data = course_doc.get("course_data", {})
    pending_topics = course_data.get("pending_topics", [])
    
    if not pending_topics:
        return {"message": "All modules have already been generated.", "completed": True}
        
    # Get next topic
    next_topic = pending_topics.pop(0)
    
    try:
        from agent.agent import generate_module_content
        # Generate content using the extracted logic
        module_content = generate_module_content(next_topic)
        
        # Update course data
        if "modules" not in course_data:
            course_data["modules"] = {}
            
        course_data["modules"][next_topic] = module_content
        course_data["pending_topics"] = pending_topics
        
        # Save back to DB
        courses_collection.update_one(
            {"course_id": course_id},
            {"$set": {"course_data": course_data}}
        )
        
        return {
            "module": module_content,
            "remaining_topics": len(pending_topics),
            "completed": False
        }
        
    except Exception as e:
        print(f"Error generating next module: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate module: {str(e)}")


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


