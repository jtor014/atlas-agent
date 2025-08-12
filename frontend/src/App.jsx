import { useState } from 'react'
import './App.css'
import WelcomeScreen from './components/WelcomeScreen'
import WorldMap from './components/WorldMap'
import QuizMode from './components/QuizMode'
import AIQuizMode from './components/AIQuizMode'
import UserProfile from './components/UserProfile'
import MissionBriefing from './components/MissionBriefing'
import MissionDebrief from './components/MissionDebrief'
import SignOutPage from './components/SignOutPage'
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
    sessionId: null,
    userId: null
  })

  const handleStartGame = async (agentName) => {
    try {
      // Create a new game session on the backend
      const response = await fetch('https://atlas-agent-production-4cd2.up.railway.app/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName })
      })

      if (response.ok) {
        const data = await response.json()
        setGameState(prev => ({ 
          ...prev, 
          agentName,
          sessionId: data.sessionId,
          userId: user?.id || null
        }))
        setCurrentScreen('worldmap')
      } else {
        // Fallback to local session if backend fails
        console.warn('Failed to create backend session, using local session')
        setGameState(prev => ({ 
          ...prev, 
          agentName,
          sessionId: `local_${Date.now()}`,
          userId: user?.id || null
        }))
        setCurrentScreen('worldmap')
      }
    } catch (error) {
      console.error('Error creating game session:', error)
      // Fallback to local session
      setGameState(prev => ({ 
        ...prev, 
        agentName,
        sessionId: `local_${Date.now()}`,
        userId: user?.id || null
      }))
      setCurrentScreen('worldmap')
    }
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
    
    // Save progress to backend game session if sessionId exists
    if (gameState.sessionId && !gameState.sessionId.startsWith('local_')) {
      try {
        await fetch(`https://atlas-agent-production-4cd2.up.railway.app/api/game/progress/${gameState.sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: newGameState.score,
            completedRegions: newGameState.completedRegions,
            unlockedRegions: newGameState.unlockedRegions,
            agentLevel: newGameState.agentLevel
          })
        })
      } catch (error) {
        console.error('Failed to save game progress:', error)
      }
    }
    
    // Save progress to user profile if user is logged in
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

  const handleLogout = async () => {
    setCurrentScreen('signout')
  }

  const handleBackToGame = () => {
    setCurrentScreen('welcome')
  }

  const handleStaySignedOut = () => {
    setCurrentScreen('welcome')
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
      case 'signout':
        return (
          <SignOutPage
            onBackToGame={handleBackToGame}
            onStaySignedOut={handleStaySignedOut}
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
              <UserProfile onClose={() => setShowProfile(!showProfile)} showFull={false} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {renderCurrentScreen()}
      </main>
      
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} showFull={true} onLogout={handleLogout} />
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