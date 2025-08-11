import { useState, useEffect } from 'react';
import './MissionBriefing.css';

function MissionBriefing({ region, gameState, onStartMission, onBack }) {
  const [briefingStep, setBriefingStep] = useState(0);

  // Enhanced mission briefings for each region
  const missionData = {
    'western-europe': {
      title: 'Operation: Renaissance Shadow',
      threat_level: 'MODERATE',
      location: 'Western Europe',
      briefing: [
        'Agent, we have a situation. Intelligence reports suggest a shadowy organization is using European cultural landmarks to hide encrypted messages.',
        'Your mission: Infiltrate major European capitals and gather intelligence. Use your knowledge of geography, history, and culture to crack their codes.',
        'The suspects were last seen near the Eiffel Tower, but they could be anywhere from London to Rome by now.',
        'Remember: Blend in with the locals. Knowledge is your weapon. Trust no one.'
      ],
      objectives: [
        'Gather intelligence from 5 major European cities',
        'Decode cultural references and historical clues',
        'Maintain cover by demonstrating local knowledge',
        'Score 70% or higher to unlock the next region'
      ],
      equipment: ['Cultural Knowledge Database', 'Historical Timeline Analyzer', 'Language Translation Device'],
      contacts: ['Agent Mueller (Berlin)', 'Operative Dubois (Paris)', 'Asset Romano (Rome)'],
      time_limit: '30 seconds per intelligence query',
      success_criteria: 'Minimum 70% accuracy to proceed'
    },
    'eastern-europe': {
      title: 'Operation: Iron Curtain Echo',
      threat_level: 'HIGH',
      location: 'Eastern Europe',
      briefing: [
        'Excellent work in Western Europe, Agent. The trail has led us eastward into more dangerous territory.',
        'Our targets have connections to Cold War-era spy networks still operating in Eastern Europe.',
        'Your mission: Navigate the complex political and cultural landscape from Moscow to Prague.',
        'Warning: This region has a history of secrets. One wrong move could compromise the entire operation.'
      ],
      objectives: [
        'Investigate former Soviet territories',
        'Decode Slavic cultural references',
        'Navigate sensitive historical topics',
        'Achieve 75% accuracy for mission success'
      ],
      equipment: ['Soviet History Database', 'Cyrillic Decoder', 'Political Sensitivity Analyzer'],
      contacts: ['Dimitri Volkov (Moscow)', 'Anya Petrov (Prague)', 'Viktor Kozlov (Warsaw)'],
      time_limit: '25 seconds per intelligence query',
      success_criteria: 'Minimum 75% accuracy required'
    },
    'asia': {
      title: 'Operation: Dragon Protocol',
      threat_level: 'CRITICAL',
      location: 'Asia-Pacific Region',
      briefing: [
        'The conspiracy reaches into Asia, Agent. This is where it gets truly dangerous.',
        'Ancient traditions hide modern secrets. From Tokyo skyscrapers to ancient temples, nothing is as it seems.',
        'Your mission: Decode messages hidden in cultural traditions spanning thousands of years.',
        'Caution: You are now in the heart of the operation. Expect sophisticated countermeasures.'
      ],
      objectives: [
        'Infiltrate major Asian metropolitan areas',
        'Understand complex cultural hierarchies',
        'Decode ancient symbols with modern meanings',
        'Maintain 80% accuracy under pressure'
      ],
      equipment: ['Ancient Wisdom Database', 'Kanji/Hanzi Translator', 'Cultural Protocol Guide'],
      contacts: ['Agent Tanaka (Tokyo)', 'Li Wei (Beijing)', 'Priya Sharma (Mumbai)'],
      time_limit: '20 seconds per intelligence query',
      success_criteria: 'Minimum 80% accuracy - failure is not an option'
    },
    'africa': {
      title: 'Operation: Source Code',
      threat_level: 'MAXIMUM',
      location: 'African Continent',
      briefing: [
        'This is it, Agent. The final piece of the puzzle lies in the cradle of civilization.',
        'The conspiracy originated here, where humanity itself began. Ancient wisdom meets cutting-edge technology.',
        'Your mission: Uncover the source of the global network and neutralize the threat permanently.',
        'This is your final test. Everything you have learned must be applied here. The world is counting on you.'
      ],
      objectives: [
        'Navigate diverse cultural landscapes',
        'Understand the connection between ancient and modern',
        'Locate and neutralize the source of the conspiracy',
        'Achieve perfect mission execution (85%+)'
      ],
      equipment: ['Complete Cultural Archive', 'Linguistic Analysis Suite', 'Historical Cross-Reference Matrix'],
      contacts: ['Dr. Amara Okafor (Lagos)', 'Hassan Al-Rashid (Cairo)', 'Nomsa Mthembu (Cape Town)'],
      time_limit: '15 seconds per intelligence query',
      success_criteria: '85% accuracy required - The fate of the operation depends on you'
    }
  };

  const currentMission = missionData[region.id] || missionData['western-europe'];

  const nextStep = () => {
    if (briefingStep < currentMission.briefing.length - 1) {
      setBriefingStep(briefingStep + 1);
    } else {
      onStartMission();
    }
  };

  const skipBriefing = () => {
    onStartMission();
  };

  return (
    <div className="mission-briefing">
      <div className="briefing-header">
        <div className="classification-bar">
          <span className="classification">TOP SECRET</span>
          <span className="threat-level">THREAT LEVEL: {currentMission.threat_level}</span>
        </div>
        <h1 className="mission-title">{currentMission.title}</h1>
        <div className="mission-location">📍 {currentMission.location}</div>
      </div>

      <div className="briefing-content">
        <div className="agent-status">
          <div className="agent-avatar">🕵️</div>
          <div className="agent-info">
            <div className="agent-name">Agent {gameState.agentName}</div>
            <div className="agent-level">{gameState.agentLevel}</div>
            <div className="mission-count">Missions Completed: {gameState.completedRegions.length}</div>
          </div>
        </div>

        <div className="briefing-main">
          <div className="briefing-text">
            <h3>🎯 Mission Briefing</h3>
            <div className="typewriter-text">
              {currentMission.briefing[briefingStep]}
            </div>
            <div className="step-indicator">
              Step {briefingStep + 1} of {currentMission.briefing.length}
            </div>
          </div>

          {briefingStep === currentMission.briefing.length - 1 && (
            <div className="mission-details">
              <div className="details-section">
                <h4>🎯 Objectives</h4>
                <ul>
                  {currentMission.objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div className="details-section">
                <h4>🛠️ Equipment Provided</h4>
                <ul>
                  {currentMission.equipment.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="details-section">
                <h4>📡 Field Contacts</h4>
                <ul>
                  {currentMission.contacts.map((contact, idx) => (
                    <li key={idx}>{contact}</li>
                  ))}
                </ul>
              </div>

              <div className="mission-parameters">
                <div className="parameter">
                  <strong>⏱️ Time Limit:</strong> {currentMission.time_limit}
                </div>
                <div className="parameter">
                  <strong>🎯 Success Criteria:</strong> {currentMission.success_criteria}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="briefing-controls">
        <button className="control-btn back-btn" onClick={onBack}>
          ← Return to HQ
        </button>
        
        {briefingStep < currentMission.briefing.length - 1 ? (
          <button className="control-btn next-btn" onClick={nextStep}>
            Continue Briefing →
          </button>
        ) : (
          <button className="control-btn mission-btn" onClick={onStartMission}>
            🚁 Deploy to Mission Zone
          </button>
        )}

        <button className="control-btn skip-btn" onClick={skipBriefing}>
          ⚡ Skip Briefing
        </button>
      </div>
    </div>
  );
}

export default MissionBriefing;