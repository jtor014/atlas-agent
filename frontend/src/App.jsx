import { useState } from 'react'
import './App.css'
import WelcomeScreen from './components/WelcomeScreen'
import WorldMap from './components/WorldMap'
import QuizMode from './components/QuizMode'
import AIQuizMode from './components/AIQuizMode'
import UserProfile from './components/UserProfile'
import MissionBriefing from './components/MissionBriefing'
import MissionDebrief from './components/MissionDebrief'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function GameApp() {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [lastMissionScore, setLastMissionScore] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  // AI mode is now the default and only mode
  const { user, isAuthenticated, saveProgress } = useAuth()
  
  const [gameState, setGameState] = useState({
    agentName: '',
    score: 0,
    completedRegions: [],
    unlockedRegions: ['western-europe'],
    currentMission: null,
    agentLevel: 'Trainee',
    sessionId: `session_${Date.now()}`,
    userId: null
  })

  const handleStartGame = (agentName) => {
    setGameState(prev => ({ ...prev, agentName }))
    setCurrentScreen('worldmap')
  }

  const handleRegionSelect = (region) => {
    setSelectedRegion(region)
    setGameState(prev => ({ 
      ...prev, 
      currentMission: `Intelligence Operation in ${region.name}`,
      userId: user?.id || null
    }))
    setCurrentScreen('briefing')
  }

  const handleStartMission = () => {
    setCurrentScreen('quiz')
  }

  const handleQuizComplete = async (score, region, quizData) => {
    const newGameState = {
      ...gameState,
      score: gameState.score + score * 10,
      completedRegions: [...gameState.completedRegions, region.id],
      unlockedRegions: score >= 70 ? [...gameState.unlockedRegions, region.nextUnlock] : gameState.unlockedRegions,
      agentLevel: getNewAgentLevel([...gameState.completedRegions, region.id].length)
    }
    
    setGameState(newGameState)
    setLastMissionScore(score)
    
    // Save progress to backend if user is logged in
    if (isAuthenticated && user) {
      const progressData = {
        score: newGameState.score,
        completedRegions: newGameState.completedRegions,
        unlockedRegions: newGameState.unlockedRegions,
        totalQuestions: quizData.totalQuestions,
        correctAnswers: quizData.correctAnswers,
        agentLevel: newGameState.agentLevel
      }
      
      await saveProgress(progressData)
    }
    
    setCurrentScreen('debrief')
  }

  const getNewAgentLevel = (completedCount) => {
    if (completedCount >= 4) return 'Master Agent'
    if (completedCount >= 3) return 'Elite Agent'
    if (completedCount >= 2) return 'Senior Agent'
    if (completedCount >= 1) return 'Field Agent'
    return 'Trainee'
  }

  const handleReturnToHQ = () => {
    setCurrentScreen('worldmap')
  }

  const renderCurrentScreen = () => {
    switch(currentScreen) {
      case 'welcome':
        return <WelcomeScreen onStartGame={handleStartGame} />
      case 'worldmap':
        return (
          <WorldMap 
            gameState={gameState}
            onRegionSelect={handleRegionSelect}
          />
        )
      case 'briefing':
        return (
          <MissionBriefing
            region={selectedRegion}
            gameState={gameState}
            onStartMission={handleStartMission}
            onBack={() => setCurrentScreen('worldmap')}
          />
        )
      case 'quiz':
        return (
          <AIQuizMode 
            region={selectedRegion}
            gameState={gameState}
            onComplete={handleQuizComplete}
            onBack={() => setCurrentScreen('worldmap')}
          />
        )
      case 'debrief':
        return (
          <MissionDebrief
            region={selectedRegion}
            gameState={gameState}
            score={lastMissionScore}
            onReturnToHQ={handleReturnToHQ}
          />
        )
      default:
        return <WelcomeScreen onStartGame={handleStartGame} />
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="game-title">
            <span className="atlas-icon">🕵️</span>
            Atlas Agent
          </h1>
          <div className="header-info">
            {gameState.agentName && (
              <div className="agent-info">
                <span className="agent-name">Agent {gameState.agentName}</span>
                <span className="agent-level">{gameState.agentLevel}</span>
                <span className="agent-score">Score: {gameState.score}</span>
              </div>
            )}
            <div className="auth-section">
              <UserProfile onClose={() => setShowProfile(!showProfile)} showFull={false} />
            </div>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {renderCurrentScreen()}
      </main>
      
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} showFull={true} />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <GameApp />
    </AuthProvider>
  )
}

export default App