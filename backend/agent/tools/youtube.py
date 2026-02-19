import json
import re
import logging
from typing import List, Dict

import requests

logger = logging.getLogger(__name__)

MAX_DURATION_SECONDS = 20 * 60

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _parse_duration_text(text: str) -> int:
    """Parse duration like '12:34' or '1:23:45' to seconds."""
    if not text:
        return 0
    try:
        parts = [int(p) for p in text.strip().split(":")]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        return parts[0]
    except (ValueError, IndexError):
        return 0


def _extract_initial_data(html: str) -> dict:
    """Extract ytInitialData JSON from YouTube search page HTML."""
    match = re.search(r"var ytInitialData\s*=\s*(\{.*?\});\s*</script>", html, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    return {}


def _parse_video_results(data: dict) -> List[dict]:
    """Walk ytInitialData to pull out video renderer objects."""
    videos = []
    try:
        contents = (
            data["contents"]["twoColumnSearchResultsRenderer"]
            ["primaryContents"]["sectionListRenderer"]["contents"]
        )
        for section in contents:
            items = section.get("itemSectionRenderer", {}).get("contents", [])
            for item in items:
                renderer = item.get("videoRenderer")
                if renderer:
                    videos.append(renderer)
    except (KeyError, TypeError):
        pass
    return videos


def search_youtube_videos(query: str, limit: int = 1) -> List[Dict[str, str]]:
    """
    Search YouTube and return videos under 20 minutes with real metadata.
    Scrapes ytInitialData from the search page for reliable results.
    """
    try:
        url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}"
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()

        data = _extract_initial_data(resp.text)
        if not data:
            logger.warning("Could not extract ytInitialData, using fallback.")
            return _fallback(query)

        renderers = _parse_video_results(data)
        results = []

        for r in renderers:
            video_id = r.get("videoId", "")
            if not video_id:
                continue

            duration_text = ""
            length_text = r.get("lengthText", {})
            if isinstance(length_text, dict):
                duration_text = length_text.get("simpleText", "")

            seconds = _parse_duration_text(duration_text)
            if seconds <= 0 or seconds > MAX_DURATION_SECONDS:
                continue

            title_runs = r.get("title", {}).get("runs", [])
            title = title_runs[0].get("text", "") if title_runs else f"Video for {query}"

            channel_runs = r.get("ownerText", {}).get("runs", [])
            channel = channel_runs[0].get("text", "YouTube") if channel_runs else "YouTube"

            results.append({
                "title": title,
                "channel": channel,
                "duration": duration_text,
                "link": f"https://www.youtube.com/watch?v={video_id}",
            })

            if len(results) >= limit:
                break

        if results:
            return results

    except Exception as e:
        logger.error(f"YouTube search error: {e}")

    return _fallback(query)


def _fallback(query: str) -> List[Dict[str, str]]:
    return [{
        "title": f"Search results for {query}",
        "channel": "YouTube",
        "duration": "",
        "link": f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}",
    }]
