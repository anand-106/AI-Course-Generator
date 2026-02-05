import React, { useState } from 'react';
import { PlayCircle, ChevronDown, ChevronUp } from "lucide-react";

export function YouTubeEmbed({ link }) {
    const [isExpanded, setIsExpanded] = useState(false);

    try {
        const url = new URL(link);
        let videoId = url.searchParams.get("v");
        let startTime = url.searchParams.get("t") || url.searchParams.get("start");
        let endTime = url.searchParams.get("end");

        if (startTime && startTime.endsWith('s')) {
            startTime = startTime.slice(0, -1);
        }

        if (!videoId && url.hostname.includes("youtube.com") && url.pathname.startsWith("/watch")) {
            videoId = url.searchParams.get("v");
        }
        if (!videoId && url.hostname.includes("youtu.be")) {
            videoId = url.pathname.slice(1);
        }
        if (!videoId) return (
            <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300 shadow-md hover:shadow-lg"
            >
                <PlayCircle className="w-5 h-5" />
                Watch on YouTube
            </a>
        );

        const embedSrc = `https://www.youtube.com/embed/${videoId}?${startTime ? 'start=' + startTime + '&' : ''}${endTime ? 'end=' + endTime : ''}`;

        return (
            <div className="space-y-3">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl group"
                >
                    <div className="flex items-center gap-3">
                        <PlayCircle className="w-6 h-6" />
                        <span className="font-semibold">Watch Video {startTime ? `(Starts at ${startTime}s)` : ''}</span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    ) : (
                        <ChevronDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                </button>
                {isExpanded && (
                    <div className="relative w-full rounded-xl overflow-hidden shadow-lg animate-fade-in">
                        <div className="aspect-video">
                            <iframe
                                width="100%"
                                height="100%"
                                src={embedSrc}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    } catch {
        return null;
    }
}
