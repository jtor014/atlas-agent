// AI Question Generation Service for Atlas Agent
import OpenAI from 'openai';

class AIQuestionGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Question templates for different categories with scenario variety
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

    // Question scenario types for variety
    this.scenarioTypes = [
      'infiltration_discovery', 'intercepted_intelligence', 'cover_story_requirement',
      'contact_warning', 'surveillance_observation', 'decoded_message',
      'border_crossing', 'safe_house_meeting', 'target_weakness',
      'emergency_extraction', 'diplomatic_reception', 'underground_network'
    ];

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
   * Generate adaptive questions based on player performance and age
   */
  async generateAdaptiveQuestion(params) {
    const {
      region,
      category,
      baseDifficulty = 'medium',
      playerProfile = {},
      performanceContext = {},
      userAge = null
    } = params;

    try {
      // Calculate age-appropriate base difficulty
      const ageAdjustedDifficulty = this.calculateAgeAppropriateDifficulty(userAge, baseDifficulty);
      
      // Analyze player performance to adjust difficulty
      const adjustedDifficulty = this.calculateAdaptiveDifficulty(
        ageAdjustedDifficulty, 
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
   * Calculate age-appropriate difficulty level
   */
  calculateAgeAppropriateDifficulty(userAge, requestedDifficulty) {
    if (!userAge) return requestedDifficulty;

    // Age-based difficulty mapping
    let maxDifficulty;
    if (userAge <= 10) {
      maxDifficulty = 'beginner';
    } else if (userAge <= 12) {
      maxDifficulty = 'easy';
    } else if (userAge <= 14) {
      maxDifficulty = 'medium';
    } else if (userAge <= 16) {
      maxDifficulty = 'hard';
    } else {
      maxDifficulty = 'expert';
    }

    // Ensure requested difficulty doesn't exceed age-appropriate level
    const difficultyLevels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const requestedIndex = difficultyLevels.indexOf(requestedDifficulty);
    const maxIndex = difficultyLevels.indexOf(maxDifficulty);
    
    if (requestedIndex > maxIndex) {
      return maxDifficulty;
    }
    
    return requestedDifficulty;
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
   * Get age-appropriate language and content guidance
   */
  getAgeAppropriateGuidance(userAge) {
    if (!userAge) return '';

    if (userAge <= 10) {
      return `
AGE-APPROPRIATE CONTENT (Ages 8-10):
- Use simple, clear language that elementary students can understand
- Focus on basic facts and observable features
- Include visual descriptions and concrete examples
- Avoid complex historical conflicts or sensitive political topics
- Make content engaging with adventure themes but keep it lighthearted
- Use familiar comparisons (size of a football field, number of classrooms, etc.)`;
    } else if (userAge <= 12) {
      return `
AGE-APPROPRIATE CONTENT (Ages 11-12):
- Use intermediate vocabulary suitable for middle school students
- Include more detailed explanations but keep them accessible
- Can introduce basic historical concepts and cultural differences
- Avoid graphic historical events or complex political situations
- Include interesting facts that spark curiosity
- Connect to things they might learn in school geography and history classes`;
    } else if (userAge <= 14) {
      return `
AGE-APPROPRIATE CONTENT (Ages 13-14):
- Use more sophisticated vocabulary and concepts
- Can include historical events and cultural analysis
- Introduce some political and economic concepts appropriately
- Avoid overly sensitive or controversial topics
- Focus on educational value while maintaining engagement
- Can include more complex geographical and cultural relationships`;
    } else if (userAge <= 16) {
      return `
AGE-APPROPRIATE CONTENT (Ages 15-16):
- Use advanced vocabulary and complex concepts
- Can include detailed historical analysis and political topics
- Address cultural nuances and global relationships
- Include some challenging analytical thinking
- Connect to high school level geography, history, and social studies
- Can touch on more sophisticated global issues appropriately`;
    } else {
      return `
AGE-APPROPRIATE CONTENT (Ages 17+):
- Use university-level vocabulary and concepts
- Include complex geopolitical analysis and historical context
- Address sophisticated cultural, economic, and political topics
- Require critical thinking and analysis
- Can include challenging contemporary global issues
- Expect advanced geographical and cultural knowledge`;
    }
  }

  /**
   * Create specialized prompt for question generation
   */
  createPrompt({ region, category, difficulty, playerProfile, performanceContext, userAge }) {
    const categoryGuidance = this.templates[category][difficulty.level] || 'General knowledge';
    const adjustmentGuidance = this.difficultyAdjustments[difficulty.adjustment] || '';
    const ageGuidance = this.getAgeAppropriateGuidance(userAge);
    
    return `Generate a dynamic, engaging geography question for Atlas Agent - vary the approach and avoid repetitive phrasing.

MISSION CONTEXT:
- Region: ${region}
- Category: ${category}
- Difficulty: ${difficulty.level}
- Adjustment: ${adjustmentGuidance}
- Focus: ${categoryGuidance}

${ageGuidance}

CREATIVITY REQUIREMENTS:
1. VARY QUESTION OPENINGS - Use these diverse beginnings (rotate, don't repeat):
   • "Your infiltration of [location] reveals..."
   • "Intercepted communications mention..."
   • "Satellite imagery shows unusual activity near..."
   • "Your contact warns that understanding [concept] is crucial because..."
   • "Mission briefing indicates..."
   • "Intelligence suggests the key to this operation lies in..."
   • "Your cover story requires knowledge of..."
   • "Decoded messages reference..."
   • "Field reconnaissance discovers..."
   • "The target's weakness involves their connection to..."

2. SHARP, SPECIFIC QUESTIONS:
   - Avoid generic "which" questions when possible
   - Use concrete scenarios and contexts
   - Create questions that feel like real intelligence gathering
   - Include specific details that paint a vivid picture

3. ENGAGING SCENARIOS:
   - Hotel lobbies where languages matter
   - Border crossings requiring cultural knowledge
   - Economic meetings where understanding trade routes is key
   - Underground networks using historical references
   - Technology hubs where geography affects infrastructure

RESPONSE FORMAT (JSON):
{
  "question": "Sharp, specific, non-repetitive spy-themed question",
  "options": ["Precise Option A", "Precise Option B", "Precise Option C", "Precise Option D"],
  "correctAnswer": 0,
  "difficulty": "${difficulty.level}",
  "hint": "Strategic hint without revealing answer",
  "explanation": "Why this knowledge matters for intelligence work + educational context",
  "region": "${region}",
  "category": "${category}",
  "spy_context": "Specific operational context making this knowledge mission-critical",
  "educational_value": "Concrete learning outcome from this scenario"
}`;
  }

  /**
   * System prompt for consistent AI behavior
   */
  getSystemPrompt() {
    return `You are a master educational content creator and spy thriller writer. You craft sharp, varied geography questions that feel like real intelligence scenarios - never generic or repetitive.

CRITICAL REQUIREMENTS:
- NEVER start consecutive questions the same way
- Use concrete, specific scenarios instead of abstract "which is" questions  
- Make each question feel like actual espionage intelligence gathering
- Vary vocabulary and sentence structure dramatically
- Create vivid, memorable contexts that stick with learners
- Be factually bulletproof and culturally respectful
- Scale complexity appropriately for difficulty level

Your questions should read like scenes from a spy novel, not a textbook quiz. Every question must feel fresh and engaging.

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