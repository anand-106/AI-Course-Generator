from typing import Dict, List


def generate_mermaid_for_topic(topic: str, subtopics: List[str]) -> str:
    """
    Create a detailed Mermaid flowchart for a topic and its subtopics.
    Returns the Mermaid code string.
    """
    # We produce a flowchart; callers can render it on the frontend.
    lines = ["graph LR", f"    A[\"<b>{topic}</b>\"]"]
    lines.append("    style A fill:#3b82f6,stroke:#1e40af,stroke-width:4px,color:#fff")
    
    for idx, st in enumerate(subtopics):
        node_id = f"B{idx}"
        lines.append(f"    {node_id}[\"{st}\"]")
        lines.append(f"    A --> {node_id}")
        lines.append(f"    style {node_id} fill:#1e293b,stroke:#334155,stroke-width:2px,color:#cbd5e1")
        
    return "\n".join(lines)


