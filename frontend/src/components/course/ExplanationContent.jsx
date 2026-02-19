import React from 'react';
import { Layers, PlayCircle } from "lucide-react";
import { MermaidBlock } from './MermaidBlock';
import { YouTubeEmbed } from './YouTubeEmbed';

function RichTextRenderer({ text, videos, mermaid }) {
    const usedVideoIndices = new Set();
    let mermaidUsed = false;

    const parts = text.split(/(\[\[MERMAID\]\]|\[\[VIDEO_\d+\]\])/g);

    const renderedContent = parts.map((part, idx) => {
        if (part === "[[MERMAID]]") {
            if (!mermaid) return null;
            mermaidUsed = true;
            return (
                <div key={idx} className="my-6">
                    <div className="flex items-center gap-2 mb-2 text-teal-400 font-semibold text-sm">
                        <Layers className="w-4 h-4" /> Visual Flow
                    </div>
                    <MermaidBlock code={mermaid} idSuffix={`inline-${idx}`} />
                </div>
            );
        }

        const videoMatch = part.match(/\[\[VIDEO_(\d+)\]\]/);
        if (videoMatch) {
            const index = parseInt(videoMatch[1], 10);
            const video = videos && videos[index];
            if (!video) return null;
            usedVideoIndices.add(index);
            return (
                <div key={idx} className="my-6">
                    <div className="flex items-center gap-2 mb-2 text-red-400 font-semibold text-sm">
                        <PlayCircle className="w-4 h-4" /> Video Tutorial
                    </div>
                    <YouTubeEmbed link={video.link} title={video.title} />
                </div>
            );
        }

        if (!part.trim()) return null;
        return <p key={idx} className="whitespace-pre-wrap">{part}</p>;
    });

    const unusedVideos = videos ? videos.filter((_, idx) => !usedVideoIndices.has(idx)) : [];
    const showMermaidFallback = mermaid && !mermaidUsed;

    return (
        <div className="space-y-4 text-slate-300 leading-relaxed">
            {renderedContent}

            {(unusedVideos.length > 0 || showMermaidFallback) && (
                <div className="mt-8 pt-8 border-t border-white/10 space-y-8">
                    <h4 className="text-lg font-semibold text-slate-400 uppercase tracking-widest text-xs">Additional Resources</h4>

                    {showMermaidFallback && (
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-teal-400 font-semibold">
                                <Layers className="w-5 h-5" /> Visual Flow
                            </div>
                            <MermaidBlock code={mermaid} idSuffix="fallback" />
                        </div>
                    )}

                    {unusedVideos.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-red-400 font-semibold">
                                <PlayCircle className="w-5 h-5" /> Related Videos
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {unusedVideos.map((video, i) => (
                                    <YouTubeEmbed key={`fallback-vid-${i}`} link={video.link} title={video.title} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ExplanationContent({ content, videos, mermaid }) {
    if (typeof content === 'object' && content !== null) {
        return (
            <div className="space-y-6">
                {Object.entries(content).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                        <h4 className="text-lg font-bold text-violet-300 mb-2">{key.replace(/_/g, ' ')}</h4>
                        <RichTextRenderer text={String(value)} videos={videos} mermaid={mermaid} />
                    </div>
                ))}
            </div>
        );
    }

    if (typeof content === 'string') {
        return <RichTextRenderer text={content} videos={videos} mermaid={mermaid} />
    }

    return null;
}
