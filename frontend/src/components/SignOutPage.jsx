import React, { useState, useEffect } from 'react';
import './SignOutPage.css';

function SignOutPage({ onBackToGame, onStaySignedOut }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onStaySignedOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStaySignedOut]);

  return (
    <div className="signout-page">
      <div className="signout-container">
        <div className="signout-header">
          <div className="signout-icon">🕵️‍♂️</div>
          <h1>Mission Debriefing Complete</h1>
          <p className="signout-subtitle">Agent, you've been signed out successfully</p>
        </div>

        <div className="signout-content">
          <div className="mission-summary">
            <h2>🎯 Agent Status Report</h2>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-icon">✅</span>
                <span>All mission data secured</span>
              </div>
              <div className="status-item">
                <span className="status-icon">🔒</span>
                <span>Account credentials protected</span>
              </div>
              <div className="status-item">
                <span className="status-icon">💾</span>
                <span>Progress automatically saved</span>
              </div>
              <div className="status-item">
                <span className="status-icon">🌍</span>
                <span>Ready for next deployment</span>
              </div>
            </div>
          </div>

          <div className="signout-message">
            <h3>🚀 What's Next?</h3>
            <p>Your mission progress has been securely saved to HQ servers. You can:</p>
            <ul>
              <li>Continue as a guest agent with limited features</li>
              <li>Sign back in anytime to access your full agent profile</li>
              <li>Resume missions where you left off</li>
            </ul>
          </div>

          <div className="auto-redirect">
            <p>Automatically returning to operations center in <strong>{countdown}</strong> seconds...</p>
            <div className="countdown-bar">
              <div 
                className="countdown-fill" 
                style={{ width: `${(countdown / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="signout-actions">
          <button className="primary-btn" onClick={onBackToGame}>
            🎮 Continue as Guest Agent
          </button>
          <button className="secondary-btn" onClick={onStaySignedOut}>
            🏠 Return to Main Menu
          </button>
        </div>

        <div className="signout-footer">
          <p>Thank you for your service, Agent. Until next time...</p>
          <div className="footer-divider">• • •</div>
          <p className="atlas-branding">🌍 Atlas Agent Command</p>
        </div>
      </div>
    </div>
  );
}

export default SignOutPage;