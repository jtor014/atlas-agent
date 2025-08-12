import { useState } from 'react';
import './AgeOnboarding.css';

function AgeOnboarding({ onComplete, onSkip }) {
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const ageNum = parseInt(age);
    if (!ageNum || ageNum < 8 || ageNum > 100) {
      setError('Please enter a valid age between 8 and 100');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('atlas_token');
      const response = await fetch('https://atlas-agent-production-4cd2.up.railway.app/auth/age', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ age: ageNum })
      });

      if (response.ok) {
        onComplete(ageNum);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save age');
      }
    } catch (error) {
      console.error('Age update error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ageRanges = [
    { label: '8-10 years (Elementary)', range: '8-10', description: 'Basic geography and simple facts' },
    { label: '11-12 years (Middle School)', range: '11-12', description: 'More detailed exploration with educational content' },
    { label: '13-14 years (Early High School)', range: '13-14', description: 'Complex topics and cultural analysis' },
    { label: '15-16 years (High School)', range: '15-16', description: 'Advanced concepts and global relationships' },
    { label: '17+ years (Advanced)', range: '17+', description: 'University-level analysis and critical thinking' }
  ];

  const handleRangeSelect = (range) => {
    if (range === '8-10') setAge('9');
    else if (range === '11-12') setAge('12');
    else if (range === '13-14') setAge('14');
    else if (range === '15-16') setAge('16');
    else if (range === '17+') setAge('18');
  };

  return (
    <div className="age-onboarding">
      <div className="onboarding-container">
        <div className="spy-header">
          <div className="classification-label">AGENT PROFILE SETUP</div>
          <h1 className="onboarding-title">🕵️ Welcome to Atlas Agent</h1>
          <p className="onboarding-subtitle">
            We tailor missions to your experience level for the perfect challenge
          </p>
        </div>

        <div className="age-form-container">
          <h2>Select Your Experience Level</h2>
          <p className="form-description">
            This helps us adjust question difficulty and content appropriately
          </p>

          <div className="age-ranges">
            {ageRanges.map((range) => (
              <button
                key={range.range}
                className={`age-range-btn ${age && range.range.includes(age) ? 'selected' : ''}`}
                onClick={() => handleRangeSelect(range.range)}
                type="button"
              >
                <div className="range-label">{range.label}</div>
                <div className="range-description">{range.description}</div>
              </button>
            ))}
          </div>

          <div className="age-input-section">
            <p className="or-divider">Or enter your exact age:</p>
            <form onSubmit={handleSubmit} className="age-form">
              <div className="input-group">
                <label htmlFor="age" className="age-label">Age:</label>
                <input
                  type="number"
                  id="age"
                  min="8"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="age-input"
                  placeholder="Enter age"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={!age || loading}
                  className="submit-btn"
                >
                  {loading ? '🔄 Setting Up...' : '🚀 Start Mission'}
                </button>
                
                <button
                  type="button"
                  onClick={onSkip}
                  className="skip-btn"
                >
                  Skip (Use Default Difficulty)
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="privacy-note">
          <p>
            🔒 Your age is used only to provide age-appropriate content and is kept private.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AgeOnboarding;