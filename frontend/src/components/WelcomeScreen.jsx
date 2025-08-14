import { useState, useEffect } from 'react'
import './WelcomeScreen.css'
import AgeOnboarding from './AgeOnboarding'

function WelcomeScreen({ onStartGame }) {
  const [agentName, setAgentName] = useState('')
  const [showAgeCollection, setShowAgeCollection] = useState(false)

  // Load saved agent name and check if age collection is needed
  useEffect(() => {
    const savedAgentName = localStorage.getItem('atlas_agent_name');
    if (savedAgentName) {
      setAgentName(savedAgentName);
    }
    
    // Check if we need to show age collection first
    const hasAge = localStorage.getItem('atlas_user_age');
    if (!hasAge) {
      setShowAgeCollection(true);
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
  }

  const handleAgeSkip = () => {
    // User skipped age, continue to agent registration
    setShowAgeCollection(false);
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