from typing import List, Dict
import logging
from ..llm import LLMClient

# Initialize shared client
llm_client = LLMClient()
logger = logging.getLogger(__name__)

def generate_explanations_for_topic(topic: str, subtopics: List[str], videos: List[Dict] = [], mermaid_code: str = "") -> Dict[str, str]:
    """
    Generate detailed, structured explanations for a topic and its subtopics,
    embedding references to provided videos and diagrams.
    """
    
    # Format video list for the prompt
    video_context = "\n".join([f"Video {i}: {v.get('title', 'Video')} (ID: {i})" for i, v in enumerate(videos)])
    
    system_prompt = """
    You are an expert technical instructor. 
    
    TASK:
    For each subtopic provided, write a DEEP, TECHNICAL, and COMPREHENSIVE explanation.
    You MUST integrate visual aids (Videos and Diagrams) directly into the text where they are most relevant.
    
    AVAILABLE RESOURCES:
    Videos:
    {video_context}
    
    Diagram: A Mermaid diagram representing the concept flow.
    
    REQUIREMENTS:
    1. Length: 200-300 words per subtopic.
    2. Content: 
       - Start with a clear, technical definition.
       - Explain the "Why" and "How" in detail.
       - Include code snippets or syntax examples where applicable.
       - Provide a real-world use case.
    3. **Embedding Visuals**:
       - You MUST insert the tag `[[MERMAID]]` in exactly ONE subtopic where the visual flow is most helpful.
       - You SHOULD insert video tags `[[VIDEO_0]]`, `[[VIDEO_1]]`, etc., in the subtopics where that specific video is most relevant.
       - **Do not list them at the end.** Embed them naturally between paragraphs or after concepts.
    4. Format: Return ONLY a valid JSON object.
    
    JSON STRUCTURE:
    {{
        "Subtopic Name 1": "Full explanation text with [[MERMAID]] and [[VIDEO_0]] tags...",
        "Subtopic Name 2": "Full explanation text..."
    }}
    
    IMPORTANT JSON RULES:
    - Output raw JSON.
    - ESCAPE ALL DOUBLE QUOTES inside the explanation strings (e.g., use \\" instead of ").
    - Do NOT use markdown formatting for the outer block (no ```json wrapper).
    - Newlines in the text must be escaped as \\n.
    """
    
    human_prompt = (
        "Topic: '{topic}'\n"
        "Subtopics: {subtopics}\n\n"
        "Return strictly a JSON object mapping subtopic_name -> detailed_explanation_string."
    )

    response = llm_client.invoke(
        system_prompt=system_prompt,
        human_prompt_template=human_prompt,
        input_vars={
            "topic": topic, 
            "subtopics": ", ".join(subtopics),
            "video_context": video_context if video_context else "No videos available."
        }
    )

    if isinstance(response, dict):
        return response

    logger.warning(f"Using fallback content for topic: {topic}")
    return _generate_fallback(topic, subtopics, videos, mermaid_code)

def _generate_fallback(topic: str, subtopics: List[str], videos: List[Dict], mermaid_code: str) -> Dict[str, str]:
    """Generates fallback content when LLM fails."""
    fallback_content = {}
    for i, st in enumerate(subtopics):
        text = (
            f"**{st}** is a fundamental concept in {topic}. \n\n"
            "Understanding this is crucial for the broader subject. "
            "(Note: Detailed AI explanation could not be generated due to local model parsing error. Please check backend logs.)"
        )
        # Try to embed resources in the first/second topic if failing
        if i == 0 and mermaid_code:
            text += "\n\n[[MERMAID]]"
        if i < len(videos):
            text += f"\n\n[[VIDEO_{i}]]"
            
        fallback_content[st] = text
        
    return fallback_content



