import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function useCourseStream(getAuthHeaders, logout) {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("");

    const generateCourse = async (prompt, onComplete) => {
        setError(null);
        setCourse(null);
        setLoading(true);
        setStatus("Initializing...");

        try {
            const res = await fetch(`${API_BASE}/course/generate`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    if (logout) logout();
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
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const event = JSON.parse(line);

                        if (event.type === "status") {
                            setStatus(event.message);
                        } else if (event.type === "meta") {
                            setCourse({ title: event.data.title, modules: {} });
                        } else if (event.type === "module") {
                            setCourse(prev => {
                                // If we missed the meta event (unlikely but possible), init structure
                                const safePrev = prev || { modules: {} };
                                return {
                                    ...safePrev,
                                    modules: { ...safePrev.modules, [event.data.module_title]: event.data }
                                };
                            });
                        } else if (event.type === "complete") {
                            const finalCourse = { ...event.data, course_id: event.course_id };
                            setCourse(finalCourse);
                            setLoading(false);
                            if (onComplete) onComplete(finalCourse);
                        } else if (event.type === "error") {
                            const msg = event.message || "An error occurred during course generation";
                            setError(msg);
                            setLoading(false);
                            setStatus("");
                            return; // Stop processing
                        }
                    } catch (e) {
                        console.error("Stream parsing error:", e);
                    }
                }
            }
        } catch (err) {
            setError(err.message || "Failed to generate course");
            setLoading(false);
        }
    };

    return { course, setCourse, loading, error, status, generateCourse };
}
