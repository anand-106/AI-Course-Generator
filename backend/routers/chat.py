import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from agent.llm import LLMClient
from core.security import get_current_user
from db import courses_collection, db
from datetime import datetime

chats_collection = db["chats"] if db is not None else None

router = APIRouter(prefix="/chat", tags=["Chat"])
llm_client = LLMClient()

CHAT_SYSTEM_PROMPT = """
You are "Geny", a friendly, professional, and supportive AI learning assistant.
Your goal is to help users understand the course content and answer their doubts.

RULES:
1. Doubt Resolution: Provide clear, structured, and educational explanations.
2. Context Awareness: You will be provided with the current course context. Prioritize answering based on this context.
3. Outside Topics: If a user asks something unrelated to the course, answer it helpfully but briefly mention it's outside the current course scope.
4. Behavior: Maintain a supportive tone, encourage curiosity, and avoid robotic responses.
5. Formatting: Use clear structure with headings (###), bullet points, and bold text for key terms. Keep examples practical.
6. Brevity: Be thorough but avoid unnecessary fluff.

COURSE CONTEXT:
{course_context}
"""

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = None

class ChatRequest(BaseModel):
    message: str
    course_id: Optional[str] = None

@router.get("/history/{course_id}")
async def get_chat_history(course_id: str, current_user: str = Depends(get_current_user)):
    if chats_collection is None:
        return []
    
    chat_doc = chats_collection.find_one({"course_id": course_id, "user_id": current_user})
    if not chat_doc:
        return []
    
    # Clean up _id for JSON serialisation if necessary, though list of dicts is fine
    return chat_doc.get("messages", [])

@router.post("/ask")
async def ask_geny(req: ChatRequest, current_user: str = Depends(get_current_user)):
    try:
        course_context = "No specific course context provided."
        if req.course_id:
            course_doc = courses_collection.find_one({"course_id": req.course_id, "user_id": current_user})
            if course_doc:
                data = course_doc.get("course_data", {})
                title = data.get("title", "Untitled")
                topics = data.get("topics", [])
                modules = data.get("modules", {})
                
                # Create a concise summary for the LLM
                context_parts = [f"Course Title: {title}"]
                context_parts.append(f"Modules: {', '.join(topics)}")
                
                # Add snippet of current modules for deeper doubt resolution
                # (Limited to avoid context window explosion)
                for t in topics[:3]: 
                    if t in modules:
                        m = modules[t]
                        explanations = m.get("explanations", {})
                        snip = " ".join(list(explanations.values()))[:500]
                        context_parts.append(f"Module '{t}' Summary: {snip}...")
                
                course_context = "\n".join(context_parts)

        # 2. Get existing history from DB for LLM context
        existing_history = []
        if chats_collection is not None and req.course_id:
            chat_doc = chats_collection.find_one({"course_id": req.course_id, "user_id": current_user})
            if chat_doc:
                existing_history = chat_doc.get("messages", [])

        # Prepare chat history for LangChain format
        history_str = ""
        for msg in existing_history[-10:]: # Last 10 messages for context
            history_str += f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}\n"
        
        human_prompt = f"Chat History:\n{history_str}\nUser Question: {req.message}\n\nAnswer as Geny:"
        
        response = llm_client.invoke(
            system_prompt=CHAT_SYSTEM_PROMPT.format(course_context=course_context),
            human_prompt_template=human_prompt,
            input_vars={},
            require_json=False
        )
        
        if not response:
            return {"answer": "I’m having trouble right now. Please try again.", "error": True}
            
        # 3. Save to DB
        if chats_collection is not None and req.course_id:
            new_user_msg = {"role": "user", "content": req.message, "timestamp": datetime.utcnow()}
            new_assistant_msg = {"role": "assistant", "content": response, "timestamp": datetime.utcnow()}
            
            chats_collection.update_one(
                {"course_id": req.course_id, "user_id": current_user},
                {"$push": {"messages": {"$each": [new_user_msg, new_assistant_msg]}}},
                upsert=True
            )

        return {"answer": response}

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Chat error: {e}")
        import traceback
        logging.getLogger(__name__).error(traceback.format_exc())
        return {"answer": "I’m having trouble right now. Please try again.", "error": True}
