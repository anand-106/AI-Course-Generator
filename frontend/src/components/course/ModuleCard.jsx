import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Layers, HelpCircle, Check, ArrowRight } from "lucide-react";
import Flashcards from '../Flashcards';
import Quiz from '../Quiz';
import { ExplanationContent } from './ExplanationContent';

export function ModuleCard({ title, data, index, onQuizComplete, isGeneratingNext, isLastModule }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [quizCompleted, setQuizCompleted] = useState(false);

    return (
        <div
            className="group bg-black border border-neutral-800 rounded-3xl overflow-hidden animate-slide-up transition-all duration-300 hover:border-neutral-700"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-8 py-6 flex items-center justify-between group-hover:bg-neutral-900/30 transition-colors"
            >
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-neutral-900 text-white border border-neutral-800">
                        {index + 1}
                    </div>
                    <div className="text-left">
                        <h2 className="text-2xl font-bold text-white group-hover:text-neutral-200 transition-colors">{title}</h2>
                        <p className="text-neutral-500 text-sm mt-1">
                            {isExpanded ? 'Click to collapse' : 'Click to expand module'}
                        </p>
                    </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-neutral-800 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white text-black' : 'text-neutral-500 group-hover:bg-white group-hover:text-black'}`}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </button>

            {isExpanded && (
                <div className="p-8 border-t border-neutral-900 bg-neutral-950/50 space-y-10 animate-fade-in">

                    {/* Content Section */}
                    {data.explanations && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                <FileText className="w-5 h-5 text-white" />
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Core Knowledge</h3>
                            </div>
                            <ExplanationContent
                                content={data.explanations}
                                videos={data.videos}
                                mermaid={data.mermaid}
                            />
                        </div>
                    )}

                    {/* Flashcards Section */}
                    {data.flashcards && data.flashcards.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                <Layers className="w-5 h-5 text-white" />
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Flashcards</h3>
                            </div>
                            <Flashcards cards={data.flashcards} />
                        </div>
                    )}

                    {/* Quiz Section */}
                    {data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                <HelpCircle className="w-5 h-5 text-white" />
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Assessment</h3>
                                <span className="text-xs px-2 py-1 bg-neutral-800 rounded text-neutral-400">{data.quiz.length} Questions</span>
                            </div>

                            <Quiz
                                questions={data.quiz}
                                onComplete={(score) => {
                                    setQuizCompleted(true);
                                    onQuizComplete(index, score);
                                }}
                            />

                            {/* Navigation / Next Steps */}
                            {isGeneratingNext ? (
                                <div className="mt-8 p-6 bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center gap-4 animate-pulse">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-neutral-400 font-medium tracking-wide">GENERATING NEXT MODULE</span>
                                </div>
                            ) : (
                                isLastModule && quizCompleted && (
                                    <button
                                        onClick={() => onQuizComplete(index, {})}
                                        className="w-full mt-6 py-4 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01]"
                                    >
                                        <span>Continue Learning</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
