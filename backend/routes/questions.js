import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Get questions for a specific region
router.get('/region/:regionId', async (req, res) => {
  try {
    const { regionId } = req.params;
    const { count = 5, difficulty } = req.query;

    const where = { region: regionId };
    if (difficulty) {
      where.difficulty = difficulty;
    }

    const questions = await prisma.question.findMany({
      where,
      take: parseInt(count)
    });
    
    if (questions.length === 0) {
      const availableRegions = await prisma.question.findMany({
        select: { region: true },
        distinct: ['region']
      });
      
      return res.status(404).json({
        error: 'No questions found for region',
        availableRegions: availableRegions.map(r => r.region)
      });
    }

    // Randomize questions
    const shuffled = questions.sort(() => 0.5 - Math.random());

    // Remove correct answers from the response for security
    const questionsForClient = shuffled.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      region: q.region
    }));

    res.json({
      region: regionId,
      count: questionsForClient.length,
      difficulty: difficulty || 'all',
      questions: questionsForClient
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Submit answer and get result
router.post('/answer', async (req, res) => {
  try {
    const { questionId, answer, sessionId } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        error: 'Question ID and answer are required'
      });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({
        error: 'Question not found'
      });
    }

    const isCorrect = question.correctAnswer === answer;
    const points = isCorrect ? (question.difficulty === 'hard' ? 300 : question.difficulty === 'medium' ? 200 : 100) : 0;

    // Record the answer if session is provided
    if (sessionId) {
      await prisma.answer.create({
        data: {
          sessionId,
          questionId,
          selectedAnswer: answer,
          isCorrect,
          pointsEarned: points
        }
      }).catch(error => {
        console.warn('Could not record answer:', error.message);
      });
    }

    res.json({
      questionId,
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      points,
      explanation: isCorrect ? 'Correct!' : `The correct answer is ${question.correctAnswer}`
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get question statistics
router.get('/stats', async (req, res) => {
  try {
    const totalQuestions = await prisma.question.count();
    
    const regionStats = await prisma.question.groupBy({
      by: ['region', 'difficulty'],
      _count: true
    });

    const stats = {};
    for (const stat of regionStats) {
      if (!stats[stat.region]) {
        stats[stat.region] = {
          total: 0,
          byDifficulty: { easy: 0, medium: 0, hard: 0 }
        };
      }
      stats[stat.region].total += stat._count;
      stats[stat.region].byDifficulty[stat.difficulty] = stat._count;
    }

    res.json({
      totalQuestions,
      regions: stats
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ error: 'Failed to fetch question statistics' });
  }
});

// Get all available regions
router.get('/regions', async (req, res) => {
  try {
    const regionCounts = await prisma.question.groupBy({
      by: ['region'],
      _count: true
    });

    const regions = regionCounts.map(regionData => ({
      id: regionData.region,
      name: regionData.region.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      questionCount: regionData._count
    }));

    res.json({
      regions,
      totalRegions: regions.length
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

export default router;