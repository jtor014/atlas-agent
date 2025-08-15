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

      // Generate story-driven question sequence instead of individual questions
      const storyResponse = await fetch(`${API_BASE_URL}/api/ai/generate-story-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: region.id,
          agentName: gameState.agentName || 'Agent',
          userAge: gameState.userAge,
          sessionId: gameState.sessionId,
          previousRegions: gameState.completedRegions
        })
      });

      if (storyResponse.ok) {
        const storyData = await storyResponse.json();
        console.log('📚 Generated story sequence:', storyData.story_path);
        
        if (storyData.story_sequence && storyData.story_sequence.length > 0) {
          // Transform backend data structure to match frontend expectations
          const transformedQuestions = storyData.story_sequence.map(q => ({
            ...q,
            answers: q.options || q.answers, // Backend uses 'options', frontend expects 'answers'
            id: q.id || `story_${Date.now()}_${Math.random()}`
          }));
          
          console.log('📚 Transformed questions:', transformedQuestions);
          setQuestions(transformedQuestions);
          setCurrentQuestion(0);
          startTimer();
          
          // Update AI stats
          setAiStats(prev => ({
            questionsGenerated: prev.questionsGenerated + storyData.story_sequence.length,
            totalCost: prev.totalCost + (storyData.generation_cost || 0),
            adaptiveAdjustments: prev.adaptiveAdjustments
          }));
        } else {
          throw new Error('No story questions generated');
        }
      } else {
        // Fallback to original individual question generation
        console.warn('Story sequence generation failed, falling back to individual questions');
        const firstQuestion = await generateAIQuestion({
          region: region.id,
          category: questionCategories[0],
          difficulty: adaptiveDifficulty
        });

        if (firstQuestion) {
          const transformedQuestion = {
            ...firstQuestion,
            answers: firstQuestion.options || firstQuestion.answers,
            id: firstQuestion.id || `fallback_${Date.now()}`
          };
          setQuestions([transformedQuestion]);
          setCurrentQuestion(0);
          startTimer();
        } else {
          console.error('❌ Critical: Both story sequence and individual question generation failed');
          // Use hardcoded fallback as last resort
          const hardcodedQuestion = {
            id: 'hardcoded_fallback',
            question: `What is the capital city of ${region.name}?`,
            answers: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            hint: 'Think about the major political center of this region.',
            explanation: 'This is a basic geography question to test the quiz system.',
            difficulty: 'easy',
            region: region.id,
            category: 'Basic Geography',
            spy_context: `Mission briefing requires knowledge of ${region.name}`,
            educational_value: 'Understanding capital cities is fundamental for agents.'
          };
          
          setQuestions([hardcodedQuestion]);
          setCurrentQuestion(0);
          startTimer();
        }
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
    console.log('🕐 Starting timer...');
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
    
    console.log(`🕐 Timer set to ${timerSeconds} seconds`);
    setTimeLeft(timerSeconds);
    setIsTimerActive(true);
  };

  // Timer countdown
  useEffect(() => {
    if (isTimerActive && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isTimerActive && !showResult) {
      handleTimeUp();
    }
  }, [timeLeft, isTimerActive, showResult]);

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
    
    // Check if we have more questions in our story sequence
    if (nextQuestionIndex < questions.length) {
      // Reset all states for next question
      setIsTimerActive(false); // Stop current timer first
      setCurrentQuestion(nextQuestionIndex);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswerResult(null);
      
      // Start timer for next question with a small delay to ensure state is reset
      setTimeout(() => {
        startTimer();
      }, 100);
    } else {
      // End of story sequence - complete the quiz
      console.log('📚 Story sequence completed');
      completeQuiz();
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
  console.log('🎯 Current Question:', { currentQuestion, questionsLength: questions.length, currentQ });
  
  if (!currentQ) {
    console.warn('❌ No current question available');
    return (
      <div className="quiz-container">
        <div className="loading-content">
          <h3>⚠️ No Question Available</h3>
          <p>Debug Info:</p>
          <pre>{JSON.stringify({ currentQuestion, questionsLength: questions.length }, null, 2)}</pre>
        </div>
      </div>
    );
  }

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

      {/* Story Context */}
      {currentQ.story_context && (
        <div className="story-context">
          <div className="story-header">
            <span className="story-icon">📍</span>
            <span className="location-info">
              {currentQ.location && currentQ.country ? (
                `${currentQ.location}, ${currentQ.country}`
              ) : (
                'Current Location'
              )}
            </span>
            <span className="sequence-info">Question {currentQuestion + 1} of {questions.length}</span>
          </div>
          <div className="story-narrative">
            <p>{currentQ.story_context}</p>
            {currentQ.progression_clue && (
              <div className="progression-hint">
                <span className="hint-icon">💡</span>
                <em>{currentQ.progression_clue}</em>
              </div>
            )}
          </div>
        </div>
      )}

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
          <div className="answers-container">
            {currentQ.answers && currentQ.answers.map((answer, index) => (
              <button
                key={index}
                className={`answer-btn ${selectedAnswer === index ? 'selected' : ''}`}
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