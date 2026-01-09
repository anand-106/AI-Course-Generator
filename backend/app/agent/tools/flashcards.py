from typing import List, Dict
import os
import json
import re

try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
except Exception:
    ChatGroq = None
    ChatPromptTemplate = None

def generate_flashcards_for_topic(topic: str, subtopics: List[str]) -> List[Dict[str, str]]:
    """
    Generate flashcards (front/back) for a topic and its subtopics.
    Returns: [{"front": "Term/Question", "back": "Definition/Answer"}]
    """
    
    if ChatGroq and ChatPromptTemplate and os.getenv("GROQ_API_KEY"):
        try:
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.3
            )
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """
                You are an expert educator creating flashcards for spaced repetition learning. 
                Return JSON only.
                Create 5-8 high-quality flashcards for the given topic and subtopics.
                Focus on:
                1. Key definitions (e.g., "What is X?")
                2. Syntax/Usage (e.g., "How do you declare Y?")
                3. Concepts (e.g., "Difference between A and B")
                                
                Structure:
                [
                    { "front": "Question or Term", "back": "Clear, concise answer or definition" },
                    ...
                ]
                """),
                ("human", (
                    "Topic: '{topic}'\n"
                    "Subtopics: {subtopics}\n\n"
                    "Return ONLY the JSON array of flashcard objects."
                )),
            ])
            
            chain = prompt | llm
            resp = chain.invoke({"topic": topic, "subtopics": ", ".join(subtopics)})
            
            content = resp.content if hasattr(resp, "content") else str(resp)
            
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "flashcards" in data:
                    return data["flashcards"]
            except Exception:
                # regex fallback
                m = re.search(r"\[[\s\S]*\]", content)
                if m:
                    try:
                        return json.loads(m.group(0))
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error generating flashcards: {e}")
            pass

    # Fallback
    return [
        {"front": f"What is {topic}?", "back": f"{topic} is a key concept covered in this module."},
        {"front": "Key Takeaway", "back": "Review the module explanations to master this topic."}
    ]
