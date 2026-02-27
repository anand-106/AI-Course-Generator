import { useState, useEffect } from "react";
import CourseRenderer from "./CourseRenderer";
import CourseHistory from "./CourseHistory";
import Dashboard from "./Dashboard";
import { Sparkles, BookOpen, LogOut, User, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCourseStream } from "../hooks/useCourseStream";
import GenyChatbot from "./GenyChatbot";
import Profile from "./Profile";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Home() {
  const { user, logout, getAuthHeaders } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [view, setView] = useState("main"); // "main" or "profile"

  const {
    course,
    setCourse,
    loading: generating,
    error: generationError,
    status: generationStatus,
    generateCourse
  } = useCourseStream(getAuthHeaders, logout);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const loading = generating || fetchLoading;
  const error = generationError || fetchError;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("courseId");
    if (courseId) {
      fetchCourse(courseId);
    }
  }, []);

  async function fetchCourse(courseId) {
    if (!courseId) return;
    try {
      setFetchLoading(true);
      setFetchError("");
      const res = await fetch(`${API_BASE}/course/${courseId}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setFetchError("Course not found");
          window.history.pushState({}, "", window.location.pathname);
        } else {
          throw new Error("Failed to load course");
        }
        return;
      }

      const data = await res.json();
      const fullCourse = { ...data.course_data, course_id: data.course_id };
      setCourse(fullCourse);
    } catch (err) {
      console.error(err);
      setFetchError("Could not load course");
    } finally {
      setFetchLoading(false);
    }
  }

  function handleSelectCourse(courseData) {
    setCourse(courseData);
    setPrompt("");
    setShowInput(false);
    setView("main");
    if (courseData.course_id) {
      const url = new URL(window.location);
      url.searchParams.set("courseId", courseData.course_id);
      window.history.pushState({}, "", url);
    }
  }

  function handleGenerate(e) {
    e.preventDefault();
    setFetchError("");
    generateCourse(prompt, (finalCourse) => {
      setShowInput(false);
      if (finalCourse.course_id) {
        const url = new URL(window.location);
        url.searchParams.set("courseId", finalCourse.course_id);
        window.history.pushState({}, "", url);
      }
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-neutral-200">
      <CourseHistory onSelectCourse={handleSelectCourse} />

      <div className="flex-1 overflow-y-auto relative scroll-smooth bg-black">
        {/* Subtle Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none sticky top-0 h-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-neutral-800/20 rounded-full blur-[150px] animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-[1500px] mx-auto px-6 py-12">

          {/* Top Bar */}
          <div className="flex justify-between items-center mb-10 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">COURSEGEN</span>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => { setCourse(null); setShowInput(true); }}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Course
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex items-center gap-3 px-4 py-2 rounded-full border border-neutral-800 bg-neutral-900/50 hover:border-white/20 transition-all group"
              >
                <User className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{user?.email}</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Input Area (Visible if Course is Null and showInput is specific) */}
          {view === "main" && !course && !loading && showInput && (
            <div className="max-w-2xl mx-auto mb-16 animate-slide-up">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">What do you want to learn?</h1>
                <p className="text-neutral-400">Generate comprehensive, structured courses on any topic.</p>
              </div>
              <form onSubmit={handleGenerate} className="relative group">
                <div className="absolute -inset-1 bg-white/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl flex flex-col gap-2">
                  <textarea
                    placeholder="E.g. Advanced Python Patterns, History of Rome, Quantum Mechanics..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-transparent border-none text-white text-lg placeholder-neutral-600 focus:ring-0 resize-none p-4 min-h-[120px]"
                    required
                    disabled={loading}
                  />
                  <div className="flex justify-between items-center px-2 pb-2">
                    <span className="text-xs text-neutral-600 uppercase font-medium tracking-widest">AI Generating Engine</span>
                    <button
                      type="submit"
                      disabled={loading || !prompt.trim()}
                      className="bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <BookOpen className="w-5 h-5" />
                      Generate
                    </button>
                  </div>
                </div>
              </form>
              <button onClick={() => setShowInput(false)} className="mx-auto block mt-6 text-neutral-500 hover:text-white text-sm">Cancel</button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-neutral-800 border-t-white rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Generating Course</h3>
              <p className="text-neutral-500">{generationStatus}</p>
            </div>
          )}

          {/* Dashboard View */}
          {view === "main" && !course && !loading && !showInput && (
            <Dashboard onResumeCourse={handleSelectCourse} />
          )}

          {/* Result View */}
          {view === "main" && course && !generating && (
            <div className="animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => { setCourse(null); setPrompt(""); setShowInput(false); }}
                  className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45" /> Back to Dashboard
                </button>
              </div>
              <CourseRenderer course={course} />
            </div>
          )}

          {/* Profile View */}
          {view === "profile" && (
            <Profile onBack={() => setView("main")} />
          )}

          {error && (
            <div className="fixed bottom-8 right-8 p-4 bg-red-900/20 border border-red-900/50 text-red-200 rounded-xl flex items-center gap-3 animate-shake shadow-2xl backdrop-blur-md">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              {error}
            </div>
          )}

        </div>

        {/* Floating AI Chatbot */}
        {course && (
          <GenyChatbot courseId={course.course_id} />
        )}
      </div>
    </div>
  );
}
