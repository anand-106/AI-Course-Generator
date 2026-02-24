from typing import Dict, List, Any, AsyncIterator, Optional
import logging
from pathlib import Path
from dotenv import load_dotenv

from langgraph.graph import StateGraph, END

# Import Tools
from agent.tools import (
    search_youtube_videos,
    generate_mermaid_for_topic,
)
from agent.llm import LLMClient

# Setup
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Services
llm_client = LLMClient()
logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# STATE
# -------------------------------------------------------------------

class CourseState(dict):
    """Represents the flow state of course generation."""
    prompt: str
    enhanced_prompt: str
    topics: List[str]
    pending_topics: List[str]
    generated_modules: Dict[str, Any]
    course: Dict[str, Any]
    # Validation & Control
    is_valid: bool = True
    validation_error: Optional[str] = None
    single_step: bool = False


# -------------------------------------------------------------------
# PROMPTS
# -------------------------------------------------------------------

PROMPT_VALIDATOR_SYS = """You are a prompt validator for an educational course generation system.
A valid prompt should be:
- Related to learning, education, or skill development.
- About a subject, topic, skill, or field that can be taught.
- Suitable for creating structured learning content.

Invalid prompts include:
- Personal questions or conversations.
- Requests for general information or facts.
- Non-educational topics (weather, jokes, etc.).
- Random text or gibberish.

Respond with ONLY a JSON object:
{{ "is_valid": true/false, "reason": "brief explanation" }}
"""

PROMPT_ENHANCER_SYS = "You are a senior instructional designer."
PROMPT_ENHANCER_USER = "Generate a concise professional course title (max 7 words) for: {prompt}. Return ONLY the title text. No 'Here is'. No quotes."

PROMPT_TOPICS_SYS = "You are an expert curriculum architect. Return raw JSON array only."
PROMPT_TOPICS_USER = """
Design a complete course for "{title}".
Requirements:
- 8–12 modules
- Progressive difficulty
- Industry-relevant
- Each module should be clearly distinct
- Return ONLY a JSON array of strings
"""

PROMPT_SUBTOPICS_SYS = "You are a subject matter expert. Return raw JSON array only."
PROMPT_SUBTOPICS_USER = """
For the course module "{topic}", generate 4–6 detailed submodules.
Each submodule should represent a clear learning unit.
Return ONLY a JSON array of short strings.
"""


# -------------------------------------------------------------------
# NODES
# -------------------------------------------------------------------

def node_validate_prompt(state: CourseState) -> CourseState:
    logger.info(f"Validating prompt: {state.get('prompt', '')[:50]}...")
    
    resp = llm_client.invoke(
        system_prompt=PROMPT_VALIDATOR_SYS,
        human_prompt_template="Validate this prompt for course generation: {prompt}",
        input_vars={"prompt": state["prompt"]}
    )

    if isinstance(resp, dict):
        state["is_valid"] = resp.get("is_valid", True)
        if not state["is_valid"]:
            state["validation_error"] = resp.get("reason", "Prompt not suitable for course generation.")
    else:
        # Fail open
        state["is_valid"] = True
        
    return state


def node_enhance_prompt(state: CourseState) -> CourseState:
    resp = llm_client.invoke(
        system_prompt=PROMPT_ENHANCER_SYS,
        human_prompt_template=PROMPT_ENHANCER_USER,
        input_vars={"prompt": state["prompt"]},
        require_json=False
    )
    
    state["enhanced_prompt"] = resp if resp else state["prompt"]
    return state


def node_generate_topics(state: CourseState) -> CourseState:
    resp = llm_client.invoke(
        system_prompt=PROMPT_TOPICS_SYS,
        human_prompt_template=PROMPT_TOPICS_USER,
        input_vars={"title": state["enhanced_prompt"]}
    )

    if isinstance(resp, list):
        state["topics"] = [str(item) if not isinstance(item, str) else item for item in resp]
    else:
        # Fallback or strict error
        state["topics"] = [f"Module {i}: General Concept" for i in range(1, 6)]
        
    state["pending_topics"] = state["topics"][:]
    state["generated_modules"] = {}
    return state


# -------------------------------------------------------------------
# PUBLIC HELPERS
# -------------------------------------------------------------------

def generate_module_content(topic: str) -> Dict[str, Any]:
    """Generates full content for a single module (public helper)."""
    subtopics = _generate_subtopics(topic)

    # 1 targeted video per subtopic (more relevant than N generic videos per module)
    videos = []
    for st in subtopics:
        results = search_youtube_videos(f"{st} {topic} explained", limit=1)
        if results:
            videos.append(results[0])

    mermaid = generate_mermaid_for_topic(topic, subtopics)

    # Single LLM call per module to get explanations, flashcards, and quiz together
    package = _generate_module_package(topic, subtopics, videos, mermaid)

    explanations = package.get("explanations")
    flashcards = package.get("flashcards")
    quiz = package.get("quiz")

    return {
        "module_title": topic,
        "explanations": explanations,
        "videos": videos,
        "mermaid": mermaid,
        "flashcards": flashcards,
        "quiz": quiz,
    }


def node_generate_module(state: CourseState) -> CourseState:
    if not state["pending_topics"]:
        return state
    
    current_topic = state["pending_topics"].pop(0)
    
    # Reuse the helper
    state["generated_modules"][current_topic] = generate_module_content(current_topic)
    
    return state



def node_finalize_course(state: CourseState) -> CourseState:
    # Organize based on original topics order
    ordered_modules = {
        topic: state["generated_modules"][topic]
        for topic in state["topics"]
        if topic in state["generated_modules"]
    }

    state["course"] = {
        "title": state["enhanced_prompt"],
        "modules": ordered_modules,
        "topics": state["topics"],
        "pending_topics": state["pending_topics"]
    }
    return state


# -------------------------------------------------------------------
# HELPERS
# -------------------------------------------------------------------


def _generate_module_package(
    topic: str,
    subtopics: List[str],
    videos: List[Dict[str, Any]],
    mermaid_code: str,
) -> Dict[str, Any]:
    """
    Use a single LLM call to generate explanations, flashcards, and quiz
    content for a module.
    """
    video_context = "\n".join(
        [f"Video {i}: {v.get('title', 'Video')}" for i, v in enumerate(videos)]
    ) or "No videos available."

    system_prompt = """
You are an expert technical instructor and assessment designer.
You create deep explanations, practical flashcards, and rigorous quizzes.

TASK:
- For the given module topic and its subtopics, generate:
  1) Detailed explanations per subtopic (with optional [[MERMAID]] and [[VIDEO_i]] tags)
  2) 5–8 spaced-repetition flashcards
  3) 6 multiple-choice quiz questions

AVAILABLE RESOURCES:
- Topic: {topic}
- Subtopics: {subtopics}
- Videos (for reference only, do NOT invent new IDs):
{video_context}
- Diagram: Mermaid diagram describing the concept flow is available.

EXPLANATIONS REQUIREMENTS:
- 200–300 words per subtopic
- Start with a clear definition
- Explain the WHY and HOW in detail
- Include examples or code/syntax where relevant
- Use [[MERMAID]] tag in exactly ONE subtopic where a visual flow helps most
- Use [[VIDEO_0]], [[VIDEO_1]], etc. inline where the corresponding video is most relevant

FLASHCARDS REQUIREMENTS:
- 5–8 items
- JSON array of objects: {{ "front": "...", "back": "..." }}
- Focus on "How to...", scenarios, or key facts
- Avoid meta-questions about modules or studying (no "What is covered in this module?")

QUIZ REQUIREMENTS:
- 6 questions testing SUBJECT MATTER knowledge (facts, concepts, syntax, procedures)
- Each question: exactly 4 options, exactly 1 correct
- Fields: "question", "options" (4 strings), "answer_index" (0–3), "explanation" (1–2 sentences)
- Do NOT talk about learning goals, modules, or studying; ONLY the subject itself.

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN, NO COMMENTS):
{{
  "explanations": {{
    "Subtopic 1": "Full text with [[MERMAID]] / [[VIDEO_i]] tags...",
    "Subtopic 2": "..."
  }},
  "flashcards": [
    {{ "front": "...", "back": "..." }}
  ],
  "quiz": [
    {{ "question": "...", "options": ["A","B","C","D"], "answer_index": 0, "explanation": "..." }}
  ]
}}
""".strip()

    human_prompt = (
        "Generate explanations, flashcards, and quiz content for:\n"
        "Topic: {topic}\n"
        "Subtopics: {subtopics}\n"
        "Return ONLY the JSON object with keys 'explanations', 'flashcards', and 'quiz'."
    )

    resp = llm_client.invoke(
        system_prompt=system_prompt,
        human_prompt_template=human_prompt,
        input_vars={
            "topic": topic,
            "subtopics": ", ".join(subtopics),
            "video_context": video_context,
        },
        require_json=True,
    )

    if isinstance(resp, dict):
        # Basic normalization to avoid crashes if some keys are missing
        pkg: Dict[str, Any] = {}
        explanations = resp.get("explanations")
        if isinstance(explanations, dict):
            pkg["explanations"] = explanations

        flashcards = resp.get("flashcards")
        if isinstance(flashcards, list):
            pkg["flashcards"] = flashcards

        quiz = resp.get("quiz")
        if isinstance(quiz, list):
            pkg["quiz"] = quiz

        return pkg

    # Fallback: empty structures to keep the pipeline robust
    logger.warning(f"Module package generation failed for topic '{topic}'. Using empty content.")
    return {
        "explanations": {},
        "flashcards": [],
        "quiz": [],
    }


def _generate_subtopics(topic: str) -> List[str]:
    resp = llm_client.invoke(
        system_prompt=PROMPT_SUBTOPICS_SYS,
        human_prompt_template=PROMPT_SUBTOPICS_USER,
        input_vars={"topic": topic}
    )
    
    if isinstance(resp, list):
        return [str(item) if not isinstance(item, str) else item for item in resp]
    return ["Overview", "Key Concepts", "Practical Examples", "Summary"]


# -------------------------------------------------------------------
# GRAPH
# -------------------------------------------------------------------

def should_continue(state: CourseState) -> str:
    if state.get("single_step", False):
        return "finalize_course"
    if state["pending_topics"]:
        return "generate_module"
    return "finalize_course"


def should_continue_after_validation(state: CourseState) -> str:
    if not state.get("is_valid", True):
        return "end"
    return "enhance_prompt"


def build_graph():
    graph = StateGraph(CourseState)

    graph.add_node("validate_prompt", node_validate_prompt)
    graph.add_node("enhance_prompt", node_enhance_prompt)
    graph.add_node("generate_topics", node_generate_topics)
    graph.add_node("generate_module", node_generate_module)
    graph.add_node("finalize_course", node_finalize_course)

    graph.set_entry_point("validate_prompt")
    
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


async def run_workflow_stream(user_prompt: str, single_step: bool = False) -> AsyncIterator[Dict[str, Any]]:
    workflow = build_graph()
    initial_state = {
        "prompt": user_prompt,
        "is_valid": True,
        "validation_error": None,
        "single_step": single_step,
        "topics": [],
        "pending_topics": [],
        "generated_modules": {},
        "course": {}
    }
    
    async for event in workflow.astream(initial_state, stream_mode="updates"):
        yield event
