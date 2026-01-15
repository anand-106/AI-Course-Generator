import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

export default function Quiz({ questions, onComplete }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState({});
    const [score, setScore] = useState(null);

    // Debug logging
    useEffect(() => {
        if (questions) {
            console.log('Quiz component received questions:', questions);
        }
    }, [questions]);

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.log('Quiz component: No valid questions provided', questions);
        return null;
    }

    const currentQuestion = questions[currentIndex];
    const isAnswered = selectedAnswers[currentIndex] !== undefined;
    const isCorrect = showResults[currentIndex] === true;
    const showExplanation = showResults[currentIndex] !== undefined;

    const handleSelectAnswer = (optionIndex) => {
        if (showResults[currentIndex] !== undefined) return; // Already answered

        const newSelected = { ...selectedAnswers, [currentIndex]: optionIndex };
        setSelectedAnswers(newSelected);

        const correct = optionIndex === currentQuestion.answer_index;
        setShowResults({ ...showResults, [currentIndex]: correct });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.answer_index) {
                correct++;
            }
        });
        return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
    };

    const handleSubmitQuiz = () => {
        const result = calculateScore();
        setScore(result);
        if (onComplete) {
            onComplete(result);
        }
    };

    const allAnswered = Object.keys(selectedAnswers).length === questions.length;

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* Score Display */}
            {score !== null && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white text-center shadow-xl animate-fade-in border border-white/10">
                    <h3 className="text-2xl font-bold mb-2">Quiz Complete! 🎉</h3>
                    <p className="text-3xl font-bold mb-2">{score.correct} / {score.total}</p>
                    <p className="text-lg opacity-90">{score.percentage}% Correct</p>
                </div>
            )}

            {/* Question Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden">
                {/* Question Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-white border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="w-6 h-6 text-white" />
                            <h3 className="text-xl font-bold">Question {currentIndex + 1} of {questions.length}</h3>
                        </div>
                        {showExplanation && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isCorrect ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>
                                {isCorrect ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <XCircle className="w-5 h-5" />
                                )}
                                <span className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Question Body */}
                <div className="p-6 space-y-4">
                    <p className="text-xl font-semibold text-slate-100 leading-relaxed">
                        {currentQuestion.question}
                    </p>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = selectedAnswers[currentIndex] === idx;
                            const isCorrectAnswer = idx === currentQuestion.answer_index;
                            const showAnswer = showResults[currentIndex] !== undefined;

                            let buttonClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 ";

                            if (showAnswer) {
                                if (isCorrectAnswer) {
                                    buttonClass += "bg-green-900/30 border-green-500/50 text-green-300 font-semibold";
                                } else if (isSelected && !isCorrectAnswer) {
                                    buttonClass += "bg-red-900/30 border-red-500/50 text-red-300";
                                } else {
                                    buttonClass += "bg-slate-800/50 border-white/5 text-slate-500";
                                }
                            } else {
                                if (isSelected) {
                                    buttonClass += "bg-violet-600/20 border-violet-500 text-violet-200 font-semibold shadow-[0_0_15px_rgba(139,92,246,0.3)]";
                                } else {
                                    buttonClass += "bg-slate-800/50 border-white/10 text-slate-300 hover:border-violet-500/50 hover:bg-slate-800/80";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectAnswer(idx)}
                                    disabled={showAnswer}
                                    className={buttonClass}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border ${showAnswer && isCorrectAnswer
                                            ? 'bg-green-500/20 border-green-500 text-green-300'
                                            : isSelected
                                                ? 'bg-violet-600 text-white border-violet-500'
                                                : 'bg-slate-700/50 text-slate-400 border-white/10'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="flex-1">{option}</span>
                                        {showAnswer && isCorrectAnswer && (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        )}
                                        {showAnswer && isSelected && !isCorrectAnswer && (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {showExplanation && currentQuestion.explanation && (
                        <div className={`mt-4 p-4 rounded-xl border-l-4 ${isCorrect
                            ? 'bg-green-900/20 border-green-500'
                            : 'bg-blue-900/20 border-blue-500'
                            } animate-fade-in`}>
                            <p className="text-sm font-semibold text-slate-300 mb-1">Explanation:</p>
                            <p className="text-slate-400 leading-relaxed">{currentQuestion.explanation}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-white/10"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                </button>

                <span className="text-sm font-medium text-slate-500">
                    {currentIndex + 1} / {questions.length}
                </span>

                {currentIndex < questions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={!isAnswered}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/20"
                    >
                        Next
                        <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={!allAnswered || score !== null}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Submit Quiz
                    </button>
                )}
            </div>
        </div>
    );
}

