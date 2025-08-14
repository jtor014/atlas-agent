import { useState, useEffect } from 'react';
import './QuizMode.css';
import { getRandomFallbackQuestion } from '../data/fallbackQuestions';

const API_BASE_URL = 'https://atlas-agent-production-4cd2.up.railway.app';

function AIQuizMode({ region, gameState, onComplete, onBack }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [generatingNext, setGeneratingNext] = useState(false);
  const [performanceContext, setPerformanceContext] = useState(null);

  // AI-specific state
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState('medium');
  const [questionCategories] = useState([
    'Geography & Environment',
    'History & Civilizations',
    'Culture & Philosophy', 
    'Modern Context',
    'Challenge Puzzles'
  ]);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [aiStats, setAiStats] = useState({
    questionsGenerated: 0,
    totalCost: 0,
    adaptiveAdjustments: 0
  });

  // Initialize with first AI-generated question
  useEffect(() => {
    console.log('🤖 Initializing AI Quiz Mode for region:', region?.id);
    initializeAIQuiz();
  }, [region]);

  const initializeAIQuiz = async () => {
    try {
      setLoading(true);
      
      // Get initial performance context
      const perfResponse = await fetch(`${API_BASE_URL}/api/ai/performance/${gameState.sessionId || 'default'}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      let initialPerformance = null;
      if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        initialPerformance = perfData.performance;
        setPerformanceContext(initialPerformance);
      }

      // Generate first question
      const firstQuestion = await generateAIQuestion({
        region: region.id,
        category: questionCategories[0],
        difficulty: adaptiveDifficulty
      });

      if (firstQuestion) {
        setQuestions([firstQuestion]);
        setCurrentQuestion(0);
        startTimer();
      } else {
        // This should never happen now with fallback system
        console.error('❌ Critical: Both AI and fallback systems failed');
        setError('Unable to load questions. Please refresh and try again.');
      }

    } catch (err) {
      console.error('AI Quiz initialization error:', err);
      setError('Failed to initialize AI-powered quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAIQuestion = async (params) => {
    try {
      setGeneratingNext(true);
      
      // Get user age from localStorage or authenticated user
      const localAge = localStorage.getItem('atlas_user_age');
      const userAge = gameState.userAge || localAge || null;
      
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          userAge: userAge ? parseInt(userAge) : null,
          sessionId: gameState.sessionId,
          userId: gameState.userId
        })
      });

      if (!response.ok) {
        throw new Error(`AI generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🎯 Generated AI Question:', data.question.substring(0, 50) + '...');
      
      // Update AI statistics
      setAiStats(prev => ({
        questionsGenerated: prev.questionsGenerated + 1,
        totalCost: prev.totalCost + (data.metadata?.generation_cost_estimate || 0.002),
        adaptiveAdjustments: data.performance_context ? prev.adaptiveAdjustments + 1 : prev.adaptiveAdjustments
      }));

      // Update performance context if provided
      if (data.performance_context) {
        setPerformanceContext(data.performance_context);
      }

      return {
        id: data.id,
        question: data.question,
        answers: data.options,
        correctAnswer: data.correctAnswer,
        hint: data.hint,
        explanation: data.explanation,
        difficulty: data.difficulty,
        region: data.region,
        category: data.category,
        spy_context: data.spy_context,
        educational_value: data.educational_value,
        ai_generated: true,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('AI question generation error:', error);
      console.log('🔄 Falling back to offline questions...');
      
      // Use fallback question when AI fails
      const fallbackQuestion = getRandomFallbackQuestion(params.region, params.difficulty);
      
      return {
        id: `fallback_${Date.now()}`,
        question: fallbackQuestion.question,
        answers: fallbackQuestion.options,
        correctAnswer: fallbackQuestion.correctAnswer,
        hint: fallbackQuestion.hint,
        explanation: fallbackQuestion.explanation,
        difficulty: fallbackQuestion.difficulty,
        region: params.region,
        category: fallbackQuestion.category,
        spy_context: `Intelligence mission in ${params.region}`,
        educational_value: fallbackQuestion.explanation,
        ai_generated: false,
        is_fallback: true
      };
    } finally {
      setGeneratingNext(false);
    }
  };

  const startTimer = () => {
    // Age-adaptive timer - younger users get more time
    const userAge = localStorage.getItem('atlas_user_age');
    let timerSeconds = 30; // default
    
    if (userAge) {
      const age = parseInt(userAge);
      if (age <= 10) {
        timerSeconds = 45; // Elementary: more time
      } else if (age <= 12) {
        timerSeconds = 40; // Middle school: slightly more time
      } else if (age <= 14) {
        timerSeconds = 35; // Early high school: a bit more time
      }
      // 15+ uses default 30 seconds
    }
    
    setTimeLeft(timerSeconds);
    setIsTimerActive(true);
  };

  // Timer countdown
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isTimerActive) {
      handleTimeUp();
    }
  }, [timeLeft, isTimerActive]);

  const handleTimeUp = () => {
    setIsTimerActive(false);
    setAnswerResult({
      correct: false,
      message: "Time's up! The correct answer was: " + questions[currentQuestion]?.answers[questions[currentQuestion]?.correctAnswer],
      explanation: questions[currentQuestion]?.explanation || "Time management is crucial for agents in the field."
    });
    setShowResult(true);
  };

  const handleAnswerSelect = async (answerIndex) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    setIsTimerActive(false);
    setSubmittingAnswer(true);

    const currentQ = questions[currentQuestion];
    const isCorrect = answerIndex === currentQ.correctAnswer;
    const timeBonus = Math.max(0, Math.floor((timeLeft / 30) * 20));
    const questionScore = isCorrect ? 100 + timeBonus : 0;

    setScore(score + questionScore);

    // Record answer for adaptive learning
    try {
      await fetch(`${API_BASE_URL}/api/game/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameState.sessionId || 'ai-session',
          questionId: currentQ.id,
          selectedAnswer: currentQ.answers[answerIndex],
          isCorrect: isCorrect,
          pointsEarned: questionScore,
          timeSpent: 30 - timeLeft,
          aiGenerated: true
        })
      });
    } catch (error) {
      console.error('Error recording answer:', error);
    }

    setAnswerResult({
      correct: isCorrect,
      message: isCorrect ? 
        `Excellent work, Agent! +${questionScore} points` : 
        `Not quite right. The correct answer was: ${currentQ.answers[currentQ.correctAnswer]}`,
      explanation: currentQ.explanation,
      spy_context: currentQ.spy_context,
      educational_value: currentQ.educational_value
    });

    setShowResult(true);
    setSubmittingAnswer(false);
  };

  const handleNextQuestion = async () => {
    const nextQuestionIndex = currentQuestion + 1;
    const nextCategoryIndex = (currentCategory + 1) % questionCategories.length;
    
    // Update adaptive difficulty based on recent performance
    const newDifficulty = calculateAdaptiveDifficulty();
    setAdaptiveDifficulty(newDifficulty);
    setCurrentCategory(nextCategoryIndex);

    // Generate next question with AI
    const nextQuestion = await generateAIQuestion({
      region: region.id,
      category: questionCategories[nextCategoryIndex],
      difficulty: newDifficulty
    });

    if (nextQuestion) {
      // Add to questions array or replace if we're cycling
      const updatedQuestions = [...questions];
      if (nextQuestionIndex < questions.length) {
        updatedQuestions[nextQuestionIndex] = nextQuestion;
      } else {
        updatedQuestions.push(nextQuestion);
      }
      
      setQuestions(updatedQuestions);
      setCurrentQuestion(nextQuestionIndex);
      
      // Reset question state
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswerResult(null);
      startTimer();
    } else {
      console.error('❌ AI question generation failed, retrying...');
      // Retry once with simpler parameters
      const retryQuestion = await generateAIQuestion({
        region: region.id,
        category: 'Geography & Environment', // Fallback to basic category
        difficulty: 'medium' // Fallback to medium difficulty
      });
      
      if (retryQuestion) {
        const updatedQuestions = [...questions];
        updatedQuestions.push(retryQuestion);
        setQuestions(updatedQuestions);
        setCurrentQuestion(nextQuestionIndex);
        setSelectedAnswer(null);
        setShowResult(false);
        setAnswerResult(null);
        startTimer();
      } else {
        // Final fallback: complete the quiz
        console.error('💥 AI generation completely failed');
        completeQuiz();
      }
    }
  };

  const calculateAdaptiveDifficulty = () => {
    if (!performanceContext) return adaptiveDifficulty;

    const { recentAccuracy, averageTime, streakCount } = performanceContext;
    
    // Increase difficulty if performing well
    if (recentAccuracy > 0.85 && averageTime < 15 && streakCount > 2) {
      return 'hard';
    }
    // Decrease difficulty if struggling
    else if (recentAccuracy < 0.4 || averageTime > 35) {
      return 'easy';  
    }
    // Default to medium
    else {
      return 'medium';
    }
  };

  const completeQuiz = () => {
    const finalScore = Math.round((score / (questions.length * 120)) * 100);
    onComplete(finalScore, region, {
      totalQuestions: questions.length,
      correctAnswers: Math.round(finalScore / 100 * questions.length),
      aiGenerated: true,
      aiStats: aiStats,
      adaptiveDifficulty: adaptiveDifficulty,
      finalPerformance: performanceContext
    });
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>🕵️ Mission Control</h3>
          <p>Preparing intelligence challenges...</p>
          <div className="loading-details">
            <span>Analyzing mission parameters</span>
            <span>Calibrating challenge difficulty</span>
            <span>Deploying unique scenarios</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-error">
        <h3>⚠️ Mission Control Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry Mission
        </button>
        <button onClick={onBack} className="back-button">
          Return to HQ
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  if (!currentQ) return null;

  return (
    <div className="quiz-container">
      {/* Mission Status Panel */}
      <div className="mission-status-panel">
        <div className="difficulty-indicator">Difficulty: {adaptiveDifficulty.toUpperCase()}</div>
        <div className="category-indicator">Category: {questionCategories[currentCategory]}</div>
      </div>

      {/* Mission Header */}
      <div className="quiz-header">
        <div className="mission-info">
          <h2>🕵️ Operation: {region.name}</h2>
          <p className="mission-context">{currentQ.spy_context}</p>
        </div>
        <div className="quiz-stats">
          <div className="stat">
            <span className="stat-label">Questions</span>
            <span className="stat-value">{currentQuestion + 1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat timer">
            <span className="stat-label">Time</span>
            <span className={`stat-value ${timeLeft <= 10 ? 'urgent' : ''}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="question-container">
        <div className="question-header">
          <h3 className="question-text">{currentQ.question}</h3>
          <div className="question-meta">
            <span className="difficulty-badge {currentQ.difficulty}">{currentQ.difficulty}</span>
            <span className="category-badge">{currentQ.category}</span>
          </div>
        </div>

        {!showResult ? (
          <div className="answers-grid">
            {currentQ.answers.map((answer, index) => (
              <button
                key={index}
                className={`answer-button ${selectedAnswer === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null || submittingAnswer}
                aria-label={`Option ${String.fromCharCode(65 + index)}: ${answer}`}
                aria-pressed={selectedAnswer === index}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (selectedAnswer === null && !submittingAnswer) {
                      handleAnswerSelect(index);
                    }
                  }
                }}
              >
                <span className="answer-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                <span className="answer-text">{answer}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="result-panel">
            <div className={`result-message ${answerResult?.correct ? 'correct' : 'incorrect'}`}>
              <div className="result-icon">
                {answerResult?.correct ? '✅' : '❌'}
              </div>
              <h4>{answerResult?.message}</h4>
              <p className="explanation">{answerResult?.explanation}</p>
              {answerResult?.educational_value && (
                <div className="educational-note">
                  <strong>Mission Intel:</strong> {answerResult.educational_value}
                </div>
              )}
            </div>

            <div className="result-actions">
              {generatingNext ? (
                <div className="generating-next">
                  <div className="loading-spinner small"></div>
                  <span>🎯 Preparing next challenge...</span>
                </div>
              ) : (
                <button className="next-button" onClick={handleNextQuestion}>
                  Continue Mission →
                </button>
              )}
              
              <button className="complete-button" onClick={completeQuiz}>
                Complete Mission
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Panel */}
      {!showResult && (
        <div className="help-panel">
          <button className="hint-button" onClick={() => alert(currentQ.hint)}>
            💡 Request Intel
          </button>
          <button className="back-button" onClick={onBack}>
            ← Abort Mission
          </button>
        </div>
      )}
    </div>
  );
}

export default AIQuizMode;