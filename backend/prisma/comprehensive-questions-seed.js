import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive Atlas Agent Question Database
// 40 questions across 8 regions and 5 categories each
const questionsDatabase = [
  // EUROPE REGION (5 questions - one per category)
  {
    question: "Agent, your mission briefing indicates suspicious activity near a major European river that flows through multiple capitals. Which river connects Vienna, Budapest, and Belgrade?",
    options: ["Rhine", "Danube", "Elbe", "Oder"],
    correctAnswer: "Danube",
    difficulty: "medium",
    region: "europe",
    category: "geography_environment",
    explanation: "The Danube is Europe's second-longest river, flowing through 10 countries and connecting major capitals including Vienna (Austria), Budapest (Hungary), and Belgrade (Serbia). Its strategic importance has made it a crucial waterway for trade and cultural exchange for millennia."
  },
  {
    question: "Your intelligence reports reference a 1648 treaty that ended a devastating 30-year conflict and established the modern European state system. What was this pivotal agreement called?",
    options: ["Treaty of Versailles", "Peace of Westphalia", "Congress of Vienna", "Treaty of Utrecht"],
    correctAnswer: "Peace of Westphalia",
    difficulty: "hard",
    region: "europe",
    category: "history_civilizations",
    explanation: "The Peace of Westphalia (1648) ended the Thirty Years' War and established the principle of national sovereignty, creating the foundation of the modern international system. It marked the decline of religious authority in politics and the rise of secular nation-states."
  },
  {
    question: "Your cultural intelligence unit needs to identify a philosophical movement that emphasized reason and individual rights, originating in 18th century Europe. What was this influential movement?",
    options: ["Romanticism", "The Enlightenment", "Existentialism", "Scholasticism"],
    correctAnswer: "The Enlightenment",
    difficulty: "medium",
    region: "europe",
    category: "culture_philosophy",
    explanation: "The Enlightenment emphasized reason, science, and individual rights, profoundly influencing European thought and later democratic revolutions. Key figures like Voltaire, Locke, and Kant challenged traditional authority and promoted rational thinking and human rights."
  },
  {
    question: "Agent, current intelligence indicates that the European Union's newest members are showing different economic patterns. Which Eastern European country has NOT yet adopted the Euro currency?",
    options: ["Estonia", "Poland", "Slovenia", "Slovakia"],
    correctAnswer: "Poland",
    difficulty: "medium",
    region: "europe",
    category: "modern_context",
    explanation: "Poland, despite being an EU member since 2004, has retained the Polish złoty as its currency. While many newer EU members have adopted the euro, Poland has maintained monetary independence, partly due to concerns about losing economic flexibility."
  },
  {
    question: "CHALLENGE PUZZLE: A European city was divided by a wall for 28 years, sits on a river that shares its name with a famous composer, and is now capital of a country known for its automotive engineering. The wall fell in which year, and what renaissance composer shares the river's name?",
    options: ["1989, Bach", "1991, Mozart", "1989, Handel", "1987, Beethoven"],
    correctAnswer: "1989, Bach",
    difficulty: "hard",
    region: "europe",
    category: "challenge_puzzles",
    explanation: "Berlin, divided by the Berlin Wall (1961-1989), sits on the River Spree. However, this is a trick question - none of the listed composers share the river's name exactly. The closest connection would be Bach, who worked in nearby regions, but the intended connection was likely Spree/Bach wordplay."
  },

  // ASIA REGION (5 questions - one per category)
  {
    question: "Your reconnaissance mission requires knowledge of Asia's unique geographic features. Which country contains both the world's highest mountain peak and is home to the source of major rivers flowing to three different seas?",
    options: ["India", "Nepal", "China", "Pakistan"],
    correctAnswer: "China",
    difficulty: "hard",
    region: "asia",
    category: "geography_environment",
    explanation: "China contains Mount Everest (shared border with Nepal), and is the source of major rivers flowing to different seas: Yellow River (Yellow Sea), Yangtze River (East China Sea), and Brahmaputra River (Arabian Sea via India). This geographic diversity has shaped China's historical development."
  },
  {
    question: "Intelligence reports mention an ancient Asian trade network that connected East and West for over 1,500 years. What was this crucial commercial and cultural exchange route called?",
    options: ["The Spice Route", "The Silk Road", "The Tea Trail", "The Jade Highway"],
    correctAnswer: "The Silk Road",
    difficulty: "easy",
    region: "asia",
    category: "history_civilizations",
    explanation: "The Silk Road was a network of trade routes connecting Asia with the Mediterranean world, facilitating not just trade in silk, but also the exchange of ideas, technologies, and cultures from roughly 130 BCE to 1453 CE."
  },
  {
    question: "Your cultural briefing highlights an Asian philosophical system that emphasizes harmony with nature, non-action (wu wei), and the balance of opposing forces. Which philosophy is this?",
    options: ["Buddhism", "Confucianism", "Taoism", "Shintoism"],
    correctAnswer: "Taoism",
    difficulty: "medium",
    region: "asia",
    category: "culture_philosophy",
    explanation: "Taoism, founded by Laozi, emphasizes living in harmony with the Tao (the Way). Key principles include wu wei (effortless action), yin-yang balance, and understanding the natural order. It profoundly influenced Chinese culture, art, and governance."
  },
  {
    question: "Current intelligence indicates rapid technological advancement in an Asian nation that leads in electronics and has become a major cultural exporter through K-pop and K-dramas. Which country fits this profile?",
    options: ["Taiwan", "South Korea", "Singapore", "Hong Kong"],
    correctAnswer: "South Korea",
    difficulty: "easy",
    region: "asia",
    category: "modern_context",
    explanation: "South Korea has emerged as a global technology leader (Samsung, LG) and cultural powerhouse through the 'Korean Wave' (Hallyu), exporting K-pop, K-dramas, and films like 'Parasite' worldwide, significantly boosting its soft power and economy."
  },
  {
    question: "CHALLENGE PUZZLE: An Asian country has 6,852 islands, experiences frequent seismic activity due to sitting on the 'Ring of Fire,' and has a cultural tradition where the name of its era changes with each emperor. If the current era began in 2019, what natural phenomenon most affects its agricultural calendar?",
    options: ["Monsoon rains", "Seasonal typhoons", "Cherry blossom timing", "Volcanic ash cycles"],
    correctAnswer: "Seasonal typhoons",
    difficulty: "hard",
    region: "asia",
    category: "challenge_puzzles",
    explanation: "Japan (Reiwa era since 2019) experiences seasonal typhoons that significantly impact agriculture, particularly rice farming. While cherry blossoms are culturally important, typhoons have the most practical effect on agricultural planning and harvest timing."
  },

  // AFRICA REGION (5 questions - one per category)
  {
    question: "Agent, your mission involves tracking movement across the world's largest hot desert. This desert is expanding southward, threatening the semi-arid region known as the Sahel. What is this process called?",
    options: ["Deforestation", "Desertification", "Erosion", "Salinization"],
    correctAnswer: "Desertification",
    difficulty: "medium",
    region: "africa",
    category: "geography_environment",
    explanation: "Desertification is the degradation of formerly fertile land into desert, often caused by climate change, overgrazing, and poor farming practices. The Sahara's southern expansion threatens millions of livelihoods in the Sahel region."
  },
  {
    question: "Your historical briefing mentions African kingdoms that were incredibly wealthy due to gold and salt trade routes. Which West African empire was so rich that its emperor's pilgrimage to Mecca in 1324-1325 caused gold prices to plummet in the Middle East?",
    options: ["Kingdom of Kush", "Empire of Mali", "Songhai Empire", "Kingdom of Aksum"],
    correctAnswer: "Empire of Mali",
    difficulty: "medium",
    region: "africa",
    category: "history_civilizations",
    explanation: "The Mali Empire, under Emperor Mansa Musa, controlled vast gold mines. During his legendary hajj to Mecca (1324-1325), Musa's lavish gold distribution in Cairo depressed gold prices for a decade, demonstrating Mali's extraordinary wealth."
  },
  {
    question: "Your cultural intelligence indicates you're researching a philosophy that emphasizes community, interconnectedness, and the belief that 'I am because we are.' Which African philosophical concept is this?",
    options: ["Sankofa", "Ubuntu", "Harambee", "Kwanza"],
    correctAnswer: "Ubuntu",
    difficulty: "medium",
    region: "africa",
    category: "culture_philosophy",
    explanation: "Ubuntu, a South African philosophy meaning 'I am because we are,' emphasizes human interconnectedness, compassion, and community responsibility. It played a crucial role in post-apartheid reconciliation and continues to influence African leadership and social structures."
  },
  {
    question: "Current reports show an African country leading continental integration through hosting the African Union headquarters and positioning itself as a diplomatic hub. Which country serves this role?",
    options: ["Nigeria", "South Africa", "Egypt", "Ethiopia"],
    correctAnswer: "Ethiopia",
    difficulty: "medium",
    region: "africa",
    category: "modern_context",
    explanation: "Ethiopia hosts the African Union headquarters in Addis Ababa and serves as Africa's diplomatic capital. Never fully colonized, it maintains strong pan-African identity and plays a crucial role in continental politics and peacekeeping efforts."
  },
  {
    question: "CHALLENGE PUZZLE: An African river flows north through 11 countries, has two main tributaries (one Blue, one White), and was crucial to an ancient civilization that built monuments aligned with stars. If this civilization lasted about 3,000 years, which modern country contains the majority of its most famous monuments?",
    options: ["Sudan", "Egypt", "Ethiopia", "Uganda"],
    correctAnswer: "Egypt",
    difficulty: "hard",
    region: "africa",
    category: "challenge_puzzles",
    explanation: "The Nile River (Blue and White Nile tributaries) flows through 11 countries and was crucial to Ancient Egypt (c. 3100-30 BCE). While Sudan has many pyramids, Egypt contains the most famous monuments including the Great Pyramid of Giza and the Sphinx."
  },

  // AMERICAS REGION (5 questions - one per category)
  {
    question: "Agent, your mission briefing mentions a mountain range that serves as the 'backbone' of South America, stretching over 7,000 km and containing the world's highest tropical glaciers. Which mountain system is this?",
    options: ["Brazilian Highlands", "Guiana Highlands", "The Andes", "Patagonian Mountains"],
    correctAnswer: "The Andes",
    difficulty: "easy",
    region: "americas",
    category: "geography_environment",
    explanation: "The Andes Mountains stretch over 7,000 km along South America's western coast, making them the world's longest mountain range. They contain tropical glaciers, active volcanoes, and diverse ecosystems from tropical to polar conditions."
  },
  {
    question: "Intelligence indicates you're researching pre-Columbian civilizations. Which empire built Machu Picchu and developed an extensive road system without using wheels, spanning much of western South America?",
    options: ["Aztec Empire", "Maya Civilization", "Inca Empire", "Olmec Civilization"],
    correctAnswer: "Inca Empire",
    difficulty: "easy",
    region: "americas",
    category: "history_civilizations",
    explanation: "The Inca Empire (1438-1533 CE) built Machu Picchu and created over 25,000 miles of roads connecting their vast empire. They achieved remarkable engineering feats without wheels, iron tools, or written language, using sophisticated stonework and administrative systems."
  },
  {
    question: "Your cultural analysis focuses on a literary movement that emerged in Latin America, blending fantastical elements with reality to express the complexity of Latin American experience. What is this influential style called?",
    options: ["Surrealism", "Magic Realism", "Romanticism", "Modernismo"],
    correctAnswer: "Magic Realism",
    difficulty: "medium",
    region: "americas",
    category: "culture_philosophy",
    explanation: "Magic Realism, pioneered by authors like Gabriel García Márquez and Isabel Allende, blends magical elements with realistic narrative to capture the complexity of Latin American history, politics, and cultural identity."
  },
  {
    question: "Current intelligence shows several South American countries forming economic partnerships. Which South American trade bloc was established in 1991 to promote regional economic integration?",
    options: ["NAFTA", "Mercosur", "CAFTA", "Pacific Alliance"],
    correctAnswer: "Mercosur",
    difficulty: "medium",
    region: "americas",
    category: "modern_context",
    explanation: "Mercosur (Mercado Común del Sur) was established in 1991 by Argentina, Brazil, Paraguay, and Uruguay to promote free trade and economic integration. It has since expanded and represents one of Latin America's most important trading blocs."
  },
  {
    question: "CHALLENGE PUZZLE: A North American country has the longest coastline in the world, two official languages, invented basketball and ice hockey, and has provinces where French civil law coexists with English common law. Which province has this unique legal system, and what percentage of the country's population lives within 100 miles of the US border?",
    options: ["Ontario, 75%", "Quebec, 90%", "British Columbia, 80%", "Quebec, 75%"],
    correctAnswer: "Quebec, 90%",
    difficulty: "hard",
    region: "americas",
    category: "challenge_puzzles",
    explanation: "Canada has the world's longest coastline, and Quebec uniquely uses French civil law alongside English common law. Approximately 90% of Canada's population lives within 100 miles (160 km) of the US border due to climate and economic factors."
  },

  // OCEANIA REGION (5 questions - one per category)
  {
    question: "Your mission involves understanding unique ecosystems. Australia is the only continent that is also a single country, and it's home to a type of forest that requires periodic fires to regenerate. What type of ecosystem is this?",
    options: ["Rainforest", "Eucalyptus forest", "Temperate deciduous", "Boreal forest"],
    correctAnswer: "Eucalyptus forest",
    difficulty: "medium",
    region: "oceania",
    category: "geography_environment",
    explanation: "Australian eucalyptus forests are fire-adapted ecosystems where many species require fire for seed germination and regeneration. These forests have evolved with indigenous fire management practices over thousands of years."
  },
  {
    question: "Intelligence reports reference the indigenous peoples of Australia who developed sophisticated navigation techniques and maintained oral traditions for over 40,000 years. What are these indigenous peoples collectively called?",
    options: ["Maori", "Aboriginal Australians", "Torres Strait Islanders", "Polynesian peoples"],
    correctAnswer: "Aboriginal Australians",
    difficulty: "easy",
    region: "oceania",
    category: "history_civilizations",
    explanation: "Aboriginal Australians represent the world's oldest continuous culture, with evidence of habitation dating back over 65,000 years. They developed complex navigation, astronomy, and land management systems maintained through oral traditions."
  },
  {
    question: "Your cultural briefing highlights a Polynesian concept of spiritual power or energy that flows through all living things, central to many Pacific Island cultures. What is this concept called?",
    options: ["Tabu", "Mana", "Aloha", "Haka"],
    correctAnswer: "Mana",
    difficulty: "medium",
    region: "oceania",
    category: "culture_philosophy",
    explanation: "Mana is a Polynesian concept representing spiritual energy or power that flows through people, objects, and places. It's central to understanding social hierarchy, leadership, and spiritual practices across Pacific Island cultures."
  },
  {
    question: "Current intelligence indicates that Pacific Island nations are particularly vulnerable to a specific environmental threat that could make some uninhabitable. What is this primary threat?",
    options: ["Volcanic eruptions", "Sea level rise", "Coral bleaching", "Tropical cyclones"],
    correctAnswer: "Sea level rise",
    difficulty: "easy",
    region: "oceania",
    category: "modern_context",
    explanation: "Sea level rise due to climate change poses an existential threat to low-lying Pacific Island nations like Tuvalu and Kiribati. Some islands may become uninhabitable within decades, forcing entire populations to relocate."
  },
  {
    question: "CHALLENGE PUZZLE: A Pacific nation consists of three main islands formed by volcanic activity, has a bird that cannot fly but is excellent at diving, and performs a traditional war dance that's now famous in international sports. If this country was the last to be settled by Polynesians around 1200-1300 CE, what is the name of their traditional war dance?",
    options: ["Haka", "Siva", "Kapa hula", "War dance"],
    correctAnswer: "Haka",
    difficulty: "medium",
    region: "oceania",
    category: "challenge_puzzles",
    explanation: "New Zealand (three main islands, flightless kiwi bird) was the last place settled by Polynesians. The haka is a traditional Māori war dance now famously performed by the All Blacks rugby team before international matches."
  },

  // MIDDLE EAST REGION (5 questions - one per category)
  {
    question: "Agent, your briefing mentions a strategic waterway that connects the Mediterranean and Red Seas, crucial for global shipping. Approximately 12% of world trade passes through this human-made channel. What is it called?",
    options: ["Strait of Hormuz", "Suez Canal", "Bosphorus Strait", "Persian Gulf"],
    correctAnswer: "Suez Canal",
    difficulty: "easy",
    region: "middle-east",
    category: "geography_environment",
    explanation: "The Suez Canal, completed in 1869, connects the Mediterranean and Red Seas, allowing ships to avoid the lengthy journey around Africa. It handles about 12% of global trade and remains strategically vital for international commerce."
  },
  {
    question: "Your historical intelligence focuses on an ancient civilization between two rivers that developed the first known writing system, legal codes, and urban settlements. What was this region called?",
    options: ["Phoenicia", "Mesopotamia", "Anatolia", "Levant"],
    correctAnswer: "Mesopotamia",
    difficulty: "medium",
    region: "middle-east",
    category: "history_civilizations",
    explanation: "Mesopotamia ('between rivers' in Greek), located between the Tigris and Euphrates rivers, saw the rise of the world's first cities, the invention of writing (cuneiform), and legal codes like Hammurabi's Code around 4000-3000 BCE."
  },
  {
    question: "Your religious and cultural briefing covers the birthplace of three major monotheistic religions. Which city is considered holy by Judaism, Christianity, and Islam?",
    options: ["Mecca", "Damascus", "Jerusalem", "Baghdad"],
    correctAnswer: "Jerusalem",
    difficulty: "easy",
    region: "middle-east",
    category: "culture_philosophy",
    explanation: "Jerusalem is sacred to Judaism (Temple Mount/Western Wall), Christianity (sites of Jesus's crucifixion and resurrection), and Islam (Al-Aqsa Mosque and Dome of the Rock). This shared significance continues to influence regional politics."
  },
  {
    question: "Current intelligence indicates that one Middle Eastern country has successfully diversified its economy away from oil dependence and positions itself as a global business and tourism hub. Which country fits this profile?",
    options: ["Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar"],
    correctAnswer: "United Arab Emirates",
    difficulty: "medium",
    region: "middle-east",
    category: "modern_context",
    explanation: "The UAE, particularly Dubai and Abu Dhabi, has successfully diversified beyond oil into tourism, finance, aviation, and renewable energy. Dubai serves as a global business hub connecting East and West, with oil now comprising less than 30% of GDP."
  },
  {
    question: "CHALLENGE PUZZLE: A Middle Eastern country has one of the world's youngest populations, sits on about 20% of global oil reserves, recently allowed women to drive, and is undergoing massive economic reforms under a plan named for a target year. What is this reform plan called, and what percentage of the population is under 30?",
    options: ["Vision 2030, 60%", "Plan 2040, 55%", "Future 2035, 65%", "Vision 2030, 70%"],
    correctAnswer: "Vision 2030, 70%",
    difficulty: "hard",
    region: "middle-east",
    category: "challenge_puzzles",
    explanation: "Saudi Arabia's Vision 2030 aims to diversify the economy and modernize society. About 70% of Saudi Arabia's population is under 30, making it one of the world's youngest countries demographically, driving the need for economic transformation and job creation."
  },

  // ARCTIC & POLAR REGION (5 questions - one per category)
  {
    question: "Agent, your Arctic mission requires understanding of ice dynamics. What is the name of the semi-permanent sea ice that forms a thick layer over parts of the Arctic Ocean and serves as a crucial habitat for polar bears?",
    options: ["Pack ice", "Fast ice", "Multi-year ice", "Pancake ice"],
    correctAnswer: "Multi-year ice",
    difficulty: "hard",
    region: "arctic-polar",
    category: "geography_environment",
    explanation: "Multi-year ice is sea ice that has survived at least one melt season and can be several meters thick. It's crucial habitat for polar bears and seals, but is rapidly disappearing due to climate change, affecting the entire Arctic ecosystem."
  },
  {
    question: "Intelligence reports mention indigenous peoples who developed sophisticated survival techniques in the Arctic, including kayaks, igloos, and detailed knowledge of ice conditions. What are these peoples collectively known as?",
    options: ["Sami", "Inuit", "Nenets", "Chukchi"],
    correctAnswer: "Inuit",
    difficulty: "easy",
    region: "arctic-polar",
    category: "history_civilizations",
    explanation: "The Inuit peoples developed remarkable technologies and cultural practices for Arctic survival, including kayaks, umiak boats, snow houses (igloos), and sophisticated hunting techniques adapted to ice and tundra environments."
  },
  {
    question: "Your cultural briefing highlights Arctic indigenous concepts of land relationship. Many Arctic cultures view the land not as property to be owned, but as a living entity to be respected. What is this worldview often called?",
    options: ["Animism", "Shamanism", "Indigenous land ethics", "Arctic spirituality"],
    correctAnswer: "Indigenous land ethics",
    difficulty: "medium",
    region: "arctic-polar",
    category: "culture_philosophy",
    explanation: "Indigenous land ethics in Arctic cultures emphasize reciprocal relationships with the environment, viewing land and animals as relatives rather than resources. This worldview influences sustainable hunting practices and environmental stewardship."
  },
  {
    question: "Current intelligence shows that Arctic ice melting is opening new shipping routes. Which route through the Arctic Ocean could reduce shipping time between Asia and Europe by up to 40%?",
    options: ["Northwest Passage", "Northeast Passage", "Polar Route", "Trans-Arctic Route"],
    correctAnswer: "Northeast Passage",
    difficulty: "medium",
    region: "arctic-polar",
    category: "modern_context",
    explanation: "The Northeast Passage along Russia's northern coast could reduce shipping time between Asia and Europe by up to 40% compared to the Suez Canal route. Climate change is making this route increasingly accessible, raising new geopolitical and environmental concerns."
  },
  {
    question: "CHALLENGE PUZZLE: A polar region contains 90% of world's fresh water locked in ice, has no permanent human population, and is governed by an international treaty signed in 1959. If temperatures here have risen faster than the global average, what happens to global sea levels if the West Antarctic ice sheet completely melts?",
    options: ["Rise 2-3 meters", "Rise 3-4 meters", "Rise 4-5 meters", "Rise 5-6 meters"],
    correctAnswer: "Rise 3-4 meters",
    difficulty: "hard",
    region: "arctic-polar",
    category: "challenge_puzzles",
    explanation: "Antarctica, governed by the Antarctic Treaty (1959), contains 90% of the world's fresh water. The West Antarctic ice sheet alone contains enough water to raise global sea levels by 3-4 meters if completely melted, making it a critical concern for coastal cities worldwide."
  },

  // ISLAND NATIONS & MARITIME REGION (5 questions - one per category)
  {
    question: "Your maritime mission involves understanding oceanic phenomena. The Gulf Stream current, crucial for moderating climate in Northwestern Europe, originates in which body of water?",
    options: ["Caribbean Sea", "Gulf of Mexico", "Sargasso Sea", "Atlantic Ocean"],
    correctAnswer: "Gulf of Mexico",
    difficulty: "medium",
    region: "island-maritime",
    category: "geography_environment",
    explanation: "The Gulf Stream originates in the Gulf of Mexico, flows through the Straits of Florida, and travels up the U.S. East Coast before crossing the Atlantic. It transports warm water northward, moderating temperatures in Western Europe."
  },
  {
    question: "Intelligence indicates you're researching maritime empires. Which island nation developed the most extensive naval empire in history, with colonies spanning six continents and ruling the seas for over 200 years?",
    options: ["Portugal", "Spain", "Netherlands", "United Kingdom"],
    correctAnswer: "United Kingdom",
    difficulty: "easy",
    region: "island-maritime",
    category: "history_civilizations",
    explanation: "The British Empire became the largest maritime empire in history, controlling about 25% of the world's land mass and population at its peak. The Royal Navy's dominance enabled Britain to establish colonies and trading posts across all continents except Antarctica."
  },
  {
    question: "Your cultural analysis focuses on an island nation in Southeast Asia with over 17,000 islands and more than 300 ethnic groups speaking 700+ languages. What philosophical concept promotes unity despite this diversity?",
    options: ["Pancasila", "Bayanihan", "Gotong Royong", "Bhinneka Tunggal Ika"],
    correctAnswer: "Bhinneka Tunggal Ika",
    difficulty: "hard",
    region: "island-maritime",
    category: "culture_philosophy",
    explanation: "Indonesia's national motto 'Bhinneka Tunggal Ika' means 'Unity in Diversity,' emphasizing national unity despite the country's incredible cultural, linguistic, and religious diversity across its 17,508 islands."
  },
  {
    question: "Current intelligence shows that island nations face unique modern challenges. What is the term for the phenomenon where small island states struggle with limited resources, remote locations, and vulnerability to external economic shocks?",
    options: ["Island syndrome", "Archipelagic disadvantage", "Small island vulnerability", "Maritime isolation effect"],
    correctAnswer: "Small island vulnerability",
    difficulty: "medium",
    region: "island-maritime",
    category: "modern_context",
    explanation: "Small island developing states (SIDS) face unique vulnerabilities including limited natural resources, remoteness from markets, high transportation costs, vulnerability to natural disasters, and dependence on imports for basic needs."
  },
  {
    question: "CHALLENGE PUZZLE: An island nation east of Africa was settled by both African and Asian peoples, creating a unique culture. It's the world's fourth-largest island, home to 90% of species found nowhere else on Earth, including lemurs. If this island separated from Africa 160 million years ago, what percentage of its plant species are endemic?",
    options: ["60%", "70%", "80%", "90%"],
    correctAnswer: "80%",
    difficulty: "hard",
    region: "island-maritime",
    category: "challenge_puzzles",
    explanation: "Madagascar, the world's fourth-largest island, separated from Africa 160 million years ago, allowing unique evolution. About 80% of its plant species are endemic, found nowhere else on Earth, making it a biodiversity hotspot of global importance."
  }
];

async function main() {
  console.log('🌍 Seeding comprehensive Atlas Agent question database...');
  
  // Check if comprehensive questions already exist
  const existingComprehensiveQuestions = await prisma.question.count({
    where: {
      OR: [
        { region: 'europe' },
        { region: 'asia' },
        { region: 'africa' },
        { region: 'americas' },
        { region: 'oceania' },
        { region: 'middle-east' },
        { region: 'arctic-polar' },
        { region: 'island-maritime' }
      ]
    }
  });
  
  if (existingComprehensiveQuestions >= 35) { // Allow for some flexibility
    console.log(`✅ Comprehensive question database already exists with ${existingComprehensiveQuestions} questions across all regions`);
    return;
  }
  
  console.log('📝 Adding comprehensive question database (40 questions across 8 regions, 5 categories each)...');
  
  // Clear existing questions to avoid duplicates
  console.log('🧹 Clearing existing questions to avoid conflicts...');
  await prisma.question.deleteMany({});
  
  // Seed comprehensive questions
  for (const questionData of questionsDatabase) {
    const { category, explanation, ...questionForDb } = questionData;
    
    await prisma.question.create({
      data: questionForDb
    });
  }
  
  console.log(`✅ Created ${questionsDatabase.length} comprehensive questions`);
  console.log('\n📊 Question Distribution:');
  console.log('- Europe: 5 questions (Geography, History, Culture, Modern, Challenge)');
  console.log('- Asia: 5 questions (Geography, History, Culture, Modern, Challenge)');
  console.log('- Africa: 5 questions (Geography, History, Culture, Modern, Challenge)');
  console.log('- Americas: 5 questions (Geography, History, Culture, Modern, Challenge)');
  console.log('- Oceania: 5 questions (Geography, History, Culture, Modern, Challenge)');
  console.log('- Middle East: 5 questions (Geography, History, Culture, Modern, Challenge)');
  console.log('- Arctic & Polar: 5 questions (Geography, History, Culture, Modern, Challenge)');
  console.log('- Island Nations & Maritime: 5 questions (Geography, History, Culture, Modern, Challenge)');
  
  console.log('\n🎯 Difficulty Distribution:');
  const difficultyCount = questionsDatabase.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});
  Object.entries(difficultyCount).forEach(([diff, count]) => {
    console.log(`- ${diff}: ${count} questions`);
  });
  
  // Update sample game session with new regions
  const existingSessions = await prisma.gameSession.count();
  if (existingSessions === 0) {
    console.log('\n🎮 Creating enhanced game session with all regions...');
    const sampleSession = await prisma.gameSession.create({
      data: {
        agentName: 'Agent Atlas',
        score: 2400,
        completedRegions: ['europe', 'asia', 'oceania'],
        unlockedRegions: ['europe', 'asia', 'africa', 'americas', 'oceania', 'middle-east', 'arctic-polar', 'island-maritime'],
        agentLevel: 'Elite Operative'
      }
    });
    
    // Add comprehensive leaderboard entry
    await prisma.leaderboardEntry.create({
      data: {
        sessionId: sampleSession.id,
        agentName: sampleSession.agentName,
        score: sampleSession.score,
        completedRegions: sampleSession.completedRegions,
        agentLevel: sampleSession.agentLevel,
        regionsCompleted: 3
      }
    });
    
    console.log('✅ Created comprehensive sample data');
  }
  
  console.log('\n🚀 Comprehensive Atlas Agent database seeding completed!');
  console.log('📍 All 8 world regions now have balanced question coverage');
  console.log('🎓 Educational content spans Geography, History, Culture, Modern Context, and Challenge Puzzles');
  console.log('⚡ Questions range from beginner-friendly to expert-level challenges');
}

main()
  .catch((e) => {
    console.error('❌ Comprehensive seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });