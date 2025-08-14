// AI Question Generation API Routes
import express from 'express';
import AIQuestionGenerator from '../lib/aiQuestionGenerator.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const aiGenerator = new AIQuestionGenerator();

// Performance tracking for adaptive difficulty
class PerformanceTracker {
  static async getPlayerPerformance(sessionId, userId = null) {
    try {
      // Get recent answers for performance analysis
      const recentAnswers = await prisma.answer.findMany({
        where: {
          ...(sessionId && { sessionId }),
          ...(userId && { session: { userId } })
        },
        orderBy: { answeredAt: 'desc' },
        take: 10,
        include: {
          question: {
            select: { difficulty: true, region: true }
          }
        }
      });

      if (recentAnswers.length === 0) {
        return this.getDefaultPerformance();
      }

      // Calculate performance metrics
      const accuracy = recentAnswers.reduce((sum, answer) => 
        sum + (answer.isCorrect ? 1 : 0), 0) / recentAnswers.length;
      
      const averageTime = recentAnswers.reduce((sum, answer) => {
        const timeDiff = new Date(answer.answeredAt) - new Date(answer.createdAt || answer.answeredAt);
        return sum + Math.max(timeDiff / 1000, 5); // Minimum 5 seconds
      }, 0) / recentAnswers.length;

      // Calculate current streak
      let streak = 0;
      for (const answer of recentAnswers) {
        if (answer.isCorrect) streak++;
        else break;
      }

      // Analyze topic performance
      const topicPerformance = this.analyzeTopicPerformance(recentAnswers);

      return {
        recentAccuracy: accuracy,
        averageTime: Math.round(averageTime),
        streakCount: streak,
        totalAnswers: recentAnswers.length,
        strongTopics: topicPerformance.strong,
        strugglingTopics: topicPerformance.struggling,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting player performance:', error);
      return this.getDefaultPerformance();
    }
  }

  static getDefaultPerformance() {
    return {
      recentAccuracy: 0.7,
      averageTime: 20,
      streakCount: 0,
      totalAnswers: 0,
      strongTopics: [],
      strugglingTopics: [],
      lastUpdated: new Date()
    };
  }

  static analyzeTopicPerformance(answers) {
    const regionPerformance = {};
    
    answers.forEach(answer => {
      const region = answer.question?.region || 'unknown';
      if (!regionPerformance[region]) {
        regionPerformance[region] = { correct: 0, total: 0 };
      }
      regionPerformance[region].total++;
      if (answer.isCorrect) {
        regionPerformance[region].correct++;
      }
    });

    const strong = [];
    const struggling = [];

    Object.entries(regionPerformance).forEach(([region, perf]) => {
      if (perf.total >= 3) { // Need at least 3 attempts to judge
        const accuracy = perf.correct / perf.total;
        if (accuracy >= 0.8) strong.push(region);
        else if (accuracy < 0.5) struggling.push(region);
      }
    });

    return { strong, struggling };
  }
}

// Generate adaptive AI question
router.post('/generate-question', async (req, res) => {
  try {
    const {
      region = 'western-europe',
      category = 'Geography & Environment',
      difficulty = 'medium',
      sessionId = null,
      userId = null
    } = req.body;

    // Validate inputs
    const validCategories = [
      'Geography & Environment',
      'History & Civilizations', 
      'Culture & Philosophy',
      'Modern Context',
      'Challenge Puzzles'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories
      });
    }

    // Get player performance for adaptive difficulty
    const performanceContext = await PerformanceTracker.getPlayerPerformance(sessionId, userId);
    
    // Get player profile if available
    let playerProfile = {};
    let userAge = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          agentLevel: true,
          completedRegions: true,
          totalScore: true,
          correctAnswers: true,
          totalQuestions: true,
          age: true
        }
      });
      playerProfile = user || {};
      userAge = user?.age || null;
    }

    // Generate AI question
    const question = await aiGenerator.generateAdaptiveQuestion({
      region,
      category,
      baseDifficulty: difficulty,
      playerProfile,
      performanceContext,
      userAge
    });

    // Store generated question in database for tracking
    const savedQuestion = await prisma.question.create({
      data: {
        question: question.question,
        options: question.options,
        correctAnswer: question.options[question.correctAnswer],
        difficulty: question.difficulty,
        region: question.region,
        createdAt: new Date(),
        // Store AI metadata in JSON field if available
        metadata: question.metadata || {}
      }
    });

    // Return question with database ID
    res.json({
      ...question,
      id: savedQuestion.id,
      performance_context: performanceContext,
      ai_generated: true
    });

  } catch (error) {
    console.error('AI Question Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate question',
      message: error.message,
      fallback_available: true
    });
  }
});

// Generate batch of questions for pre-loading
router.post('/generate-batch', async (req, res) => {
  try {
    const {
      regions = ['western-europe'],
      categories = ['Geography & Environment'],
      difficulties = ['medium'],
      count = 5,
      sessionId = null,
      userId = null
    } = req.body;

    if (count > 20) {
      return res.status(400).json({
        error: 'Maximum batch size is 20 questions'
      });
    }

    // Get player performance
    const performanceContext = await PerformanceTracker.getPlayerPerformance(sessionId, userId);
    
    // Create question specifications
    const questionSpecs = [];
    for (let i = 0; i < count; i++) {
      questionSpecs.push({
        region: regions[i % regions.length],
        category: categories[i % categories.length],
        baseDifficulty: difficulties[i % difficulties.length],
        playerProfile: {},
        performanceContext
      });
    }

    // Generate batch of questions
    const questions = await aiGenerator.batchGenerateQuestions(questionSpecs);

    // Save all questions to database
    const savedQuestions = await Promise.all(
      questions.map(question =>
        prisma.question.create({
          data: {
            question: question.question,
            options: question.options,
            correctAnswer: question.options[question.correctAnswer],
            difficulty: question.difficulty,
            region: question.region,
            createdAt: new Date(),
            metadata: question.metadata || {}
          }
        })
      )
    );

    // Add database IDs to questions
    const questionsWithIds = questions.map((question, index) => ({
      ...question,
      id: savedQuestions[index].id,
      ai_generated: true
    }));

    res.json({
      questions: questionsWithIds,
      count: questionsWithIds.length,
      performance_context: performanceContext,
      estimated_cost: questions.reduce((sum, q) => 
        sum + (q.metadata?.generation_cost_estimate || 0.002), 0)
    });

  } catch (error) {
    console.error('Batch Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate question batch',
      message: error.message
    });
  }
});

// Get player performance analytics
router.get('/performance/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    const performance = await PerformanceTracker.getPlayerPerformance(sessionId, userId);
    
    res.json({
      performance,
      recommendations: {
        suggested_difficulty: performance.recentAccuracy > 0.8 ? 'hard' : 
                             performance.recentAccuracy < 0.5 ? 'easy' : 'medium',
        focus_areas: performance.strugglingTopics,
        strong_areas: performance.strongTopics
      }
    });

  } catch (error) {
    console.error('Performance Analytics Error:', error);
    res.status(500).json({
      error: 'Failed to get performance analytics',
      message: error.message
    });
  }
});

// Generate AI-powered mission narrative and sequence
router.post('/generate-mission-narrative', async (req, res) => {
  try {
    const {
      agentName,
      startingRegion,
      missionSequence = [],
      userAge = null,
      sessionId = null
    } = req.body;

    const aiGenerator = new AIQuestionGenerator();

    // Create narrative prompt
    const narrativePrompt = `Create a unique spy thriller narrative for Atlas Agent, a global intelligence game.

MISSION PARAMETERS:
- Agent Name: ${agentName}
- Starting Region: ${startingRegion}
- Mission Sequence: ${missionSequence.join(' → ')}
- Player Age: ${userAge || 'Not specified'}

NARRATIVE REQUIREMENTS:
1. Create an overarching conspiracy/threat storyline that connects all regions
2. Generate unique mission codenames for each region operation
3. Provide region-specific storyline connections and plot developments
4. Include mysterious antagonist organization with clear global motives
5. Create compelling narrative tension that builds across regions
6. Ensure age-appropriate content and complexity
7. Generate unique character names for local contacts in each region

OUTPUT FORMAT (JSON):
{
  "overall_narrative": {
    "title": "Operation: [Unique Name]",
    "threat_description": "Description of the global conspiracy/threat",
    "antagonist_organization": "Name and brief description of enemy organization",
    "victory_condition": "What needs to be achieved to stop the threat"
  },
  "regional_narratives": {
    "region-id": {
      "operation_name": "Operation: [Unique Name]",
      "threat_level": "LOW|MODERATE|HIGH|CRITICAL|MAXIMUM|ULTIMATE",
      "local_plot": "Region-specific story development",
      "connection_to_overall": "How this region connects to the main plot",
      "local_contacts": ["Contact Name (Location)", "Contact Name (Location)"],
      "intelligence_target": "What the agent is trying to discover/accomplish"
    }
  },
  "story_progression": "Brief description of how the narrative evolves across regions"
}`;

    const response = await aiGenerator.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are a master storyteller specializing in spy thrillers and global conspiracy narratives. Create compelling, age-appropriate stories that make learning about world geography and cultures exciting."
        },
        {
          role: "user",
          content: narrativePrompt
        }
      ],
      temperature: 0.8, // Higher creativity for narrative
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const narrative = JSON.parse(response.choices[0].message.content);
    
    res.json({
      success: true,
      session_id: sessionId,
      agent_name: agentName,
      narrative,
      generation_cost: 0.004, // Approximate cost
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Narrative Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate mission narrative',
      message: error.message,
      fallback_available: true
    });
  }
});

// Test AI generation (for development)
router.post('/test-generation', async (req, res) => {
  try {
    const { userAge, region = 'western-europe', category = 'Geography & Environment', difficulty = 'medium' } = req.body;
    
    const testQuestion = await aiGenerator.generateAdaptiveQuestion({
      region,
      category,
      baseDifficulty: difficulty,
      playerProfile: { agentLevel: 'Field Agent' },
      performanceContext: { recentAccuracy: 0.7, averageTime: 20, streakCount: 2 },
      userAge
    });

    res.json({
      message: 'AI generation test successful',
      test_question: testQuestion,
      ai_status: 'operational'
    });

  } catch (error) {
    console.error('AI Test Error:', error);
    res.status(500).json({
      error: 'AI generation test failed',
      message: error.message,
      ai_status: 'error'
    });
  }
});

export default router;