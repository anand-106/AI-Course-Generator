import React, { useEffect, useState } from 'react';
import { BookOpen, Trophy, Activity, PlayCircle, BarChart, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Dashboard({ onResumeCourse }) {
    const { getAuthHeaders } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completedCourses: 0,
        totalModules: 0,
        completedModules: 0,
        averageQuizScore: 0,
        totalQuizAttempts: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            const res = await fetch(`${API_BASE}/course/list/all`, { headers });
            if (res.ok) {
                const data = await res.json();
                processData(data);
                setCourses(data);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const processData = (data) => {
        let completedCourses = 0;
        let totalModules = 0;
        let completedModulesCount = 0;
        let totalScore = 0;
        let scoreCount = 0;

        data.forEach(course => {
            const modules = course.course_data?.modules ? Object.keys(course.course_data.modules).length : 0;
            const progress = course.course_progress || { completed_modules: [], quiz_scores: {} };
            const done = progress.completed_modules.length;

            if (done > 0 && done >= modules) completedCourses++;
            totalModules += modules;
            completedModulesCount += done;

            // Quiz calculations
            const scores = Object.values(progress.quiz_scores || {});
            if (scores.length > 0) {
                totalScore += scores.reduce((a, b) => a + b, 0);
                scoreCount += scores.length;
            }
        });

        setStats({
            completedCourses,
            totalModules,
            completedModules: completedModulesCount,
            averageQuizScore: scoreCount ? Math.round(totalScore / scoreCount * 10) : 0, // Assuming score is out of 10 usually? Quiz returns count. Let's assume raw score.
            totalQuizAttempts: scoreCount
        });
    };

    // Clean title helper from previous request
    const cleanTitle = (text) => {
        if (!text) return "";
        return text
            .replace(/^(Here is|Here's|Sure,? here is|I have generated|The title is|Title:)\s+.*?(course|title|about)?\s*:?\s*/i, "")
            .replace(/^["']|["']$/g, "")
            .trim();
    };

    const getLastActiveCourse = () => {
        // Simple logic: return the first course in the list (most recent)
        // A better approach would be to track 'last_accessed' in backend
        return courses.length > 0 ? courses[0] : null;
    };

    const lastCourse = getLastActiveCourse();
    const lastCourseProgress = lastCourse?.course_progress || { completed_modules: [] };
    const lastCourseTotalModules = lastCourse?.course_data?.modules ? Object.keys(lastCourse.course_data.modules).length : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                <BookOpen className="w-16 h-16 text-neutral-700 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to your Learning Dashboard</h2>
                <p className="text-neutral-500 max-w-md">
                    You haven't started any courses yet. Generate your first course to begin your journey.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">

            {/* Continue Learning Hero */}
            {lastCourse && (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] group-hover:bg-purple-500/10 transition-all duration-700"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-purple-400 font-medium text-xs tracking-wider uppercase mb-2">
                                <Activity className="w-3 h-3" />
                                <span>Continue Learning</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">{cleanTitle(lastCourse.title || lastCourse.prompt)}</h2>
                            <p className="text-neutral-400 text-sm">
                                {lastCourseProgress.completed_modules.length} of {lastCourseTotalModules} modules completed
                            </p>
                        </div>
                        <button
                            onClick={() => onResumeCourse({ ...lastCourse.course_data, course_id: lastCourse.course_id })}
                            className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-lg hover:shadow-white/10"
                        >
                            <PlayCircle className="w-5 h-5" />
                            Resume Course
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8 h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-1000"
                            style={{ width: `${lastCourseTotalModules ? (lastCourseProgress.completed_modules.length / lastCourseTotalModules) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black border border-neutral-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                        <Trophy className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-semibold">Courses Completed</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.completedCourses}</div>
                </div>
                <div className="bg-black border border-neutral-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                        <BarChart className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-semibold">Modules Finished</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.completedModules}</div>
                </div>
                <div className="bg-black border border-neutral-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-semibold">Quiz Attempts</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalQuizAttempts}</div>
                </div>
            </div>

            {/* My Courses List */}
            <div>
                <h3 className="text-xl font-bold text-white mb-6">My Courses</h3>
                <div className="grid grid-cols-1 gap-4">
                    {courses.map(course => {
                        const progress = course.course_progress || { completed_modules: [] };
                        const total = course.course_data?.modules ? Object.keys(course.course_data.modules).length : 0;
                        const completed = progress.completed_modules.length;
                        const percent = total ? Math.round((completed / total) * 100) : 0;

                        return (
                            <div key={course.course_id} className="group bg-neutral-900/30 border border-neutral-800 p-5 rounded-xl hover:border-neutral-700 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-200 group-hover:text-white transition-colors">
                                            {cleanTitle(course.title || course.prompt)}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1 text-xs text-neutral-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(course.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {percent === 100 ? (
                                                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">Completed</span>
                                            ) : percent > 0 ? (
                                                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">In Progress</span>
                                            ) : (
                                                <span className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded">Not Started</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden md:block w-32">
                                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                                            <span>Progress</span>
                                            <span>{percent}%</span>
                                        </div>
                                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-neutral-400 rounded-full"
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onResumeCourse({ ...course.course_data, course_id: course.course_id })}
                                        className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm font-medium hover:bg-white hover:text-black transition-colors"
                                    >
                                        Resume
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
