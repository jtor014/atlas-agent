import { useState, useEffect } from 'react'
import './WorldMap.css'

function WorldMap({ gameState, onRegionSelect, onCountrySelect }) {
  const [showLearningMode, setShowLearningMode] = useState(false)
  const [learningRegions, setLearningRegions] = useState([])
  const [loading, setLoading] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState(null)

  // Original quiz regions
  const quizRegions = [
    {
      id: 'western-europe',
      name: 'Western Europe',
      continent: 'Europe',
      difficulty: 'Beginner',
      description: 'Investigate reports of suspicious activities in major European capitals.',
      clue: '🗼 Intelligence suggests our target was last seen near famous landmarks in the City of Light...',
      isUnlocked: gameState.unlockedRegions.includes('western-europe'),
      isCompleted: gameState.completedRegions.includes('western-europe'),
      nextUnlock: 'eastern-europe',
      position: { top: '25%', left: '45%' },
      icon: '🏰'
    },
    {
      id: 'eastern-europe',
      name: 'Eastern Europe',
      continent: 'Europe', 
      difficulty: 'Intermediate',
      description: 'Track down leads in the historic cities of Eastern Europe.',
      clue: '🏛️ Our sources report movement near the Red Square and ancient castles...',
      isUnlocked: gameState.unlockedRegions.includes('eastern-europe'),
      isCompleted: gameState.completedRegions.includes('eastern-europe'),
      nextUnlock: 'asia',
      position: { top: '20%', left: '55%' },
      icon: '🏛️'
    },
    {
      id: 'asia',
      name: 'Asia',
      continent: 'Asia',
      difficulty: 'Intermediate',
      description: 'Follow the trail to the bustling metropolises of Asia.',
      clue: '🏯 Witnesses report sightings near ancient temples and modern skyscrapers...',
      isUnlocked: gameState.unlockedRegions.includes('asia'),
      isCompleted: gameState.completedRegions.includes('asia'),
      nextUnlock: 'africa',
      position: { top: '30%', left: '75%' },
      icon: '🏯'
    },
    {
      id: 'africa',
      name: 'Africa',
      continent: 'Africa',
      difficulty: 'Advanced',
      description: 'Venture into the mysteries of ancient civilizations.',
      clue: '🐪 Desert winds carry rumors of activities near the great pyramids...',
      isUnlocked: gameState.unlockedRegions.includes('africa'),
      isCompleted: gameState.completedRegions.includes('africa'),
      nextUnlock: null,
      position: { top: '45%', left: '50%' },
      icon: '🏜️'
    }
  ]

  // Fetch learning regions from API
  useEffect(() => {
    if (showLearningMode) {
      fetchLearningRegions()
    }
  }, [showLearningMode])

  const fetchLearningRegions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3003'}/api/learning/regions`)
      if (response.ok) {
        const data = await response.json()
        setLearningRegions(data)
      }
    } catch (error) {
      console.error('Failed to fetch learning regions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegionClick = (region) => {
    if (showLearningMode) {
      // In learning mode, show countries for exploration
      if (region.countries && region.countries.length > 0) {
        onCountrySelect(region.countries[0].id) // Select first country for now
      }
    } else {
      // Original quiz mode
      if (region.isUnlocked) {
        onRegionSelect(region)
      }
    }
  }

  const getRegionClassName = (region) => {
    let className = 'region-marker'
    if (region.isCompleted) className += ' completed'
    else if (region.isUnlocked) className += ' unlocked'
    else className += ' locked'
    return className
  }

  const currentRegions = showLearningMode ? learningRegions : quizRegions
  const completedCount = gameState.completedRegions.length
  const unlockedCount = currentRegions.filter(r => showLearningMode || r.isUnlocked).length
  const progressPercentage = Math.round((completedCount / currentRegions.length) * 100)

  return (
    <div className="world-map">
      <div className="map-header">
        <div className="header-top">
          <h2>🌍 {showLearningMode ? 'Educational Exploration Center' : 'Global Operations Center'}</h2>
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${!showLearningMode ? 'active' : ''}`}
              onClick={() => setShowLearningMode(false)}
            >
              🕵️ Agent Mode
            </button>
            <button 
              className={`mode-btn ${showLearningMode ? 'active' : ''}`}
              onClick={() => setShowLearningMode(true)}
            >
              📚 Learning Mode
            </button>
          </div>
        </div>
        <div className="mission-status">
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-label">Regions Completed:</span>
              <span className="stat-value">{completedCount}/{currentRegions.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Mission Progress:</span>
              <span className="stat-value">{progressPercentage}%</span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {gameState.currentMission && (
        <div className="current-mission">
          <h3>📋 Current Assignment</h3>
          <p>{gameState.currentMission}</p>
        </div>
      )}

      <div className="map-container">
        <div className="world-map-svg">
          {/* Simplified world map background */}
          <svg viewBox="0 0 100 60" className="map-background">
            {/* Europe */}
            <path d="M 40 15 L 50 18 L 52 25 L 45 28 L 40 25 Z" fill="rgba(255,255,255,0.1)" />
            {/* Asia */}
            <path d="M 55 15 L 80 20 L 85 35 L 70 45 L 55 30 Z" fill="rgba(255,255,255,0.1)" />
            {/* Africa */}
            <path d="M 45 35 L 55 38 L 58 55 L 48 55 L 42 45 Z" fill="rgba(255,255,255,0.1)" />
            {/* North America */}
            <path d="M 15 20 L 35 18 L 38 35 L 20 40 L 12 30 Z" fill="rgba(255,255,255,0.1)" />
            {/* South America */}
            <path d="M 25 40 L 35 42 L 32 55 L 22 55 L 20 45 Z" fill="rgba(255,255,255,0.1)" />
          </svg>

          {/* Region markers */}
          {loading && showLearningMode ? (
            <div className="loading-regions">Loading educational content...</div>
          ) : (
            currentRegions.map((region) => (
              <div
                key={region.id}
                className={getRegionClassName(region)}
                style={{
                  position: 'absolute',
                  top: showLearningMode ? (region.continent === 'Europe' ? '25%' : '35%') : region.position?.top,
                  left: showLearningMode ? (region.continent === 'Europe' ? '50%' : '70%') : region.position?.left,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleRegionClick(region)}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <div className="region-icon">
                  {showLearningMode ? '🎓' : (region.icon || '🌍')}
                </div>
                <div className="region-label">{region.name}</div>
                
                {region.isCompleted && (
                  <div className="completion-badge">✅</div>
                )}
                
                {!showLearningMode && !region.isUnlocked && (
                  <div className="lock-icon">🔒</div>
                )}

                {showLearningMode && region.countries && (
                  <div className="country-count">{region.countries.length} countries</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Region tooltip */}
        {hoveredRegion && (
          <div className="region-tooltip">
            <h4>{hoveredRegion.name}</h4>
            <p className="region-difficulty">
              <span className="difficulty-badge">{hoveredRegion.difficulty}</span>
            </p>
            <p className="region-description">{hoveredRegion.description}</p>
            <div className="region-clue">
              <strong>Intelligence Report:</strong>
              <p>{hoveredRegion.clue}</p>
            </div>
            <div className="region-status">
              {hoveredRegion.isCompleted ? (
                <span className="status-completed">✅ Mission Complete</span>
              ) : hoveredRegion.isUnlocked ? (
                <span className="status-available">🎯 Available for Deployment</span>
              ) : (
                <span className="status-locked">🔒 Classified - Complete previous missions</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-icon completed">✅</span>
          <span>Mission Complete</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon available">🎯</span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon locked">🔒</span>
          <span>Classified</span>
        </div>
      </div>

      <div className="agent-status">
        <div className="status-card">
          <h4>🕵️ Agent Status</h4>
          <div className="agent-details">
            <div>Level: {gameState.agentLevel}</div>
            <div>Regions Unlocked: {unlockedCount}</div>
            <div>Current Score: {gameState.score}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorldMap