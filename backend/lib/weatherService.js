// Weather Service for Atlas Agent - OpenWeatherMap API Integration
import fetch from 'node-fetch';

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes for weather data
  }

  /**
   * Get current weather for a region's major city
   */
  async getRegionalWeather(region) {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured - using fallback weather');
      return this.getFallbackWeather(region);
    }

    const cacheKey = `weather-${region}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const cityData = this.getRegionalCity(region);
      
      const response = await fetch(
        `${this.baseUrl}/weather?` + 
        new URLSearchParams({
          lat: cityData.lat,
          lon: cityData.lon,
          appid: this.apiKey,
          units: 'metric'
        })
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const processedWeather = this.processWeatherData(data, region, cityData);

      // Cache the result
      this.cache.set(cacheKey, {
        data: processedWeather,
        timestamp: Date.now()
      });

      return processedWeather;

    } catch (error) {
      console.error(`Weather service error for ${region}:`, error);
      return this.getFallbackWeather(region);
    }
  }

  /**
   * Get representative city coordinates for each region
   */
  getRegionalCity(region) {
    const cities = {
      'western-europe': { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
      'eastern-europe': { name: 'Prague', country: 'CZ', lat: 50.0755, lon: 14.4378 },
      'north-america': { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
      'south-america': { name: 'São Paulo', country: 'BR', lat: -23.5558, lon: -46.6396 },
      'east-asia': { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
      'southeast-asia': { name: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },
      'south-asia': { name: 'Mumbai', country: 'IN', lat: 19.0760, lon: 72.8777 },
      'central-west-asia': { name: 'Istanbul', country: 'TR', lat: 41.0082, lon: 28.9784 },
      'africa': { name: 'Cairo', country: 'EG', lat: 30.0444, lon: 31.2357 },
      'oceania': { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 }
    };

    return cities[region] || cities['western-europe'];
  }

  /**
   * Process raw weather data from API
   */
  processWeatherData(data, region, cityData) {
    return {
      region: region,
      city: cityData.name,
      country: cityData.country,
      timestamp: new Date().toISOString(),
      current: {
        temperature: Math.round(data.main.temp),
        temperature_f: Math.round((data.main.temp * 9/5) + 32),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        uv_index: null // Not available in current weather endpoint
      },
      conditions: {
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        icon_url: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
      },
      wind: {
        speed: data.wind.speed,
        speed_mph: Math.round(data.wind.speed * 2.237),
        direction: data.wind.deg,
        direction_text: this.getWindDirection(data.wind.deg)
      },
      sun: {
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString()
      },
      educational_context: this.getEducationalContext(data, region, cityData),
      spy_relevance: this.getSpyRelevance(data, region)
    };
  }

  /**
   * Convert wind degree to direction text
   */
  getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Generate educational context about the weather
   */
  getEducationalContext(data, region, cityData) {
    const season = this.getSeason(cityData.lat);
    const climateType = this.getClimateType(region);
    
    return {
      season: season,
      climate_type: climateType,
      explanation: `${cityData.name} is currently experiencing ${season.toLowerCase()} weather with ${data.weather[0].description}. ` +
                  `This ${climateType} climate region typically has ${this.getTypicalWeather(climateType, season)}.`,
      geography_connection: `The weather in ${cityData.name} influences daily life, agriculture, and culture throughout ${region}.`,
      best_visit_time: this.getBestVisitTime(region, climateType)
    };
  }

  /**
   * Generate spy-relevant weather context
   */
  getSpyRelevance(data, region) {
    const conditions = data.weather[0].main.toLowerCase();
    const visibility = data.visibility ? data.visibility / 1000 : 10;
    
    let relevance = {
      visibility_status: visibility > 8 ? 'excellent' : visibility > 5 ? 'good' : 'limited',
      cover_conditions: 'normal',
      operational_notes: []
    };

    if (conditions.includes('rain') || conditions.includes('storm')) {
      relevance.cover_conditions = 'enhanced';
      relevance.operational_notes.push('Rain provides excellent cover for covert operations');
    }
    
    if (conditions.includes('fog') || conditions.includes('mist')) {
      relevance.cover_conditions = 'optimal';
      relevance.operational_notes.push('Fog conditions ideal for stealth movements');
    }
    
    if (data.main.temp < 0) {
      relevance.operational_notes.push('Cold temperatures affect equipment performance');
    }
    
    if (data.wind.speed > 10) {
      relevance.operational_notes.push('High winds may impact aerial surveillance');
    }

    return relevance;
  }

  /**
   * Determine season based on latitude and date
   */
  getSeason(latitude) {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Northern hemisphere seasons
    if (latitude > 0) {
      if (month >= 2 && month <= 4) return 'Spring';
      if (month >= 5 && month <= 7) return 'Summer';
      if (month >= 8 && month <= 10) return 'Autumn';
      return 'Winter';
    }
    // Southern hemisphere seasons (reversed)
    else {
      if (month >= 2 && month <= 4) return 'Autumn';
      if (month >= 5 && month <= 7) return 'Winter';
      if (month >= 8 && month <= 10) return 'Spring';
      return 'Summer';
    }
  }

  /**
   * Get climate type for region
   */
  getClimateType(region) {
    const climates = {
      'western-europe': 'Temperate Maritime',
      'eastern-europe': 'Continental',
      'north-america': 'Continental/Maritime',
      'south-america': 'Tropical/Subtropical',
      'east-asia': 'Monsoon/Continental',
      'southeast-asia': 'Tropical Monsoon',
      'south-asia': 'Monsoon',
      'central-west-asia': 'Arid/Semi-arid',
      'africa': 'Arid/Tropical',
      'oceania': 'Maritime/Mediterranean'
    };
    
    return climates[region] || 'Varied';
  }

  /**
   * Get typical weather patterns for climate and season
   */
  getTypicalWeather(climateType, season) {
    const patterns = {
      'Temperate Maritime': {
        'Spring': 'mild temperatures and frequent rain showers',
        'Summer': 'warm but not hot temperatures with occasional rain',
        'Autumn': 'cooling temperatures with increased rainfall',
        'Winter': 'cool temperatures with regular precipitation'
      },
      'Continental': {
        'Spring': 'rapidly warming temperatures with variable conditions',
        'Summer': 'hot temperatures with thunderstorms',
        'Autumn': 'rapidly cooling with clear, crisp days',
        'Winter': 'very cold temperatures with snow'
      },
      'Tropical Monsoon': {
        'Spring': 'hot and humid conditions',
        'Summer': 'heavy monsoon rains and high humidity',
        'Autumn': 'decreasing rainfall and high temperatures',
        'Winter': 'dry season with warm temperatures'
      }
    };
    
    return patterns[climateType]?.[season] || 'varied seasonal patterns';
  }

  /**
   * Get best visit time recommendations
   */
  getBestVisitTime(region, climateType) {
    const recommendations = {
      'western-europe': 'Late spring to early autumn (May-September) for pleasant weather',
      'eastern-europe': 'Spring and early autumn (April-June, September-October) for mild temperatures',
      'north-america': 'Varies by location - spring and fall generally optimal',
      'south-america': 'April-October for most areas (opposite seasons in south)',
      'east-asia': 'Spring (March-May) and autumn (October-November) for comfortable weather',
      'southeast-asia': 'November-March dry season for most areas',
      'south-asia': 'October-March for cooler, drier weather',
      'central-west-asia': 'Spring (March-May) and autumn (October-November) for moderate temperatures',
      'africa': 'Varies greatly - generally April-June and September-November',
      'oceania': 'September-May for warm weather (opposite seasons)'
    };
    
    return recommendations[region] || 'Spring and autumn generally offer the most pleasant conditions';
  }

  /**
   * Fallback weather when API is unavailable
   */
  getFallbackWeather(region) {
    const cityData = this.getRegionalCity(region);
    const climateType = this.getClimateType(region);
    
    return {
      region: region,
      city: cityData.name,
      country: cityData.country,
      timestamp: new Date().toISOString(),
      current: {
        temperature: 20,
        temperature_f: 68,
        feels_like: 20,
        humidity: 65,
        pressure: 1013,
        visibility: 10
      },
      conditions: {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
        icon_url: 'https://openweathermap.org/img/wn/01d@2x.png'
      },
      wind: {
        speed: 3.5,
        speed_mph: 8,
        direction: 180,
        direction_text: 'S'
      },
      educational_context: {
        climate_type: climateType,
        explanation: `Weather data temporarily unavailable for ${cityData.name}. This ${climateType} region typically experiences varied seasonal conditions.`,
        best_visit_time: this.getBestVisitTime(region, climateType)
      },
      spy_relevance: {
        visibility_status: 'good',
        cover_conditions: 'normal',
        operational_notes: ['Standard operational conditions']
      },
      source: 'fallback'
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
}

export default WeatherService;