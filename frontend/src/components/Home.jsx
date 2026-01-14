import { useState } from "react";
import CourseRenderer from "./CourseRenderer";
import CourseHistory from "./CourseHistory";
import { Sparkles, BookOpen, Loader2, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Home() {
  const { user, logout, getAuthHeaders } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generationStatus, setGenerationStatus] = useState("Initializing...");

  function handleSelectCourse(courseData) {
    setCourse(courseData);
    setPrompt(""); // Clear prompt when viewing history
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setCourse(null);
    setLoading(true);
    setGenerationStatus("Initializing...");

    try {
      const res = await fetch(`${API_BASE}/course/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`API error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "status") {
              setGenerationStatus(event.message);
            } else if (event.type === "meta") {
              setCourse({
                title: event.data.title,
                modules: {} // Initialize with empty modules
              });
            } else if (event.type === "module") {
              console.log("Module received:", event.data.module_title, "Quiz:", event.data.quiz);
              setCourse(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  modules: {
                    ...prev.modules,
                    [event.data.module_title]: event.data
                  }
                };
              });
            } else if (event.type === "complete") {
              setCourse(event.data); // Ensure consistency
              setLoading(false);
            } else if (event.type === "error") {
              // Set error state and stop loading
              const errorMessage = event.message || "An error occurred during course generation";
              console.log("Error received from stream:", errorMessage);
              setError(errorMessage);
              setLoading(false);
              setGenerationStatus("");
              // Break out of the stream loop
              return;
            }
          } catch (parseError) {
            // Only catch JSON parsing errors, not application errors
            if (parseError instanceof SyntaxError) {
              console.error("Error parsing stream line:", line, parseError);
            } else {
              // Re-throw application errors
              throw parseError;
            }
          }
        }
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Sidebar - Course History */}
      <CourseHistory
        onSelectCourse={handleSelectCourse}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative scroll-smooth">

        {/* Animated background elements (constrained to main area) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none sticky top-0 h-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* User Header with Logout */}
          <div className="flex justify-between items-center mb-8 animate-fade-in">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-xl shadow-md">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-700 font-medium">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              COURSEGEN
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your ideas into comprehensive, structured courses powered by AI
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 mb-8 border border-white/20 animate-slide-up">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur-xl"></div>
                <textarea
                  placeholder="Describe the course you want to create... "
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="relative w-full px-6 py-4 bg-white/90 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 resize-none text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating Course...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" />
                      <span>Generate Course</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-shake">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-red-700 font-medium">Error: {error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Course Renderer */}
          {course && (
            <div className="animate-fade-in-up">
              <CourseRenderer course={course} />
            </div>
          )}

          {/* Loading State - Shows progress message */}
          {loading && (
            <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-pulse">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Creating Your Course</h3>
                  <p className="text-blue-600 font-medium">{generationStatus}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
