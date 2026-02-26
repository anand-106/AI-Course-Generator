import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, CheckCircle } from 'lucide-react';

export default function Flashcards({ cards }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!cards || cards.length === 0) return null;

    const currentCard = cards[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }, 200);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="w-full relative group">
            {/* Stacked background effect */}
            <div className="absolute inset-0 bg-white/[0.02] border border-white/5 rounded-3xl translate-y-4 translate-x-2 scale-[0.98] -z-10"></div>
            <div className="absolute inset-0 bg-white/[0.01] border border-white/5 rounded-3xl translate-y-8 translate-x-4 scale-[0.96] -z-20"></div>

            <div className="relative perspective-2000 h-[350px] cursor-pointer group/card" onClick={handleFlip}>
                <div
                    className={`relative w-full h-full transition-all duration-700 transform-style-3d shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 bg-neutral-900 border border-white/10 rounded-3xl text-white group-hover/card:border-white/20 transition-all">
                        <div className="absolute top-6 left-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Recall Prompt</span>
                        </div>
                        <p className="text-2xl lg:text-3xl font-black text-center leading-[1.3] tracking-tight">{currentCard.front}</p>
                        <div className="absolute bottom-8 flex flex-col items-center gap-2 opacity-30 group-hover/card:opacity-100 transition-opacity">
                            <RotateCw className="w-4 h-4 text-white animate-spin-slow" />
                            <span className="text-[9px] uppercase tracking-widest font-black">Tap to reveal</span>
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-10 bg-white rounded-3xl border border-white text-black shadow-inner">
                        <div className="absolute top-6 left-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Core Insight</span>
                        </div>
                        <p className="text-xl lg:text-2xl font-bold text-center leading-relaxed tracking-tight">{currentCard.back}</p>
                        <div className="absolute bottom-6 flex items-center gap-2 px-3 py-1 rounded-full bg-black/5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verified Concept</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-12 px-6">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 text-slate-400 hover:bg-white hover:text-black transition-all border border-white/10"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black text-white/50 tracking-widest">
                        {currentIndex + 1} <span className="text-[10px] mx-1 opacity-20">/</span> {cards.length}
                    </span>
                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 text-slate-400 hover:bg-white hover:text-black transition-all border border-white/10"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
