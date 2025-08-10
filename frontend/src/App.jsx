import { useState } from 'react'
import './App.css'
import WelcomeScreen from './components/WelcomeScreen'
import WorldMap from './components/WorldMap'
import QuizMode from './components/QuizMode'

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [gameState, setGameState] = useState({
    agentName: '',
    score: 0,
    completedRegions: [],
    unlockedRegions: ['Europe'],
    currentMission: null,
    agentLevel: 'Trainee'
  })

  const handleStartGame = (agentName) => {
    setGameState(prev => ({ ...prev, agentName }))
    setCurrentScreen('worldmap')
  }

  const handleRegionSelect = (region) => {
    setSelectedRegion(region)
    setGameState(prev => ({ 
      ...prev, 
      currentMission: `Investigate suspicious activity in ${region.name}` 
    }))
    setCurrentScreen('quiz')
  }

  const handleQuizComplete = (score, region) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + score,
      completedRegions: [...prev.completedRegions, region.id],
      unlockedRegions: score >= 70 ? [...prev.unlockedRegions, region.nextUnlock] : prev.unlockedRegions
    }))
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
      case 'quiz':
        return (
          <QuizMode 
            region={selectedRegion}
            gameState={gameState}
            onComplete={handleQuizComplete}
            onBack={() => setCurrentScreen('worldmap')}
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
          {gameState.agentName && (
            <div className="agent-info">
              <span className="agent-name">Agent {gameState.agentName}</span>
              <span className="agent-level">{gameState.agentLevel}</span>
              <span className="agent-score">Score: {gameState.score}</span>
            </div>
          )}
        </div>
      </header>
      
      <main className="app-main">
        {renderCurrentScreen()}
      </main>
    </div>
  )
}

export default App