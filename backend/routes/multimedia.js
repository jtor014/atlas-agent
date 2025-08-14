// Multimedia Routes for Atlas Agent - Photos, Weather, Audio
import express from 'express';
import PhotoService from '../lib/photoService.js';
import WeatherService from '../lib/weatherService.js';
import AudioService from '../lib/audioService.js';

const router = express.Router();

// Initialize services
const photoService = new PhotoService();
const weatherService = new WeatherService();
const audioService = new AudioService();

// Photo endpoints
router.get('/photos/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { category = 'geography', count = 3 } = req.query;

    const photos = await photoService.getRegionalPhotos(region, category, parseInt(count));
    
    res.json({
      success: true,
      region,
      category,
      count: photos.length,
      photos,
      cached: photos.some(p => p.source === 'cache'),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Photo endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve regional photos',
      fallback_available: true
    });
  }
});

// Weather photo endpoint
router.get('/photos/:region/weather/:condition', async (req, res) => {
  try {
    const { region, condition } = req.params;
    
    const photos = await photoService.getWeatherPhotos(region, condition);
    
    res.json({
      success: true,
      region,
      weather_condition: condition,
      photos,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather photo endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather photos',
      fallback_available: true
    });
  }
});

// Weather endpoints
router.get('/weather/:region', async (req, res) => {
  try {
    const { region } = req.params;
    
    const weather = await weatherService.getRegionalWeather(region);
    
    res.json({
      success: true,
      weather,
      cache_status: weather.source === 'fallback' ? 'fallback' : 'live',
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather data',
      fallback_available: true
    });
  }
});

// Audio configuration endpoint
router.get('/audio/config', (req, res) => {
  try {
    const { user_age, region } = req.query;
    const userAge = user_age ? parseInt(user_age) : null;
    
    const audioConfig = audioService.getAudioConfig(userAge, region);
    
    res.json({
      success: true,
      audio_config: audioConfig,
      web_audio_config: audioService.getWebAudioConfig(),
      accessibility_audio: audioService.getAccessibilityAudio(),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Audio config endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audio configuration'
    });
  }
});

// Audio feedback endpoint
router.post('/audio/feedback', (req, res) => {
  try {
    const { score, streak, time_to_answer } = req.body;
    
    const feedback = audioService.getPerformanceFeedback(
      parseFloat(score) || 0,
      parseInt(streak) || 0,
      parseInt(time_to_answer) || 30
    );
    
    res.json({
      success: true,
      feedback,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Audio feedback endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate audio feedback'
    });
  }
});

// Combined multimedia data for region
router.get('/region/:region/multimedia', async (req, res) => {
  try {
    const { region } = req.params;
    const { user_age, include_weather = 'true', include_photos = 'true', include_audio = 'true' } = req.query;
    const userAge = user_age ? parseInt(user_age) : null;

    const results = {};

    // Get photos if requested
    if (include_photos === 'true') {
      try {
        results.photos = await photoService.getRegionalPhotos(region, 'geography', 2);
      } catch (error) {
        console.error('Photos failed in combined endpoint:', error);
        results.photos = photoService.getFallbackPhotos(region);
      }
    }

    // Get weather if requested
    if (include_weather === 'true') {
      try {
        results.weather = await weatherService.getRegionalWeather(region);
      } catch (error) {
        console.error('Weather failed in combined endpoint:', error);
        results.weather = weatherService.getFallbackWeather(region);
      }
    }

    // Get audio config if requested
    if (include_audio === 'true') {
      try {
        results.audio = audioService.getRegionalAudio(region);
        results.pronunciation = audioService.getPronunciationGuide(region);
      } catch (error) {
        console.error('Audio failed in combined endpoint:', error);
        results.audio = {};
        results.pronunciation = [];
      }
    }

    res.json({
      success: true,
      region,
      user_age: userAge,
      multimedia: results,
      generated_at: new Date().toISOString(),
      cache_info: {
        photos_cached: results.photos?.some(p => p.source === 'cache') || false,
        weather_cached: results.weather?.source !== 'fallback',
        services_status: {
          photos: results.photos ? 'active' : 'unavailable',
          weather: results.weather ? 'active' : 'unavailable',
          audio: results.audio ? 'active' : 'unavailable'
        }
      }
    });

  } catch (error) {
    console.error('Combined multimedia endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve multimedia data',
      region,
      partial_data_available: false
    });
  }
});

// Cache management endpoints
router.delete('/cache/photos', (req, res) => {
  try {
    photoService.cache.clear();
    res.json({
      success: true,
      message: 'Photo cache cleared',
      cleared_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear photo cache'
    });
  }
});

router.delete('/cache/weather', (req, res) => {
  try {
    weatherService.cache.clear();
    res.json({
      success: true,
      message: 'Weather cache cleared',
      cleared_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear weather cache'
    });
  }
});

router.get('/cache/status', (req, res) => {
  try {
    const photoStats = photoService.getCacheStats();
    const weatherStats = weatherService.getCacheStats();
    
    res.json({
      success: true,
      cache_status: {
        photos: {
          size: photoStats.size,
          keys: photoStats.keys,
          oldest_entry: photoStats.oldestEntry ? new Date(photoStats.oldest_entry).toISOString() : null,
          newest_entry: photoStats.newestEntry ? new Date(photoStats.newest_entry).toISOString() : null
        },
        weather: {
          size: weatherStats.size,
          keys: Array.from(weatherService.cache.keys()),
          expiry_minutes: 30
        }
      },
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache status'
    });
  }
});

// Cleanup expired cache entries (maintenance endpoint)
router.post('/cache/cleanup', (req, res) => {
  try {
    photoService.clearExpiredCache();
    weatherService.clearExpiredCache();
    
    res.json({
      success: true,
      message: 'Expired cache entries cleared',
      cleaned_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup cache'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      multimedia_services: {
        photos: {
          status: process.env.UNSPLASH_ACCESS_KEY ? 'configured' : 'fallback_only',
          api_key_present: !!process.env.UNSPLASH_ACCESS_KEY
        },
        weather: {
          status: process.env.OPENWEATHER_API_KEY ? 'configured' : 'fallback_only',
          api_key_present: !!process.env.OPENWEATHER_API_KEY
        },
        audio: {
          status: 'active',
          library_size: Object.keys(audioService.audioLibrary).length
        }
      },
      cache: {
        photos: photoService.cache.size,
        weather: weatherService.cache.size
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;