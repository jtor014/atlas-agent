// Photo Service for Atlas Agent - Unsplash API Integration
import fetch from 'node-fetch';

class PhotoService {
  constructor() {
    this.apiKey = process.env.UNSPLASH_ACCESS_KEY;
    this.baseUrl = 'https://api.unsplash.com';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Search for photos related to a geographic region
   */
  async getRegionalPhotos(region, category = 'geography', count = 3) {
    if (!this.apiKey) {
      console.warn('Unsplash API key not configured - using fallback photos');
      return this.getFallbackPhotos(region);
    }

    const cacheKey = `${region}-${category}-${count}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const searchTerms = this.buildSearchTerms(region, category);
      const photos = [];

      // Try multiple search terms to get diverse photos
      for (const term of searchTerms.slice(0, 2)) {
        try {
          const response = await fetch(
            `${this.baseUrl}/search/photos?` + 
            new URLSearchParams({
              query: term,
              per_page: Math.ceil(count / searchTerms.length) + 1,
              orientation: 'landscape',
              content_filter: 'high', // Family-friendly content
              order_by: 'relevant'
            }),
            {
              headers: {
                'Authorization': `Client-ID ${this.apiKey}`,
                'Accept-Version': 'v1'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const processedPhotos = data.results
              .filter(photo => this.isAgeAppropriate(photo))
              .map(photo => this.processPhoto(photo, region, term))
              .slice(0, Math.ceil(count / 2));
            
            photos.push(...processedPhotos);
          }
        } catch (error) {
          console.error(`Error searching for "${term}":`, error.message);
        }
      }

      // Deduplicate and limit results
      const uniquePhotos = this.deduplicatePhotos(photos).slice(0, count);
      
      // Fill with fallbacks if needed
      while (uniquePhotos.length < count) {
        const fallbacks = this.getFallbackPhotos(region);
        uniquePhotos.push(...fallbacks.slice(0, count - uniquePhotos.length));
        break;
      }

      // Cache the results
      this.cache.set(cacheKey, {
        data: uniquePhotos,
        timestamp: Date.now()
      });

      return uniquePhotos;

    } catch (error) {
      console.error('Photo service error:', error);
      return this.getFallbackPhotos(region);
    }
  }

  /**
   * Build search terms based on region and category
   */
  buildSearchTerms(region, category) {
    const regionTerms = {
      'western-europe': ['Paris Eiffel Tower', 'London Big Ben', 'Rome Colosseum', 'Amsterdam canals', 'Swiss Alps'],
      'eastern-europe': ['Prague castle', 'Moscow Red Square', 'Budapest parliament', 'Krakow market square'],
      'north-america': ['New York skyline', 'Grand Canyon', 'Toronto CN Tower', 'Golden Gate Bridge'],
      'south-america': ['Machu Picchu', 'Rio Christ statue', 'Amazon rainforest', 'Buenos Aires colorful houses'],
      'east-asia': ['Great Wall China', 'Tokyo skyline', 'Mount Fuji', 'Seoul palaces'],
      'southeast-asia': ['Angkor Wat', 'Singapore skyline', 'Bali rice terraces', 'Bangkok temples'],
      'south-asia': ['Taj Mahal', 'Himalayan mountains', 'Mumbai skyline', 'Kerala backwaters'],
      'central-west-asia': ['Istanbul mosque', 'Dubai skyline', 'Persian architecture', 'Silk Road'],
      'africa': ['African safari', 'Pyramid Giza', 'Victoria Falls', 'Sahara desert'],
      'oceania': ['Sydney Opera House', 'Great Barrier Reef', 'New Zealand mountains', 'Fiji beaches']
    };

    const categoryTerms = {
      'geography': ['landscape', 'nature', 'mountains', 'rivers'],
      'culture': ['traditional', 'festival', 'architecture', 'people'],
      'history': ['ancient', 'monument', 'historical site', 'ruins'],
      'modern': ['city', 'urban', 'modern architecture', 'skyline']
    };

    const baseTerms = regionTerms[region] || [region];
    const categoryWords = categoryTerms[category] || [category];

    // Combine region-specific terms with category terms
    const searchTerms = [
      ...baseTerms,
      ...baseTerms.map(term => `${term} ${categoryWords[0]}`).slice(0, 2)
    ];

    return searchTerms;
  }

  /**
   * Process raw photo data from Unsplash
   */
  processPhoto(photo, region, searchTerm) {
    return {
      id: photo.id,
      url: photo.urls.regular,
      thumb_url: photo.urls.thumb,
      small_url: photo.urls.small,
      description: photo.alt_description || photo.description || `${region} landscape`,
      photographer: photo.user.name,
      photographer_url: photo.user.links.html,
      unsplash_url: photo.links.html,
      width: photo.width,
      height: photo.height,
      region: region,
      search_term: searchTerm,
      content_rating: 'safe', // Unsplash content_filter ensures this
      source: 'unsplash'
    };
  }

  /**
   * Check if photo content is age-appropriate
   */
  isAgeAppropriate(photo) {
    const description = (photo.alt_description || photo.description || '').toLowerCase();
    const tags = photo.tags ? photo.tags.map(tag => tag.title.toLowerCase()) : [];
    
    // Simple content filtering - Unsplash's content_filter=high handles most cases
    const inappropriateTerms = ['adult', 'alcohol', 'violence', 'weapon'];
    const allText = [description, ...tags].join(' ');
    
    return !inappropriateTerms.some(term => allText.includes(term));
  }

  /**
   * Remove duplicate photos based on ID
   */
  deduplicatePhotos(photos) {
    const seen = new Set();
    return photos.filter(photo => {
      if (seen.has(photo.id)) return false;
      seen.add(photo.id);
      return true;
    });
  }

  /**
   * Fallback photos when API is unavailable
   */
  getFallbackPhotos(region) {
    const fallbackPhotos = {
      'western-europe': [
        {
          id: 'fallback-we-1',
          url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52',
          thumb_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=150',
          small_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400',
          description: 'Paris Eiffel Tower',
          photographer: 'Fallback Collection',
          region: region,
          source: 'fallback',
          content_rating: 'safe'
        }
      ],
      'eastern-europe': [
        {
          id: 'fallback-ee-1',
          url: 'https://images.unsplash.com/photo-1541849546-216549ae216d',
          thumb_url: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=150',
          small_url: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400',
          description: 'Prague Castle',
          photographer: 'Fallback Collection',
          region: region,
          source: 'fallback',
          content_rating: 'safe'
        }
      ]
    };

    return fallbackPhotos[region] || [{
      id: `fallback-${region}-1`,
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      thumb_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150',
      small_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      description: `${region} landscape`,
      photographer: 'Fallback Collection',
      region: region,
      source: 'fallback',
      content_rating: 'safe'
    }];
  }

  /**
   * Get weather-related photos for a region
   */
  async getWeatherPhotos(region, weatherCondition) {
    const weatherTerms = {
      'sunny': ['sunny landscape', 'clear sky', 'bright day'],
      'cloudy': ['cloudy sky', 'overcast', 'dramatic clouds'],
      'rainy': ['rain drops', 'stormy sky', 'after rain'],
      'snowy': ['snow covered', 'winter landscape', 'snowy mountains']
    };

    const terms = weatherTerms[weatherCondition] || ['landscape'];
    const regionTerms = this.buildSearchTerms(region, 'geography');
    
    // Combine weather terms with region
    const searchTerm = `${regionTerms[0]} ${terms[0]}`;
    
    try {
      return await this.getRegionalPhotos(region, searchTerm, 1);
    } catch (error) {
      return this.getFallbackPhotos(region);
    }
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
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(v => v.timestamp)),
      newestEntry: Math.max(...Array.from(this.cache.values()).map(v => v.timestamp))
    };
  }
}

export default PhotoService;