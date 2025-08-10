import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questionsData = [
  // Western Europe
  {
    question: 'Which country has the longest coastline in Western Europe?',
    options: ['Norway', 'United Kingdom', 'France', 'Spain'],
    correctAnswer: 'Norway',
    difficulty: 'medium',
    region: 'western-europe'
  },
  {
    question: 'What is the capital of Switzerland?',
    options: ['Geneva', 'Zurich', 'Bern', 'Basel'],
    correctAnswer: 'Bern',
    difficulty: 'easy',
    region: 'western-europe'
  },
  {
    question: 'Which river flows through Paris?',
    options: ['Thames', 'Rhine', 'Seine', 'Danube'],
    correctAnswer: 'Seine',
    difficulty: 'easy',
    region: 'western-europe'
  },
  {
    question: 'Which Western European country is completely landlocked?',
    options: ['Belgium', 'Netherlands', 'Luxembourg', 'Austria'],
    correctAnswer: 'Austria',
    difficulty: 'medium',
    region: 'western-europe'
  },
  {
    question: 'Mount Vesuvius is located near which Italian city?',
    options: ['Rome', 'Milan', 'Naples', 'Florence'],
    correctAnswer: 'Naples',
    difficulty: 'medium',
    region: 'western-europe'
  },
  
  // Eastern Europe
  {
    question: 'What is the capital of Czech Republic?',
    options: ['Prague', 'Budapest', 'Warsaw', 'Bratislava'],
    correctAnswer: 'Prague',
    difficulty: 'easy',
    region: 'eastern-europe'
  },
  {
    question: 'Which river is the longest in Eastern Europe?',
    options: ['Danube', 'Volga', 'Dnieper', 'Vistula'],
    correctAnswer: 'Volga',
    difficulty: 'hard',
    region: 'eastern-europe'
  },
  
  // Asia
  {
    question: 'What is the highest mountain in Asia?',
    options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Lhotse'],
    correctAnswer: 'Mount Everest',
    difficulty: 'easy',
    region: 'asia'
  },
  {
    question: 'Which Asian country has the most time zones?',
    options: ['China', 'India', 'Russia', 'Mongolia'],
    correctAnswer: 'Russia',
    difficulty: 'hard',
    region: 'asia'
  },
  
  // Africa
  {
    question: 'What is the longest river in Africa?',
    options: ['Congo River', 'Niger River', 'Zambezi River', 'Nile River'],
    correctAnswer: 'Nile River',
    difficulty: 'easy',
    region: 'africa'
  },
  {
    question: 'Which African country was never colonized?',
    options: ['Ethiopia', 'Liberia', 'Both Ethiopia and Liberia', 'Morocco'],
    correctAnswer: 'Both Ethiopia and Liberia',
    difficulty: 'hard',
    region: 'africa'
  }
];

async function main() {
  console.log('🌱 Seeding Atlas Agent database...');
  
  // Check if questions already exist
  const existingQuestions = await prisma.question.count();
  
  if (existingQuestions > 0) {
    console.log(`✅ Database already seeded with ${existingQuestions} questions`);
    return;
  }
  
  console.log('📝 Adding initial questions...');
  
  // Seed questions
  for (const questionData of questionsData) {
    await prisma.question.create({
      data: questionData
    });
  }
  
  console.log(`✅ Created ${questionsData.length} questions`);
  
  // Create a sample game session for testing
  const sampleSession = await prisma.gameSession.create({
    data: {
      agentName: 'Agent Demo',
      score: 1200,
      completedRegions: ['western-europe', 'asia'],
      unlockedRegions: ['Europe', 'Asia', 'Africa'],
      agentLevel: 'Expert'
    }
  });
  
  console.log('🎮 Created sample game session');
  
  // Add sample leaderboard entry
  await prisma.leaderboardEntry.create({
    data: {
      sessionId: sampleSession.id,
      agentName: sampleSession.agentName,
      score: sampleSession.score,
      completedRegions: sampleSession.completedRegions,
      agentLevel: sampleSession.agentLevel,
      regionsCompleted: 2
    }
  });
  
  console.log('🏆 Created sample leaderboard entry');
  console.log('🚀 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });