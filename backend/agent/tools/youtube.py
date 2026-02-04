import re
import requests
from typing import List, Dict

# Try to import transcript api, but don't fail if missing
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    TRANSCRIPT_API_AVAILABLE = True
except ImportError:
    TRANSCRIPT_API_AVAILABLE = False


from typing import List, Dict, Tuple

# ... (imports)

def get_video_segment(video_id: str, query: str) -> Tuple[int, int]:
    """
    Finds the most relevant segment (start, end) in the video transcript based on
    keyword density matching.
    """
    if not TRANSCRIPT_API_AVAILABLE:
        return 0, 0
        
    try:
        api = YouTubeTranscriptApi()
        # Retrieve transcript (with fallbacks)
        transcript_list = api.list(video_id)
        transcript = None
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            try:
                transcript = transcript_list.find_generated_transcript(['en'])
            except:
                try:
                    transcript = next(iter(transcript_list))
                except:
                    return 0, 0
        
        if not transcript:
            return 0, 0
            
        snippets = transcript.fetch()
        if not snippets:
            return 0, 0
            
        # 1. Prepare Keywords
        # Remove generic words to focus on the specific topic
        ignore_words = {
            "tutorial", "course", "video", "learn", "how", "to", "guide", 
            "introduction", "intro", "in", "the", "a", "an", "of", "for", 
            "with", "full", "what", "is", "are", "basics", "beginner"
        }
        keywords = [w.lower() for w in query.split() if w.lower() not in ignore_words and len(w) > 2]
        
        if not keywords:
            return 0, 0
            
        # 2. Score Snippets
        # Each snippet gets a score based on keyword semantic matches
        scored_snippets = []
        for s in snippets:
            # Handle object vs dict safely
            if isinstance(s, dict):
                text = s.get('text', '')
                start = s.get('start', 0)
                duration = s.get('duration', 0)
            else:
                # Assume object attributes
                text = getattr(s, 'text', '')
                start = getattr(s, 'start', 0)
                duration = getattr(s, 'duration', 0)
            
            # Normalize
            text = str(text).lower()
            start = float(start)
            duration = float(duration)
            
            score = sum(1 for k in keywords if k in text)
            scored_snippets.append({
                'index': len(scored_snippets),
                'start': start,
                'end': start + duration,
                'score': score,
                'text': text
            })

        # 3. Find Best Window (Rolling density)
        # We look for a window of 'N' snippets with highest density
        window_size = 5 
        best_window_score = 0
        best_start_index = 0
        
        for i in range(len(scored_snippets) - window_size + 1):
            # Sum scores in this window
            current_window_score = sum(item['score'] for item in scored_snippets[i : i + window_size])
            
            if current_window_score > best_window_score:
                best_window_score = current_window_score
                best_start_index = i
        
        # If no good match found, return 0 (start from beginning if topic is vague)
        # or check broad match. 
        if best_window_score == 0:
            return 0, 0

        # 4. Determine Start and End
        # Start is the beginning of our best window
        start_node = scored_snippets[best_start_index]
        start_time = int(start_node['start'])
        
        # End Time Logic:
        # Extend from the window end until we hit a "dead zone" (no keywords for X seconds)
        # or we reach a max clip length (e.g., 5 mins).
        
        scan_index = best_start_index + window_size
        last_relevant_time = scored_snippets[best_start_index + window_size - 1]['end']
        
        # Heuristic: Allow gap of 30 seconds without keywords, otherwise stop
        max_silence = 45 
        current_silence = 0
        min_clip_length = 60 # Minimum 1 minute
        max_clip_length = 300 # Max 5 minutes
        
        while scan_index < len(scored_snippets):
            node = scored_snippets[scan_index]
            
            # If current clip length exceeds max, hard stop
            if (node['end'] - start_time) > max_clip_length:
                break
                
            if node['score'] > 0:
                # Found relevance, reset silence counter
                current_silence = 0
                last_relevant_time = node['end']
            else:
                # No relevance, accumulate silence duration
                current_silence += node['end'] - node['start'] # rough approximation
                
                if current_silence > max_silence:
                    # Too much irrelevant chatter, cut it here
                    break
            
            scan_index += 1
            
        end_time = int(last_relevant_time)
        
        # Ensure minimum clip length
        if (end_time - start_time) < min_clip_length:
            end_time = start_time + min_clip_length
            
        return start_time, end_time

    except Exception as e:
        print(f"Transcript segment error: {e}")
        return 0, 0


def search_youtube_videos(query: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Search YouTube for videos related to a query using direct HTML scraping 
    to avoid library dependency issues.
    Returns a list of dicts with title, channel, duration, link.
    """
    # Use a browser-like User-Agent
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
        response = requests.get(url, headers=headers, timeout=10)
        html = response.text
        
        # Regex to find video IDs (basic pattern)
        video_ids = re.findall(r'/watch\?v=([a-zA-Z0-9_-]{11})', html)
        
        # Deduplicate while preserving order
        unique_ids = []
        seen = set()
        for vid in video_ids:
            if vid not in seen:
                seen.add(vid)
                unique_ids.append(vid)
                if len(unique_ids) >= limit:
                    break
        
        results = []
        for vid in unique_ids:
            # Try to find a relevant start time
            start_time, end_time = get_video_segment(vid, query)
            
            link = f"https://www.youtube.com/watch?v={vid}"
            if start_time > 0:
                link += f"&t={start_time}"
                if end_time > start_time:
                    link += f"&end={end_time}"
                
            results.append({
                "title": f"Video for {query}", 
                "channel": "YouTube",
                "duration": "",
                "link": link
            })
        
        if results:
            return results
            
    except Exception as e:
        print(f"YouTube search error: {e}")

    # Fallback to a generic search URL if scraping fails (better than nothing)
    return [
        {
            "title": f"Search results for {query}",
            "channel": "YouTube",
            "duration": "",
            "link": f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
        }
    ]


