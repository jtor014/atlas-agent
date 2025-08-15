import { useState, useEffect } from 'react'
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
  const { user, isAuthenticated, needsRegistration, saveProgress, updateUserAge } = useAuth()
  
  // All available regions - players can start anywhere!
  const allRegions = [
    { id: 'western-europe', difficulty: 'beginner', name: 'Western Europe' },
    { id: 'eastern-europe', difficulty: 'beginner', name: 'Eastern Europe' },
    { id: 'north-america', difficulty: 'intermediate', name: 'North America' },
    { id: 'south-america', difficulty: 'intermediate', name: 'South America' },
    { id: 'east-asia', difficulty: 'intermediate', name: 'East Asia' },
    { id: 'southeast-asia', difficulty: 'advanced', name: 'Southeast Asia' },
    { id: 'south-asia', difficulty: 'advanced', name: 'South Asia' },
    { id: 'central-west-asia', difficulty: 'advanced', name: 'Central & West Asia' },
    { id: 'africa', difficulty: 'expert', name: 'Africa' },
    { id: 'oceania', difficulty: 'expert', name: 'Oceania' }
  ];
  
  // Generate randomized mission sequence starting from any region
  const generateRandomMissionSequence = (startingRegionId = null) => {
    // Shuffle all regions
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    let shuffledRegions = shuffleArray([...allRegions]);
    
    // If a specific starting region is provided, put it first
    if (startingRegionId) {
      shuffledRegions = shuffledRegions.filter(r => r.id !== startingRegionId);
      const startingRegion = allRegions.find(r => r.id === startingRegionId);
      if (startingRegion) {
        shuffledRegions.unshift(startingRegion);
      }
    }
    
    return shuffledRegions.map(r => r.id);
  };
  
  // Generate initial random starting region from any available region
  const getRandomStartingRegion = () => {
    return allRegions[Math.floor(Math.random() * allRegions.length)].id;
  };
  
  // Initialize gameState with session management
  const initializeGameState = () => {
    const tempSession = sessionStorage.getItem('atlas_temp_session');
    const isAuthenticated = localStorage.getItem('atlas_token');
    
    // Agent names are persistent for ALL users (authenticated or not)
    // Only cleared when explicitly starting a new game
    const agentName = localStorage.getItem('atlas_agent_name') || '';
    
    // Try to restore existing game session
    const savedGameState = isAuthenticated ? 
      localStorage.getItem('atlas_game_state') : 
      sessionStorage.getItem('atlas_game_state');
    
    if (savedGameState) {
      try {
        const parsed = JSON.parse(savedGameState);
        // Restore saved game state but ensure we have current user data
        return {
          ...parsed,
          agentName: agentName || parsed.agentName,
          userId: user?.id || null,
          userAge: user?.age || localStorage.getItem('atlas_user_age') || parsed.userAge
        };
      } catch (error) {
        console.warn('Failed to parse saved game state:', error);
      }
    }
    
    // Create new game state
    const startingRegion = getRandomStartingRegion();
    const missionSequence = generateRandomMissionSequence(startingRegion);
    
    return {
      agentName,
      score: 0,
      completedRegions: [],
      unlockedRegions: [startingRegion],
      missionSequence,
      currentMission: null,
      agentLevel: 'Trainee',
      sessionId: null,
      userId: null,
      userAge: null,
      aiNarrative: null,
      generatingNarrative: false
    };
  };

  const [gameState, setGameState] = useState(initializeGameState())

  // Save game state when it changes
  useEffect(() => {
    if (gameState.missionSequence.length > 0) {
      const stateToSave = JSON.stringify(gameState);
      if (isAuthenticated) {
        localStorage.setItem('atlas_game_state', stateToSave);
      } else if (sessionStorage.getItem('atlas_temp_session')) {
        sessionStorage.setItem('atlas_game_state', stateToSave);
      }
    }
  }, [gameState, isAuthenticated]);

  // Update gameState when user age changes
  useEffect(() => {
    const currentAge = user?.age || localStorage.getItem('atlas_user_age') || null;
    if (currentAge !== gameState.userAge) {
      setGameState(prev => ({
        ...prev,
        userAge: currentAge ? parseInt(currentAge) : null
      }));
    }
  }, [user?.age, gameState.userAge]);

  const handleStartGame = async (agentName) => {
    try {
      // Clear any existing game state for fresh start
      localStorage.removeItem('atlas_game_state');
      sessionStorage.removeItem('atlas_game_state');
      
      // Generate new randomized starting region and sequence
      const newStartingRegion = getRandomStartingRegion();
      const newMissionSequence = generateRandomMissionSequence(newStartingRegion);
      
      // Create session - permanent if Google authenticated, temporary otherwise
      let sessionId;
      if (isAuthenticated && user) {
        // Create permanent session on backend for authenticated users
        const response = await fetch('https://atlas-agent-production-4cd2.up.railway.app/api/game/start', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('atlas_token')}`
          },
          body: JSON.stringify({ agentName })
        });

        if (response.ok) {
          const data = await response.json()
          sessionId = data.sessionId;
        } else {
          console.warn('Failed to create backend session, using local session')
          sessionId = `local_${Date.now()}`;
        }
      } else {
        // Create temporary local session for non-authenticated users
        sessionId = `temp_${Date.now()}`;
        // Mark session as temporary - will clear on browser close
        sessionStorage.setItem('atlas_temp_session', sessionId);
      }
      
      // Save agent name for ALL users (authenticated and non-authenticated)
      localStorage.setItem('atlas_agent_name', agentName);
      
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
      // Fallback to temporary session
      const newStartingRegion = getRandomStartingRegion();
      const newMissionSequence = generateRandomMissionSequence(newStartingRegion);
      const sessionId = `temp_${Date.now()}`;
      
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
        agentLevel: newGameState.agentLevel,
        // Session-specific data for proper incremental updates
        sessionQuestions: quizData.totalQuestions || 0,
        sessionCorrect: quizData.correctAnswers || 0
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

  const renderCurrentScreen = () => {
    // If user is authenticated and has completed setup, go directly to map
    if (isAuthenticated && user && user.age) {
      if (currentScreen === 'welcome' || currentScreen === 'age') {
        setCurrentScreen('worldmap');
        return null; // Will re-render with worldmap
      }
    }
    
    // If not authenticated but has temporary session data, show map
    if (!isAuthenticated && gameState.agentName && (localStorage.getItem('atlas_user_age') || gameState.userAge)) {
      if (currentScreen === 'welcome') {
        setCurrentScreen('worldmap');
        return null; // Will re-render with worldmap  
      }
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