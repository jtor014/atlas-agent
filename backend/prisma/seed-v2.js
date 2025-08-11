import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌍 Seeding Atlas Agent v2.0 with rich content...')
  
  // Check if regions already exist
  const existingRegions = await prisma.region.count()
  if (existingRegions > 0) {
    console.log(`✅ Database already seeded with ${existingRegions} regions`)
    return
  }

  // Create Regions
  console.log('🗺️  Creating regions...')
  
  const westernEurope = await prisma.region.create({
    data: {
      name: 'Western Europe',
      description: 'Explore the birthplace of Renaissance art, democratic ideals, and culinary traditions that have influenced the world.',
      continent: 'Europe',
      difficultyLevel: 1,
      unlockOrder: 1,
      mapImage: '/images/regions/western-europe.jpg',
      backgroundMusic: '/audio/classical-european.mp3',
      ambientSounds: ['market-sounds.mp3', 'church-bells.mp3', 'cafe-chatter.mp3']
    }
  })

  const eastAsia = await prisma.region.create({
    data: {
      name: 'East Asia',
      description: 'Discover ancient philosophies, revolutionary technologies, and rich cultural traditions spanning thousands of years.',
      continent: 'Asia',
      difficultyLevel: 2,
      unlockOrder: 2,
      mapImage: '/images/regions/east-asia.jpg',
      backgroundMusic: '/audio/traditional-asian.mp3',
      ambientSounds: ['temple-bells.mp3', 'street-market.mp3', 'rain-on-bamboo.mp3']
    }
  })

  // Create Countries with Rich Content
  console.log('🏛️  Creating countries...')
  
  const france = await prisma.country.create({
    data: {
      name: 'France',
      regionId: westernEurope.id,
      capitalCity: 'Paris',
      population: '67 million',
      languages: ['French', 'Occitan', 'Breton', 'Corsican'],
      currency: 'Euro (EUR)',
      timeZone: 'CET (UTC+1)',
      coordinates: { lat: 46.2276, lng: 2.2137 },
      climate: 'Temperate; cool winters and mild summers',
      geography: 'France features diverse landscapes from the Mediterranean coast to Alpine peaks, fertile river valleys, and Atlantic shores. The country is known for its varied terroir that produces world-renowned wines and regional cuisines.',
      culturalSummary: 'French culture emphasizes art, literature, philosophy, and gastronomy. The concept of "savoir-vivre" (knowing how to live well) permeates daily life, from leisurely meals to appreciation of beauty and intellectual discourse.',
      modernContext: 'France balances preservation of cultural heritage with modern innovation. It leads in luxury goods, aerospace, and sustainable energy while maintaining strong social safety nets and work-life balance.',
      flagImage: '/images/flags/france.svg',
      mapImage: '/images/maps/france.jpg',
      photoGallery: ['/images/france/eiffel-tower.jpg', '/images/france/provence.jpg', '/images/france/louvre.jpg']
    }
  })

  const japan = await prisma.country.create({
    data: {
      name: 'Japan',
      regionId: eastAsia.id,
      capitalCity: 'Tokyo',
      population: '125 million',
      languages: ['Japanese', 'Ryukyuan languages'],
      currency: 'Japanese Yen (JPY)',
      timeZone: 'JST (UTC+9)',
      coordinates: { lat: 36.2048, lng: 138.2529 },
      climate: 'Varies from tropical in south to temperate in north',
      geography: 'An archipelago of 6,852 islands, Japan is mountainous with frequent earthquakes and volcanic activity. Only about 12% of land is arable, leading to innovative agricultural techniques and a deep connection to the sea.',
      culturalSummary: 'Japanese culture balances ancient traditions with cutting-edge modernity. Core values include harmony (wa), respect (sonkei), and continuous improvement (kaizen). Seasonal awareness and aesthetic appreciation permeate daily life.',
      modernContext: 'Japan leads in technology, robotics, and sustainable design while facing demographic challenges. It demonstrates how traditional values can coexist with rapid technological advancement.',
      flagImage: '/images/flags/japan.svg',
      mapImage: '/images/maps/japan.jpg',
      photoGallery: ['/images/japan/tokyo-skyline.jpg', '/images/japan/cherry-blossoms.jpg', '/images/japan/temple.jpg']
    }
  })

  // Create Learning Modules for France
  console.log('📚 Creating learning modules...')
  
  const frenchGeography = await prisma.learningModule.create({
    data: {
      title: 'French Geography & Environment',
      type: 'GEOGRAPHY_ENVIRONMENT',
      countryId: france.id,
      orderIndex: 1,
      estimatedTime: 8,
      objectives: [
        'Understand France\'s diverse geographic regions',
        'Learn how geography influences French culture and economy',
        'Explore environmental challenges and solutions'
      ],
      content: {
        overview: 'France\'s geography is incredibly diverse, from Mediterranean beaches to Alpine peaks.',
        keyPoints: [
          'Six major geographic regions each with distinct characteristics',
          'Rivers like the Seine, Loire, and Rhône shaped civilization',
          'Climate varies from oceanic to continental to Mediterranean'
        ]
      },
      completionCriteria: {
        requiredActions: ['complete_map_activity', 'answer_quiz_questions'],
        minimumScore: 70
      }
    }
  })

  const frenchHistory = await prisma.learningModule.create({
    data: {
      title: 'French History & Civilization',
      type: 'HISTORY_CIVILIZATION',
      countryId: france.id,
      orderIndex: 2,
      estimatedTime: 12,
      objectives: [
        'Trace major periods of French history',
        'Understand the French Revolution\'s global impact',
        'Learn about French contributions to human rights and democracy'
      ],
      content: {
        timeline: [
          { period: 'Ancient Gaul', years: '600 BCE - 50 BCE', key: 'Celtic tribes and Roman conquest' },
          { period: 'Medieval Kingdom', years: '987 - 1789', key: 'Feudalism to absolute monarchy' },
          { period: 'Revolution & Republic', years: '1789 - present', key: 'Democratic ideals spread globally' }
        ],
        keyFigures: ['Charlemagne', 'Joan of Arc', 'Napoleon', 'Charles de Gaulle']
      },
      completionCriteria: {
        requiredActions: ['timeline_activity', 'historical_scenario'],
        minimumScore: 75
      }
    }
  })

  // Create Rich Module Content
  console.log('🎨 Creating interactive content...')
  
  await prisma.moduleContent.create({
    data: {
      moduleId: frenchGeography.id,
      contentType: 'interactive',
      orderIndex: 1,
      title: 'French Regions Explorer',
      content: {
        type: 'map_interaction',
        description: 'Click on each region to discover its unique characteristics',
        regions: [
          {
            name: 'Provence',
            climate: 'Mediterranean',
            specialties: ['Lavender', 'Olive oil', 'Rosé wine'],
            culture: 'Relaxed pace of life, outdoor markets, artistic heritage'
          },
          {
            name: 'Brittany', 
            climate: 'Oceanic',
            specialties: ['Seafood', 'Cider', 'Celtic music'],
            culture: 'Maritime traditions, Celtic heritage, folklore'
          }
        ]
      },
      interactionType: 'click',
      correctAnswers: null, // Exploration-based, no wrong answers
      hints: ['Start with the Mediterranean coast', 'Notice how geography affects local culture']
    }
  })

  await prisma.moduleContent.create({
    data: {
      moduleId: frenchHistory.id,
      contentType: 'puzzle',
      orderIndex: 1,
      title: 'Revolutionary Timeline Challenge',
      content: {
        type: 'timeline_builder',
        description: 'Arrange these key events of the French Revolution in chronological order',
        events: [
          { id: 'bastille', text: 'Storming of the Bastille', year: 1789 },
          { id: 'rights', text: 'Declaration of Rights', year: 1789 },
          { id: 'king', text: 'Execution of Louis XVI', year: 1793 },
          { id: 'napoleon', text: 'Napoleon becomes Emperor', year: 1804 }
        ],
        correctOrder: ['bastille', 'rights', 'king', 'napoleon']
      },
      interactionType: 'drag',
      correctAnswers: ['bastille', 'rights', 'king', 'napoleon'],
      hints: ['The revolution began with a symbolic act', 'Rights were declared early in the process', 'Napoleon came to power after the revolutionary period']
    }
  })

  console.log('✅ Seeding completed successfully!')
  console.log(`Created:`)
  console.log(`- 2 regions (Western Europe, East Asia)`)
  console.log(`- 2 countries (France, Japan)`)  
  console.log(`- 2 learning modules with rich content`)
  console.log(`- Interactive map and puzzle activities`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })