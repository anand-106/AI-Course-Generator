import { useEffect, useRef } from "react";

// Lazy load mermaid to avoid SSR issues
let mermaidInstance = null;

async function ensureMermaid() {
  if (mermaidInstance) return mermaidInstance;
  const mermaid = (await import("mermaid"))?.default ?? (await import("mermaid"));
  mermaid.initialize({ startOnLoad: false });
  mermaidInstance = mermaid;
  return mermaid;
}

function MermaidBlock({ code, idSuffix }) {
  const containerRef = useRef(null);
  useEffect(() => {
    (async () => {
      if (!code || !containerRef.current) return;
      const mermaid = await ensureMermaid();
      const targetId = `mermaid-${idSuffix}`;
      try {
        mermaid.render(`${targetId}-svg`, code, (svg) => {
          containerRef.current.innerHTML = svg;
        });
      } catch (e) {
        // no-op
      }
    })();
  }, [code, idSuffix]);
  return <div ref={containerRef} style={{ overflowX: 'auto' }} />;
}

function YouTubeEmbed({ link }) {
  try {
    const url = new URL(link);
    let videoId = url.searchParams.get("v");
    if (!videoId && url.hostname.includes("youtube.com") && url.pathname.startsWith("/watch")) {
      videoId = url.searchParams.get("v");
    }
    if (!videoId && url.hostname.includes("youtu.be")) {
      videoId = url.pathname.slice(1);
    }
    if (!videoId) return <a href={link} target="_blank" rel="noreferrer">Watch on YouTube</a>;
    return (
      <iframe
        width="560"
        height="315"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ maxWidth: "100%" }}
      />
    );
  } catch {
    return null;
  }
}

export default function CourseRenderer({ course }) {

  if (!course) return null;

  const modules = course.modules || {};
  const moduleEntries = Object.entries(modules);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Generated Course</h1>

      {moduleEntries.map(([title, data], i) => (
        <div key={title} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{i + 1}. {title}</h2>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Explanations</h3>
              <ul style={{ paddingLeft: 16 }}>
                {Object.entries(data.explanations || {}).map(([sub, text]) => (
                  <li key={sub} style={{ marginBottom: 8 }}>
                    <strong>{sub}:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Diagram</h3>
              <MermaidBlock code={data.mermaid} idSuffix={`${i}`} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Videos</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {(data.videos || []).map((v, idx) => (
                  <div key={idx}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{v.title}</div>
                    <YouTubeEmbed link={v.link} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


