// Atlas Agent Frontend Configuration

// Environment-based API URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3002' : 'https://atlas-agent-production-4cd2.up.railway.app');

export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL ||
  (import.meta.env.DEV ? 'http://localhost:5173' : 'https://atlas-agent.torkington.au');

// Multimedia service configuration
export const MULTIMEDIA_CONFIG = {
  audio: {
    enabled: true,
    masterVolume: 0.7,
    preloadEssentialSounds: true,
    fallbackToHtml5: true
  },
  photos: {
    enabled: true,
    cacheDuration: 30 * 60 * 1000, // 30 minutes
    fallbackEnabled: true,
    ageFiltering: true
  },
  weather: {
    enabled: true,
    cacheDuration: 30 * 60 * 1000, // 30 minutes
    fallbackEnabled: true,
    showSpyRelevance: true
  }
};

// Age-based content configuration
export const AGE_CONFIG = {
  minAge: 8,
  maxAge: 100,
  defaultAge: 13,
  ageGroups: {
    child: { min: 8, max: 10 },
    preteen: { min: 11, max: 12 },
    teen: { min: 13, max: 16 },
    adult: { min: 17, max: 100 }
  }
};

// Regional configuration
export const REGIONS = {
  'western-europe': {
    name: 'Western Europe',
    continent: 'Europe',
    difficulty: 'beginner',
    primaryCity: 'Paris'
  },
  'eastern-europe': {
    name: 'Eastern Europe', 
    continent: 'Europe',
    difficulty: 'beginner',
    primaryCity: 'Prague'
  },
  'north-america': {
    name: 'North America',
    continent: 'North America',
    difficulty: 'intermediate',
    primaryCity: 'New York'
  },
  'south-america': {
    name: 'South America',
    continent: 'South America', 
    difficulty: 'intermediate',
    primaryCity: 'São Paulo'
  },
  'east-asia': {
    name: 'East Asia',
    continent: 'Asia',
    difficulty: 'hard',
    primaryCity: 'Tokyo'
  },
  'southeast-asia': {
    name: 'Southeast Asia',
    continent: 'Asia',
    difficulty: 'advanced',
    primaryCity: 'Singapore'
  },
  'south-asia': {
    name: 'South Asia',
    continent: 'Asia',
    difficulty: 'advanced',
    primaryCity: 'Mumbai'
  },
  'central-west-asia': {
    name: 'Central & West Asia',
    continent: 'Asia',
    difficulty: 'expert',
    primaryCity: 'Istanbul'
  },
  'africa': {
    name: 'Africa',
    continent: 'Africa',
    difficulty: 'expert',
    primaryCity: 'Cairo'
  },
  'oceania': {
    name: 'Oceania',
    continent: 'Oceania',
    difficulty: 'expert',
    primaryCity: 'Sydney'
  }
};

// Development and debugging
export const DEBUG = import.meta.env.DEV;

export default {
  API_BASE_URL,
  FRONTEND_URL,
  MULTIMEDIA_CONFIG,
  AGE_CONFIG,
  REGIONS,
  DEBUG
};