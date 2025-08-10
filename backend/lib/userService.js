import prisma from './prisma.js';

export class UserService {
  
  // Get user profile with stats
  static async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gameSessions: {
          orderBy: { startTime: 'desc' },
          take: 5 // Last 5 games
        },
        _count: {
          select: {
            gameSessions: true,
            leaderboardEntries: true
          }
        }
      }
    });

    if (!user) return null;

    return {
      ...user,
      completedRegions: JSON.parse(user.completedRegions),
      unlockedRegions: JSON.parse(user.unlockedRegions),
      accuracy: user.totalQuestions > 0 ? Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0,
      stats: {
        gamesPlayed: user._count.gameSessions,
        leaderboardEntries: user._count.leaderboardEntries
      }
    };
  }

  // Update user progress after game completion
  static async updateUserProgress(userId, gameData) {
    const { 
      score, 
      completedRegions, 
      unlockedRegions, 
      correctAnswers, 
      totalQuestions,
      agentLevel 
    } = gameData;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Calculate new totals
    const newTotalScore = currentUser.totalScore + score;
    const newTotalQuestions = currentUser.totalQuestions + totalQuestions;
    const newCorrectAnswers = currentUser.correctAnswers + correctAnswers;

    // Determine new agent level based on total score
    let newAgentLevel = this.calculateAgentLevel(newTotalScore);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalScore: newTotalScore,
        totalQuestions: newTotalQuestions,
        correctAnswers: newCorrectAnswers,
        completedRegions: JSON.stringify(completedRegions),
        unlockedRegions: JSON.stringify(unlockedRegions),
        agentLevel: newAgentLevel,
        gamesPlayed: { increment: 1 }
      }
    });

    return {
      ...updatedUser,
      completedRegions: JSON.parse(updatedUser.completedRegions),
      unlockedRegions: JSON.parse(updatedUser.unlockedRegions)
    };
  }

  // Calculate agent level based on score
  static calculateAgentLevel(totalScore) {
    if (totalScore >= 5000) return 'Master Agent';
    if (totalScore >= 3000) return 'Senior Agent';
    if (totalScore >= 1500) return 'Field Agent';
    if (totalScore >= 500) return 'Junior Agent';
    return 'Trainee';
  }

  // Get user leaderboard position
  static async getUserLeaderboardPosition(userId) {
    const userRank = await prisma.user.count({
      where: {
        totalScore: {
          gt: await prisma.user.findUnique({
            where: { id: userId },
            select: { totalScore: true }
          }).then(u => u?.totalScore || 0)
        }
      }
    });

    return userRank + 1; // Add 1 because count gives users above, we want position
  }

  // Unlock new regions based on progress
  static calculateUnlockedRegions(completedRegions) {
    const unlockRules = {
      'western-europe': [], // Starting region
      'eastern-europe': ['western-europe'],
      'asia': ['western-europe', 'eastern-europe'],
      'africa': ['western-europe', 'eastern-europe', 'asia']
    };

    const unlockedRegions = ['western-europe']; // Always start with western-europe

    for (const [region, requirements] of Object.entries(unlockRules)) {
      if (region === 'western-europe') continue; // Already unlocked
      
      const hasAllRequirements = requirements.every(req => 
        completedRegions.includes(req)
      );
      
      if (hasAllRequirements) {
        unlockedRegions.push(region);
      }
    }

    return unlockedRegions;
  }
}

export default UserService;