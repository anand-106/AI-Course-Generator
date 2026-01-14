import React, { useEffect, useRef, useState } from "react";
import { BookOpen, PlayCircle, FileText, ChevronDown, ChevronUp, Layers, HelpCircle } from "lucide-react";
import Flashcards from "./Flashcards";
import Quiz from "./Quiz";

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
    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
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

    return (
      <div className="space-y-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl group"
        >
          <div className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6" />
            <span className="font-semibold">Watch Video</span>
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
                src={`https://www.youtube.com/embed/${videoId}`}
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

function ExplanationContent({ content }) {
  if (typeof content === 'string') {
    return <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  // Handle structured object content
  if (typeof content === 'object' && content !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(content).map(([key, value]) => (
          <div key={key}>
            <span className="font-bold text-gray-900">{key}: </span>
            <span className="text-gray-700">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function ModuleCard({ title, data, index }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Debug: Log module data to check for quiz
  useEffect(() => {
    console.log(`Module "${title}" data:`, data);
    console.log(`Module "${title}" quiz:`, data?.quiz);
  }, [title, data]);

  return (
    <div
      className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Module Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between group hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
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
          {/* Explanations Section */}
          {data.explanations && Object.keys(data.explanations).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Explanations</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(data.explanations).map(([sub, text], idx) => (
                  <div
                    key={sub}
                    className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-l-4 border-blue-500 hover:shadow-md transition-shadow duration-300 animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <h4 className="font-semibold text-blue-900 mb-2 text-lg">{sub}</h4>
                    <ExplanationContent content={text} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagram Section */}
          {data.mermaid && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg"></div>
                <h3 className="text-xl font-semibold text-gray-800">Visual Diagram</h3>
              </div>
              <MermaidBlock code={data.mermaid} idSuffix={`${index}`} />
            </div>
          )}

          {/* Videos Section */}
          {data.videos && data.videos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <PlayCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-semibold text-gray-800">Video Resources</h3>
              </div>
              <div className="space-y-4">
                {data.videos.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 animate-fade-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <h4 className="font-semibold text-red-900 mb-3 text-lg">{v.title}</h4>
                    <YouTubeEmbed link={v.link} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flashcards Section */}
          {data.flashcards && data.flashcards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-6 h-6 text-violet-600" />
                <h3 className="text-xl font-semibold text-gray-800">Flashcards</h3>
              </div>
              <Flashcards cards={data.flashcards} />
            </div>
          )}

          {/* Quiz Section */}
          {data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-semibold text-gray-800">Module Quiz</h3>
                <span className="text-sm text-gray-500">({data.quiz.length} questions)</span>
              </div>
              <Quiz questions={data.quiz} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseRenderer({ course }) {
  if (!course) return null;

  const modules = course.modules || {};
  const moduleEntries = Object.entries(modules);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Generated Course</h1>
            <p className="text-blue-100 text-lg">{course.title || "Your Custom Course"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-100">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>{moduleEntries.length} Module{moduleEntries.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Modules - Horizontal Layout */}
      <div className="flex overflow-x-auto gap-6 pb-12 snap-x snap-mandatory px-4 -mx-4 scrollbar-hide">
        {moduleEntries.map(([title, data], i) => (
          <div key={title} className="snap-center flex-shrink-0 w-[85vw] md:w-[650px] lg:w-[800px]">
            <ModuleCard title={title} data={data} index={i} />
          </div>
        ))}

        {/* Spacer for last item scrolling */}
        <div className="w-4 shrink-0" />
      </div>
    </div>
  );
}
