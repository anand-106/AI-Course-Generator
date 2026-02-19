import React from 'react';
import { PlayCircle, ExternalLink } from "lucide-react";

export function YouTubeEmbed({ link, title }) {
    try {
        const url = new URL(link);
        let videoId = url.searchParams.get("v");
        let startTime = url.searchParams.get("t") || url.searchParams.get("start");
        let endTime = url.searchParams.get("end");

        if (startTime && startTime.endsWith('s')) {
            startTime = startTime.slice(0, -1);
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

        const params = new URLSearchParams();
        if (startTime) params.set('start', startTime);
        if (endTime) params.set('end', endTime);
        params.set('rel', '0');
        const embedSrc = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

        return (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-lg">
                <div className="aspect-video">
                    <iframe
                        width="100%"
                        height="100%"
                        src={embedSrc}
                        title={title || "YouTube video player"}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                    />
                </div>
                {title && (
                    <div className="px-4 py-3 flex items-center justify-between">
                        <p className="text-sm text-neutral-300 font-medium truncate">{title}</p>
                        <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-500 hover:text-white transition-colors flex-shrink-0 ml-3"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                )}
            </div>
        );
    } catch {
        return null;
    }
}
