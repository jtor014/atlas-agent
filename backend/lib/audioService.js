// Audio Service for Atlas Agent - Sound Effects and Audio Feedback
class AudioService {
  constructor() {
    this.audioLibrary = {
      // Success/Achievement Sounds
      correct_answer: {
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        fallback_url: '/audio/correct.wav',
        description: 'Success chime for correct answers',
        volume: 0.6,
        duration: 1.2
      },
      mission_complete: {
        url: 'https://www.soundjay.com/misc/sounds/achievement-bell-01.wav',
        fallback_url: '/audio/mission-complete.wav',
        description: 'Achievement sound for completed missions',
        volume: 0.7,
        duration: 2.0
      },
      level_up: {
        url: 'https://www.soundjay.com/misc/sounds/magic-chime-02.wav',
        fallback_url: '/audio/level-up.wav',
        description: 'Level progression sound',
        volume: 0.8,
        duration: 1.8
      },
      
      // Error/Failure Sounds
      incorrect_answer: {
        url: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav',
        fallback_url: '/audio/incorrect.wav',
        description: 'Gentle error sound for incorrect answers',
        volume: 0.4,
        duration: 1.0
      },
      mission_failed: {
        url: 'https://www.soundjay.com/misc/sounds/fail-trombone-01.wav',
        fallback_url: '/audio/mission-failed.wav',
        description: 'Mission failure indicator',
        volume: 0.5,
        duration: 1.5
      },
      
      // Interface Sounds
      button_click: {
        url: 'https://www.soundjay.com/misc/sounds/click-01.wav',
        fallback_url: '/audio/click.wav',
        description: 'Button interaction sound',
        volume: 0.3,
        duration: 0.2
      },
      page_transition: {
        url: 'https://www.soundjay.com/misc/sounds/swish-01.wav',
        fallback_url: '/audio/transition.wav',
        description: 'Page/screen transition sound',
        volume: 0.4,
        duration: 0.5
      },
      
      // Ambient/Themed Sounds
      spy_theme: {
        url: 'https://www.soundjay.com/misc/sounds/spy-theme-01.wav',
        fallback_url: '/audio/spy-theme.wav',
        description: 'Spy-themed background music',
        volume: 0.2,
        duration: 30.0,
        loop: true
      },
      typing_sound: {
        url: 'https://www.soundjay.com/misc/sounds/typing-01.wav',
        fallback_url: '/audio/typing.wav',
        description: 'Typewriter effect for mission briefings',
        volume: 0.3,
        duration: 0.1
      },
      
      // Regional Ambient Sounds (when available)
      ambient_europe: {
        url: '/audio/ambient/europe-bells.wav',
        fallback_url: '/audio/ambient/default.wav',
        description: 'European ambient sounds',
        volume: 0.15,
        duration: 60.0,
        loop: true
      },
      ambient_asia: {
        url: '/audio/ambient/asia-gong.wav',
        fallback_url: '/audio/ambient/default.wav',
        description: 'Asian ambient sounds',
        volume: 0.15,
        duration: 60.0,
        loop: true
      }
    };
    
    // Audio preferences and settings
    this.settings = {
      masterVolume: 0.7,
      effectsEnabled: true,
      musicEnabled: true,
      ageAppropriate: true
    };
    
    this.currentlyPlaying = new Map();
  }

  /**
   * Get audio configuration for client
   */
  getAudioConfig(userAge = null, region = null) {
    // Filter audio based on age appropriateness
    const filteredAudio = {};
    
    Object.entries(this.audioLibrary).forEach(([key, audio]) => {
      // All current sounds are age-appropriate, but we can filter here if needed
      if (this.isAgeAppropriate(key, userAge)) {
        filteredAudio[key] = {
          ...audio,
          volume: audio.volume * this.settings.masterVolume
        };
      }
    });

    return {
      audio_library: filteredAudio,
      settings: {
        ...this.settings,
        user_age: userAge,
        current_region: region
      },
      regional_audio: this.getRegionalAudio(region),
      pronunciation_guide: this.getPronunciationGuide(region)
    };
  }

  /**
   * Check if audio is age-appropriate
   */
  isAgeAppropriate(audioKey, userAge) {
    // All current sounds are family-friendly
    // Could implement more sophisticated filtering if needed
    const ageRestrictedSounds = []; // None currently
    
    if (!userAge || userAge >= 13) {
      return true; // All sounds available for teens and adults
    }
    
    return !ageRestrictedSounds.includes(audioKey);
  }

  /**
   * Get regional-specific audio content
   */
  getRegionalAudio(region) {
    if (!region) return {};

    const regionalContent = {
      'western-europe': {
        ambient_key: 'ambient_europe',
        cultural_sounds: [
          { name: 'Church Bells', description: 'Traditional European church bells' },
          { name: 'Market Sounds', description: 'European marketplace ambiance' }
        ],
        language_samples: [
          { language: 'French', phrase: 'Bonjour', pronunciation: 'bohn-ZHOOR' },
          { language: 'German', phrase: 'Guten Tag', pronunciation: 'GOO-ten tahk' },
          { language: 'Italian', phrase: 'Ciao', pronunciation: 'chow' }
        ]
      },
      'east-asia': {
        ambient_key: 'ambient_asia',
        cultural_sounds: [
          { name: 'Temple Gong', description: 'Traditional Buddhist temple gong' },
          { name: 'Bamboo Wind', description: 'Peaceful bamboo forest sounds' }
        ],
        language_samples: [
          { language: 'Chinese', phrase: '你好', pronunciation: 'nee-how' },
          { language: 'Japanese', phrase: 'こんにちは', pronunciation: 'kon-nee-chee-wah' },
          { language: 'Korean', phrase: '안녕하세요', pronunciation: 'ahn-nyeong-hah-say-yo' }
        ]
      },
      'africa': {
        ambient_key: 'ambient_africa',
        cultural_sounds: [
          { name: 'Drums', description: 'Traditional African drums' },
          { name: 'Wildlife', description: 'African savanna sounds' }
        ],
        language_samples: [
          { language: 'Swahili', phrase: 'Habari', pronunciation: 'hah-BAH-ree' },
          { language: 'Arabic', phrase: 'مرحبا', pronunciation: 'mar-ha-ban' }
        ]
      }
    };

    return regionalContent[region] || {
      ambient_key: 'spy_theme',
      cultural_sounds: [],
      language_samples: []
    };
  }

  /**
   * Get pronunciation guide for region
   */
  getPronunciationGuide(region) {
    const guides = {
      'western-europe': [
        { word: 'Paris', pronunciation: 'pah-REE', language: 'French' },
        { word: 'Berlin', pronunciation: 'ber-LEEN', language: 'German' },
        { word: 'Roma', pronunciation: 'ROH-mah', language: 'Italian' }
      ],
      'east-asia': [
        { word: 'Beijing', pronunciation: 'bay-JING', language: 'Chinese' },
        { word: 'Tokyo', pronunciation: 'TOH-kyoh', language: 'Japanese' },
        { word: 'Seoul', pronunciation: 'soul', language: 'Korean' }
      ],
      'south-asia': [
        { word: 'Mumbai', pronunciation: 'mum-BYE', language: 'Hindi' },
        { word: 'Delhi', pronunciation: 'DEL-ee', language: 'Hindi' },
        { word: 'Namaste', pronunciation: 'nah-mas-TAY', language: 'Hindi' }
      ]
    };

    return guides[region] || [];
  }

  /**
   * Generate audio feedback based on performance
   */
  getPerformanceFeedback(score, streak, timeToAnswer) {
    let feedback = {
      primary_sound: 'correct_answer',
      secondary_sounds: [],
      volume_modifier: 1.0,
      message: 'Well done, Agent!'
    };

    if (score >= 0.9) {
      feedback.primary_sound = 'mission_complete';
      feedback.message = 'Excellent work, Agent! Perfect intelligence gathering.';
      feedback.volume_modifier = 1.2;
    } else if (score >= 0.7) {
      feedback.primary_sound = 'correct_answer';
      feedback.message = 'Good work, Agent. Your intelligence skills are improving.';
    } else if (score >= 0.5) {
      feedback.primary_sound = 'button_click';
      feedback.message = 'Adequate, Agent. Study the intelligence more carefully.';
      feedback.volume_modifier = 0.8;
    } else {
      feedback.primary_sound = 'incorrect_answer';
      feedback.message = 'Mission briefing needed, Agent. Review your intel.';
      feedback.volume_modifier = 0.6;
    }

    // Add streak bonuses
    if (streak >= 5) {
      feedback.secondary_sounds.push('level_up');
      feedback.message += ' Outstanding streak!';
    }

    // Add timing feedback
    if (timeToAnswer < 10) {
      feedback.secondary_sounds.push('spy_theme');
      feedback.message += ' Lightning fast response!';
    }

    return feedback;
  }

  /**
   * Get audio cues for accessibility
   */
  getAccessibilityAudio() {
    return {
      question_ready: {
        sound: 'button_click',
        description: 'Question loaded and ready'
      },
      time_warning: {
        sound: 'typing_sound',
        description: 'Time running low'
      },
      answer_selected: {
        sound: 'page_transition',
        description: 'Answer option selected'
      },
      hint_available: {
        sound: 'spy_theme',
        description: 'Hint available for question',
        volume: 0.1
      }
    };
  }

  /**
   * Generate Web Audio API compatible configuration
   */
  getWebAudioConfig() {
    return {
      audio_context: {
        sample_rate: 44100,
        buffer_size: 2048,
        supported_formats: ['wav', 'mp3', 'ogg']
      },
      preload_sounds: [
        'correct_answer',
        'incorrect_answer',
        'button_click',
        'page_transition'
      ],
      fallback_strategy: 'html5_audio',
      crossfade_duration: 0.2,
      max_concurrent_sounds: 3
    };
  }

  /**
   * Update user audio preferences
   */
  updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    return this.settings;
  }

  /**
   * Get current audio settings
   */
  getSettings() {
    return this.settings;
  }
}

export default AudioService;