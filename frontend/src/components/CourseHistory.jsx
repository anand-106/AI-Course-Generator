import React, { useEffect, useState } from 'react';
import { History, Book, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function CourseHistory({ onSelectCourse }) {
    const { getAuthHeaders, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = async () => {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/course/list/all`, { headers });
            if (res.status === 401) {
                logout();
                throw new Error("Unauthorized");
            }
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setCourses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [getAuthHeaders]);

    return (
        <div className="bg-black border-r border-neutral-800 h-full flex flex-col w-80 shadow-2xl relative z-20">
            <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center gap-3 text-white">
                    <History className="w-5 h-5" />
                    <h2 className="font-bold text-lg tracking-wide">LIBRARY</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {loading && (
                    <div className="flex justify-center p-8">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && courses.length === 0 && (
                    <div className="text-center p-8 text-neutral-600">
                        <Book className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">No courses yet.</p>
                    </div>
                )}

                {courses.map((course) => (
                    <button
                        key={course.course_id}
                        onClick={() => onSelectCourse({ ...course.course_data, course_id: course.course_id })}
                        className="w-full text-left p-4 rounded-xl hover:bg-neutral-900 transition-all duration-200 border border-transparent hover:border-neutral-800 group relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <h3 className="font-semibold text-neutral-300 line-clamp-1 group-hover:text-white transition-colors mb-2 text-sm">
                                {course.title || course.prompt}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-neutral-600 group-hover:text-neutral-500">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(course.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
