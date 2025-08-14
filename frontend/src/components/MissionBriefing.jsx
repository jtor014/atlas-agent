import { useState, useEffect } from 'react';
import RegionalMultimedia from './RegionalMultimedia';
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
    'north-america': {
      title: 'Operation: Liberty Bell',
      threat_level: 'MODERATE',
      location: 'North America',
      briefing: [
        'Agent, the conspiracy has crossed the Atlantic. Our intelligence network has detected suspicious activity across North America.',
        'From the skyscrapers of New York to the tech hubs of Silicon Valley, the organization is using American innovation against us.',
        'Your mission: Navigate the vast continent from coast to coast, gathering intelligence on their North American operations.',
        'Remember: This land of opportunity has become their playground. Use your knowledge wisely.'
      ],
      objectives: [
        'Investigate major North American cities and landmarks',
        'Understand diverse regional cultures and histories',
        'Decode references to American and Canadian heritage',
        'Maintain 75% accuracy to advance eastward'
      ],
      equipment: ['Colonial History Database', 'Native American Cultural Guide', 'Modern Politics Analyzer'],
      contacts: ['Agent Johnson (Washington)', 'Operative Smith (Toronto)', 'Asset Rodriguez (Mexico City)'],
      time_limit: '28 seconds per intelligence query',
      success_criteria: 'Minimum 75% accuracy to proceed'
    },
    'south-america': {
      title: 'Operation: Condor\'s Flight',
      threat_level: 'HIGH',
      location: 'South America',
      briefing: [
        'The trail leads south, Agent. South America\'s diverse landscapes hide more than ancient ruins.',
        'From the Amazon rainforest to the Andes peaks, our adversaries are using the continent\'s natural barriers.',
        'Your mission: Navigate through vibrant cultures and complex histories from Brazil to Argentina.',
        'Caution: The terrain is challenging, but the people\'s stories hold the keys to victory.'
      ],
      objectives: [
        'Explore diverse South American cultures and geographies',
        'Understand colonial and indigenous heritage',
        'Navigate complex modern political landscapes',
        'Achieve 75% accuracy for mission success'
      ],
      equipment: ['Pre-Columbian Archive', 'Rainforest Navigation System', 'Latin American Politics Brief'],
      contacts: ['Agent Silva (Rio de Janeiro)', 'Dr. Morales (Lima)', 'Captain Fernandez (Buenos Aires)'],
      time_limit: '26 seconds per intelligence query',
      success_criteria: 'Minimum 75% accuracy required'
    },
    'east-asia': {
      title: 'Operation: Rising Sun Protocol',
      threat_level: 'HIGH',
      location: 'East Asia',
      briefing: [
        'Welcome to East Asia, Agent. Here, ancient wisdom meets cutting-edge technology.',
        'The conspiracy runs deep through the region\'s interconnected economies and shared histories.',
        'Your mission: Decode secrets from the Great Wall to Tokyo\'s neon-lit streets.',
        'Warning: Centuries of tradition mask modern espionage networks. Stay alert.'
      ],
      objectives: [
        'Navigate complex East Asian cultural relationships',
        'Understand ancient philosophies and modern innovations',
        'Decode references to shared histories and conflicts',
        'Maintain 80% accuracy under increasing pressure'
      ],
      equipment: ['Confucian Philosophy Guide', 'Modern Tech Analysis Tool', 'Diplomatic Relations Database'],
      contacts: ['Agent Yamamoto (Tokyo)', 'Dr. Chen (Beijing)', 'Captain Kim (Seoul)'],
      time_limit: '24 seconds per intelligence query',
      success_criteria: 'Minimum 80% accuracy - precision is crucial'
    },
    'southeast-asia': {
      title: 'Operation: Monsoon Network',
      threat_level: 'CRITICAL',
      location: 'Southeast Asia',
      briefing: [
        'The monsoon winds carry more than rain, Agent. Southeast Asia\'s strategic position makes it vital.',
        'Island nations and mainland powers hide sophisticated networks in plain sight.',
        'Your mission: Navigate the archipelagos and river deltas where ancient trade routes still pulse.',
        'Danger: The region\'s diversity is both your greatest asset and biggest challenge.'
      ],
      objectives: [
        'Master the complex tapestry of Southeast Asian cultures',
        'Understand maritime trade and colonial legacies',
        'Navigate religious and ethnic diversity',
        'Achieve 80% accuracy for advancement'
      ],
      equipment: ['Maritime Trade Archives', 'Religious Diversity Guide', 'Colonial History Decoder'],
      contacts: ['Agent Lim (Singapore)', 'Dr. Nguyen (Ho Chi Minh City)', 'Captain Sutanto (Jakarta)'],
      time_limit: '22 seconds per intelligence query',
      success_criteria: 'Minimum 80% accuracy required'
    },
    'south-asia': {
      title: 'Operation: Monsoon Crown',
      threat_level: 'CRITICAL',
      location: 'South Asia',
      briefing: [
        'South Asia awaits, Agent. From the Himalayas to the Indian Ocean, ancient civilizations guard modern secrets.',
        'The subcontinent\'s billion-plus population hides our targets in plain sight.',
        'Your mission: Navigate through layers of history, from the Indus Valley to the digital age.',
        'Challenge: Religious diversity and political complexity make this our most intricate operation yet.'
      ],
      objectives: [
        'Understand South Asian religious and philosophical traditions',
        'Navigate complex colonial and independence histories',
        'Master regional geopolitics and economic relationships',
        'Maintain 85% accuracy under extreme conditions'
      ],
      equipment: ['Vedic Philosophy Database', 'Partition History Archive', 'Geopolitical Analysis Suite'],
      contacts: ['Agent Patel (Mumbai)', 'Dr. Rahman (Dhaka)', 'Major Singh (New Delhi)'],
      time_limit: '20 seconds per intelligence query',
      success_criteria: 'Minimum 85% accuracy - excellence is non-negotiable'
    },
    'central-west-asia': {
      title: 'Operation: Silk Road Revival',
      threat_level: 'MAXIMUM',
      location: 'Central & West Asia',
      briefing: [
        'The ancient Silk Road still pulses with secrets, Agent. Central and West Asia hold the keys to global power.',
        'Oil reserves and strategic positions make this region the world\'s most watched chessboard.',
        'Your mission: Navigate from Persian empires to modern oil kingdoms, from steppes to deserts.',
        'Ultimate caution: One wrong move here could destabilize global operations. Precision is everything.'
      ],
      objectives: [
        'Master the geopolitics of oil and strategic waterways',
        'Understand ancient Persian and Islamic civilizations',
        'Navigate modern Middle Eastern complexities',
        'Achieve near-perfect execution (85%+)'
      ],
      equipment: ['Persian Empire Archives', 'Oil Geopolitics Database', 'Islamic Civilization Guide'],
      contacts: ['Agent Al-Rashid (Dubai)', 'Dr. Nazarbayev (Almaty)', 'Captain Hosseini (Tehran)'],
      time_limit: '18 seconds per intelligence query',
      success_criteria: '85% accuracy required - The world is watching'
    },
    'africa': {
      title: 'Operation: Source Code',
      threat_level: 'MAXIMUM',
      location: 'African Continent',
      briefing: [
        'Africa - the cradle of civilization and our penultimate challenge, Agent.',
        'From the Sahara\'s ancient trade routes to modern megacities, the continent pulses with untold stories.',
        'Your mission: Navigate diverse cultures, from Berber traditions to Swahili commerce.',
        'The conspiracy\'s African connections run deeper than the Nile. Prepare for revelations.'
      ],
      objectives: [
        'Navigate Africa\'s incredible cultural diversity',
        'Understand ancient trade networks and colonial impacts',
        'Master contemporary African politics and economics',
        'Achieve expert-level performance (85%+)'
      ],
      equipment: ['Ancient Trade Route Maps', 'Colonial Impact Analysis', 'Modern African Politics Brief'],
      contacts: ['Dr. Amara Okafor (Lagos)', 'Hassan Al-Rashid (Cairo)', 'Nomsa Mthembu (Cape Town)'],
      time_limit: '16 seconds per intelligence query',
      success_criteria: '85% accuracy required - Almost there, Agent'
    },
    'oceania': {
      title: 'Operation: Final Horizon',
      threat_level: 'ULTIMATE',
      location: 'Oceania',
      briefing: [
        'This is it, Agent. The final frontier across the vast Pacific.',
        'From Australia\'s ancient Dreamtime to modern Pacific partnerships, every detail matters.',
        'Your mission: Navigate island cultures and continental mysteries in our ultimate test.',
        'The conspiracy ends here. Everything you\'ve learned culminates in this final operation. The world depends on you.'
      ],
      objectives: [
        'Master Pacific island cultures and Australian heritage',
        'Understand Oceanic trade and environmental challenges',
        'Navigate indigenous wisdom and modern challenges',
        'Achieve perfect mission execution (90%+)'
      ],
      equipment: ['Dreamtime Cultural Archive', 'Pacific Maritime Database', 'Environmental Challenge Analyzer'],
      contacts: ['Agent Mitchell (Sydney)', 'Dr. Tui (Suva)', 'Captain Aroha (Auckland)'],
      time_limit: '15 seconds per intelligence query',
      success_criteria: '90% accuracy required - The fate of the world is in your hands'
    }
  };

  // Use AI-generated narrative if available, otherwise fall back to default
  const getAIEnhancedMission = () => {
    const defaultMission = missionData[region.id] || missionData['western-europe'];
    
    if (gameState.aiNarrative && gameState.aiNarrative.regional_narratives && gameState.aiNarrative.regional_narratives[region.id]) {
      const aiRegion = gameState.aiNarrative.regional_narratives[region.id];
      return {
        ...defaultMission,
        title: aiRegion.operation_name || defaultMission.title,
        threat_level: aiRegion.threat_level || defaultMission.threat_level,
        briefing: [
          `Agent ${gameState.agentName}, ${aiRegion.local_plot}`,
          aiRegion.connection_to_overall || defaultMission.briefing[1],
          `Intelligence Target: ${aiRegion.intelligence_target}`,
          defaultMission.briefing[defaultMission.briefing.length - 1] // Keep final warning/motivation
        ],
        contacts: aiRegion.local_contacts || defaultMission.contacts,
        // Keep other properties from default
        objectives: defaultMission.objectives,
        equipment: defaultMission.equipment,
        time_limit: defaultMission.time_limit,
        success_criteria: defaultMission.success_criteria
      };
    }
    
    return defaultMission;
  };

  const currentMission = getAIEnhancedMission();

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
              <div className="details-grid">
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
              </div>

              <div className="mission-parameters">
                <div className="parameter">
                  <strong>⏱️ Time Limit:</strong> {currentMission.time_limit}
                </div>
                <div className="parameter">
                  <strong>🎯 Success Criteria:</strong> {currentMission.success_criteria}
                </div>
              </div>

              {/* Regional Multimedia Content */}
              <div className="regional-content">
                <RegionalMultimedia 
                  region={region.id} 
                  userAge={gameState.userAge}
                  className="briefing-multimedia"
                />
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