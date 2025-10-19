from typing import List, Dict

try:
    from youtubesearchpython import VideosSearch
except Exception:  # pragma: no cover
    VideosSearch = None


def search_youtube_videos(query: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Search YouTube for videos related to a query. Returns a list of dicts with
    title, channel, duration, link.
    """
    if VideosSearch:
        try:
            search = VideosSearch(query, limit=limit)
            results = search.result().get("result", [])
            return [
                {
                    "title": r.get("title", ""),
                    "channel": r.get("channel", {}).get("name", ""),
                    "duration": r.get("duration", ""),
                    # Build a canonical watch URL using the video id for embedding
                    "link": (
                        f"https://www.youtube.com/watch?v={r.get('id')}"
                        if r.get("id") else r.get("link", "")
                    ),
                }
                for r in results
            ]
        except Exception:
            pass

    # Fallback deterministic results
    return [
        {
            "title": f"Intro to {query}",
            "channel": "Example Channel",
            "duration": "10:00",
            # Fallback to a search page when no ID is available
            "link": "https://www.youtube.com/results?search_query=" + query.replace(" ", "+"),
        }
    ]


