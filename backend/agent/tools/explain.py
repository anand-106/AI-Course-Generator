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


def generate_explanations_for_topic(topic: str, subtopics: List[str], videos: List[Dict] = [], mermaid_code: str = "") -> Dict[str, str]:
    """
    Generate detailed, structured explanations for a topic and its subtopics,
    embedding references to provided videos and diagrams.
    """
    
    # Check if Ollama is available
    if ChatOllama and ChatPromptTemplate:
        try:
            llm = ChatOllama(
                model="llama3.1",
                temperature=0.3
            )
            
            # Format video list for the prompt
            video_context = "\n".join([f"Video {i}: {v.get('title', 'Video')} (ID: {i})" for i, v in enumerate(videos)])
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """
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
                """),
                ("human", (
                    "Topic: '{topic}'\n"
                    "Subtopics: {subtopics}\n\n"
                    "Return strictly a JSON object mapping subtopic_name -> detailed_explanation_string."
                )),
            ])
            
            chain = prompt | llm
            resp = chain.invoke({
                "topic": topic, 
                "subtopics": ", ".join(subtopics),
                "video_context": video_context if video_context else "No videos available."
            })
            
            content = resp.content if hasattr(resp, "content") else str(resp)
            content = content.strip()
            
            # Robust cleanup: Only remove START/END blocks, preserving internal backticks
            if content.startswith("```json"): 
                content = content[7:]
            elif content.startswith("```"): 
                content = content[3:]
            
            if content.endswith("```"): 
                content = content[:-3]
            
            content = content.strip()
            
            # Attempt to fix invalid escape sequences (like \s, \c, or windows paths)
            # Regex matches backslashes not followed by valid JSON escape chars
            # Attempt to fix invalid escape sequences (like \s, \c, or windows paths)
            # Regex matches backslashes not followed by valid JSON escape chars
            content = re.sub(r'\\(?![\\/bfnrt"]|u[0-9a-fA-F]{4})', r'\\\\', content)

            # Fix unescaped newlines inside strings (common LLM error)
            # This is tricky without a full parser, but we can try to escape newlines that are not between } and " or , and "
            # A safer, simpler approach for common markdown tables/code blocks usage:
            # content = content.replace("\n", "\\n") # TOO AGGRESSIVE for the outer structure
            
            # Use a more robust extraction if there is garbage before/after { }
            match = re.search(r"(\{.*\})", content, re.DOTALL)
            if match:
                content = match.group(1)

            # JSON clean-up logic
            try:
                # strict=False allows control characters (like newlines) inside strings
                data = json.loads(content, strict=False)
                if isinstance(data, dict):
                    return data
            except json.JSONDecodeError as e:
                
                m = re.search(r"\{.*\}", content, re.DOTALL)
                if m:
                    try:
                        return json.loads(m.group(0), strict=False)
                    except:
                        pass
                        
                print(f"FAILED TO PARSE EXPLANATION JSON. Error: {e}")
                print(f"Raw Content Start: {content[:200]}...")
        except Exception as e:
            print(f"Error generating explanations: {e}")
            pass

    # Fallback if LLM fails
    # Fallback if LLM fails
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


