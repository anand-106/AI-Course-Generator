from typing import Dict, List, Any, AsyncIterator
import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv

from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from agent.tools import (
    generate_explanations_for_topic,
    search_youtube_videos,
    generate_mermaid_for_topic,
    generate_flashcards_for_topic,
)

# Load .env file before checking for API key
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# -------------------------------------------------------------------
# HARD REQUIREMENTS (AI-ONLY MODE)
# -------------------------------------------------------------------

if not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("GROQ_API_KEY is required to run the course generation agent.")

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.3
)

# -------------------------------------------------------------------
# STATE
# -------------------------------------------------------------------

class CourseState(dict):
    prompt: str
    enhanced_prompt: str
    topics: List[str]
    # Iterative state
    pending_topics: List[str]
    generated_modules: Dict[str, Any]
    # Final output
    course: Dict[str, Any]
    # Validation
    is_valid: bool = True
    validation_error: str = None


def extract_json_list(text: str) -> List[str]:
    """Extracts a JSON list from a string, handling markdown code blocks."""
    text = text.strip()
    # Try to find a JSON list in markdown code blocks
    match = re.search(r"```(?:json)?\s*(\[\s*.*?\s*\])\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    else:
        # Fallback: try to find the start and end of a list
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1:
            text = text[start:end+1]
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Log the failed content for debugging
        print(f"FAILED TO PARSE JSON. RAW CONTENT:\n{text}")
        raise e


# -------------------------------------------------------------------
# NODE 0: Validate Prompt
# -------------------------------------------------------------------

def node_validate_prompt(state: CourseState) -> CourseState:
    """
    Validate if the prompt is related to course generation or educational content.
    Returns state with is_valid=False and validation_error if not valid.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a prompt validator for an educational course generation system.
Your task is to determine if a user's prompt is suitable for generating an educational course.

A valid prompt should be:
- Related to learning, education, or skill development
- About a subject, topic, skill, or field that can be taught
- Suitable for creating structured learning content

Invalid prompts include:
- Personal questions or conversations
- Requests for general information or facts
- Non-educational topics (weather, jokes, etc.)
- Random text or gibberish
- Requests that don't involve learning or teaching

Respond with ONLY a JSON object in this exact format:
{{"is_valid": true/false, "reason": "brief explanation"}}

If valid, set is_valid to true. If invalid, set is_valid to false and provide a clear reason."""),
            ("human", "Validate this prompt for course generation: {prompt}")
        ])
        
        chain = prompt | llm
        logger.info(f"Validating prompt: {state['prompt'][:50]}...")
        resp = chain.invoke({"prompt": state["prompt"]})
        logger.info(f"Validation response received: {resp.content[:100]}...")
        
        # Extract JSON from response
        response_text = resp.content.strip()
        # Remove markdown code blocks if present
        response_text = re.sub(r"```(?:json)?\s*", "", response_text)
        response_text = re.sub(r"```\s*", "", response_text)
        response_text = response_text.strip()
        
        # Try to find JSON object
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        if start != -1 and end > start:
            response_text = response_text[start:end]
        
        validation_result = json.loads(response_text)
        logger.info(f"Parsed validation result: {validation_result}")
        
        state["is_valid"] = validation_result.get("is_valid", True)
        if not state["is_valid"]:
            reason = validation_result.get("reason", "This prompt is not suitable for course generation.")
            # Create a user-friendly error message
            error_msg = f"{reason}\n\nPlease provide a topic, subject, or skill that can be taught. Examples: 'Python programming', 'Machine Learning basics', 'Web development', 'Data structures and algorithms'."
            state["validation_error"] = error_msg
            logger.info(f"Validation failed: {error_msg}")
        else:
            logger.info("Validation passed")
            
    except (json.JSONDecodeError, KeyError) as e:
        # If we can't parse the validation, default to valid (fail open)
        logger.warning(f"Could not parse validation response: {e}")
        logger.warning(f"Response was: {resp.content if 'resp' in locals() else 'No response'}")
        state["is_valid"] = True
    except Exception as e:
        logger.error(f"Error during validation: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # On error, default to valid to not block users
        state["is_valid"] = True
    
    return state


# -------------------------------------------------------------------
# NODE 1: Enhance Prompt → Course Title
# -------------------------------------------------------------------


def node_enhance_prompt(state: CourseState) -> CourseState:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a senior instructional designer."),
        ("human", "Generate a concise professional course title (max 12 words) for: {prompt}")
    ])

    chain = prompt | llm
    resp = chain.invoke({"prompt": state["prompt"]})

    state["enhanced_prompt"] = resp.content.strip()
    return state

# -------------------------------------------------------------------
# NODE 2: Generate Course Topics (Modules)
# -------------------------------------------------------------------

def node_generate_topics(state: CourseState) -> CourseState:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert curriculum architect. Return raw JSON array only, no markdown, no code blocks."),
        ("human", """
        Design a complete course for "{title}".

        Requirements:
        - 8–12 modules
        - Progressive difficulty
        - Industry-relevant
        - Each module should be clearly distinct
        - Return ONLY a JSON array of strings
        - Do not use markdown formatting
        """)
    ])

    chain = prompt | llm
    resp = chain.invoke({"title": state["enhanced_prompt"]})

    try:
        topics = extract_json_list(resp.content)
    except Exception as e:
        print(f"Error parsing topics: {e}")
        # Fallback or retry logic could go here, for now raising to be handled upstream or fail
        raise ValueError("Failed to parse topics from LLM response")

    if not isinstance(topics, list) or not topics:
        raise ValueError("Invalid topics generated by AI")

    state["topics"] = topics
    state["pending_topics"] = topics[:]  # Initialize pending
    state["generated_modules"] = {}      # Initialize storage
    return state


# -------------------------------------------------------------------
# HELPER: Generate Submodules per Topic
# -------------------------------------------------------------------

def generate_subtopics(topic: str) -> List[str]:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a subject matter expert. Return raw JSON array only, no markdown."),
        ("human", """
        For the course module "{topic}", generate 4–6 detailed submodules.
        Each submodule should represent a clear learning unit.
        Return ONLY a JSON array of short strings.
        Do not use markdown formatting.
        """)
    ])

    chain = prompt | llm
    resp = chain.invoke({"topic": topic})

    try:
        subtopics = extract_json_list(resp.content)
    except Exception as e:
        print(f"Error parsing subtopics: {e}")
        raise ValueError(f"Failed to parse subtopics for {topic}")

    if not isinstance(subtopics, list) or not subtopics:
        raise ValueError(f"Invalid subtopics for module: {topic}")

    return subtopics

# -------------------------------------------------------------------
# NODE 3: Generate Module Content (Iterative)
# -------------------------------------------------------------------

def node_generate_module(state: CourseState) -> CourseState:
    
    if not state["pending_topics"]:
        return state
    
    current_topic = state["pending_topics"].pop(0)
    
    
    subtopics = generate_subtopics(current_topic)
    explanations = generate_explanations_for_topic(current_topic, subtopics)
    videos = search_youtube_videos(f"{current_topic} tutorial", limit=3)
    mermaid = generate_mermaid_for_topic(current_topic, list(explanations.keys()))
    flashcards = generate_flashcards_for_topic(current_topic, subtopics)
    
    module_data = {
        "module_title": current_topic,
        "explanations": explanations,    # Restore dictionary for frontend
        "videos": videos,                # Rename back to 'videos'
        "mermaid": mermaid,              # Rename back to 'mermaid'
        "flashcards": flashcards         # New field
    }
    
    # Store in state
    state["generated_modules"][current_topic] = module_data
    return state


# -------------------------------------------------------------------
# NODE 4: Finalize
# -------------------------------------------------------------------

def node_finalize_course(state: CourseState) -> CourseState:
    ordered_modules = {}
    for topic in state["topics"]:
        if topic in state["generated_modules"]:
            ordered_modules[topic] = state["generated_modules"][topic]

    state["course"] = {
        "title": state["enhanced_prompt"],
        "modules": ordered_modules
    }
    return state


# -------------------------------------------------------------------
# CONDITIONAL EDGES
# -------------------------------------------------------------------

def should_continue(state: CourseState) -> str:
    if state["pending_topics"]:
        return "generate_module"
    return "finalize_course"


# -------------------------------------------------------------------
# GRAPH BUILDER
# -------------------------------------------------------------------

def build_graph():
    graph = StateGraph(CourseState)

    graph.add_node("validate_prompt", node_validate_prompt)
    graph.add_node("enhance_prompt", node_enhance_prompt)
    graph.add_node("generate_topics", node_generate_topics)
    graph.add_node("generate_module", node_generate_module)
    graph.add_node("finalize_course", node_finalize_course)

    graph.set_entry_point("validate_prompt")
    
    # Conditional edge: if validation fails, go to END, otherwise continue
    def should_continue_after_validation(state: CourseState) -> str:
        if not state.get("is_valid", True):
            return "end"
        return "enhance_prompt"
    
    graph.add_conditional_edges(
        "validate_prompt",
        should_continue_after_validation,
        {
            "end": END,
            "enhance_prompt": "enhance_prompt"
        }
    )
    
    graph.add_edge("enhance_prompt", "generate_topics")
    graph.add_edge("generate_topics", "generate_module")
    
    graph.add_conditional_edges(
        "generate_module",
        should_continue,
        {
            "generate_module": "generate_module",
            "finalize_course": "finalize_course"
        }
    )
    graph.add_edge("finalize_course", END)

    return graph.compile()


# -------------------------------------------------------------------
# PUBLIC API (Streaming)
# -------------------------------------------------------------------

async def run_workflow_stream(user_prompt: str) -> AsyncIterator[Dict[str, Any]]:
    workflow = build_graph()
    initial_state = {
        "prompt": user_prompt,
        "is_valid": True,
        "validation_error": None
    }
    
    # We'll stream the updates from the graph
    # stream_mode="updates" yields only the updates returned by the nodes
    async for event in workflow.astream(initial_state, stream_mode="updates"):
        yield event
