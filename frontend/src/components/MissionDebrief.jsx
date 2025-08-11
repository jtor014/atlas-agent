import { useState, useEffect } from 'react';
import './MissionDebrief.css';

function MissionDebrief({ region, gameState, score, onReturnToHQ }) {
  const [debriefStep, setDebriefStep] = useState(0);
  const [showStats, setShowStats] = useState(false);

  // Enhanced debrief messages based on performance and region
  const getDebriefData = () => {
    const baseData = {
      'western-europe': {
        success_title: 'Operation: Renaissance Shadow - COMPLETED',
        failure_title: 'Operation: Renaissance Shadow - REQUIRES ADDITIONAL TRAINING',
        location: 'Western Europe',
        next_region: 'Eastern Europe',
        success_messages: [
          `Outstanding work, Agent ${gameState.agentName}. Your cultural knowledge proved invaluable in cracking their European network.`,
          'The suspects in London, Paris, and Rome have been neutralized. Their coded messages have been decrypted.',
          'Intelligence suggests the conspiracy extends eastward. Prepare for deployment to Eastern Europe.',
          'Your promotion to Senior Agent has been approved. Well done.'
        ],
        failure_messages: [
          `Agent ${gameState.agentName}, your performance in Western Europe was below operational standards.`,
          'Several suspects escaped due to insufficient cultural knowledge. This cannot happen again.',
          'Additional training is required before you can proceed to more dangerous territories.',
          'Report back to HQ for remedial cultural studies. The mission depends on your expertise.'
        ]
      },
      'eastern-europe': {
        success_title: 'Operation: Iron Curtain Echo - CLASSIFIED SUCCESS',
        failure_title: 'Operation: Iron Curtain Echo - MISSION COMPROMISED',
        location: 'Eastern Europe',
        next_region: 'Asia',
        success_messages: [
          'Exceptional work navigating the complex political landscape of Eastern Europe, Agent.',
          'The Cold War-era network has been dismantled. Moscow, Prague, and Warsaw are secure.',
          'Your understanding of Slavic cultures prevented a major international incident.',
          'Asia beckons. The dragon awaits your arrival.'
        ],
        failure_messages: [
          'Your mission in Eastern Europe has been compromised, Agent.',
          'Insufficient knowledge of regional sensitivities has endangered our contacts.',
          'The conspiracy grows stronger while our intelligence weakens.',
          'Intensive retraining is mandatory before any further deployment.'
        ]
      },
      'asia': {
        success_title: 'Operation: Dragon Protocol - LEGENDARY STATUS ACHIEVED',
        failure_title: 'Operation: Dragon Protocol - CODE RED FAILURE',
        location: 'Asia-Pacific',
        next_region: 'Africa',
        success_messages: [
          'Remarkable achievement, Agent. Few operatives successfully navigate Asian cultural complexities.',
          'From Tokyo to Mumbai, the ancient wisdom networks have been secured.',
          'Your ability to decode millennia of cultural heritage saved countless lives.',
          'One final destination remains: Africa. The source awaits.'
        ],
        failure_messages: [
          'The Dragon Protocol has failed, Agent. This is catastrophic.',
          'Your lack of cultural understanding has allowed the conspiracy to grow exponentially.',
          'Asian contacts are compromised. Trust will take years to rebuild.',
          'Immediate extraction and intensive retraining required.'
        ]
      },
      'africa': {
        success_title: 'Operation: Source Code - WORLD SAVED',
        failure_title: 'Operation: Source Code - GLOBAL CATASTROPHE AVERTED',
        location: 'Africa - The Source',
        next_region: null,
        success_messages: [
          'Incredible work, Agent. You have saved the world from a conspiracy spanning millennia.',
          'The source has been neutralized. Ancient wisdom and modern technology are no longer in the wrong hands.',
          'From the cradle of civilization, you have secured the future of humanity.',
          'Welcome to the elite ranks of Master Agents. The world owes you a debt it will never know.'
        ],
        failure_messages: [
          'The mission was not completed to full specifications, but catastrophe was avoided.',
          'The source remains partially active, but you prevented total global domination.',
          'Additional operatives will complete what you started.',
          'Your efforts, though imperfect, saved billions of lives. That is not forgotten.'
        ]
      }
    };

    return baseData[region.id] || baseData['western-europe'];
  };

  const debriefData = getDebriefData();
  const isSuccess = score >= 70; // or whatever the success threshold is
  const messages = isSuccess ? debriefData.success_messages : debriefData.failure_messages;
  const title = isSuccess ? debriefData.success_title : debriefData.failure_title;

  const nextStep = () => {
    if (debriefStep < messages.length - 1) {
      setDebriefStep(debriefStep + 1);
    } else {
      setShowStats(true);
    }
  };

  const getPerformanceRating = () => {
    if (score >= 90) return { rating: 'LEGENDARY', color: '#gold', icon: '🏆' };
    if (score >= 80) return { rating: 'EXCELLENT', color: '#4caf50', icon: '⭐' };
    if (score >= 70) return { rating: 'SATISFACTORY', color: '#2196f3', icon: '✓' };
    if (score >= 50) return { rating: 'NEEDS IMPROVEMENT', color: '#ff9800', icon: '⚠️' };
    return { rating: 'REQUIRES RETRAINING', color: '#f44336', icon: '❌' };
  };

  const performance = getPerformanceRating();

  const getNewRank = () => {
    const completed = gameState.completedRegions.length + (isSuccess ? 1 : 0);
    if (completed >= 4) return 'Master Agent';
    if (completed >= 3) return 'Elite Agent';
    if (completed >= 2) return 'Senior Agent';
    if (completed >= 1) return 'Field Agent';
    return 'Trainee';
  };

  return (
    <div className="mission-debrief">
      <div className="debrief-header">
        <div className={`status-bar ${isSuccess ? 'success' : 'failure'}`}>
          <span className="status-text">
            {isSuccess ? '✓ MISSION SUCCESS' : '⚠ MISSION INCOMPLETE'}
          </span>
        </div>
        <h1 className="debrief-title">{title}</h1>
        <div className="debrief-location">📍 {debriefData.location}</div>
      </div>

      <div className="debrief-content">
        <div className="agent-status-panel">
          <div className="agent-avatar">🕵️</div>
          <div className="agent-details">
            <div className="agent-name">Agent {gameState.agentName}</div>
            <div className="agent-rank">{getNewRank()}</div>
            <div className="mission-score">Mission Score: {score}%</div>
            <div className={`performance-rating ${performance.rating.toLowerCase()}`}>
              {performance.icon} {performance.rating}
            </div>
          </div>
        </div>

        <div className="debrief-main">
          <div className="debrief-message">
            <h3>🎯 Mission Debrief</h3>
            <div className="message-text">
              {messages[debriefStep]}
            </div>
            <div className="step-indicator">
              Message {debriefStep + 1} of {messages.length}
            </div>
          </div>

          {showStats && (
            <div className="mission-stats">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{score}%</div>
                  <div className="stat-label">Accuracy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{gameState.completedRegions.length + (isSuccess ? 1 : 0)}</div>
                  <div className="stat-label">Regions Cleared</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{gameState.score + (isSuccess ? score * 10 : 0)}</div>
                  <div className="stat-label">Total Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{getNewRank()}</div>
                  <div className="stat-label">Current Rank</div>
                </div>
              </div>

              {isSuccess && debriefData.next_region && (
                <div className="next-mission-preview">
                  <h4>🚨 Next Mission Available</h4>
                  <p>Intelligence suggests activity in <strong>{debriefData.next_region}</strong></p>
                  <p>Prepare for escalated threat levels and increased operational complexity.</p>
                </div>
              )}

              {!isSuccess && (
                <div className="retraining-notice">
                  <h4>📚 Additional Training Required</h4>
                  <p>Report to the Academy for specialized cultural studies.</p>
                  <p>Mission replay available once training objectives are met.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="debrief-controls">
        {!showStats ? (
          <button className="control-btn next-btn" onClick={nextStep}>
            Continue Debrief →
          </button>
        ) : (
          <button className="control-btn return-btn" onClick={onReturnToHQ}>
            🏢 Return to HQ
          </button>
        )}
      </div>
    </div>
  );
}

export default MissionDebrief;