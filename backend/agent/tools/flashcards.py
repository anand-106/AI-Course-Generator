from typing import List, Dict
import os
import json
import re

try:
    from langchain_ollama import ChatOllama
    from langchain_core.prompts import ChatPromptTemplate
except Exception:
    ChatOllama = None
    ChatPromptTemplate = None

def generate_flashcards_for_topic(topic: str, subtopics: List[str]) -> List[Dict[str, str]]:
    """
    Generate flashcards (front/back) for a topic and its subtopics.
    Returns: [{"front": "Term/Question", "back": "Definition/Answer"}]
    """
    
    if ChatOllama and ChatPromptTemplate:
        try:
            llm = ChatOllama(
                model="llama3.1",
                temperature=0.3
            )
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """
                You are an expert technical educator creating practical flashcards for spaced repetition learning.
                Return JSON only.
                
                Create 5-8 high-quality, concept-based flashcards for the given topic.
                
                RULES:
                1. Avoid generic "What is X?" questions unless X is a complex concept.
                2. Focus on "How to..." or "Scenario" based questions.
                   - Example: "How to declare an integer in Python?" -> "x = 5 (or int variable)"
                   - Example: "Command to install a package?" -> "pip install <package>"
                3. Ensure the Front is a clear question or prompt, and the Back is the direct answer.
                4. If the topic includes "Module X:", ignore the prefix and focus on the actual content.
                5. Do NOT reference the module title itself as a question (e.g., "What is Module 1?").
                                
                Structure:
                [
                    {{ "front": "Specific Question/Prompt", "back": "Precise Answer" }},
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
            
            # Attempt to fix invalid escape sequences
            content = re.sub(r'\\(?![\\/bfnrt"]|u[0-9a-fA-F]{4})', r'\\\\', content)
            
            try:
                data = json.loads(content, strict=False)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "flashcards" in data:
                    return data["flashcards"]
            except Exception:
                # regex fallback
                m = re.search(r"\[[\s\S]*\]", content)
                if m:
                    try:
                        return json.loads(m.group(0), strict=False)
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
