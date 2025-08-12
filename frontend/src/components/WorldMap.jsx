import { useState, useEffect } from 'react'
import './WorldMap.css'

function WorldMap({ gameState, onRegionSelect, onCountrySelect }) {
  const [loading, setLoading] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState(null)

  // Expanded global regions for comprehensive coverage
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
      difficulty: 'Beginner',
      description: 'Track down leads in the historic cities of Eastern Europe.',
      clue: '🏛️ Our sources report movement near the Red Square and ancient castles...',
      isUnlocked: gameState.unlockedRegions.includes('eastern-europe'),
      isCompleted: gameState.completedRegions.includes('eastern-europe'),
      nextUnlock: 'north-america',
      position: { top: '20%', left: '55%' },
      icon: '🏛️'
    },
    {
      id: 'north-america',
      name: 'North America',
      continent: 'North America',
      difficulty: 'Intermediate',
      description: 'Pursue leads across the vast landscapes of North America.',
      clue: '🗽 Reports indicate movement from the Statue of Liberty to Hollywood signs...',
      isUnlocked: gameState.unlockedRegions.includes('north-america'),
      isCompleted: gameState.completedRegions.includes('north-america'),
      nextUnlock: 'south-america',
      position: { top: '30%', left: '20%' },
      icon: '🗽'
    },
    {
      id: 'south-america',
      name: 'South America',
      continent: 'South America',
      difficulty: 'Intermediate',
      description: 'Navigate the diverse terrains from Amazon rainforest to Andes mountains.',
      clue: '⛰️ Witnesses spotted activity near Christ the Redeemer and ancient Inca ruins...',
      isUnlocked: gameState.unlockedRegions.includes('south-america'),
      isCompleted: gameState.completedRegions.includes('south-america'),
      nextUnlock: 'east-asia',
      position: { top: '55%', left: '25%' },
      icon: '⛰️'
    },
    {
      id: 'east-asia',
      name: 'East Asia',
      continent: 'Asia',
      difficulty: 'Intermediate',
      description: 'Decode ancient wisdom and modern technology in East Asia.',
      clue: '🏯 Activity reported from Tokyo skyscrapers to the Great Wall of China...',
      isUnlocked: gameState.unlockedRegions.includes('east-asia'),
      isCompleted: gameState.completedRegions.includes('east-asia'),
      nextUnlock: 'southeast-asia',
      position: { top: '25%', left: '75%' },
      icon: '🏯'
    },
    {
      id: 'southeast-asia',
      name: 'Southeast Asia',
      continent: 'Asia',
      difficulty: 'Advanced',
      description: 'Navigate the tropical archipelagos and bustling trade routes.',
      clue: '🌺 Intelligence gathered from temples of Angkor to Singapore skylines...',
      isUnlocked: gameState.unlockedRegions.includes('southeast-asia'),
      isCompleted: gameState.completedRegions.includes('southeast-asia'),
      nextUnlock: 'south-asia',
      position: { top: '40%', left: '70%' },
      icon: '🌺'
    },
    {
      id: 'south-asia',
      name: 'South Asia',
      continent: 'Asia',
      difficulty: 'Advanced',
      description: 'Uncover secrets from the Himalayas to the Indian Ocean.',
      clue: '🕌 Trail leads from the Taj Mahal to Buddhist monasteries in the mountains...',
      isUnlocked: gameState.unlockedRegions.includes('south-asia'),
      isCompleted: gameState.completedRegions.includes('south-asia'),
      nextUnlock: 'central-west-asia',
      position: { top: '35%', left: '65%' },
      icon: '🕌'
    },
    {
      id: 'central-west-asia',
      name: 'Central & West Asia',
      continent: 'Asia',
      difficulty: 'Advanced',
      description: 'Navigate the crossroads of civilizations and oil-rich territories.',
      clue: '🏛️ Movement detected from Persian ruins to modern Dubai towers...',
      isUnlocked: gameState.unlockedRegions.includes('central-west-asia'),
      isCompleted: gameState.completedRegions.includes('central-west-asia'),
      nextUnlock: 'africa',
      position: { top: '30%', left: '60%' },
      icon: '🏛️'
    },
    {
      id: 'africa',
      name: 'Africa',
      continent: 'Africa',
      difficulty: 'Expert',
      description: 'Venture into the cradle of civilization and untamed wilderness.',
      clue: '🐪 Desert winds carry rumors of activities from pyramids to Victoria Falls...',
      isUnlocked: gameState.unlockedRegions.includes('africa'),
      isCompleted: gameState.completedRegions.includes('africa'),
      nextUnlock: 'oceania',
      position: { top: '45%', left: '50%' },
      icon: '🏜️'
    },
    {
      id: 'oceania',
      name: 'Oceania',
      continent: 'Oceania',
      difficulty: 'Expert',
      description: 'The final frontier across Pacific islands and Australian outback.',
      clue: '🏄 The trail ends somewhere between Sydney Opera House and remote Pacific atolls...',
      isUnlocked: gameState.unlockedRegions.includes('oceania'),
      isCompleted: gameState.completedRegions.includes('oceania'),
      nextUnlock: null,
      position: { top: '55%', left: '80%' },
      icon: '🏄'
    }
  ]


  const handleRegionClick = (region) => {
    // AI-powered mission mode
    if (region.isUnlocked) {
      onRegionSelect(region)
    }
  }

  const getRegionClassName = (region) => {
    let className = 'region-marker'
    if (region.isCompleted) className += ' completed'
    else if (region.isUnlocked) className += ' unlocked'
    else className += ' locked'
    return className
  }

  const currentRegions = quizRegions
  const completedCount = gameState.completedRegions.length
  const unlockedCount = currentRegions.filter(r => r.isUnlocked).length
  const progressPercentage = Math.round((completedCount / currentRegions.length) * 100)

  return (
    <div className="world-map">
      <div className="map-header">
        <div className="header-top">
          <h2>🌍 Global Operations Center</h2>
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
          {currentRegions.map((region) => (
            <div
              key={region.id}
              className={getRegionClassName(region)}
              style={{
                position: 'absolute',
                top: region.position?.top,
                left: region.position?.left,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleRegionClick(region)}
              onMouseEnter={() => setHoveredRegion(region)}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <div className="region-icon">
                {region.icon || '🌍'}
              </div>
              <div className="region-label">{region.name}</div>
              
              {region.isCompleted && (
                <div className="completion-badge">✅</div>
              )}
              
              {!region.isUnlocked && (
                <div className="lock-icon">🔒</div>
              )}
            </div>
          ))}
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