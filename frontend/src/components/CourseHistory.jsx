import React, { useEffect, useState } from 'react';
import { History, Book, ChevronRight, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function CourseHistory({ onSelectCourse }) {
    const { getAuthHeaders, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourses = async () => {
        const headers = getAuthHeaders();
        if (!headers.Authorization) {
            return; // Wait for token
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/course/list`, {
                headers: headers,
            });
            if (res.status === 401) {
                // Token expired/invalid
                logout();
                throw new Error("Unauthorized");
            }
            if (!res.ok) throw new Error("Failed to fetch history");
            const data = await res.json();
            setCourses(data);
        } catch (err) {
            console.error(err);
            setError("Could not load history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [getAuthHeaders]); // Re-run when auth headers change (implies token change if getAuthHeaders is stable/dynamic)

    return (
        <div className="bg-white/80 backdrop-blur-md border-r border-gray-200 h-full flex flex-col w-80 shadow-2xl">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3 text-blue-900">
                    <History className="w-6 h-6" />
                    <h2 className="font-bold text-xl">History</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading && (
                    <div className="flex justify-center p-8">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && courses.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        <Book className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No courses yet.</p>
                        <p className="text-sm">Generate one to get started!</p>
                    </div>
                )}

                {courses.map((course) => (
                    <button
                        key={course.course_id}
                        onClick={() => onSelectCourse(course.course_data)}
                        className="w-full text-left p-4 rounded-xl hover:bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-transparent hover:border-blue-100 group relative overflow-hidden bg-gray-50/50"
                    >
                        <div className="relative z-10">
                            <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors mb-2">
                                {course.title || course.prompt}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(course.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
