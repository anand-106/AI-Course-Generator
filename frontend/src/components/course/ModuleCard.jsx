import React, { useState } from 'react';
import { ChevronDown, Layers, Check, ArrowRight, Lock, Sparkles } from "lucide-react";
import Flashcards from '../Flashcards';
import Quiz from '../Quiz';
import { ExplanationContent } from './ExplanationContent';

export function ModuleCard({ title, data, index, onQuizComplete, isGeneratingNext, isLastModule }) {
    const isLocked = !data;
    const [isExpanded, setIsExpanded] = useState(!isLocked);
    const [quizCompleted, setQuizCompleted] = useState(false);

    return (
        <div
            className={`group animate-slide-up transition-all duration-700 ${isExpanded ? 'mb-32' : 'mb-6'} ${isLocked ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Header - Modular and clean */}
            <div className={`rounded-[2rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'bg-[#0A0A0A] border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]' : 'bg-neutral-900/50 border-white/5 hover:border-white/20 shadow-xl'}`}>
                <button
                    onClick={() => !isLocked && setIsExpanded(!isExpanded)}
                    className={`w-full px-12 py-12 lg:py-14 flex items-center justify-between transition-colors ${isLocked ? 'cursor-not-allowed' : 'hover:bg-white/[0.01]'}`}
                >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                        <div className="relative flex-shrink-0">
                            <span className="text-[120px] font-black text-white/[0.02] absolute -left-12 -top-16 select-none">{index + 1}</span>
                            <div className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl transition-all ${isLocked ? 'bg-neutral-800 text-neutral-500' : 'bg-white text-black shadow-2xl'}`}>
                                {isLocked ? <Lock className="w-8 h-8" /> : index + 1}
                            </div>
                        </div>
                        <div className="text-left relative z-10">
                            <h2 className={`text-4xl lg:text-6xl font-black leading-none tracking-tighter transition-colors ${isLocked ? 'text-neutral-500' : 'text-white'}`}>
                                {title}
                            </h2>
                            <div className="flex gap-4 mt-8">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    <Layers className="w-4 h-4" /> Comprehensive Module
                                </div>
                                {quizCompleted && (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
                                        <Check className="w-4 h-4" /> Mastery Achieved
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {!isLocked && (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 ${isExpanded ? 'rotate-180 bg-white text-black border-transparent' : 'border-white/10 text-slate-500'}`}>
                            <ChevronDown className="w-8 h-8" />
                        </div>
                    )}
                </button>
            </div>

            {/* Expanded Content: The Two-Column Mastery System */}
            {isExpanded && data && (
                <div className="mt-16 lg:mt-24 animate-fade-in relative z-20 px-4">
                    <div className="grid lg:grid-cols-[1fr_450px] gap-20 xl:gap-32 items-start">
                        {/* Left Side: Deep Educational Flow */}
                        <div className="space-y-40">
                            <div className="space-y-32">
                                <ExplanationContent
                                    content={data.explanations}
                                    videos={data.videos}
                                    mermaid={data.mermaid}
                                />
                            </div>

                            {/* Detailed Assessment integration */}
                            {data.quiz && data.quiz.length > 0 && (
                                <div className="pt-24 border-t border-white/5">
                                    <div className="mb-16">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-px w-20 bg-purple-500/50"></div>
                                            <span className="text-purple-500 font-bold uppercase tracking-[0.5em] text-xs">Knowledge Certification</span>
                                        </div>
                                        <h3 className="text-6xl lg:text-7xl font-black text-white tracking-tighter">Module Final Quiz</h3>
                                    </div>
                                    <div className="p-10 lg:p-14 bg-white/[0.01] rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
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

                            {/* Footer Navigation */}
                            <div className="pt-16 flex flex-col items-center">
                                {isGeneratingNext ? (
                                    <div className="w-full p-12 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-6 animate-pulse">
                                        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
                                        <span className="text-white text-sm font-bold tracking-[0.3em] uppercase">Constructing Next Frontier</span>
                                    </div>
                                ) : (
                                    isLastModule && quizCompleted && (
                                        <button
                                            onClick={() => onQuizComplete(index, {})}
                                            className="group/btn relative px-16 py-7 bg-white text-black rounded-3xl font-black text-2xl overflow-hidden transition-all hover:scale-[1.05] active:scale-[0.98] shadow-[0_40px_80px_rgba(255,255,255,0.1)]"
                                        >
                                            <div className="relative z-10 flex items-center gap-6">
                                                <span>Unlock Next Module</span>
                                                <ArrowRight className="w-8 h-8 group-hover/btn:translate-x-3 transition-transform" />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/btn:opacity-20 transition-opacity"></div>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Right Side: The Interactive Panel (Sticky) */}
                        <div className="hidden lg:block sticky top-8">
                            <div className="space-y-12">
                                {/* Flashcards Panel */}
                                <div className="p-12 bg-[#0A0A0A] border border-white/10 rounded-[3rem] shadow-3xl space-y-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Layers className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-widest leading-none mb-1">Flashcards</h3>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Active Recall Kit</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Flashcards cards={data.flashcards} />
                                </div>

                                {/* Sidebar Help */}
                                <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 group/help">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover/help:scale-110 transition-transform">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Learning Support</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">Need deep clarification on any of the concepts discussed in this module? Geny is synced with this specific lesson context.</p>
                                    <div className="pt-2">
                                        <div className="h-px w-full bg-gradient-to-r from-purple-500/30 to-transparent"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Flashcards Section */}
                        <div className="lg:hidden mt-20 p-10 bg-neutral-900 border border-white/5 rounded-[2.5rem]">
                            <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4">
                                <Layers className="w-6 h-6 text-blue-400" /> Flashcards
                            </h3>
                            <Flashcards cards={data.flashcards} />
                        </div>
                    </div>
                </div>
            )}

            {/* Elegant separation line */}
            {!isExpanded && <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mt-12 mb-6"></div>}
        </div>
    );
}
