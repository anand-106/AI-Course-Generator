import React from 'react';
import { Layers, PlayCircle, Info, History, Cpu, ListOrdered, Lightbulb, Globe, AlertTriangle, CheckCircle, Terminal } from "lucide-react";
import { MermaidBlock } from './MermaidBlock';
import { YouTubeEmbed } from './YouTubeEmbed';

const SECTION_CONFIG = {
    "Topic Introduction": { icon: Info, color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/20" },
    "Core Concepts": { icon: Layers, color: "text-purple-400", bg: "bg-purple-400/5", border: "border-purple-400/20" },
    "Foundational Background": { icon: History, color: "text-slate-400", bg: "bg-white/[0.02]", border: "border-white/10" },
    "Detailed Explanation": { icon: Cpu, color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/20" },
    "Concept Breakdown / Mechanism / Theory Analysis": { icon: ListOrdered, color: "text-emerald-400", bg: "bg-emerald-400/5", border: "border-emerald-400/20", isStep: true },
    "Examples / Case Studies / Illustrations": { icon: Lightbulb, color: "text-orange-400", bg: "bg-orange-400/5", border: "border-orange-400/20", isCallout: true },
    "Applications / Significance": { icon: Globe, color: "text-indigo-400", bg: "bg-indigo-400/5", border: "border-indigo-400/20" },
    "Key Insights or Important Points": { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/5", border: "border-red-400/20", isCallout: true },
    "Recap Summary": { icon: CheckCircle, color: "text-slate-500", bg: "bg-white/[0.01]", border: "border-white/5", isSoft: true }
};

function parseMarkdown(text) {
    if (!text) return null;

    // Handle code blocks with a terminal-like appearance
    const parts = text.split(/(```[\s\S]*?```|`.*?`)/g);

    return parts.map((part, i) => {
        if (part.startsWith('```')) {
            const code = part.replace(/```(javascript|python|css|html|json)?/i, '').replace(/```$/, '').trim();
            return (
                <div key={i} className="my-6 group relative">
                    <div className="absolute -top-3 left-4 px-2 py-1 bg-neutral-800 border border-white/10 rounded font-mono text-[10px] text-slate-500 uppercase tracking-widest z-10 flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Source Code
                    </div>
                    <pre className="p-6 bg-black border border-white/10 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed shadow-2xl">
                        <code className="text-emerald-400">{code}</code>
                    </pre>
                </div>
            );
        }
        if (part.startsWith('`')) {
            return (
                <code key={i} className="px-2 py-0.5 bg-white/10 border border-white/5 rounded-md font-mono text-sm text-blue-300">
                    {part.slice(1, -1)}
                </code>
            );
        }

        // Key terms highlighting (Variables, Data Types, etc.)
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
                const term = bp.slice(2, -2);
                return (
                    <strong key={`${i}-${j}`} className="text-white font-bold bg-white/5 px-1 rounded transition-colors hover:bg-white/10">
                        {term}
                    </strong>
                );
            }
            return bp;
        });
    });
}

function StepTimeline({ content }) {
    const steps = content.split(/\n(?=\d+\.)/);
    return (
        <div className="relative space-y-8 pl-8 ml-4 border-l border-white/10 my-8">
            {steps.map((step, si) => (
                <div key={si} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[45px] top-1 w-8 h-8 rounded-full bg-neutral-900 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
                        {si + 1}
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/10 hover:border-emerald-500/20 transition-all">
                        <div className="text-slate-300 leading-relaxed font-medium">
                            {parseMarkdown(step.replace(/^\d+\.\s*/, ''))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CalloutBox({ title, content, config }) {
    const Icon = config.icon;
    return (
        <div className={`relative overflow-hidden rounded-3xl border ${config.border} ${config.bg} p-8 my-8`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-start gap-6 relative z-10">
                <div className={`mt-1 p-3 rounded-2xl ${config.bg} ${config.color} border ${config.border}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                    <h5 className={`text-lg font-black uppercase tracking-widest ${config.color}`}>{title}</h5>
                    <div className="text-slate-300 leading-relaxed">
                        {parseMarkdown(content)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionRenderer({ title, text, videos, mermaid, usedVideoIndices, mermaidUsedRef }) {
    const config = SECTION_CONFIG[title] || { icon: Info, color: "text-slate-400", bg: "bg-white/[0.02]", border: "border-white/10" };
    const Icon = config.icon;

    if (config.isCallout) {
        return <CalloutBox title={title} content={text} config={config} />;
    }

    const parts = text.split(/(\[\[MERMAID\]\]|\[\[VIDEO_\d+\]\])/g);

    const renderedContent = parts.map((part, idx) => {
        if (part === "[[MERMAID]]") {
            if (!mermaid || mermaidUsedRef.current) return null;
            mermaidUsedRef.current = true;
            return (
                <div key={idx} className="my-10 p-8 rounded-[2.5rem] bg-black border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-2 mb-6 text-blue-400 font-black tracking-[0.2em] text-[10px] uppercase">
                        <Layers className="w-4 h-4" /> Architecture Blueprint
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
                <div key={idx} className="my-10">
                    <div className="flex items-center gap-2 mb-4 text-red-500 font-black tracking-[0.2em] text-[10px] uppercase">
                        <PlayCircle className="w-4 h-4" /> Masterclass Session
                    </div>
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                        <YouTubeEmbed link={video.link} title={video.title} />
                    </div>
                </div>
            );
        }

        if (!part.trim()) return null;

        if (config.isStep) {
            return <StepTimeline key={idx} content={part} />;
        }

        return <div key={idx} className="whitespace-pre-wrap leading-[1.8] text-slate-300 text-lg lg:text-xl font-normal tracking-tight mb-8 last:mb-0">{parseMarkdown(part)}</div>;
    });

    return (
        <div className={`group relative rounded-[3rem] p-10 lg:p-16 border ${config.border} ${config.bg} space-y-10 transition-all duration-700 hover:shadow-2xl`}>
            <div className="flex items-center gap-6 pb-10 border-b border-white/5">
                <div className={`p-4 rounded-2xl ${config.bg} ${config.color} border ${config.border} shadow-lg`}>
                    <Icon className="w-8 h-8" />
                </div>
                <h4 className={`text-3xl lg:text-4xl font-black tracking-tighter ${config.color}`}>{title}</h4>
            </div>
            <div className="space-y-10">
                {renderedContent}
            </div>
        </div>
    );
}

function parseSections(text) {
    const titles = Object.keys(SECTION_CONFIG);
    const pattern = new RegExp(`^[\\s#\\*]*\\d\\.\\s+(${titles.join('|').replace(/\//g, '\\/')})[:\\*\\s\\-]*`, 'gmi');

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

    if (typeof content === 'object' && content !== null) {
        return (
            <div className="space-y-24 max-w-5xl mx-auto pb-20">
                {Object.entries(content).map(([topic, text]) => {
                    const sections = parseSections(String(text));
                    return (
                        <div key={topic} className="space-y-12 animate-fade-in">
                            {/* Header for Subtopic */}
                            <div className="relative pt-24">
                                <div className="absolute top-0 left-0 w-40 h-2 bg-gradient-to-r from-white/20 to-transparent"></div>
                                <h3 className="text-5xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">{topic}</h3>
                                <div className="flex items-center gap-3 opacity-50">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-xs">Knowledge Pillar</p>
                                </div>
                            </div>

                            <div className="space-y-16">
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
            </div>
        );
    }

    return null;
}
