import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

export default function Quiz({ questions }) {
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
    };

    const allAnswered = Object.keys(selectedAnswers).length === questions.length;

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* Score Display */}
            {score !== null && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center shadow-xl animate-fade-in">
                    <h3 className="text-2xl font-bold mb-2">Quiz Complete! 🎉</h3>
                    <p className="text-3xl font-bold mb-2">{score.correct} / {score.total}</p>
                    <p className="text-lg opacity-90">{score.percentage}% Correct</p>
                </div>
            )}

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Question Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Question {currentIndex + 1} of {questions.length}</h3>
                        </div>
                        {showExplanation && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
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
                    <p className="text-xl font-semibold text-gray-800 leading-relaxed">
                        {currentQuestion.question}
                    </p>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = selectedAnswers[currentIndex] === idx;
                            const isCorrectAnswer = idx === currentQuestion.answer_index;
                            const showAnswer = showResults[currentIndex] !== undefined;

                            let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ";
                            
                            if (showAnswer) {
                                if (isCorrectAnswer) {
                                    buttonClass += "bg-green-50 border-green-500 text-green-900 font-semibold";
                                } else if (isSelected && !isCorrectAnswer) {
                                    buttonClass += "bg-red-50 border-red-500 text-red-900";
                                } else {
                                    buttonClass += "bg-gray-50 border-gray-200 text-gray-600";
                                }
                            } else {
                                if (isSelected) {
                                    buttonClass += "bg-blue-50 border-blue-500 text-blue-900 font-semibold";
                                } else {
                                    buttonClass += "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50";
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
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                                            showAnswer && isCorrectAnswer 
                                                ? 'bg-green-500 text-white' 
                                                : isSelected 
                                                    ? 'bg-blue-500 text-white' 
                                                    : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="flex-1">{option}</span>
                                        {showAnswer && isCorrectAnswer && (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                        {showAnswer && isSelected && !isCorrectAnswer && (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {showExplanation && currentQuestion.explanation && (
                        <div className={`mt-4 p-4 rounded-xl border-l-4 ${
                            isCorrect 
                                ? 'bg-green-50 border-green-500' 
                                : 'bg-blue-50 border-blue-500'
                        } animate-fade-in`}>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Explanation:</p>
                            <p className="text-gray-600 leading-relaxed">{currentQuestion.explanation}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                </button>

                <span className="text-sm font-medium text-gray-500">
                    {currentIndex + 1} / {questions.length}
                </span>

                {currentIndex < questions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={!isAnswered}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                        <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={!allAnswered || score !== null}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Submit Quiz
                    </button>
                )}
            </div>
        </div>
    );
}

