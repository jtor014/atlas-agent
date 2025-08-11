import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

function UserProfile({ onClose, showFull = false }) {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!showFull && !isAuthenticated) {
    return (
      <div className="login-prompt">
        <button className="login-btn" onClick={login}>
          <span className="google-icon">🚀</span>
          Sign in with Google
        </button>
        <p className="login-subtitle">Save your progress and compete!</p>
      </div>
    );
  }

  if (!showFull) {
    return (
      <div className="user-avatar" onClick={onClose}>
        <img src={user.avatar} alt={user.name} />
        <span className="user-name">{user.name}</span>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="profile-avatar">
            <img src={user.avatar} alt={user.name} />
          </div>
          <h2>{user.name}</h2>
          <p className="user-email">{user.email}</p>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <span className="stat-value">{user.totalScore?.toLocaleString() || 0}</span>
              <span className="stat-label">Total Score</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🕵️</div>
            <div className="stat-info">
              <span className="stat-value">{user.agentLevel}</span>
              <span className="stat-label">Agent Level</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <span className="stat-value">{user.accuracy || 0}%</span>
              <span className="stat-label">Accuracy</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-info">
              <span className="stat-value">{user.gamesPlayed || 0}</span>
              <span className="stat-label">Games Played</span>
            </div>
          </div>
        </div>

        <div className="profile-progress">
          <h3>🗺️ Regional Progress</h3>
          <div className="regions-grid">
            {user.completedRegions && JSON.parse(user.completedRegions).map(region => (
              <div key={region} className="completed-region">
                ✅ {region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ')}
              </div>
            ))}
            {user.unlockedRegions && JSON.parse(user.unlockedRegions)
              .filter(region => !JSON.parse(user.completedRegions || '[]').includes(region))
              .map(region => (
                <div key={region} className="unlocked-region">
                  🔓 {region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ')}
                </div>
              ))
            }
          </div>
        </div>

        <div className="profile-actions">
          <button className="logout-btn" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;