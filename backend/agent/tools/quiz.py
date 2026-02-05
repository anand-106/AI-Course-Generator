from typing import List, Dict, Any
import logging
import re
from ..llm import LLMClient

# Initialize shared client
llm_client = LLMClient()
logger = logging.getLogger(__name__)

QuizQuestion = Dict[str, Any]

def generate_quiz_for_topic(topic: str, subtopics: List[str], num_questions: int = 6) -> List[QuizQuestion]:
    """
    Generate a quiz for a module/topic.
    Returns a list of questions with options, answer_index, and explanation.
    """
    num_questions = max(3, min(int(num_questions or 6), 10))
    clean_topic = _clean_topic_name(topic)
    
    # We embed params directly in system prompt string where they are descriptive,
    # but pass dynamic values via input_vars for safety/cleanliness
    system_prompt = """
    You are an expert educator creating multiple-choice quizzes that test actual SUBJECT MATTER knowledge.
    Return JSON only. No markdown. No code fences.
    
    CRITICAL RULES:
    - Questions MUST test knowledge of the ACTUAL SUBJECT CONTENT (facts, concepts, syntax, procedures, examples)
    - DO NOT mention "Module", "studying", "learning goals", "course structure", or "completing module"
    - DO NOT ask "What is a key concept covered in..." or "What should you understand after..."
    - Questions should be about THE SUBJECT ITSELF, not about the course structure or learning process
    - Extract the actual subject from the topic name (ignore "Module X:" prefixes)
    
    Rules:
    - Create {num_questions} questions testing actual knowledge of: {subject} and its subtopics: {subtopics}
    - Each question must have exactly 4 options.
    - Exactly one option is correct.
    - Provide answer_index as an integer 0-3.
    - Provide a short explanation (1-2 sentences) explaining why the answer is correct.
    - Make questions test specific facts, concepts, syntax, or skills from the subject matter.
    
    Return ONLY a JSON array in this exact shape:
    [
      {{ "question": "...", "options": ["A","B","C","D"], "answer_index": 0, "explanation": "..." }}
    ]
    """
    
    human_prompt = (
        "Generate quiz questions that test actual SUBJECT KNOWLEDGE of:\n"
        "Subject: {subject}\n"
        "Subtopics: {subtopics}\n\n"
        "Create {num_questions} questions about THE SUBJECT CONTENT."
    )

    response = llm_client.invoke(
        system_prompt=system_prompt,
        human_prompt_template=human_prompt,
        input_vars={
            "subject": clean_topic,
            "subtopics": ", ".join(subtopics),
            "num_questions": num_questions
        }
    )

    data = response
    # Handle { "quiz": [...] } format if LLM wraps it
    if isinstance(data, dict) and isinstance(data.get("quiz"), list):
        data = data["quiz"]
        
    if isinstance(data, list) and data:
        return _filter_and_clean_questions(data, num_questions)
        
    logger.warning(f"Quiz generation failed for topic '{topic}'. Returning empty quiz.")
    return []

def _clean_topic_name(topic: str) -> str:
    """Remove module prefixes like 'Module 1:' or 'Module X:' to get the actual subject."""
    cleaned = re.sub(r"^Module\s+\d+:\s*", "", topic, flags=re.IGNORECASE)
    cleaned = re.sub(r"^Module\s+[A-Z]+:\s*", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip() or topic

def _is_meta_question(question: str) -> bool:
    """Check if a question is a meta-question about studying/learning rather than content."""
    meta_keywords = [
        "primary goal of studying", "key concept covered in", "should you understand after completing",
        "most relevant to", "what should you do", "how should you approach", "what is the goal",
        "studying module", "learning module", "completing module"
    ]
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in meta_keywords)

def _filter_and_clean_questions(questions: List[Dict], limit: int) -> List[QuizQuestion]:
    """Validates and processes raw questions."""
    cleaned = []
    for q in questions:
        if not isinstance(q, dict): continue
        
        question = str(q.get("question", "")).strip()
        options = q.get("options", [])
        
        if not question or not isinstance(options, list) or len(options) != 4:
            continue
            
        if _is_meta_question(question):
            logger.info(f"Filtered out meta-question: {question[:60]}...")
            continue
            
        try:
            ai = int(q.get("answer_index", -1))
        except (ValueError, TypeError):
            continue
            
        if not (0 <= ai <= 3):
            continue
            
        cleaned.append({
            "question": question,
            "options": [str(o) for o in options],
            "answer_index": ai,
            "explanation": q.get("explanation", "Review module content.").strip()
        })
        
    return cleaned[:limit]
