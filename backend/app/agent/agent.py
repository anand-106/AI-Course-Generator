from typing import Dict, List, Any

try:
    from langgraph.graph import StateGraph, END
except Exception:
    StateGraph = None
    END = None

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
except Exception:
    ChatGoogleGenerativeAI = None
    ChatPromptTemplate = None

from app.agent.tools import (
    generate_explanations_for_topic,
    search_youtube_videos,
    generate_mermaid_for_topic,
)


class CourseState(dict):
    """Dictionary-backed state for LangGraph nodes."""

    prompt: str
    enhanced_prompt: str
    topics: List[str]
    course: Dict[str, Any]


def node_enhance_prompt(state: 'CourseState') -> 'CourseState':
    user_prompt = state.get("prompt", "")

    if ChatGoogleGenerativeAI and ChatPromptTemplate:
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You refine course prompts to be specific, level-appropriate, and goal-oriented."),
                ("human", "Refine this course prompt for clarity and coverage: {prompt}")
            ])
            chain = prompt | ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
            resp = chain.invoke({"prompt": user_prompt})
            enhanced = resp.content if hasattr(resp, "content") else str(resp)
        except Exception:
            enhanced = f"Course on: {user_prompt}. Include fundamentals, practical projects, and assessments."
    else:
        enhanced = f"Course on: {user_prompt}. Include fundamentals, practical projects, and assessments."

    state["enhanced_prompt"] = enhanced
    return state


def node_generate_topics(state: 'CourseState') -> 'CourseState':
    enhanced = state.get("enhanced_prompt", "")
    if ChatGoogleGenerativeAI and ChatPromptTemplate:
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You create stepwise curricula consisting of 6-12 atomic topics."),
                ("human", "Propose a linear list of course topics for: {enhanced}. Return as a JSON array of strings.")
            ])
            chain = prompt | ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
            resp = chain.invoke({"enhanced": enhanced})
            import json
            content = resp.content if hasattr(resp, "content") else str(resp)
            try:
                topics = json.loads(content)
                if not isinstance(topics, list):
                    raise ValueError
            except Exception:
                topics = [
                    "Introduction",
                    "Core Concepts",
                    "Hands-on Example",
                    "Advanced Techniques",
                    "Project",
                    "Assessment",
                ]
        except Exception:
            topics = [
                "Introduction",
                "Core Concepts",
                "Hands-on Example",
                "Advanced Techniques",
                "Project",
                "Assessment",
            ]
    else:
        topics = [
            "Introduction",
            "Core Concepts",
            "Hands-on Example",
            "Advanced Techniques",
            "Project",
            "Assessment",
        ]

    state["topics"] = topics
    return state


def node_generate_course(state: 'CourseState') -> 'CourseState':
    topics = state.get("topics", [])
    course_modules: Dict[str, Any] = {}

    for topic in topics:
        subtopics = [f"{topic} overview", f"{topic} practice", f"{topic} quiz"]
        explanations = generate_explanations_for_topic(topic, subtopics)
        videos = search_youtube_videos(f"{topic} tutorial", limit=3)
        mermaid = generate_mermaid_for_topic(topic, list(explanations.keys()))

        course_modules[topic] = {
            "subtopics": list(explanations.keys()),
            "explanations": explanations,
            "videos": videos,
            "mermaid": mermaid,
        }

    state["course"] = {
        "summary": state.get("enhanced_prompt", "Course"),
        "modules": course_modules,
    }
    return state


def build_graph():
    if StateGraph is None:
        raise RuntimeError("LangGraph is not installed. Ensure 'langgraph' is in requirements.")

    graph = StateGraph(CourseState)
    graph.add_node("enhance_prompt", node_enhance_prompt)
    graph.add_node("generate_topics", node_generate_topics)
    graph.add_node("generate_course", node_generate_course)

    graph.set_entry_point("enhance_prompt")
    graph.add_edge("enhance_prompt", "generate_topics")
    graph.add_edge("generate_topics", "generate_course")
    graph.add_edge("generate_course", END)

    return graph.compile()


def run_workflow(user_prompt: str) -> Dict[str, Any]:
    workflow = build_graph()
    final_state = workflow.invoke({"prompt": user_prompt})
    return final_state.get("course", {})


