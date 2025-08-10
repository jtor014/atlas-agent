import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Submit score to leaderboard
router.post('/submit', async (req, res) => {
  try {
    const { agentName, score, completedRegions, agentLevel, sessionId } = req.body;

    if (!agentName || score === undefined) {
      return res.status(400).json({
        error: 'Agent name and score are required'
      });
    }

    const entryData = {
      agentName: agentName.trim(),
      score: parseInt(score),
      completedRegions: completedRegions || [],
      agentLevel: agentLevel || 'Trainee',
      regionsCompleted: (completedRegions || []).length
    };

    // Check if entry already exists for this session
    const existingEntry = await prisma.leaderboardEntry.findUnique({
      where: { sessionId }
    });

    let entry;
    if (existingEntry) {
      // Update existing entry if score improved
      if (entryData.score > existingEntry.score) {
        entry = await prisma.leaderboardEntry.update({
          where: { sessionId },
          data: entryData
        });
        
        const rank = await getRank(entry.score);
        res.json({
          message: 'Leaderboard score updated',
          entry,
          rank
        });
      } else {
        const rank = await getRank(existingEntry.score);
        res.json({
          message: 'Score not improved',
          currentEntry: existingEntry,
          rank
        });
      }
    } else {
      // Create new entry
      entry = await prisma.leaderboardEntry.create({
        data: {
          sessionId,
          ...entryData
        }
      });
      
      const rank = await getRank(entry.score);
      res.status(201).json({
        message: 'Score submitted to leaderboard',
        entry,
        rank
      });
    }
  } catch (error) {
    console.error('Error submitting to leaderboard:', error);
    res.status(500).json({ error: 'Failed to submit score to leaderboard' });
  }
});

// Get top scores
router.get('/top', async (req, res) => {
  try {
    const { limit = 10, region } = req.query;
    
    const where = {};
    if (region) {
      where.completedRegions = {
        path: '$',
        array_contains: region
      };
    }

    const entries = await prisma.leaderboardEntry.findMany({
      where,
      take: parseInt(limit),
      orderBy: [
        { score: 'desc' },
        { completedAt: 'asc' }
      ]
    });

    const topEntries = entries.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      completedAt: entry.completedAt.toISOString()
    }));

    const totalCount = await prisma.leaderboardEntry.count({ where });

    res.json({
      leaderboard: topEntries,
      totalEntries: totalCount,
      filter: region || 'all'
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get leaderboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalEntries = await prisma.leaderboardEntry.count();
    
    if (totalEntries === 0) {
      return res.json({
        totalEntries: 0,
        highestScore: 0,
        averageScore: 0,
        topAgentLevel: 'None',
        mostCompletedRegions: 0
      });
    }

    const stats = await prisma.leaderboardEntry.aggregate({
      _max: { score: true, regionsCompleted: true },
      _avg: { score: true }
    });

    // Find most common agent level among top scorers
    const topEntries = await prisma.leaderboardEntry.findMany({
      take: 5,
      orderBy: { score: 'desc' },
      select: { agentLevel: true }
    });
    
    const levelCounts = {};
    topEntries.forEach(entry => {
      levelCounts[entry.agentLevel] = (levelCounts[entry.agentLevel] || 0) + 1;
    });
    
    const topAgentLevel = Object.entries(levelCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Trainee';

    // Recent activity
    const recentActivity = await prisma.leaderboardEntry.findMany({
      take: 5,
      orderBy: { completedAt: 'desc' },
      select: {
        agentName: true,
        score: true,
        completedAt: true
      }
    });

    res.json({
      totalEntries,
      highestScore: stats._max.score || 0,
      averageScore: Math.round(stats._avg.score || 0),
      topAgentLevel,
      mostCompletedRegions: stats._max.regionsCompleted || 0,
      recentActivity: recentActivity.map(entry => ({
        ...entry,
        completedAt: entry.completedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard statistics' });
  }
});

// Get specific agent's scores
router.get('/agent/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    
    const agentEntries = await prisma.leaderboardEntry.findMany({
      where: {
        agentName: {
          mode: 'insensitive',
          equals: agentName
        }
      },
      orderBy: { score: 'desc' }
    });

    if (agentEntries.length === 0) {
      return res.status(404).json({
        error: 'Agent not found in leaderboard'
      });
    }

    const bestScore = agentEntries[0];
    const totalAttempts = agentEntries.length;
    const averageScore = Math.round(
      agentEntries.reduce((sum, entry) => sum + entry.score, 0) / totalAttempts
    );

    const bestRank = await getRank(bestScore.score);

    res.json({
      agentName,
      bestScore: bestScore.score,
      bestRank,
      averageScore,
      totalAttempts,
      recentScores: agentEntries.slice(0, 10).map(entry => ({
        ...entry,
        completedAt: entry.completedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching agent scores:', error);
    res.status(500).json({ error: 'Failed to fetch agent scores' });
  }
});

// Helper function to calculate rank
async function getRank(score) {
  try {
    const higherScoreCount = await prisma.leaderboardEntry.count({
      where: {
        score: {
          gt: score
        }
      }
    });
    
    return higherScoreCount + 1;
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 1;
  }
}

// Clear leaderboard (for development/testing)
router.delete('/clear', async (req, res) => {
  try {
    const clearedCount = await prisma.leaderboardEntry.count();
    await prisma.leaderboardEntry.deleteMany();
    
    res.json({
      message: 'Leaderboard cleared',
      clearedEntries: clearedCount
    });
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    res.status(500).json({ error: 'Failed to clear leaderboard' });
  }
});

export default router;