// Atlas Agent Learning Module API Routes
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// JWT middleware for authenticated routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Get all regions with countries and module counts
router.get('/regions', async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      include: {
        countries: {
          include: {
            learningModules: {
              select: {
                id: true,
                title: true,
                type: true,
                estimatedTime: true,
                orderIndex: true
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      },
      orderBy: { unlockOrder: 'asc' }
    });

    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// Get specific country with all learning modules
router.get('/countries/:countryId', async (req, res) => {
  try {
    const { countryId } = req.params;
    
    const country = await prisma.country.findUnique({
      where: { id: countryId },
      include: {
        region: true,
        learningModules: {
          include: {
            moduleContent: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json(country);
  } catch (error) {
    console.error('Error fetching country:', error);
    res.status(500).json({ error: 'Failed to fetch country details' });
  }
});

// Get specific learning module with all content
router.get('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId },
      include: {
        country: {
          include: { region: true }
        },
        moduleContent: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!module) {
      return res.status(404).json({ error: 'Learning module not found' });
    }

    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

// Start a learning module (authenticated)
router.post('/modules/:moduleId/start', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    // Check if module exists
    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId },
      include: { moduleContent: true }
    });

    if (!module) {
      return res.status(404).json({ error: 'Learning module not found' });
    }

    // Create or update progress
    const progress = await prisma.moduleProgress.upsert({
      where: {
        userId_moduleId: {
          userId: userId,
          moduleId: moduleId
        }
      },
      update: {
        status: 'in_progress',
        currentStep: 0,
        lastActivity: new Date()
      },
      create: {
        userId: userId,
        moduleId: moduleId,
        status: 'in_progress',
        currentStep: 0,
        totalSteps: module.moduleContent.length,
        startedAt: new Date()
      }
    });

    res.json({ progress, module });
  } catch (error) {
    console.error('Error starting module:', error);
    res.status(500).json({ error: 'Failed to start module' });
  }
});

// Update module progress (authenticated)
router.post('/modules/:moduleId/progress', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;
    const { 
      currentStep, 
      score, 
      timeSpent, 
      correctAnswers, 
      totalAnswers, 
      hintsUsed 
    } = req.body;

    const progress = await prisma.moduleProgress.update({
      where: {
        userId_moduleId: {
          userId: userId,
          moduleId: moduleId
        }
      },
      data: {
        currentStep: currentStep,
        score: score,
        timeSpent: timeSpent,
        correctAnswers: correctAnswers,
        totalAnswers: totalAnswers,
        hintsUsed: hintsUsed,
        lastActivity: new Date()
      }
    });

    res.json({ progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Complete a learning module (authenticated)
router.post('/modules/:moduleId/complete', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;
    const { finalScore, totalTimeSpent } = req.body;

    const progress = await prisma.moduleProgress.update({
      where: {
        userId_moduleId: {
          userId: userId,
          moduleId: moduleId
        }
      },
      data: {
        status: 'completed',
        score: finalScore,
        timeSpent: totalTimeSpent,
        completedAt: new Date(),
        lastActivity: new Date()
      }
    });

    // Update user's overall progress
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalScore: {
          increment: finalScore || 0
        }
      }
    });

    res.json({ progress });
  } catch (error) {
    console.error('Error completing module:', error);
    res.status(500).json({ error: 'Failed to complete module' });
  }
});

// Get user's learning progress (authenticated)
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await prisma.moduleProgress.findMany({
      where: { userId: userId },
      include: {
        module: {
          include: {
            country: {
              include: { region: true }
            }
          }
        }
      }
    });

    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Submit answer for interactive content (authenticated)
router.post('/content/:contentId/answer', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { answer, timeSpent } = req.body;

    const content = await prisma.moduleContent.findUnique({
      where: { id: contentId }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    let isCorrect = false;
    let feedback = '';

    // Check answer based on content type
    if (content.correctAnswers && content.correctAnswers.length > 0) {
      isCorrect = content.correctAnswers.includes(answer);
      feedback = isCorrect ? 'Correct!' : 'Not quite right. Try again!';
    } else {
      // For exploration-type content, all answers are valid
      isCorrect = true;
      feedback = 'Great exploration!';
    }

    res.json({
      isCorrect,
      feedback,
      correctAnswers: isCorrect ? null : content.correctAnswers,
      hints: !isCorrect ? content.hints : null
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

export default router;