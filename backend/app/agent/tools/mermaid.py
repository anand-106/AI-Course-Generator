from typing import Dict, List


def generate_mermaid_for_topic(topic: str, subtopics: List[str]) -> str:
    """
    Create a simple Mermaid mindmap/flow for a topic and its subtopics.
    Returns the Mermaid code string.
    """
    # We produce a flowchart; callers can render it on the frontend.
    lines = ["flowchart TD", f"    A[\"{topic}\"]"]
    for idx, st in enumerate(subtopics):
        node_id = f"B{idx}"
        lines.append(f"    {node_id}[\"{st}\"]")
        lines.append(f"    A --> {node_id}")
    return "\n".join(lines)


