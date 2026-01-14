from typing import List, Dict, Any, Optional
import os
import json
import re

try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
except Exception:
    ChatGroq = None
    ChatPromptTemplate = None


QuizQuestion = Dict[str, Any]


def _extract_json_array(text: str) -> Optional[List[Dict[str, Any]]]:
    text = text.strip()
    # Remove fenced blocks if present
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get("quiz"), list):
            return data["quiz"]
        return None
    except Exception:
        m = re.search(r"\[[\s\S]*\]", text)
        if not m:
            return None
        try:
            data = json.loads(m.group(0))
            if isinstance(data, list):
                return data
            return None
        except Exception:
            return None


def _clean_topic_name(topic: str) -> str:
    """Remove module prefixes like 'Module 1:' or 'Module X:' to get the actual subject."""
    # Remove patterns like "Module 1:", "Module X:", "Module 2: ", etc.
    cleaned = re.sub(r"^Module\s+\d+:\s*", "", topic, flags=re.IGNORECASE)
    cleaned = re.sub(r"^Module\s+[A-Z]+:\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned if cleaned else topic


def _is_meta_question(question: str) -> bool:
    """Check if a question is a meta-question about studying/learning rather than content."""
    meta_keywords = [
        "primary goal of studying",
        "key concept covered in",
        "should you understand after completing",
        "most relevant to",
        "what should you do",
        "how should you approach",
        "what is the goal",
        "studying module",
        "learning module",
        "completing module",
    ]
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in meta_keywords)


def generate_quiz_for_topic(topic: str, subtopics: List[str], num_questions: int = 6) -> List[QuizQuestion]:
    """
    Generate a quiz for a module/topic.

    Returns a list of questions:
    [
      {
        "question": str,
        "options": [str, str, str, str],
        "answer_index": int,              # 0-3
        "explanation": str                # brief why
      },
      ...
    ]
    """
    num_questions = max(3, min(int(num_questions or 6), 10))
    
    # Clean topic name to remove module prefixes
    clean_topic = _clean_topic_name(topic)

    if ChatGroq and ChatPromptTemplate and os.getenv("GROQ_API_KEY"):
        try:
            llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)

            prompt = ChatPromptTemplate.from_messages([
                ("system", """
You are an expert educator creating multiple-choice quizzes that test actual SUBJECT MATTER knowledge.
Return JSON only. No markdown. No code fences.

CRITICAL RULES:
- Questions MUST test knowledge of the ACTUAL SUBJECT CONTENT (facts, concepts, syntax, procedures, examples)
- DO NOT mention "Module", "studying", "learning goals", "course structure", or "completing module"
- DO NOT ask "What is a key concept covered in..." or "What should you understand after..."
- Questions should be about THE SUBJECT ITSELF, not about the course structure or learning process
- Extract the actual subject from the topic name (ignore "Module X:" prefixes)

Examples for "Introduction to Java Programming":
GOOD questions:
- "What keyword is used to declare a class in Java?"
- "What is the entry point method in a Java program?"
- "Which data type stores whole numbers in Java?"
- "What does 'public static void main(String[] args)' represent?"

BAD questions (DO NOT CREATE):
- "What is a key concept covered in Module 1: Introduction to Java Programming?"
- "What should you understand after completing Introduction to Java Programming?"
- "What is the primary goal of studying Java Programming?"

Rules:
- Create {num_questions} questions testing actual knowledge of: {subject} and its subtopics: {subtopics}
- Each question must have exactly 4 options.
- Exactly one option is correct.
- Provide answer_index as an integer 0-3.
- Provide a short explanation (1-2 sentences) explaining why the answer is correct.
- Make questions test specific facts, concepts, syntax, or skills from the subject matter.

Return ONLY a JSON array in this exact shape:
[
  {{"question":"...", "options":["A","B","C","D"], "answer_index": 0, "explanation":"..."}},
  ...
]
"""),
                ("human", "Generate quiz questions that test actual SUBJECT KNOWLEDGE of:\nSubject: {subject}\nSubtopics: {subtopics}\n\nCreate {num_questions} questions about THE SUBJECT CONTENT (facts, concepts, syntax, examples), NOT about modules, studying, or learning goals.")
            ])

            chain = prompt | llm
            resp = chain.invoke({
                "subject": clean_topic,  # Use cleaned topic without module prefix
                "subtopics": ", ".join(subtopics),
                "num_questions": num_questions,
            })

            content = resp.content if hasattr(resp, "content") else str(resp)
            data = _extract_json_array(content)
            if isinstance(data, list) and data:
                # Validation and filtering
                cleaned: List[QuizQuestion] = []
                for q in data:
                    if not isinstance(q, dict):
                        continue
                    question = str(q.get("question", "")).strip()
                    options = q.get("options", [])
                    answer_index = q.get("answer_index", None)
                    explanation = str(q.get("explanation", "")).strip()
                    
                    # Skip if question is empty or invalid format
                    if not question or not isinstance(options, list) or len(options) != 4:
                        continue
                    
                    # FILTER OUT META-QUESTIONS
                    if _is_meta_question(question):
                        print(f"Filtered out meta-question: {question[:60]}...")
                        continue
                    
                    try:
                        ai = int(answer_index)
                    except Exception:
                        continue
                    if ai < 0 or ai > 3:
                        continue
                    
                    cleaned.append({
                        "question": question,
                        "options": [str(o) for o in options],
                        "answer_index": ai,
                        "explanation": explanation or "Review the module content to understand why this is correct.",
                    })
                if cleaned:
                    return cleaned[:num_questions]
        except Exception as e:
            print(f"Error generating quiz: {e}")

    # Fallback: Return empty list to force LLM retry or indicate failure
    # We don't want to generate generic meta-questions as fallback
    # Better to have no quiz than bad quiz
    print(f"Warning: Quiz generation failed for topic '{topic}'. Returning empty quiz.")
    return []


