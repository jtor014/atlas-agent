// AI Question Generation Service for Atlas Agent
import OpenAI from 'openai';

class AIQuestionGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Question templates for different categories
    this.templates = {
      'Geography & Environment': {
        easy: 'Basic physical features, capitals, major landmarks',
        medium: 'Climate patterns, natural resources, ecosystems',
        hard: 'Complex geographical relationships, environmental challenges'
      },
      'History & Civilizations': {
        easy: 'Major historical figures, important dates, basic events',
        medium: 'Historical movements, cultural developments, empire connections',
        hard: 'Complex historical analysis, cause-and-effect relationships'
      },
      'Culture & Philosophy': {
        easy: 'Basic cultural practices, famous artworks, religious basics',
        medium: 'Philosophical concepts, cultural significance, artistic movements',
        hard: 'Deep cultural analysis, philosophical debates, cultural synthesis'
      },
      'Modern Context': {
        easy: 'Current leaders, basic politics, major cities',
        medium: 'Economic systems, political structures, social issues',
        hard: 'Complex geopolitical analysis, economic relationships, global challenges'
      },
      'Challenge Puzzles': {
        easy: 'Simple connections between concepts',
        medium: 'Multi-step reasoning, pattern recognition',
        hard: 'Complex synthesis, strategic thinking, multiple variable analysis'
      }
    };

    // Performance-based difficulty adjustments
    this.difficultyAdjustments = {
      'too_easy': 'Make this significantly more challenging with deeper analysis required',
      'slightly_easy': 'Increase complexity slightly with additional details',
      'perfect': 'Maintain current difficulty level',
      'slightly_hard': 'Simplify slightly while maintaining educational value',
      'too_hard': 'Make more accessible with clearer context and hints'
    };
  }

  /**
   * Generate adaptive questions based on player performance
   */
  async generateAdaptiveQuestion(params) {
    const {
      region,
      category,
      baseDifficulty = 'medium',
      playerProfile = {},
      performanceContext = {}
    } = params;

    try {
      // Analyze player performance to adjust difficulty
      const adjustedDifficulty = this.calculateAdaptiveDifficulty(
        baseDifficulty, 
        performanceContext
      );

      // Create specialized prompt based on spy theme and parameters
      const prompt = this.createPrompt({
        region,
        category,
        difficulty: adjustedDifficulty,
        playerProfile,
        performanceContext
      });

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective model
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.7, // Some creativity but consistent quality
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const generatedQuestion = JSON.parse(completion.choices[0].message.content);
      
      // Validate and enhance the generated question
      const validatedQuestion = this.validateAndEnhanceQuestion(generatedQuestion, params);
      
      // Add metadata for tracking
      validatedQuestion.metadata = {
        generated_at: new Date().toISOString(),
        ai_model: 'gpt-4o-mini',
        adaptive_difficulty: adjustedDifficulty,
        base_difficulty: baseDifficulty,
        performance_context: performanceContext,
        generation_cost_estimate: 0.002 // Approximate cost in USD
      };

      return validatedQuestion;

    } catch (error) {
      console.error('AI Question Generation Error:', error);
      
      // Fallback to predefined questions if AI fails
      return this.getFallbackQuestion(region, category, baseDifficulty);
    }
  }

  /**
   * Calculate adaptive difficulty based on player performance
   */
  calculateAdaptiveDifficulty(baseDifficulty, performanceContext) {
    const { 
      recentAccuracy = 0.7, 
      averageTime = 20, 
      streakCount = 0,
      strugglingTopics = [],
      strongTopics = []
    } = performanceContext;

    let adjustment = 'perfect';

    // Performance-based adjustments
    if (recentAccuracy > 0.85 && averageTime < 15 && streakCount > 3) {
      adjustment = 'too_easy';
    } else if (recentAccuracy > 0.75 && averageTime < 20) {
      adjustment = 'slightly_easy';
    } else if (recentAccuracy < 0.4 || averageTime > 35) {
      adjustment = 'too_hard';
    } else if (recentAccuracy < 0.6) {
      adjustment = 'slightly_hard';
    }

    return {
      level: baseDifficulty,
      adjustment,
      reasoning: this.getAdjustmentReasoning(recentAccuracy, averageTime, streakCount)
    };
  }

  /**
   * Create specialized prompt for question generation
   */
  createPrompt({ region, category, difficulty, playerProfile, performanceContext }) {
    const categoryGuidance = this.templates[category][difficulty.level] || 'General knowledge';
    const adjustmentGuidance = this.difficultyAdjustments[difficulty.adjustment] || '';
    
    return `Create a spy-themed geography question for Atlas Agent, a game where players are secret agents gathering intelligence worldwide.

MISSION PARAMETERS:
- Region: ${region}
- Category: ${category}
- Base Difficulty: ${difficulty.level}
- Adjustment: ${adjustmentGuidance}
- Category Focus: ${categoryGuidance}

PLAYER INTELLIGENCE PROFILE:
${this.formatPlayerProfile(playerProfile, performanceContext)}

QUESTION REQUIREMENTS:
1. Must fit the spy/intelligence theme (agents, missions, intelligence gathering)
2. Should be educational and accurate
3. Include exactly 4 multiple choice options
4. Provide a helpful hint that doesn't give away the answer
5. Include interesting context that makes learning memorable
6. Respect cultural sensitivity while being engaging

RESPONSE FORMAT (JSON):
{
  "question": "Engaging spy-themed question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "difficulty": "${difficulty.level}",
  "hint": "Helpful hint without revealing answer",
  "explanation": "Why this answer is correct and educational context",
  "region": "${region}",
  "category": "${category}",
  "spy_context": "Brief mission context that makes this knowledge relevant to a spy",
  "educational_value": "What the player learns from this question"
}`;
  }

  /**
   * System prompt for consistent AI behavior
   */
  getSystemPrompt() {
    return `You are an expert educational content creator specializing in geography, history, and cultures worldwide. You create engaging spy-themed quiz questions for Atlas Agent, a game where players learn about the world while playing as secret agents.

Your questions should:
- Be factually accurate and well-researched
- Fit seamlessly into spy/espionage narratives
- Provide genuine educational value
- Be culturally respectful and sensitive
- Scale appropriately for the specified difficulty level
- Include interesting details that make learning memorable

Always respond with valid JSON in the exact format specified.`;
  }

  /**
   * Format player profile for AI context
   */
  formatPlayerProfile(playerProfile, performanceContext) {
    const profile = playerProfile || {};
    const context = performanceContext || {};
    
    return `Recent Performance: ${Math.round((context.recentAccuracy || 0.7) * 100)}% accuracy
Average Response Time: ${context.averageTime || 20} seconds
Current Streak: ${context.streakCount || 0} correct answers
Agent Level: ${profile.agentLevel || 'Field Agent'}
Regions Completed: ${(profile.completedRegions || []).length}
Strong Areas: ${(context.strongTopics || ['General Knowledge']).join(', ')}
Areas for Improvement: ${(context.strugglingTopics || ['None identified']).join(', ')}`;
  }

  /**
   * Validate and enhance AI-generated questions
   */
  validateAndEnhanceQuestion(question, params) {
    // Ensure required fields exist
    const validated = {
      question: question.question || 'Generated question unavailable',
      options: question.options || ['A', 'B', 'C', 'D'],
      correctAnswer: Number(question.correctAnswer) || 0,
      difficulty: question.difficulty || params.baseDifficulty,
      hint: question.hint || 'Consider the geographical and cultural context',
      explanation: question.explanation || 'This question tests knowledge of regional characteristics',
      region: params.region,
      category: params.category,
      spy_context: question.spy_context || 'Intelligence gathering mission context',
      educational_value: question.educational_value || 'Builds global awareness and cultural understanding'
    };

    // Ensure correctAnswer is within valid range
    if (validated.correctAnswer < 0 || validated.correctAnswer > 3) {
      validated.correctAnswer = 0;
    }

    // Ensure we have exactly 4 options
    if (validated.options.length !== 4) {
      validated.options = validated.options.slice(0, 4);
      while (validated.options.length < 4) {
        validated.options.push(`Option ${validated.options.length + 1}`);
      }
    }

    return validated;
  }

  /**
   * Fallback question when AI generation fails
   */
  getFallbackQuestion(region, category, difficulty) {
    return {
      question: `As an agent investigating ${region}, what key intelligence should you gather about this region's ${category.toLowerCase()}?`,
      options: [
        'Basic overview information',
        'Detailed strategic analysis', 
        'Historical context only',
        'Modern developments only'
      ],
      correctAnswer: 1,
      difficulty: difficulty,
      hint: 'Agents need comprehensive intelligence for successful missions',
      explanation: 'Strategic analysis provides the depth needed for intelligence operations',
      region: region,
      category: category,
      spy_context: 'Intelligence gathering requires thorough regional analysis',
      educational_value: 'Understanding regional complexity and strategic thinking',
      metadata: {
        generated_at: new Date().toISOString(),
        ai_model: 'fallback',
        is_fallback: true
      }
    };
  }

  /**
   * Get reasoning for difficulty adjustments
   */
  getAdjustmentReasoning(accuracy, time, streak) {
    if (accuracy > 0.85 && time < 15 && streak > 3) {
      return 'Player showing mastery - increasing challenge to maintain engagement';
    } else if (accuracy < 0.4) {
      return 'Player struggling - reducing difficulty to build confidence';
    } else if (time > 35) {
      return 'Player taking long to respond - simplifying to improve flow';
    } else {
      return 'Player performance optimal - maintaining current difficulty';
    }
  }

  /**
   * Batch generate multiple questions for efficiency
   */
  async batchGenerateQuestions(questionSpecs, maxConcurrent = 3) {
    const results = [];
    
    // Process in batches to manage API rate limits
    for (let i = 0; i < questionSpecs.length; i += maxConcurrent) {
      const batch = questionSpecs.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(spec => this.generateAdaptiveQuestion(spec));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches to be respectful to API
        if (i + maxConcurrent < questionSpecs.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Batch generation error for batch starting at ${i}:`, error);
        // Add fallback questions for failed batch
        batch.forEach(spec => {
          results.push(this.getFallbackQuestion(spec.region, spec.category, spec.baseDifficulty));
        });
      }
    }
    
    return results;
  }
}

export default AIQuestionGenerator;