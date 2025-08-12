import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('atlas_token'));

  const API_BASE_URL = 'https://atlas-agent-production-4cd2.up.railway.app';

  // Check for auth token on mount and URL callback
  useEffect(() => {
    const checkAuth = async () => {
      // Check URL for auth callback token
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        localStorage.setItem('atlas_token', urlToken);
        setToken(urlToken);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const currentToken = urlToken || token;
      
      if (currentToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token invalid, remove it
            localStorage.removeItem('atlas_token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('atlas_token');
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('atlas_token');
      setToken(null);
      setUser(null);
    }
  };

  const saveProgress = async (gameData) => {
    if (!token || !user) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });

      if (response.ok) {
        const data = await response.json();
        // Update user with new stats
        setUser(prev => ({
          ...prev,
          totalScore: data.user.totalScore,
          agentLevel: data.user.agentLevel,
          gamesPlayed: data.user.gamesPlayed
        }));
        return true;
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
    return false;
  };

  const updateUserAge = async (age) => {
    if (!token || !user) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/age`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ age })
      });

      if (response.ok) {
        // Update user with new age
        setUser(prev => ({
          ...prev,
          age: age
        }));
        return true;
      }
    } catch (error) {
      console.error('Failed to update age:', error);
    }
    return false;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    saveProgress,
    updateUserAge,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;