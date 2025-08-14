import { useState, useEffect } from 'react'
import './WelcomeScreen.css'
import AgeOnboarding from './AgeOnboarding'

function WelcomeScreen({ onStartGame }) {
  const [agentName, setAgentName] = useState('')
  const [showIntro, setShowIntro] = useState(true)
  const [showAgeCollection, setShowAgeCollection] = useState(false)

  // Load saved agent name on component mount
  useEffect(() => {
    const savedAgentName = localStorage.getItem('atlas_agent_name');
    if (savedAgentName) {
      setAgentName(savedAgentName);
    }
  }, []);

  const handleStartMission = () => {
    if (agentName.trim()) {
      // Save agent name for persistence between sessions
      localStorage.setItem('atlas_agent_name', agentName.trim());
      // Mark that user wants to start playing (triggers age onboarding if needed)
      localStorage.setItem('atlas_has_started_game', 'true');
      onStartGame(agentName.trim())
    }
  }

  const handleAgentNameChange = (e) => {
    const newName = e.target.value;
    setAgentName(newName);
    // Save immediately as user types (for better UX)
    if (newName.trim()) {
      localStorage.setItem('atlas_agent_name', newName.trim());
    }
  }

  const handleAgeComplete = (age) => {
    // Age has been set, now proceed to agent registration
    setShowAgeCollection(false);
    setShowIntro(false);
  }

  const handleAgeSkip = () => {
    // User skipped age, continue to agent registration
    setShowAgeCollection(false);
    setShowIntro(false);
  }

  if (showIntro) {
    return (
      <div className="welcome-screen">
        <div className="intro-content">
          <div className="agency-logo">
            <span className="logo-icon">🌍</span>
            <h1>ATLAS AGENCY</h1>
            <p className="agency-tagline">Global Intelligence Division</p>
          </div>
          
          <div className="mission-briefing">
            <h2>🚨 URGENT MISSION BRIEFING</h2>
            <div className="briefing-text">
              <p>Agent, we have a situation that requires your immediate attention.</p>
              <p>Our intelligence networks have detected suspicious activities across multiple international locations. We need an agent with exceptional geography knowledge to track down these leads.</p>
              <p>Your mission: Travel the world, investigate locations, and piece together the clues to solve international cases.</p>
            </div>
            
            <div className="mission-features">
              <div className="feature">
                <span className="feature-icon">🗺️</span>
                <span>Explore 6 continents</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <span>Solve location-based puzzles</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🏆</span>
                <span>Earn agent rankings and badges</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⏱️</span>
                <span>Complete missions efficiently</span>
              </div>
            </div>
          </div>
          
          <button 
            className="accept-mission-btn"
            onClick={() => {
              // Check if user has already provided age
              const hasAge = localStorage.getItem('atlas_user_age');
              if (hasAge) {
                setShowIntro(false); // Skip age collection if already set
              } else {
                setShowAgeCollection(true); // Show age collection first
              }
            }}
          >
            🎯 Accept Mission
          </button>
        </div>
      </div>
    )
  }

  // Show age collection screen
  if (showAgeCollection) {
    return (
      <AgeOnboarding
        onComplete={handleAgeComplete}
        onSkip={handleAgeSkip}
      />
    );
  }

  return (
    <div className="welcome-screen">
      <div className="agent-registration">
        <div className="registration-header">
          <h2>🕵️ Agent Registration</h2>
          <p>Enter your agent codename to begin your first assignment</p>
        </div>
        
        <div className="registration-form">
          <div className="form-group">
            <label htmlFor="agentName">Agent Codename:</label>
            <input
              type="text"
              id="agentName"
              value={agentName}
              onChange={handleAgentNameChange}
              onKeyPress={(e) => e.key === 'Enter' && handleStartMission()}
              placeholder="Enter your codename..."
              maxLength={20}
              autoFocus
            />
          </div>
          
          <div className="agent-preview">
            {agentName && (
              <div className="preview-card">
                <div className="agent-badge">
                  <span className="badge-icon">🎖️</span>
                  <div className="badge-text">
                    <strong>Agent {agentName}</strong>
                    <span>Trainee Level</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              className="start-game-btn"
              onClick={handleStartMission}
              disabled={!agentName.trim()}
            >
              🚁 Deploy to Field
            </button>
            <button 
              className="back-btn"
              onClick={() => setShowIntro(true)}
            >
              ← Back to Briefing
            </button>
          </div>
        </div>
        
        <div className="security-notice">
          <p>🔒 All agent activities are classified and secured</p>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen