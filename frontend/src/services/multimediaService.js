// Multimedia Service for Atlas Agent Frontend
import { API_BASE_URL, MULTIMEDIA_CONFIG } from '../config';

class MultimediaService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/multimedia`;
    this.cache = new Map();
    this.cacheExpiry = MULTIMEDIA_CONFIG.photos.cacheDuration;
    this.audioContext = null;
    this.audioBuffers = new Map();
    this.currentVolume = MULTIMEDIA_CONFIG.audio.masterVolume;
    this.audioEnabled = MULTIMEDIA_CONFIG.audio.enabled;
  }

  /**
   * Initialize Web Audio API
   */
  async initializeAudio() {
    if (!this.audioContext && window.AudioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load essential audio files
        await this.preloadAudioFiles([
          'correct_answer',
          'incorrect_answer',
          'button_click',
          'page_transition'
        ]);
        
        return true;
      } catch (error) {
        console.warn('Web Audio API not available:', error);
        return false;
      }
    }
    return !!this.audioContext;
  }

  /**
   * Preload audio files for better performance
   */
  async preloadAudioFiles(audioKeys) {
    const audioConfig = await this.getAudioConfig();
    if (!audioConfig || !audioConfig.audio_library) return;

    const loadPromises = audioKeys.map(async (key) => {
      const audio = audioConfig.audio_library[key];
      if (!audio) return;

      try {
        // Try to load from CDN first, fallback to local
        const audioUrl = audio.fallback_url; // Start with local files
        const response = await fetch(audioUrl);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          if (this.audioContext) {
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(key, audioBuffer);
          }
        }
      } catch (error) {
        console.warn(`Failed to preload audio: ${key}`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  }

  /**
   * Play audio with fallback options
   */
  async playAudio(audioKey, volume = null) {
    if (!this.audioEnabled) return;

    const finalVolume = volume !== null ? volume : this.currentVolume;

    // Try Web Audio API first
    if (this.audioContext && this.audioBuffers.has(audioKey)) {
      try {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.audioBuffers.get(audioKey);
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        gainNode.gain.value = finalVolume;
        
        source.start(0);
        return;
      } catch (error) {
        console.warn(`Web Audio playback failed for ${audioKey}:`, error);
      }
    }

    // Fallback to HTML5 Audio
    try {
      const audioConfig = await this.getAudioConfig();
      if (audioConfig?.audio_library?.[audioKey]) {
        const audio = new Audio();
        audio.volume = finalVolume;
        audio.src = audioConfig.audio_library[audioKey].fallback_url;
        
        // Handle audio play promise
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`HTML5 Audio playback failed for ${audioKey}:`, error);
          });
        }
      }
    } catch (error) {
      console.warn(`Fallback audio failed for ${audioKey}:`, error);
    }
  }

  /**
   * Get regional photos
   */
  async getRegionalPhotos(region, category = 'geography', count = 3) {
    const cacheKey = `photos-${region}-${category}-${count}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/photos/${region}?category=${category}&count=${count}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Photos API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data.photos || [],
        timestamp: Date.now()
      });

      return data.photos || [];

    } catch (error) {
      console.error(`Failed to get photos for ${region}:`, error);
      return this.getFallbackPhotos(region);
    }
  }

  /**
   * Get regional weather data
   */
  async getRegionalWeather(region) {
    const cacheKey = `weather-${region}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather/${region}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data.weather || null,
        timestamp: Date.now()
      });

      return data.weather;

    } catch (error) {
      console.error(`Failed to get weather for ${region}:`, error);
      return this.getFallbackWeather(region);
    }
  }

  /**
   * Get audio configuration
   */
  async getAudioConfig(userAge = null, region = null) {
    const cacheKey = `audio-config-${userAge}-${region}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams();
      if (userAge) params.append('user_age', userAge);
      if (region) params.append('region', region);

      const response = await fetch(
        `${this.baseUrl}/audio/config?${params}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Audio config API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data.audio_config || {},
        timestamp: Date.now()
      });

      return data.audio_config;

    } catch (error) {
      console.error('Failed to get audio config:', error);
      return this.getFallbackAudioConfig();
    }
  }

  /**
   * Get performance-based audio feedback
   */
  async getPerformanceFeedback(score, streak, timeToAnswer) {
    try {
      const response = await fetch(
        `${this.baseUrl}/audio/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            score,
            streak,
            time_to_answer: timeToAnswer
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Feedback API error: ${response.status}`);
      }

      const data = await response.json();
      return data.feedback;

    } catch (error) {
      console.error('Failed to get performance feedback:', error);
      return {
        primary_sound: score >= 0.7 ? 'correct_answer' : 'incorrect_answer',
        message: score >= 0.7 ? 'Good work, Agent!' : 'Keep studying, Agent.',
        volume_modifier: 1.0
      };
    }
  }

  /**
   * Get combined multimedia data for region
   */
  async getRegionalMultimedia(region, userAge = null, options = {}) {
    const {
      includeWeather = true,
      includePhotos = true,
      includeAudio = true
    } = options;

    try {
      const params = new URLSearchParams();
      if (userAge) params.append('user_age', userAge);
      if (!includeWeather) params.append('include_weather', 'false');
      if (!includePhotos) params.append('include_photos', 'false');
      if (!includeAudio) params.append('include_audio', 'false');

      const response = await fetch(
        `${this.baseUrl}/region/${region}/multimedia?${params}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Regional multimedia API error: ${response.status}`);
      }

      const data = await response.json();
      return data.multimedia || {};

    } catch (error) {
      console.error(`Failed to get multimedia for ${region}:`, error);
      return {
        photos: includePhotos ? this.getFallbackPhotos(region) : [],
        weather: includeWeather ? this.getFallbackWeather(region) : null,
        audio: includeAudio ? {} : null
      };
    }
  }

  /**
   * Play feedback audio based on answer correctness
   */
  async playAnswerFeedback(isCorrect, score = null, streak = 0, timeToAnswer = 30) {
    try {
      if (score !== null) {
        // Get sophisticated feedback
        const feedback = await this.getPerformanceFeedback(score, streak, timeToAnswer);
        await this.playAudio(feedback.primary_sound, feedback.volume_modifier * this.currentVolume);
        
        // Play secondary sounds if any
        if (feedback.secondary_sounds?.length > 0) {
          setTimeout(async () => {
            for (const sound of feedback.secondary_sounds) {
              await this.playAudio(sound, 0.5 * this.currentVolume);
              await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause between sounds
            }
          }, 800);
        }
      } else {
        // Simple correct/incorrect feedback
        const audioKey = isCorrect ? 'correct_answer' : 'incorrect_answer';
        await this.playAudio(audioKey);
      }
    } catch (error) {
      console.warn('Failed to play answer feedback:', error);
    }
  }

  /**
   * Play UI interaction sounds
   */
  async playUISound(action) {
    const soundMap = {
      click: 'button_click',
      transition: 'page_transition',
      success: 'correct_answer',
      error: 'incorrect_answer',
      achievement: 'mission_complete'
    };

    const audioKey = soundMap[action];
    if (audioKey) {
      await this.playAudio(audioKey, 0.4);
    }
  }

  /**
   * Update audio settings
   */
  setAudioSettings({ volume, enabled }) {
    if (volume !== undefined) {
      this.currentVolume = Math.max(0, Math.min(1, volume));
    }
    if (enabled !== undefined) {
      this.audioEnabled = enabled;
    }
  }

  /**
   * Fallback photos when service is unavailable
   */
  getFallbackPhotos(region) {
    return [{
      id: `fallback-${region}`,
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      thumb_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150',
      small_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
      description: `${region} landscape`,
      photographer: 'Fallback Collection',
      region: region,
      source: 'fallback'
    }];
  }

  /**
   * Fallback weather when service is unavailable
   */
  getFallbackWeather(region) {
    return {
      region: region,
      city: 'Regional Center',
      current: {
        temperature: 20,
        temperature_f: 68,
        description: 'Pleasant conditions'
      },
      conditions: {
        main: 'Clear',
        description: 'clear sky',
        icon_url: 'https://openweathermap.org/img/wn/01d@2x.png'
      },
      educational_context: {
        explanation: 'Weather data temporarily unavailable.',
        climate_type: 'Varied'
      },
      source: 'fallback'
    };
  }

  /**
   * Fallback audio config when service is unavailable
   */
  getFallbackAudioConfig() {
    return {
      audio_library: {
        correct_answer: {
          fallback_url: '/audio/correct.wav',
          volume: 0.6,
          description: 'Success sound'
        },
        incorrect_answer: {
          fallback_url: '/audio/incorrect.wav',
          volume: 0.4,
          description: 'Error sound'
        },
        button_click: {
          fallback_url: '/audio/click.wav',
          volume: 0.3,
          description: 'Button click'
        }
      },
      settings: {
        masterVolume: 0.7,
        effectsEnabled: true
      }
    };
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.health;
      }
    } catch (error) {
      console.warn('Failed to get multimedia service health:', error);
    }

    return {
      photos: { status: 'unavailable' },
      weather: { status: 'unavailable' },
      audio: { status: 'fallback_only' }
    };
  }
}

// Create and export singleton instance
const multimediaService = new MultimediaService();
export default multimediaService;