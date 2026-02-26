from typing import Dict, List, Any, AsyncIterator, Optional
import logging
import re
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
PROMPT_ENHANCER_USER = """
Generate a very short, precise, and professional course title (2-4 words) for: {prompt}.

STRICT RULES:
1. Return ONLY the title text itself.
2. DO NOT include "Course Title:", "Title:", or any prefix.
3. DO NOT include "Reasoning", "Brevity", or any explanation of your thought process.
4. DO NOT use bolding or markdown.
5. NO quotes.

Example of GOOD output: Quantum Mechanics Fundamentals
Example of BAD output: Course Title: Quantum Mechanics. Reasoning: I chose this because...
""".strip()

PROMPT_TOPICS_SYS = "You are an expert curriculum architect. Return raw JSON array only."
PROMPT_TOPICS_USER = """
Design a complete course for "{title}".
Requirements:
- 8–12 modules
- Short and precise module titles (max 5 words)
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
    
    title = resp if resp else state["prompt"]
    
    # Post-process to ensure no junk text leaked through
    # 1. Strip "Course Title:" or "Title:" prefix
    title = re.sub(r'^(Course Title|Title):\s*', '', title, flags=re.IGNORECASE)
    # 2. Strip anything starting with "**Reasoning**" or "Reasoning:"
    title = re.split(r'\n|Reasoning:', title, flags=re.IGNORECASE)[0]
    # 3. Clean markdown bolding
    title = title.replace("**", "").replace("__", "").strip()
    
    state["enhanced_prompt"] = title
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

# Removed score_video_relevance


def generate_module_content(topic: str, course_title: str = "") -> Dict[str, Any]:
    """Generates full content for a single module (public helper)."""
    subtopics = _generate_subtopics(topic)

    # Fetch and select 1 highly relevant video per subtopic.
    # Include the course subject in the search query for contextual, domain-specific results.
    # e.g. "Python Variables and Data Types tutorial" instead of just "Variables tutorial"
    selected_videos = []
    for st in subtopics:
        if course_title:
            query = f"{course_title} {st} tutorial"
        else:
            query = f"{st} {topic} tutorial"
        results = search_youtube_videos(query, limit=1)
        if results:
            # Trust YouTube's native search ranking (result #1) as it is much smarter than word matching
            selected_videos.append(results[0])
        else:
            selected_videos.append(None)

    # Single LLM call per module to get everything
    package = _generate_module_package(topic, subtopics, selected_videos)
    explanations = package.get("explanations", {})

    # Ensure contextual placement: Attach [[VIDEO_i]] tag to the end of each subtopic 
    # if the LLM didn't already place it, ensuring every subtopic has its corresponding video.
    # We iterate by order since LLMs might slightly alter the dict keys.
    for i, key in enumerate(explanations.keys()):
        if i < len(selected_videos) and selected_videos[i] is not None:
            tag = f"[[VIDEO_{i}]]"
            if tag not in explanations[key]:
                explanations[key] = explanations[key].strip() + f"\n\n{tag}"
        else:
            # Clean up broken tags if no video exists
            explanations[key] = explanations[key].replace(f"[[VIDEO_{i}]]", "")

    return {
        "module_title": topic,
        "explanations": explanations,
        "videos": selected_videos,
        "mermaid": package.get("mermaid", ""),
        "flashcards": package.get("flashcards", []),
        "quiz": package.get("quiz", []),
    }


def node_generate_module(state: CourseState) -> CourseState:
    if not state["pending_topics"]:
        return state
    
    current_topic = state["pending_topics"].pop(0)
    course_title = state.get("enhanced_prompt", "")
    state["generated_modules"][current_topic] = generate_module_content(current_topic, course_title=course_title)
    return state


def node_finalize_course(state: CourseState) -> CourseState:
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


def _generate_module_package(
    topic: str,
    subtopics: List[str],
    videos: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Use a single LLM call to generate explanations, flashcards, quiz, 
    and a custom Mermaid diagram for a module.
    """
    video_context = "\n".join(
        [f"Video {i}: {v.get('title', 'Video')}" for i, v in enumerate(videos)]
    ) or "No videos available."

    system_prompt = """
You are an expert technical instructor and assessment designer.
You create deep explanations, practical flashcards, rigorous quizzes, and detailed diagrams.

TASK:
- For the given module topic and its subtopics, generate:
  1) Detailed explanations per subtopic (with optional [[MERMAID]] and [[VIDEO_i]] tags)
  2) 5–8 spaced-repetition flashcards
  3) 6 multiple-choice quiz questions
  4) Exactly ONE Mermaid diagram (graph LR) that visually explains the core process or logic of this module.

AVAILABLE RESOURCES:
- Topic: {topic}
- Subtopics: {subtopics}
- Videos (for reference only, do NOT invent new IDs):
{video_context}

EXPLANATIONS REQUIREMENTS:
- DO NOT summarize. Expand every concept thoroughly, providing MAXIMUM detail.
- Prefer completeness over brevity. Write extremely comprehensive paragraphs.
- Tone: Educational, professional, and textbook-level.

FOR EVERY SUBTOPIC, you MUST structure your explanation using the following exact numbered headings. Do not alter the names of these headings. You can use markdown like `### 1. Topic Introduction` but the text MUST match exactly one of the following:
1. Topic Introduction
2. Core Concepts
3. Foundational Background
4. Detailed Explanation
5. Concept Breakdown / Mechanism / Theory Analysis
6. Examples / Case Studies / Illustrations
7. Applications / Significance
8. Key Insights or Important Points
9. Recap Summary

Rules for Subtopic Explanations:
- You must generate AT LEAST 4-5 of the above structure sections for each subtopic.
- NEVER combine everything into a single short paragraph. Break the text under each heading into detailed, in-depth explanations.
- Adapt content logically: derive logically for math/physics, explain principles for science, analyze frameworks for humanities. Let the content be natural.
- The keys within the "explanations" JSON object MUST EXACTLY MATCH the items listed in Subtopics. Do not alter the subtopic names at all.
- Use [[MERMAID]] tag exactly ZERO or ONE time in the entire module's explanations.
- Video Embedding: Each subtopic {{i}} (0-indexed) has a corresponding Video {{i}}. You MUST embed the tag [[VIDEO_{{i}}]] at the end of the explanation for subtopic {{i}} to provide visual context.

DIAGRAM REQUIREMENTS:
- Format: Mermaid.js (graph LR)
- Content: Must be specific to this module's logic, not a generic overview.
- Styling: Use 'style' commands for colors (e.g., style NodeA fill:#f96).

FLASHCARDS REQUIREMENTS:
- 5–8 items
- JSON array: {{ "front": "...", "back": "..." }}

QUIZ REQUIREMENTS:
- 6 questions testing SUBJECT MATTER knowledge.
- Fields: "question", "options" (4), "answer_index" (0-3), "explanation".

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{{
  "explanations": {{ "Subtopic": "..." }},
  "flashcards": [ ... ],
  "quiz": [ ... ],
  "mermaid": "graph LR\\n    A[Step 1] --> B[Step 2]..."
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
        return resp

    # Fallback
    logger.warning(f"Module package generation failed for topic '{topic}'.")
    return {
        "explanations": {},
        "flashcards": [],
        "quiz": [],
        "mermaid": "",
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
