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

// Generate progressive story-driven question sequence for a region
router.post('/generate-story-sequence', async (req, res) => {
  try {
    const {
      region,
      agentName,
      userAge = null,
      sessionId = null,
      previousRegions = []
    } = req.body;

    const aiGenerator = new AIQuestionGenerator();

    // Define story progression paths for each region
    const regionStoryPaths = {
      'western-europe': [
        { country: 'France', locations: ['Paris', 'Lyon', 'Marseille'] },
        { country: 'Germany', locations: ['Berlin', 'Munich', 'Hamburg'] },
        { country: 'United Kingdom', locations: ['London', 'Edinburgh', 'Manchester'] },
        { country: 'Italy', locations: ['Rome', 'Milan', 'Naples'] }
      ],
      'eastern-europe': [
        { country: 'Russia', locations: ['Moscow', 'St. Petersburg', 'Volgograd'] },
        { country: 'Poland', locations: ['Warsaw', 'Krakow', 'Gdansk'] },
        { country: 'Czech Republic', locations: ['Prague', 'Brno', 'Ostrava'] },
        { country: 'Hungary', locations: ['Budapest', 'Debrecen', 'Szeged'] }
      ],
      'north-america': [
        { country: 'United States', locations: ['New York', 'Los Angeles', 'Chicago'] },
        { country: 'Canada', locations: ['Toronto', 'Vancouver', 'Montreal'] },
        { country: 'Mexico', locations: ['Mexico City', 'Guadalajara', 'Monterrey'] }
      ],
      'south-america': [
        { country: 'Brazil', locations: ['São Paulo', 'Rio de Janeiro', 'Salvador'] },
        { country: 'Argentina', locations: ['Buenos Aires', 'Córdoba', 'Mendoza'] },
        { country: 'Colombia', locations: ['Bogotá', 'Medellín', 'Cartagena'] }
      ],
      'east-asia': [
        { country: 'Japan', locations: ['Tokyo', 'Osaka', 'Kyoto'] },
        { country: 'China', locations: ['Beijing', 'Shanghai', 'Guangzhou'] },
        { country: 'South Korea', locations: ['Seoul', 'Busan', 'Incheon'] }
      ],
      'southeast-asia': [
        { country: 'Thailand', locations: ['Bangkok', 'Chiang Mai', 'Phuket'] },
        { country: 'Vietnam', locations: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'] },
        { country: 'Singapore', locations: ['Singapore City', 'Jurong', 'Woodlands'] }
      ],
      'south-asia': [
        { country: 'India', locations: ['Mumbai', 'Delhi', 'Bangalore'] },
        { country: 'Pakistan', locations: ['Karachi', 'Lahore', 'Islamabad'] },
        { country: 'Bangladesh', locations: ['Dhaka', 'Chittagong', 'Sylhet'] }
      ],
      'central-west-asia': [
        { country: 'Turkey', locations: ['Istanbul', 'Ankara', 'Izmir'] },
        { country: 'Iran', locations: ['Tehran', 'Isfahan', 'Shiraz'] },
        { country: 'Saudi Arabia', locations: ['Riyadh', 'Jeddah', 'Mecca'] }
      ],
      'africa': [
        { country: 'Egypt', locations: ['Cairo', 'Alexandria', 'Luxor'] },
        { country: 'South Africa', locations: ['Cape Town', 'Johannesburg', 'Durban'] },
        { country: 'Nigeria', locations: ['Lagos', 'Abuja', 'Kano'] }
      ],
      'oceania': [
        { country: 'Australia', locations: ['Sydney', 'Melbourne', 'Perth'] },
        { country: 'New Zealand', locations: ['Auckland', 'Wellington', 'Christchurch'] },
        { country: 'Fiji', locations: ['Suva', 'Nadi', 'Lautoka'] }
      ]
    };

    const storyPath = regionStoryPaths[region] || [];
    
    // Generate story-driven questions following the path
    const storyQuestions = [];
    let currentNarrative = '';
    
    for (let i = 0; i < storyPath.length && storyQuestions.length < 5; i++) {
      const countryData = storyPath[i];
      const locationsToVisit = Math.min(2, countryData.locations.length); // 1-2 questions per country
      
      for (let j = 0; j < locationsToVisit && storyQuestions.length < 5; j++) {
        const location = countryData.locations[j];
        const isCapital = j === 0; // First location is usually the capital/major city
        const isLastInCountry = j === locationsToVisit - 1;
        
        // Create narrative connection
        if (storyQuestions.length === 0) {
          currentNarrative = `Your investigation begins in ${location}, ${countryData.country}. Intelligence suggests this is where the conspiracy originated.`;
        } else if (j === 0) {
          currentNarrative = `The trail leads across the border to ${location}, ${countryData.country}. Your contacts have spotted suspicious activity here.`;
        } else {
          currentNarrative = `Following leads from the capital, you move to ${location} where local sources report strange meetings.`;
        }

        const storyPrompt = `Create a spy-themed geography question that follows this narrative progression:

MISSION CONTEXT:
- Agent Name: ${agentName}
- Current Location: ${location}, ${countryData.country}
- Region: ${region}
- Question ${storyQuestions.length + 1} of 5
- Story Context: ${currentNarrative}
- Player Age: ${userAge || 'Not specified'}

PROGRESSION REQUIREMENTS:
1. This question should feel like a natural part of following leads through ${region}
2. ${isCapital ? 'Focus on major landmarks, government, or cultural significance (capital/major city)' : 'Focus on regional characteristics, local culture, or economic activities'}
3. Create a scenario where the agent needs this knowledge to progress the investigation
4. ${isLastInCountry ? 'End with a clue that leads to the next country' : 'Build tension within the current country'}
5. Make the question feel connected to the ongoing story

RESPONSE FORMAT (JSON):
{
  "question": "Story-driven spy question incorporating the current location and narrative",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "difficulty": "medium",
  "hint": "Strategic hint that fits the spy narrative",
  "explanation": "Why this knowledge helps the agent progress the investigation",
  "location": "${location}",
  "country": "${countryData.country}",
  "region": "${region}",
  "story_context": "${currentNarrative}",
  "narrative_connection": "How this question connects to the overall story",
  "progression_clue": "Hint about what this reveals for the next step"
}`;

        try {
          const response = await aiGenerator.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a master storyteller creating interconnected geography questions that form a compelling spy narrative. Each question should feel like a crucial step in an investigation."
              },
              {
                role: "user",
                content: storyPrompt
              }
            ],
            temperature: 0.8,
            max_tokens: 800,
            response_format: { type: "json_object" }
          });

          const questionData = JSON.parse(response.choices[0].message.content);
          storyQuestions.push({
            ...questionData,
            sequence_number: storyQuestions.length + 1,
            generated_at: new Date().toISOString()
          });
          
        } catch (error) {
          console.error(`Error generating question for ${location}:`, error);
          // Add a fallback question if AI generation fails
          storyQuestions.push({
            question: `Your investigation in ${location}, ${countryData.country} requires local knowledge. What key fact about this location would help your mission?`,
            options: ['Cultural significance', 'Economic importance', 'Strategic location', 'Historical relevance'],
            correctAnswer: 0,
            difficulty: 'medium',
            hint: 'Consider what makes this location important for intelligence work',
            explanation: 'Understanding local significance helps agents blend in and gather information effectively',
            location: location,
            country: countryData.country,
            region: region,
            story_context: currentNarrative,
            narrative_connection: 'Part of the ongoing investigation',
            progression_clue: 'This information helps you understand the local network',
            sequence_number: storyQuestions.length + 1,
            generated_at: new Date().toISOString(),
            is_fallback: true
          });
        }
      }
    }

    res.json({
      success: true,
      session_id: sessionId,
      region: region,
      story_sequence: storyQuestions,
      story_path: storyPath.map(c => `${c.country}: ${c.locations.join(' → ')}`),
      generation_cost: storyQuestions.length * 0.003, // Approximate cost
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Story Sequence Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate story sequence',
      message: error.message,
      fallback_available: true
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