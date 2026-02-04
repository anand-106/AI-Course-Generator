import React, { useEffect, useRef, useState } from "react";
import { BookOpen, PlayCircle, FileText, ChevronDown, ChevronUp, Layers, HelpCircle } from "lucide-react";
import Flashcards from "./Flashcards";
import Quiz from "./Quiz";
import { useAuth } from "../context/AuthContext";

// Lazy load mermaid to avoid SSR issues
let mermaidInstance = null;

async function ensureMermaid() {
  if (mermaidInstance) return mermaidInstance;
  const mermaid = (await import("mermaid"))?.default ?? (await import("mermaid"));
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    themeVariables: {
      primaryColor: '#3b82f6',
      primaryTextColor: '#fff',
      primaryBorderColor: '#2563eb',
      lineColor: '#1e40af',
      secondaryColor: '#60a5fa',
      tertiaryColor: '#dbeafe'
    }
  });
  mermaidInstance = mermaid;
  return mermaid;
}

function MermaidBlock({ code, idSuffix }) {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!code || !containerRef.current) return;
      setIsLoading(true);
      try {
        const mermaid = await ensureMermaid();
        const targetId = `mermaid-${idSuffix}-${Math.random().toString(36).substr(2, 9)}`;

        // Mermaid v10+ returns a promise with { svg }
        const { svg } = await mermaid.render(targetId, code);

        if (mounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Mermaid error:", e);
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [code, idSuffix]);

  return (
    <div className="relative bg-slate-900/50 rounded-2xl p-6 border border-white/10">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      <div ref={containerRef} className="overflow-x-auto min-h-[100px]" />
    </div>
  );
}

function YouTubeEmbed({ link }) {
  const [isExpanded, setIsExpanded] = useState(false);

  try {
    const url = new URL(link);
    let videoId = url.searchParams.get("v");
    let startTime = url.searchParams.get("t") || url.searchParams.get("start");
    let endTime = url.searchParams.get("end");

    // Clean up start time (handle "120s" -> "120")
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

// Helper to parse content with tags like [[VIDEO_0]] or [[MERMAID]]
function ExplanationContent({ content, videos, mermaid }) {
  if (typeof content === 'object' && content !== null) {
    return (
      <div className="space-y-6">
        {Object.entries(content).map(([key, value]) => (
          <div key={key} className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
            <h4 className="text-lg font-bold text-violet-300 mb-2">{key}</h4>
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

function RichTextRenderer({ text, videos, mermaid }) {
  // Track which assets are used in the text
  const usedVideoIndices = new Set();
  let mermaidUsed = false;

  // Regex for tags: [[MERMAID]] or [[VIDEO_n]]
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
          <YouTubeEmbed link={video.link} />
        </div>
      );
    }

    // Regular text
    if (!part.trim()) return null;
    return <p key={idx} className="whitespace-pre-wrap">{part}</p>;
  });

  // Fallback: Check for unused assets and append them
  const unusedVideos = videos ? videos.filter((_, idx) => !usedVideoIndices.has(idx)) : [];
  const showMermaidFallback = mermaid && !mermaidUsed;

  return (
    <div className="space-y-4 text-slate-300 leading-relaxed">
      {renderedContent}

      {/* Fallback for unused content */}
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
                  <YouTubeEmbed key={`fallback-vid-${i}`} link={video.link} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ title, data, index, onQuizComplete, isGeneratingNext, isLastModule }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);

  return (
    <div
      className="glass-card rounded-3xl overflow-hidden mb-6 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* ... Header ... */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-8 py-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between group hover:from-violet-700 hover:to-indigo-700 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xl backdrop-blur-sm">
            {index + 1}
          </div>
          <h2 className="text-2xl font-bold text-left">{title}</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
        ) : (
          <ChevronDown className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Module Content */}
      {isExpanded && (
        <div className="p-8 space-y-8 animate-fade-in">
          {/* Main Explanations with Embedded Content */}
          {data.explanations && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-slate-200">Module Content</h3>
              </div>

              {/* Pass videos and mermaid down for embedding */}
              <ExplanationContent
                content={data.explanations}
                videos={data.videos}
                mermaid={data.mermaid}
              />
            </div>
          )}

          {/* Fallback Display: If tags are NOT used by LLM or for older content, 
              we might want to still show them? 
              For now, the user requested "force", so we expect them inline.
              However, if the LLM fails to embed, they vanish.
              Safe approach: We could check if they were rendered?
              Or just rely on the LLM complying.
          */}

          {/* ... Flashcards ... */}
          {/* ... Flashcards ... */}
          {data.flashcards && data.flashcards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-6 h-6 text-violet-400" />
                <h3 className="text-xl font-semibold text-slate-200">Flashcards</h3>
              </div>
              <Flashcards cards={data.flashcards} />
            </div>
          )}

          {/* Quiz Section */}
          {data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-semibold text-slate-200">Module Quiz</h3>
                <span className="text-sm text-slate-400">({data.quiz.length} questions)</span>
              </div>
              <Quiz
                questions={data.quiz}
                onComplete={(score) => {
                  setQuizCompleted(true);
                  onQuizComplete(index, score);
                }}
              />

              {isGeneratingNext ? (
                <div className="mt-6 p-6 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl border border-blue-500/30 flex flex-col items-center justify-center gap-3 animate-pulse">
                  <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg font-semibold text-blue-200">Great job! Generating next module...</span>
                </div>
              ) : (
                /* Show manual continue button if quiz is done, it's the last module, and we aren't generating yet (failed or initial state) */
                isLastModule && quizCompleted && (
                  <button
                    onClick={() => onQuizComplete(index, {})}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-bold text-lg shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continue to Next Module</span>
                    <ChevronUp className="w-5 h-5 rotate-90" />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseRenderer({ course }) {
  const { getAuthHeaders } = useAuth(); // Use auth hook
  const [localCourse, setLocalCourse] = useState(course);
  const [generatingNext, setGeneratingNext] = useState(false);
  const [completedModules, setCompletedModules] = useState({});

  useEffect(() => {
    setLocalCourse(course);
  }, [course]);

  if (!localCourse) return null;

  const modules = localCourse.modules || {};
  const moduleEntries = Object.entries(modules);
  const courseId = localCourse.course_id;

  const handleQuizComplete = async (moduleIndex, score) => {
    // Prevent multiple calls for same module attempt IF it's already generated
    // But allowing retry if it failed (generatingNext is false)
    if (generatingNext) return;

    setCompletedModules(prev => ({ ...prev, [moduleIndex]: true }));

    // If this is the last visible module, fetch the next one
    if (moduleIndex === moduleEntries.length - 1 && courseId) {
      setGeneratingNext(true);
      try {
        const response = await fetch(`http://localhost:8000/course/${courseId}/generate_next_module`, {
          method: 'POST',
          headers: getAuthHeaders() // Use proper headers
        });

        if (response.ok) {
          const result = await response.json();
          if (!result.completed && result.module) {
            // Append new module to local state
            setLocalCourse(prev => {
              const newModules = { ...prev.modules, [result.module.module_title]: result.module };
              return { ...prev, modules: newModules };
            });
          } else if (result.completed) {
            console.log("Course fully generated!");
          }
        } else {
          console.error("Failed to generate next module");
        }
      } catch (error) {
        console.error("Error asking for next module:", error);
      } finally {
        setGeneratingNext(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 text-white shadow-2xl mb-8">
        {/* ... (Header content unchanged) ... */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Generated Course</h1>
            <p className="text-purple-100 text-lg">{localCourse.title || "Your Custom Course"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-purple-100">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>{moduleEntries.length} Module{moduleEntries.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Modules - Horizontal Layout */}
      <div className="flex overflow-x-auto gap-6 pb-12 snap-x snap-mandatory px-4 -mx-4 scrollbar-hide">
        {moduleEntries.map(([title, data], i) => (
          <div key={title} className="snap-center flex-shrink-0 w-[85vw] md:w-[650px] lg:w-[800px]">
            <ModuleCard
              title={title}
              data={data}
              index={i}
              onQuizComplete={handleQuizComplete}
              isGeneratingNext={generatingNext && i === moduleEntries.length - 1}
              isLastModule={i === moduleEntries.length - 1}
            />
          </div>
        ))}

        {/* Spacer for last item scrolling */}
        <div className="w-4 shrink-0" />
      </div>
    </div>
  );
}
