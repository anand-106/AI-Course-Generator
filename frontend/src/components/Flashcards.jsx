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
        <div className="w-full max-w-2xl mx-auto">
            <div className="relative group perspective-1000 h-64 cursor-pointer" onClick={handleFlip}>
                <div
                    className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''
                        }`}
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl text-white border border-white/10">
                        <h3 className="text-sm uppercase tracking-wider font-medium opacity-70 mb-4">Term</h3>
                        <p className="text-2xl font-bold text-center leading-relaxed">{currentCard.front}</p>
                        <div className="absolute bottom-4 right-4 text-white/50 text-xs flex items-center gap-1">
                            <RotateCw className="w-3 h-3" /> Click to flip
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl border border-indigo-500/30 shadow-inner">
                        <h3 className="text-sm uppercase tracking-wider font-medium text-pink-400 mb-4">Definition</h3>
                        <p className="text-xl text-slate-200 text-center leading-relaxed">{currentCard.back}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6 px-4">
                <button
                    onClick={handlePrev}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <span className="text-sm font-medium text-slate-500">
                    {currentIndex + 1} / {cards.length}
                </span>

                <button
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
