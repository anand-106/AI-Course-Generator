import React from 'react';
import { Layers, PlayCircle, Info, History, Cpu, ListOrdered, Lightbulb, Globe, AlertTriangle, CheckCircle } from "lucide-react";
import { MermaidBlock } from './MermaidBlock';
import { YouTubeEmbed } from './YouTubeEmbed';

const SECTION_STYLES = {
    "Concept Overview": { icon: Info, color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/10" },
    "Historical/Conceptual Background": { icon: History, color: "text-amber-400", bg: "bg-amber-400/5", border: "border-amber-400/10" },
    "Detailed Technical Explanation": { icon: Cpu, color: "text-purple-400", bg: "bg-purple-400/5", border: "border-purple-400/10" },
    "Step-by-Step Working": { icon: ListOrdered, color: "text-emerald-400", bg: "bg-emerald-400/5", border: "border-emerald-400/10", isStep: true },
    "Practical Examples": { icon: Lightbulb, color: "text-orange-400", bg: "bg-orange-400/5", border: "border-orange-400/20", isCallout: true },
    "Real-World Applications": { icon: Globe, color: "text-indigo-400", bg: "bg-indigo-400/5", border: "border-indigo-400/10" },
    "Common Mistakes or Confusions": { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/5", border: "border-red-400/20", isCallout: true },
    "Summary Recap": { icon: CheckCircle, color: "text-slate-400", bg: "bg-white/5", border: "border-white/10", isSoft: true }
};

function parseMarkdown(text) {
    if (!text) return null;

    // Handle code blocks first
    const parts = text.split(/(```[\s\S]*?```|`.*?`)/g);

    return parts.map((part, i) => {
        if (part.startsWith('```')) {
            const code = part.replace(/```(javascript|python|css|html|json)?/i, '').replace(/```$/, '').trim();
            return (
                <pre key={i} className="my-4 p-4 bg-black border border-white/10 rounded-xl overflow-x-auto font-mono text-sm text-emerald-400 leading-relaxed shadow-inner">
                    <code>{code}</code>
                </pre>
            );
        }
        if (part.startsWith('`')) {
            return <code key={i} className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-sm text-blue-300">{part.slice(1, -1)}</code>;
        }

        // Handle bolding
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
                return <strong key={`${i}-${j}`} className="text-white font-bold">{bp.slice(2, -2)}</strong>;
            }
            return bp;
        });
    });
}

function SectionRenderer({ title, text, videos, mermaid, usedVideoIndices, mermaidUsedRef }) {
    const config = SECTION_STYLES[title] || { icon: Info, color: "text-slate-400", bg: "bg-white/5", border: "border-white/10" };
    const Icon = config.icon;

    const parts = text.split(/(\[\[MERMAID\]\]|\[\[VIDEO_\d+\]\])/g);

    const renderedText = parts.map((part, idx) => {
        if (part === "[[MERMAID]]") {
            if (!mermaid || mermaidUsedRef.current) return null;
            mermaidUsedRef.current = true;
            return (
                <div key={idx} className="my-8">
                    <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold tracking-tight text-sm uppercase">
                        <Layers className="w-4 h-4" /> System Diagram
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
                <div key={idx} className="my-8">
                    <div className="flex items-center gap-2 mb-3 text-red-500 font-bold tracking-tight text-sm uppercase">
                        <PlayCircle className="w-4 h-4" /> Concept Video
                    </div>
                    <YouTubeEmbed link={video.link} title={video.title} />
                </div>
            );
        }

        if (!part.trim()) return null;

        // Handle step by step visual
        if (config.isStep) {
            const steps = part.split(/\n(?=\d+\.)/);
            return (
                <div key={idx} className="space-y-4">
                    {steps.map((step, si) => (
                        <div key={si} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/[0.07]">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                                {si + 1}
                            </div>
                            <div className="text-slate-300 leading-relaxed pt-0.5">{parseMarkdown(step.replace(/^\d+\.\s*/, ''))}</div>
                        </div>
                    ))}
                </div>
            );
        }

        return <div key={idx} className="whitespace-pre-wrap leading-relaxed text-slate-300">{parseMarkdown(part)}</div>;
    });

    return (
        <div className={`rounded-3xl p-6 md:p-8 border ${config.border} ${config.bg} space-y-4 transition-all duration-300`}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className={`p-2 rounded-xl ${config.bg} ${config.color} border ${config.border}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h4 className={`text-xl font-bold tracking-tight ${config.color}`}>{title}</h4>
            </div>
            <div className="space-y-4">
                {renderedText}
            </div>
        </div>
    );
}

function parseSections(text) {
    const titles = Object.keys(SECTION_STYLES);
    const pattern = new RegExp(`^\\d\\.\\s+(${titles.join('|').replace(/\//g, '\\/')})\\:?`, 'gmi');

    const sections = [];
    let match;
    let lastIndex = 0;
    let lastTitle = "Introduction";

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            sections.push({ title: lastTitle, text: text.substring(lastIndex, match.index).trim() });
        }
        lastTitle = match[1];
        lastIndex = pattern.lastIndex;
    }

    sections.push({ title: lastTitle, text: text.substring(lastIndex).trim() });
    return sections;
}

export function ExplanationContent({ content, videos, mermaid }) {
    const usedVideoIndices = new Set();
    const mermaidUsedRef = React.useRef(false);

    // If content is an object (multiple subtopics)
    if (typeof content === 'object' && content !== null) {
        return (
            <div className="space-y-12">
                {Object.entries(content).map(([topic, text]) => {
                    const sections = parseSections(String(text));
                    return (
                        <div key={topic} className="space-y-8 animate-fade-in">
                            <div className="relative pl-6 py-2 border-l-2 border-white/10">
                                <h3 className="text-3xl font-extrabold text-white tracking-tight">{topic}</h3>
                                <div className="absolute top-0 left-[-2px] w-[2px] h-full bg-gradient-to-b from-blue-500 to-transparent"></div>
                            </div>

                            <div className="space-y-8">
                                {sections.map((section, si) => (
                                    <SectionRenderer
                                        key={si}
                                        title={section.title}
                                        text={section.text}
                                        videos={videos}
                                        mermaid={mermaid}
                                        usedVideoIndices={usedVideoIndices}
                                        mermaidUsedRef={mermaidUsedRef}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Unused resources footer */}
                <UnusedResources videos={videos} usedVideoIndices={usedVideoIndices} />
            </div>
        );
    }

    return null;
}

function UnusedResources({ videos, usedVideoIndices }) {
    const unusedVideos = videos ? videos.filter((_, idx) => !usedVideoIndices.has(idx)) : [];
    if (unusedVideos.length === 0) return null;

    return (
        <div className="mt-16 pt-12 border-t border-white/10 space-y-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Learning Lab Resources</h4>
            <div>
                <div className="flex items-center gap-2 mb-6 text-red-500 font-bold uppercase text-sm tracking-wider">
                    <PlayCircle className="w-5 h-5" /> Detailed Video Tutorials
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {unusedVideos.map((video, i) => (
                        <div key={i} className="group transition-all hover:translate-y-[-4px]">
                            <YouTubeEmbed link={video.link} title={video.title} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
