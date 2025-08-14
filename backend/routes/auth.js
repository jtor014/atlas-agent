import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://atlas-agent-production-4cd2.up.railway.app/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    });

    if (user) {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
        }
      });
    }

    return done(null, user);
  } catch (error) {
    console.error('OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Auth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user.id,
          email: req.user.email 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Check if user needs to complete registration (age)
      const needsRegistration = !req.user.age;
      
      // Redirect to frontend with token and registration status
      const frontendUrl = process.env.FRONTEND_URL || 'https://atlas-agent.torkington.au';
      if (needsRegistration) {
        res.redirect(`${frontendUrl}?token=${token}&newUser=true`);
      } else {
        res.redirect(`${frontendUrl}?token=${token}`);
      }
    } catch (error) {
      console.error('Callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'https://atlas-agent.torkington.au';
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        age: true,
        totalScore: true,
        agentLevel: true,
        completedRegions: true,
        unlockedRegions: true,
        totalQuestions: true,
        correctAnswers: true,
        gamesPlayed: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        ...user,
        accuracy: user.totalQuestions > 0 ? Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Update user age (for new users)
router.post('/age', authenticateToken, async (req, res) => {
  try {
    const { age } = req.body;

    if (!age || age < 8 || age > 100) {
      return res.status(400).json({ error: 'Please provide a valid age between 8 and 100' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { age: parseInt(age) }
    });

    res.json({ 
      message: 'Age updated successfully',
      user: {
        id: user.id,
        age: user.age
      }
    });
  } catch (error) {
    console.error('Update age error:', error);
    res.status(500).json({ error: 'Failed to update age' });
  }
});

// Update user progress (improved with proper incremental updates)
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { 
      score, 
      completedRegions = [], 
      unlockedRegions = [], 
      totalQuestions, 
      correctAnswers,
      agentLevel,
      sessionQuestions = 0,
      sessionCorrect = 0
    } = req.body;

    // Get current user data for incremental updates
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        totalScore: true,
        totalQuestions: true,
        correctAnswers: true,
        gamesPlayed: true
      }
    });

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        totalScore: Math.max(score || 0, currentUser.totalScore || 0), // Take highest score
        completedRegions: JSON.stringify(completedRegions),
        unlockedRegions: JSON.stringify(unlockedRegions),
        totalQuestions: (currentUser.totalQuestions || 0) + (sessionQuestions || 0),
        correctAnswers: (currentUser.correctAnswers || 0) + (sessionCorrect || 0),
        agentLevel: agentLevel || currentUser.agentLevel,
        gamesPlayed: { increment: 1 },
        lastLoginAt: new Date()
      }
    });

    res.json({ 
      message: 'Progress saved successfully',
      user: {
        totalScore: user.totalScore,
        agentLevel: user.agentLevel,
        gamesPlayed: user.gamesPlayed,
        totalQuestions: user.totalQuestions,
        correctAnswers: user.correctAnswers,
        accuracy: user.totalQuestions > 0 ? Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ error: 'Failed to save progress', details: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export default router;