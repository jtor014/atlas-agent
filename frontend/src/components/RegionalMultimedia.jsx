import { useState, useEffect } from 'react';
import multimediaService from '../services/multimediaService';
import './RegionalMultimedia.css';

function RegionalMultimedia({ region, userAge, className = '' }) {
  const [multimedia, setMultimedia] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    loadMultimediaData();
  }, [region, userAge]);

  const loadMultimediaData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await multimediaService.getRegionalMultimedia(region, userAge, {
        includeWeather: true,
        includePhotos: true,
        includeAudio: false // Audio handled separately
      });

      setMultimedia(data);
      setSelectedPhoto(0);
    } catch (err) {
      console.error('Failed to load multimedia data:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoNavigation = (direction) => {
    if (!multimedia.photos?.length) return;

    if (direction === 'next') {
      setSelectedPhoto((prev) => (prev + 1) % multimedia.photos.length);
    } else {
      setSelectedPhoto((prev) => (prev - 1 + multimedia.photos.length) % multimedia.photos.length);
    }
  };

  const formatTemperature = (temp, showFahrenheit = false) => {
    if (showFahrenheit && multimedia.weather?.current?.temperature_f) {
      return `${multimedia.weather.current.temperature_f}°F`;
    }
    return `${temp}°C`;
  };

  const getWindDescription = (wind) => {
    if (!wind) return 'Calm';
    
    const speed = wind.speed_mph || wind.speed;
    const direction = wind.direction_text || '';
    
    let description = '';
    if (speed < 5) description = 'Light';
    else if (speed < 15) description = 'Moderate';
    else if (speed < 25) description = 'Strong';
    else description = 'Very Strong';
    
    return `${description} ${direction} winds at ${Math.round(speed)} ${wind.speed_mph ? 'mph' : 'm/s'}`;
  };

  if (loading) {
    return (
      <div className={`regional-multimedia loading ${className}`}>
        <div className="multimedia-spinner">
          <div className="spinner"></div>
          <p>Loading regional content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`regional-multimedia error ${className}`}>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={loadMultimediaData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`regional-multimedia ${className}`}>
      {/* Photo Gallery Section */}
      {multimedia.photos?.length > 0 && (
        <div className="multimedia-section photos-section">
          <h3 className="section-title">
            <span className="section-icon">📸</span>
            Regional Gallery
          </h3>
          
          <div className="photo-gallery">
            <div className="photo-container">
              <img
                src={multimedia.photos[selectedPhoto]?.small_url || multimedia.photos[selectedPhoto]?.url}
                alt={multimedia.photos[selectedPhoto]?.description}
                className="featured-photo"
                loading="lazy"
              />
              
              {multimedia.photos.length > 1 && (
                <div className="photo-navigation">
                  <button
                    className="nav-btn prev-btn"
                    onClick={() => handlePhotoNavigation('prev')}
                    aria-label="Previous photo"
                  >
                    ←
                  </button>
                  <span className="photo-counter">
                    {selectedPhoto + 1} / {multimedia.photos.length}
                  </span>
                  <button
                    className="nav-btn next-btn"
                    onClick={() => handlePhotoNavigation('next')}
                    aria-label="Next photo"
                  >
                    →
                  </button>
                </div>
              )}
              
              <div className="photo-info">
                <p className="photo-description">
                  {multimedia.photos[selectedPhoto]?.description}
                </p>
                {multimedia.photos[selectedPhoto]?.photographer && (
                  <p className="photo-credit">
                    📷 {multimedia.photos[selectedPhoto].photographer}
                  </p>
                )}
              </div>
            </div>

            {multimedia.photos.length > 1 && (
              <div className="photo-thumbnails">
                {multimedia.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    className={`thumbnail ${index === selectedPhoto ? 'active' : ''}`}
                    onClick={() => setSelectedPhoto(index)}
                    aria-label={`View photo ${index + 1}`}
                  >
                    <img
                      src={photo.thumb_url || photo.small_url}
                      alt={photo.description}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weather Section */}
      {multimedia.weather && (
        <div className="multimedia-section weather-section">
          <h3 className="section-title">
            <span className="section-icon">🌤️</span>
            Regional Weather
            {multimedia.weather.city && (
              <span className="weather-location">in {multimedia.weather.city}</span>
            )}
          </h3>
          
          <div className="weather-content">
            <div className="weather-current">
              <div className="weather-main">
                {multimedia.weather.conditions?.icon_url && (
                  <img
                    src={multimedia.weather.conditions.icon_url}
                    alt={multimedia.weather.conditions?.description}
                    className="weather-icon"
                  />
                )}
                <div className="weather-temp">
                  <span className="temperature">
                    {formatTemperature(multimedia.weather.current?.temperature)}
                  </span>
                  <span className="feels-like">
                    Feels like {formatTemperature(multimedia.weather.current?.feels_like)}
                  </span>
                </div>
              </div>
              
              <div className="weather-description">
                {multimedia.weather.conditions?.description}
              </div>
            </div>

            <div className="weather-details">
              <div className="weather-stat">
                <span className="stat-label">💧 Humidity</span>
                <span className="stat-value">{multimedia.weather.current?.humidity}%</span>
              </div>
              
              {multimedia.weather.wind && (
                <div className="weather-stat">
                  <span className="stat-label">💨 Wind</span>
                  <span className="stat-value">
                    {getWindDescription(multimedia.weather.wind)}
                  </span>
                </div>
              )}
              
              {multimedia.weather.current?.visibility && (
                <div className="weather-stat">
                  <span className="stat-label">👁️ Visibility</span>
                  <span className="stat-value">{multimedia.weather.current.visibility} km</span>
                </div>
              )}
            </div>

            {/* Educational Context */}
            {multimedia.weather.educational_context && (
              <div className="weather-education">
                <h4 className="education-title">🎓 Climate Context</h4>
                <p className="climate-type">
                  <strong>Climate:</strong> {multimedia.weather.educational_context.climate_type}
                </p>
                <p className="climate-explanation">
                  {multimedia.weather.educational_context.explanation}
                </p>
                {multimedia.weather.educational_context.best_visit_time && (
                  <p className="visit-time">
                    <strong>Best visit time:</strong> {multimedia.weather.educational_context.best_visit_time}
                  </p>
                )}
              </div>
            )}

            {/* Spy Context */}
            {multimedia.weather.spy_relevance && (
              <div className="spy-context">
                <h4 className="spy-title">🕵️ Agent Intel</h4>
                <div className="spy-stats">
                  <span className="spy-stat">
                    <strong>Visibility:</strong> {multimedia.weather.spy_relevance.visibility_status}
                  </span>
                  <span className="spy-stat">
                    <strong>Cover conditions:</strong> {multimedia.weather.spy_relevance.cover_conditions}
                  </span>
                </div>
                {multimedia.weather.spy_relevance.operational_notes?.length > 0 && (
                  <ul className="operational-notes">
                    {multimedia.weather.spy_relevance.operational_notes.map((note, index) => (
                      <li key={index} className="note">{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {multimedia.weather.source === 'fallback' && (
              <div className="fallback-notice">
                <small>⚠️ Live weather data temporarily unavailable</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Language Pronunciation (if available) */}
      {multimedia.pronunciation?.length > 0 && (
        <div className="multimedia-section pronunciation-section">
          <h3 className="section-title">
            <span className="section-icon">🗣️</span>
            Language Guide
          </h3>
          
          <div className="pronunciation-list">
            {multimedia.pronunciation.map((item, index) => (
              <div key={index} className="pronunciation-item">
                <span className="word">{item.word}</span>
                <span className="pronunciation">[{item.pronunciation}]</span>
                {item.language && (
                  <span className="language">{item.language}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RegionalMultimedia;