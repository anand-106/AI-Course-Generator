import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Layers, HelpCircle, Check, ArrowRight, Lock } from "lucide-react";
import Flashcards from '../Flashcards';
import Quiz from '../Quiz';
import { ExplanationContent } from './ExplanationContent';

export function ModuleCard({ title, data, index, onQuizComplete, isGeneratingNext, isLastModule }) {
    const isLocked = !data;
    const [isExpanded, setIsExpanded] = useState(!isLocked);
    const [quizCompleted, setQuizCompleted] = useState(false);

    return (
        <div
            className={`group bg-[#0A0A0A] border rounded-[2rem] overflow-hidden animate-slide-up transition-all duration-500 shadow-2xl ${isLocked ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-white/20'}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <button
                onClick={() => !isLocked && setIsExpanded(!isExpanded)}
                className={`w-full px-10 py-8 flex items-center justify-between transition-colors ${isLocked ? 'cursor-not-allowed' : 'hover:bg-white/[0.02]'}`}
            >
                <div className="flex items-center gap-8">
                    <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all ${isLocked ? 'bg-neutral-800 text-neutral-500' : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}>
                            {isLocked ? <Lock className="w-6 h-6" /> : index + 1}
                        </div>
                        {!isLocked && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-black flex items-center justify-center">
                                {quizCompleted && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                            </div>
                        )}
                    </div>
                    <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">
                            {isLocked ? 'Upcoming Module' : `Module ${index + 1}`}
                        </span>
                        <h2 className={`text-3xl font-black leading-tight tracking-tight transition-colors ${isLocked ? 'text-neutral-500' : 'text-white'}`}>
                            {title}
                        </h2>
                    </div>
                </div>
                {!isLocked && (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/10 transition-all duration-500 ${isExpanded ? 'rotate-180 bg-white text-black border-transparent' : 'text-slate-500 hover:border-white/20'}`}>
                        <ChevronDown className="w-6 h-6" />
                    </div>
                )}
            </button>

            {isExpanded && data && (
                <div className="px-10 pb-12 pt-4 space-y-16 animate-fade-in">
                    {/* Main Content Area */}
                    {data.explanations && (
                        <div className="space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                    <FileText className="w-3 h-3" /> Advanced Learning
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            </div>

                            <ExplanationContent
                                content={data.explanations}
                                videos={data.videos}
                                mermaid={data.mermaid}
                            />
                        </div>
                    )}

                    {/* Interactive Elements Grid */}
                    <div className="grid lg:grid-cols-2 gap-10">
                        {/* Flashcards */}
                        {data.flashcards && data.flashcards.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Layers className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Recall</h3>
                                </div>
                                <Flashcards cards={data.flashcards} />
                            </div>
                        )}

                        {/* Quiz */}
                        {data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <HelpCircle className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Knowledge Check</h3>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-4">
                                    <Quiz
                                        questions={data.quiz}
                                        onComplete={(score) => {
                                            setQuizCompleted(true);
                                            onQuizComplete(index, score);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Navigation */}
                    <div className="pt-8 flex flex-col items-center">
                        {isGeneratingNext ? (
                            <div className="w-full p-8 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex flex-col items-center gap-4 animate-pulse">
                                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                <span className="text-blue-400 text-xs font-bold tracking-[0.2em] uppercase">Constructing Next Lesson</span>
                            </div>
                        ) : (
                            isLastModule && quizCompleted && (
                                <button
                                    onClick={() => onQuizComplete(index, {})}
                                    className="group/btn relative px-12 py-5 bg-white text-black rounded-2xl font-black text-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                                >
                                    <div className="relative z-10 flex items-center gap-4">
                                        <span>Unlock Next Module</span>
                                        <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                                </button>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
