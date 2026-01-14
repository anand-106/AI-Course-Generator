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


def generate_explanations_for_topic(topic: str, subtopics: List[str]) -> Dict[str, str]:
    """
    Generate detailed, structured explanations for a topic and its subtopics.
    """
    
    # Check if Groq is available and configured
    if ChatGroq and ChatPromptTemplate and os.getenv("GROQ_API_KEY"):
        try:
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                temperature=0.3
            )
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """
                You are an expert instructor. return JSON only.
                For each subtopic, write a DETAILED, COMPREHENSIVE explanation (150-250 words).
                Include:
                1. Core Concept: Clear definition.
                2. Real-world Context: Why it matters.
                3. Key Details: How it works.
                4. Example/Analogy: To clarify the concept.
                """),
                ("human", (
                    "Topic: '{topic}'\n"
                    "Subtopics: {subtopics}\n\n"
                    "Return strictly a JSON object object mapping subtopic_name -> detailed_explanation_string."
                )),
            ])
            
            chain = prompt | llm
            resp = chain.invoke({"topic": topic, "subtopics": ", ".join(subtopics)})
            
            content = resp.content if hasattr(resp, "content") else str(resp)
            
            # JSON clean-up logic
            try:
                return json.loads(content)
            except Exception:
                # regex fallback to find the JSON object
                m = re.search(r"\{[\s\S]*\}", content)
                if m:
                    try:
                        return json.loads(m.group(0))
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error generating explanations: {e}")
            pass

    # Fallback if LLM fails
    return {
        st: (
            f"**{st}** is a fundamental concept in {topic}. \n\n"
            "In this module, we explore its core principles and applications. "
            "Understanding this is crucial for mastering the broader subject. "
            "We will delve into practical examples and best practices to ensure deep comprehension."
        ) for st in subtopics
    }


