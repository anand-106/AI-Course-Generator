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
                You are an expert technical instructor. 
                
                TASK:
                For each subtopic provided, write a DEEP, TECHNICAL, and COMPREHENSIVE explanation.
                
                REQUIREMENTS:
                1. Length: 200-300 words per subtopic.
                2. Content: 
                   - Start with a clear, technical definition.
                   - Explain the "Why" and "How" in detail.
                   - Include code snippets or syntax examples where applicable (use markdown for code).
                   - Provide a real-world use case.
                3. Format: Return ONLY a valid JSON object.
                
                JSON STRUCTURE:
                {{
                    "Subtopic Name 1": "Full explanation text...",
                    "Subtopic Name 2": "Full explanation text..."
                }}
                
                IMPORTANT:
                - Output raw JSON only. Do not wrap in markdown code blocks.
                - Escape all double quotes within the text.
                - Ensure the JSON is valid.
                """),
                ("human", (
                    "Topic: '{topic}'\n"
                    "Subtopics: {subtopics}\n\n"
                    "Return strictly a JSON object mapping subtopic_name -> detailed_explanation_string."
                )),
            ])
            
            chain = prompt | llm
            resp = chain.invoke({"topic": topic, "subtopics": ", ".join(subtopics)})
            
            content = resp.content if hasattr(resp, "content") else str(resp)
            # Clean up markdown code blocks if present
            content = re.sub(r"```(json)?", "", content).strip()
            
            # JSON clean-up logic
            try:
                data = json.loads(content)
                if isinstance(data, dict):
                    return data
            except Exception:
                # regex fallback to find the JSON object
                m = re.search(r"\{[\s\S]*\}", content)
                if m:
                    try:
                        return json.loads(m.group(0))
                    except Exception:
                        pass
                print(f"FAILED TO PARSE EXPLANATION JSON. Raw: {content[:100]}...")
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


