import React, { useEffect, useState } from "react";
import { BookOpen, Share2, MoreHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ModuleCard } from "./course/ModuleCard";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function CourseRenderer({ course }) {
  const { getAuthHeaders } = useAuth();
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
    if (generatingNext) return;

    const currentModuleTitle = moduleEntries[moduleIndex]?.[0];

    // Local state update
    setCompletedModules(prev => ({ ...prev, [moduleIndex]: true }));

    // Save progress to DB
    if (currentModuleTitle) {
      try {
        await fetch(`${API_BASE}/course/${courseId}/progress`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            module_title: currentModuleTitle,
            completed: true,
            quiz_score: typeof score === 'number' ? score : undefined
          })
        });
      } catch (e) {
        console.error("Failed to save progress", e);
      }
    }

    if (moduleIndex === moduleEntries.length - 1 && courseId) {
      setGeneratingNext(true);
      try {
        const response = await fetch(`${API_BASE}/course/${courseId}/generate_next_module`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const result = await response.json();
          if (!result.completed && result.module) {
            setLocalCourse(prev => {
              const newModules = { ...prev.modules, [result.module.module_title]: result.module };
              return { ...prev, modules: newModules };
            });
          }
        }
      } catch (error) {
        console.error("Error asking for next module:", error);
      } finally {
        setGeneratingNext(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Elegant Header Card */}
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        {/* Abstract decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg shadow-white/5">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <p className="text-neutral-400 text-sm font-medium tracking-wide uppercase mb-1">Course Content</p>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{localCourse.title || "Untitled Course"}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 border-t border-white/5 pt-6 mt-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-900"></div>)}
            </div>
            <span className="text-sm font-medium">{moduleEntries.length} of {(localCourse.topics || []).length} Modules Unlocked</span>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="flex flex-col gap-6">
        {(localCourse.topics || []).map((topic, i) => {
          const moduleData = modules[topic];
          return (
            <ModuleCard
              key={topic}
              title={topic}
              data={moduleData}
              index={i}
              onQuizComplete={handleQuizComplete}
              isGeneratingNext={generatingNext && i === moduleEntries.length - 1}
              isLastModule={i === moduleEntries.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}
