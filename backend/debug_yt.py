import json
from agent.tools.youtube import search_youtube_videos

results = search_youtube_videos("Python Variables and Data Types tutorial")
with open('debug_yt.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
