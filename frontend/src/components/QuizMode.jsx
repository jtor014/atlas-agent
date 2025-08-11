import { useState, useEffect } from 'react'
import './QuizMode.css'

const API_BASE_URL = 'https://atlas-agent-production-4cd2.up.railway.app'

function QuizMode({ region, gameState, onComplete, onBack }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [answerResult, setAnswerResult] = useState(null)

  // Fetch questions from backend
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/questions/region/${region.id}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch questions: ${response.status}`)
        }
        const data = await response.json()
        // Transform API data to match frontend expectations
        const transformedQuestions = data.questions.map(q => ({
          id: q.id,
          question: q.question,
          answers: q.options, // API uses 'options', frontend expects 'answers'
          correctAnswer: null, // Will be determined by API call
          hint: "Submit your answer to see the explanation",
          difficulty: q.difficulty,
          region: q.region
        }))
        setQuestions(transformedQuestions)
        setError(null)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError(err.message)
        // Fallback questions if API fails
        setQuestions([
          {
            question: "What is the capital of France?",
            answers: ["London", "Paris", "Rome", "Berlin"],
            correctAnswer: 1,
            hint: "Known as the 'City of Light', home to the Eiffel Tower"
          },
          {
            question: "Which river runs through London?",
            answers: ["Seine", "Rhine", "Thames", "Danube"],
            correctAnswer: 2,
            hint: "This river is famous for the Tower Bridge that spans across it"
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    if (region && region.id) {
      fetchQuestions()
    }
  }, [region])

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      // Time's up - treat as wrong answer
      handleAnswerSelect(null)
    }
  }, [timeLeft, isTimerActive, showResult])

  const handleAnswerSelect = async (answerIndex) => {
    if (submittingAnswer) return
    
    setSelectedAnswer(answerIndex)
    setIsTimerActive(false)
    setSubmittingAnswer(true)
    
    try {
      const currentQ = questions[currentQuestion]
      const selectedAnswerText = answerIndex !== null ? currentQ.answers[answerIndex] : null
      
      const response = await fetch(`${API_BASE_URL}/api/questions/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQ.id,
          answer: selectedAnswerText
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to submit answer: ${response.status}`)
      }
      
      const result = await response.json()
      setAnswerResult(result)
      
      // Update score if correct
      if (result.correct) {
        setScore(score + 1)
      }
      
      // Update the question with the correct answer for display
      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestion].correctAnswer = currentQ.answers.indexOf(result.correctAnswer)
      updatedQuestions[currentQuestion].hint = result.explanation
      setQuestions(updatedQuestions)
      
    } catch (err) {
      console.error('Error submitting answer:', err)
      // Fallback behavior
      setAnswerResult({
        correct: false,
        explanation: 'Error checking answer. Please try again.'
      })
    } finally {
      setSubmittingAnswer(false)
      setShowResult(true)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(30)
      setIsTimerActive(true)
      setAnswerResult(null)
    } else {
      // Quiz completed
      const finalScore = Math.round((score / questions.length) * 100)
      const quizData = {
        totalQuestions: questions.length,
        correctAnswers: score
      }
      onComplete(finalScore, region, quizData)
    }
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const isCorrect = answerResult ? answerResult.correct : false

  if (loading) {
    return (
      <div className="quiz-mode">
        <div className="quiz-header">
          <div className="mission-info">
            <h2>🎯 Loading Mission: {region.name}</h2>
            <p className="loading-message">🔄 Retrieving intelligence data...</p>
          </div>
          <div className="quiz-controls">
            <button className="back-btn" onClick={onBack}>
              ← Return to Map
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="quiz-mode">
        <div className="quiz-header">
          <div className="mission-info">
            <h2>⚠️ Mission: {region.name}</h2>
            <p className="error-message">
              {error ? `Error: ${error}` : 'No questions available for this region'}
              {error && <br />}
              <em>Using fallback training questions.</em>
            </p>
          </div>
          <div className="quiz-controls">
            <button className="back-btn" onClick={onBack}>
              ← Return to Map
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-mode">
      <div className="quiz-header">
        <div className="mission-info">
          <h2>🎯 Mission: {region.name}</h2>
          <p className="mission-briefing">{region.description}</p>
        </div>
        
        <div className="quiz-controls">
          <button className="back-btn" onClick={onBack}>
            ← Return to Map
          </button>
          <div className="agent-score">
            Agent {gameState.agentName} | Score: {gameState.score}
          </div>
        </div>
      </div>

      <div className="quiz-progress">
        <div className="progress-info">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span className="current-score">{score}/{questions.length} correct</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="quiz-container">
        <div className="intelligence-report">
          <div className="report-header">
            <h3>📋 Intelligence Report</h3>
            <div className="timer">
              <span className={`time-remaining ${timeLeft <= 10 ? 'urgent' : ''}`}>
                ⏱️ {timeLeft}s
              </span>
            </div>
          </div>
          <div className="region-clue">
            <p><strong>Field Report:</strong> {region.clue}</p>
          </div>
        </div>

        <div className="question-card">
          <div className="question-header">
            <h3>Question {currentQuestion + 1}</h3>
            <div className="difficulty-badge">{region.difficulty}</div>
          </div>
          
          <div className="question-text">
            {currentQ.question}
          </div>

          <div className="answers-container">
            {currentQ.answers.map((answer, index) => (
              <button
                key={index}
                className={`answer-btn ${
                  showResult && index === currentQ.correctAnswer ? 'correct' : ''
                } ${
                  showResult && index === selectedAnswer && index !== currentQ.correctAnswer ? 'incorrect' : ''
                } ${
                  selectedAnswer === index ? 'selected' : ''
                }`}
                onClick={() => !showResult && !submittingAnswer && handleAnswerSelect(index)}
                disabled={showResult || submittingAnswer}
              >
                <span className="answer-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="answer-text">{answer}</span>
              </button>
            ))}
          </div>

          {showResult && (
            <div className="result-panel">
              <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? (
                  <div className="success-result">
                    <span className="result-icon">🎉</span>
                    <span className="result-text">Excellent detective work!</span>
                  </div>
                ) : (
                  <div className="failure-result">
                    <span className="result-icon">❌</span>
                    <span className="result-text">
                      {selectedAnswer === null ? "Time's up!" : "Not quite right."}
                    </span>
                  </div>
                )}
              </div>

              <div className="hint-section">
                <p><strong>Agent Intel:</strong> {answerResult ? answerResult.explanation : currentQ.hint}</p>
              </div>

              <button 
                className="next-btn"
                onClick={handleNextQuestion}
              >
                {currentQuestion < questions.length - 1 ? (
                  <>🔍 Next Lead</>
                ) : (
                  <>📊 Complete Mission</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mission-status">
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-icon">🎯</span>
            <span>Accuracy: {questions.length > 0 ? Math.round((score / (currentQuestion + (showResult ? 1 : 0))) * 100) || 0 : 0}%</span>
          </div>
          <div className="status-item">
            <span className="status-icon">⚡</span>
            <span>Speed: {timeLeft > 20 ? 'Excellent' : timeLeft > 10 ? 'Good' : 'Urgent'}</span>
          </div>
          <div className="status-item">
            <span className="status-icon">🏆</span>
            <span>Level: {gameState.agentLevel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizMode