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
import AgeOnboarding from './components/AgeOnboarding'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function GameApp() {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [lastMissionScore, setLastMissionScore] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  // AI mode is now the default and only mode
  const { user, isAuthenticated, saveProgress, updateUserAge } = useAuth()
  
  // Available starting regions (beginner level)
  const startingRegions = ['western-europe', 'eastern-europe'];
  
  // Generate randomized mission sequence
  const generateRandomMissionSequence = () => {
    // All regions with their difficulty levels
    const allRegions = [
      { id: 'western-europe', difficulty: 'beginner' },
      { id: 'eastern-europe', difficulty: 'beginner' },
      { id: 'north-america', difficulty: 'intermediate' },
      { id: 'south-america', difficulty: 'intermediate' },
      { id: 'east-asia', difficulty: 'intermediate' },
      { id: 'southeast-asia', difficulty: 'advanced' },
      { id: 'south-asia', difficulty: 'advanced' },
      { id: 'central-west-asia', difficulty: 'advanced' },
      { id: 'africa', difficulty: 'expert' },
      { id: 'oceania', difficulty: 'expert' }
    ];
    
    // Group by difficulty to ensure progression
    const beginner = allRegions.filter(r => r.difficulty === 'beginner');
    const intermediate = allRegions.filter(r => r.difficulty === 'intermediate');
    const advanced = allRegions.filter(r => r.difficulty === 'advanced');
    const expert = allRegions.filter(r => r.difficulty === 'expert');
    
    // Shuffle each group
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Create randomized sequence while maintaining difficulty progression
    const sequence = [
      ...shuffleArray(beginner),
      ...shuffleArray(intermediate), 
      ...shuffleArray(advanced),
      ...shuffleArray(expert)
    ];
    
    return sequence.map(r => r.id);
  };
  
  // Generate initial random starting region
  const getRandomStartingRegion = () => {
    return startingRegions[Math.floor(Math.random() * startingRegions.length)];
  };
  
  const [gameState, setGameState] = useState({
    agentName: '',
    score: 0,
    completedRegions: [],
    unlockedRegions: [getRandomStartingRegion()],
    missionSequence: generateRandomMissionSequence(),
    currentMission: null,
    agentLevel: 'Trainee',
    sessionId: null,
    userId: null,
    aiNarrative: null,
    generatingNarrative: false
  })

  const handleStartGame = async (agentName) => {
    try {
      // Generate new randomized sequence for this game
      const newMissionSequence = generateRandomMissionSequence();
      const newStartingRegion = getRandomStartingRegion();
      
      // Create a new game session on the backend
      const response = await fetch('https://atlas-agent-production-4cd2.up.railway.app/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName })
      })

      let sessionId;
      if (response.ok) {
        const data = await response.json()
        sessionId = data.sessionId;
      } else {
        console.warn('Failed to create backend session, using local session')
        sessionId = `local_${Date.now()}`;
      }
      
      // Update game state with new randomized setup
      setGameState(prev => ({ 
        ...prev, 
        agentName,
        sessionId,
        userId: user?.id || null,
        unlockedRegions: [newStartingRegion],
        missionSequence: newMissionSequence,
        generatingNarrative: true
      }));
      
      // Generate AI narrative asynchronously
      generateAINarrative(agentName, newStartingRegion, newMissionSequence, sessionId);
      
      setCurrentScreen('worldmap')
      
    } catch (error) {
      console.error('Error creating game session:', error)
      // Fallback to local session
      const newMissionSequence = generateRandomMissionSequence();
      const newStartingRegion = getRandomStartingRegion();
      const sessionId = `local_${Date.now()}`;
      
      setGameState(prev => ({ 
        ...prev, 
        agentName,
        sessionId,
        userId: user?.id || null,
        unlockedRegions: [newStartingRegion],
        missionSequence: newMissionSequence,
        generatingNarrative: true
      }));
      
      generateAINarrative(agentName, newStartingRegion, newMissionSequence, sessionId);
      setCurrentScreen('worldmap')
    }
  }
  
  const generateAINarrative = async (agentName, startingRegion, missionSequence, sessionId) => {
    try {
      const userAge = user?.age || localStorage.getItem('atlas_user_age');
      
      const response = await fetch('https://atlas-agent-production-4cd2.up.railway.app/api/ai/generate-mission-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          startingRegion,
          missionSequence,
          userAge: userAge ? parseInt(userAge) : null,
          sessionId
        })
      });
      
      if (response.ok) {
        const narrativeData = await response.json();
        setGameState(prev => ({
          ...prev,
          aiNarrative: narrativeData.narrative,
          generatingNarrative: false
        }));
      } else {
        console.warn('Failed to generate AI narrative, using default');
        setGameState(prev => ({
          ...prev,
          generatingNarrative: false
        }));
      }
    } catch (error) {
      console.error('Error generating AI narrative:', error);
      setGameState(prev => ({
        ...prev,
        generatingNarrative: false
      }));
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
    // Determine next region from randomized sequence
    const currentIndex = gameState.missionSequence.indexOf(region.id);
    const nextRegionId = currentIndex >= 0 && currentIndex < gameState.missionSequence.length - 1 
      ? gameState.missionSequence[currentIndex + 1] 
      : null;
    
    const newGameState = {
      ...gameState,
      score: gameState.score + score * 10,
      completedRegions: [...gameState.completedRegions, region.id],
      unlockedRegions: score >= 70 && nextRegionId ? [...gameState.unlockedRegions, nextRegionId] : gameState.unlockedRegions,
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

  const handleAgeComplete = (age) => {
    // Age has been set via the AgeOnboarding component
    localStorage.setItem('atlas_age_onboarding_completed', 'true');
    setCurrentScreen('welcome')
  }

  const handleAgeSkip = () => {
    // User skipped age setup, continue without age
    localStorage.setItem('atlas_age_onboarding_completed', 'true');
    setCurrentScreen('welcome')
  }

  // Check if we need to show age onboarding  
  const shouldShowAgeOnboarding = () => {
    // Only show age onboarding when user is about to start playing (after seeing welcome)
    const hasSeenAgeOnboarding = localStorage.getItem('atlas_age_onboarding_completed');
    const localAge = localStorage.getItem('atlas_user_age');
    const hasStartedGame = localStorage.getItem('atlas_has_started_game');
    
    if (currentScreen !== 'welcome') return false;
    
    // Only show if user has indicated intent to play but hasn't set age
    if (!hasStartedGame) return false;
    
    if (isAuthenticated && user) {
      return !user.age;
    } else {
      return !hasSeenAgeOnboarding && !localAge;
    }
  }

  const renderCurrentScreen = () => {
    // Show age onboarding if user is logged in but has no age
    if (shouldShowAgeOnboarding()) {
      return (
        <AgeOnboarding
          onComplete={handleAgeComplete}
          onSkip={handleAgeSkip}
        />
      );
    }

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