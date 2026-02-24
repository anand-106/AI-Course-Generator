from typing import List, Dict
import logging
from ..llm import LLMClient

llm_client = LLMClient()
logger = logging.getLogger(__name__)

def generate_flashcards_for_topic(topic: str, subtopics: List[str]) -> List[Dict[str, str]]:
    """
    Generate flashcards (front/back) for a topic and its subtopics.
    Returns: [{"front": "Term/Question", "back": "Definition/Answer"}]
    """
    
    system_prompt = """
    You are an expert educator creating practical flashcards for spaced repetition learning.
    Return JSON only.
    
    Create 5-8 high-quality, concept-based flashcards for the given topic.
    
    RULES:
    1. Avoid generic "What is X?" questions unless X is a complex concept.
    2. Focus on "How to...", "Scenario", or "Key Fact" based questions.
       - Example: "Who was the first president of the USA?" -> "George Washington"
       - Example: "Primary cause of photosynthesis?" -> "Sunlight, Water, and Carbon Dioxide"
    3. Ensure the Front is a clear question or prompt, and the Back is the direct answer.
    4. If the topic includes "Module X:", ignore the prefix and focus on the actual content.
    5. Do NOT reference the module title itself as a question (e.g., "What is Module 1?").
                    
    Structure:
    [
        {{ "front": "Specific Question/Prompt", "back": "Precise Answer" }}
    ]
    """
    
    human_prompt = (
        "Topic: '{topic}'\n"
        "Subtopics: {subtopics}\n\n"
        "Return ONLY the JSON array of flashcard objects."
    )

    response = llm_client.invoke(
        system_prompt=system_prompt,
        human_prompt_template=human_prompt,
        input_vars={"topic": topic, "subtopics": ", ".join(subtopics)}
    )

    # Validate and normalize response
    if isinstance(response, list):
        return response
    elif isinstance(response, dict) and "flashcards" in response:
        return response["flashcards"]
        
    logger.warning(f"Using fallback flashcards for topic: {topic}")
    return _generate_fallback(topic)

def _generate_fallback(topic: str) -> List[Dict[str, str]]:
    """Generates generic flashcards on failure."""
    return [
        {"front": f"What is {topic}?", "back": f"{topic} is a key concept covered in this module."},
        {"front": "Key Takeaway", "back": "Review the module explanations to master this topic."}
    ]
