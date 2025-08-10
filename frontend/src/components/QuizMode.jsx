import { useState, useEffect } from 'react'
import './QuizMode.css'

function QuizMode({ region, gameState, onComplete, onBack }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isTimerActive, setIsTimerActive] = useState(true)

  // Sample questions - in a real app, these would come from your backend
  const questions = [
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
    },
    {
      question: "What is the smallest country in Europe?",
      answers: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
      correctAnswer: 1,
      hint: "This country is entirely surrounded by Rome, Italy"
    },
    {
      question: "Which mountain range separates Europe from Asia?",
      answers: ["Alps", "Pyrenees", "Carpathians", "Urals"],
      correctAnswer: 3,
      hint: "These mountains run north-south through Russia"
    },
    {
      question: "What is the currency used in most European Union countries?",
      answers: ["Pound", "Euro", "Franc", "Mark"],
      correctAnswer: 1,
      hint: "Introduced in 1999, this currency replaced many national currencies"
    }
  ]

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

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex)
    setShowResult(true)
    setIsTimerActive(false)
    
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer
    if (isCorrect) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(30)
      setIsTimerActive(true)
    } else {
      // Quiz completed
      const finalScore = Math.round((score / questions.length) * 100)
      onComplete(finalScore, region)
    }
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const isCorrect = selectedAnswer === currentQ.correctAnswer

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
                onClick={() => !showResult && handleAnswerSelect(index)}
                disabled={showResult}
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
                <p><strong>Agent Intel:</strong> {currentQ.hint}</p>
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