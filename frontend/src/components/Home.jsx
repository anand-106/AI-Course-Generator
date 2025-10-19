import { useState } from "react";
import CourseRenderer from "./CourseRenderer";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setCourse(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/course/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }
      const data = await res.json();
      setCourse(data.course);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>AI Course Generator</h1>
      <form onSubmit={handleGenerate} style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <textarea
          placeholder="Describe the course you want..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          required
        />
        <div>
          <button type="submit" disabled={loading} style={{
            background: '#111827', color: 'white', padding: '10px 16px', borderRadius: 8, border: 0
          }}>
            {loading ? 'Generating…' : 'Generate Course'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: '#b91c1c', marginBottom: 16 }}>Error: {error}</div>
      )}

      <CourseRenderer course={course} />
    </div>
  );
}


