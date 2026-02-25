import React, { useEffect, useRef, useState } from 'react';

// Lazy load mermaid singleton to avoid multiple initializations
let mermaidInstance = null;

async function ensureMermaid() {
    if (mermaidInstance) return mermaidInstance;

    // Dynamic import for code-splitting
    try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default || mermaidModule;

        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            themeVariables: {
                primaryColor: '#3b82f6',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#2563eb',
                lineColor: '#60a5fa',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
                mainBkg: '#0f172a',
                nodeBorder: '#334155',
                clusterBkg: '#1e293b',
            }
        });
        mermaidInstance = mermaid;
        return mermaid;
    } catch (err) {
        console.error("Failed to load mermaid", err);
        return null;
    }
}

export function MermaidBlock({ code, idSuffix }) {
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            if (!code || !containerRef.current) return;
            setIsLoading(true);
            try {
                const mermaid = await ensureMermaid();
                if (!mermaid) return;

                const targetId = `mermaid-${idSuffix}-${Math.random().toString(36).substr(2, 9)}`;

                // Render returns { svg } in newer versions
                const { svg } = await mermaid.render(targetId, code);

                if (mounted && containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    setIsLoading(false);
                }
            } catch (e) {
                console.error("Mermaid render error:", e);
                if (mounted) setIsLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [code, idSuffix]);

    return (
        <div className="relative bg-slate-900/50 rounded-2xl p-6 border border-white/10">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            )}
            <div ref={containerRef} className="overflow-x-auto min-h-[100px]" />
        </div>
    );
}
