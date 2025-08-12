import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Start new game session
router.post('/start', async (req, res) => {
  try {
    const { agentName } = req.body;
    
    if (!agentName || agentName.trim().length === 0) {
      return res.status(400).json({
        error: 'Agent name is required'
      });
    }

    const gameSession = await prisma.gameSession.create({
      data: {
        agentName: agentName.trim(),
        score: 0,
        completedRegions: [],
        unlockedRegions: ['Europe'],
        agentLevel: 'Trainee'
      }
    });

    res.status(201).json({
      message: 'Game session started',
      sessionId: gameSession.id,
      gameState: {
        sessionId: gameSession.id,
        agentName: gameSession.agentName,
        score: gameSession.score,
        completedRegions: gameSession.completedRegions,
        unlockedRegions: gameSession.unlockedRegions,
        currentMission: gameSession.currentMission,
        agentLevel: gameSession.agentLevel,
        startTime: gameSession.startTime.toISOString(),
        lastActivity: gameSession.lastActivity.toISOString()
      }
    });
  } catch (error) {
    console.error('Error starting game session:', error);
    res.status(500).json({ error: 'Failed to start game session' });
  }
});

// Get game state
router.get('/state/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId }
    });

    if (!gameSession) {
      return res.status(404).json({
        error: 'Game session not found'
      });
    }

    res.json({
      gameState: {
        sessionId: gameSession.id,
        agentName: gameSession.agentName,
        score: gameSession.score,
        completedRegions: gameSession.completedRegions,
        unlockedRegions: gameSession.unlockedRegions,
        currentMission: gameSession.currentMission,
        agentLevel: gameSession.agentLevel,
        startTime: gameSession.startTime.toISOString(),
        lastActivity: gameSession.lastActivity.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

// Update game progress
router.put('/progress/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { score, completedRegions, unlockedRegions, agentLevel } = req.body;
    
    const updateData = {};
    if (score !== undefined) updateData.score = score;
    if (completedRegions) updateData.completedRegions = completedRegions;
    if (unlockedRegions) updateData.unlockedRegions = unlockedRegions;
    if (agentLevel) updateData.agentLevel = agentLevel;

    const gameSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: updateData
    });

    res.json({
      message: 'Game progress updated',
      gameState: {
        sessionId: gameSession.id,
        agentName: gameSession.agentName,
        score: gameSession.score,
        completedRegions: gameSession.completedRegions,
        unlockedRegions: gameSession.unlockedRegions,
        currentMission: gameSession.currentMission,
        agentLevel: gameSession.agentLevel,
        startTime: gameSession.startTime.toISOString(),
        lastActivity: gameSession.lastActivity.toISOString()
      }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Game session not found' });
    }
    console.error('Error updating game progress:', error);
    res.status(500).json({ error: 'Failed to update game progress' });
  }
});

// Get all active sessions (for development)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.gameSession.findMany({
      select: {
        id: true,
        agentName: true,
        score: true,
        agentLevel: true,
        lastActivity: true
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    res.json({
      totalSessions: sessions.length,
      sessions: sessions.map(session => ({
        sessionId: session.id,
        agentName: session.agentName,
        score: session.score,
        agentLevel: session.agentLevel,
        lastActivity: session.lastActivity.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Record answer for game session
router.post('/answer', async (req, res) => {
  try {
    const { 
      sessionId, 
      questionId, 
      selectedAnswer, 
      isCorrect, 
      pointsEarned, 
      timeSpent,
      aiGenerated = false 
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    // Verify session exists
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Game session not found'
      });
    }

    // Record the answer
    const answer = await prisma.answer.create({
      data: {
        sessionId,
        questionId: questionId || `ai_${Date.now()}`, // Handle AI-generated questions
        selectedAnswer,
        isCorrect,
        pointsEarned: pointsEarned || 0
      }
    });

    // Update session score and activity
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        score: {
          increment: pointsEarned || 0
        }
      }
    });

    res.json({
      message: 'Answer recorded successfully',
      answerId: answer.id,
      sessionScore: updatedSession.score
    });

  } catch (error) {
    console.error('Error recording answer:', error);
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// Delete game session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await prisma.gameSession.delete({
      where: { id: sessionId }
    });
    
    res.json({ message: 'Game session deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Game session not found' });
    }
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;