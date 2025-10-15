from typing import List, Dict

try:
    # Prefer Gemini via LangChain
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
except Exception:  # pragma: no cover - allow running without these deps during editing
    ChatGoogleGenerativeAI = None
    ChatPromptTemplate = None


def generate_explanations_for_topic(topic: str, subtopics: List[str]) -> Dict[str, str]:
    """
    Generate concise, structured explanations for a topic and its subtopics.

    If OpenAI credentials and langchain are configured, use the LLM; otherwise,
    fall back to a deterministic template-based explanation.
    """
    if ChatGoogleGenerativeAI and ChatPromptTemplate:
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a precise teaching assistant. Explain concepts clearly with examples."),
                ("human", "Create explanations for the topic '{topic}' covering subtopics: {subtopics}. Return a JSON object mapping subtopic to explanation. Keep each under 180 words.")
            ])
            chain = prompt | ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
            resp = chain.invoke({"topic": topic, "subtopics": ", ".join(subtopics)})
            # LangChain returns AIMessage; try to parse JSON-like content
            import json
            content = resp.content if hasattr(resp, "content") else str(resp)
            try:
                return json.loads(content)
            except Exception:
                # Simple heuristic split if JSON parsing fails
                return {st: f"Overview of {st} under {topic}." for st in subtopics}
        except Exception:
            pass

    # Fallback: deterministic stub
    return {
        st: (
            f"{st}: Core ideas within {topic}. Definition, why it matters, a simple example, "
            f"and common pitfalls. Practice: apply {st} to a small, real-world scenario."
        ) for st in subtopics
    }


