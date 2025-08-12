// Offline fallback questions for when AI generation fails
export const fallbackQuestions = {
  'western-europe': [
    {
      question: "As a secret agent in Western Europe, which capital city would you find the Eiffel Tower?",
      options: ["London", "Paris", "Rome", "Berlin"],
      correctAnswer: 1,
      difficulty: "beginner",
      hint: "This city is known as the 'City of Light'",
      explanation: "The Eiffel Tower is located in Paris, France. Built in 1889, it has become the most iconic symbol of France.",
      category: "Geography & Environment"
    },
    {
      question: "Which Western European country is shaped like a boot and is famous for pasta and pizza?",
      options: ["Spain", "France", "Greece", "Italy"],
      correctAnswer: 3,
      difficulty: "beginner",
      hint: "Look at a map - this country's shape is very distinctive!",
      explanation: "Italy is shaped like a boot and is world-famous for its cuisine, including pasta and pizza.",
      category: "Geography & Environment"
    },
    {
      question: "As an agent investigating European history, which empire built Hadrian's Wall in northern England?",
      options: ["Greek Empire", "Roman Empire", "Ottoman Empire", "Byzantine Empire"],
      correctAnswer: 1,
      difficulty: "easy",
      hint: "This empire was known for building walls and roads across Europe",
      explanation: "The Roman Empire built Hadrian's Wall around 122 AD to defend against Scottish tribes.",
      category: "History & Civilizations"
    }
  ],
  'eastern-europe': [
    {
      question: "As a field agent in Eastern Europe, which is the largest country in the world by land area?",
      options: ["China", "Canada", "Russia", "United States"],
      correctAnswer: 2,
      difficulty: "beginner", 
      hint: "This country spans 11 time zones!",
      explanation: "Russia is the largest country in the world, covering over 17 million square kilometers.",
      category: "Geography & Environment"
    },
    {
      question: "Which Eastern European capital city is home to the famous Red Square?",
      options: ["Warsaw", "Prague", "Budapest", "Moscow"],
      correctAnswer: 3,
      difficulty: "easy",
      hint: "This city is the capital of the largest country in the world",
      explanation: "Red Square is located in Moscow, the capital of Russia, and is home to the Kremlin.",
      category: "Geography & Environment"
    }
  ],
  'north-america': [
    {
      question: "As an agent investigating North America, which is the longest river in the United States?",
      options: ["Colorado River", "Rio Grande", "Mississippi River", "Columbia River"],
      correctAnswer: 2,
      difficulty: "easy",
      hint: "This river is often called 'America's River' and flows into the Gulf of Mexico",
      explanation: "The Mississippi River is about 2,320 miles long and is crucial for American commerce and culture.",
      category: "Geography & Environment"
    },
    {
      question: "Which North American country has three official languages?",
      options: ["United States", "Mexico", "Canada", "Costa Rica"],
      correctAnswer: 2,
      difficulty: "medium",
      hint: "This country is known for being bilingual, but actually recognizes a third indigenous language group",
      explanation: "Canada has English and French as official languages, plus many recognized Indigenous languages.",
      category: "Culture & Philosophy"
    }
  ],
  'south-america': [
    {
      question: "As an operative in South America, which is the largest country by area?",
      options: ["Argentina", "Peru", "Colombia", "Brazil"],
      correctAnswer: 3,
      difficulty: "easy",
      hint: "This country speaks Portuguese, not Spanish like its neighbors",
      explanation: "Brazil covers about half of South America's total land area and is the only Portuguese-speaking country on the continent.",
      category: "Geography & Environment"
    }
  ],
  'east-asia': [
    {
      question: "As an agent in East Asia, which country is made up of thousands of islands?",
      options: ["China", "South Korea", "Japan", "Mongolia"],
      correctAnswer: 2,
      difficulty: "beginner",
      hint: "This island nation is known for sushi and anime",
      explanation: "Japan consists of 6,852 islands, though only about 430 are inhabited.",
      category: "Geography & Environment"
    }
  ],
  'southeast-asia': [
    {
      question: "Which Southeast Asian city-state is known as the 'Garden City'?",
      options: ["Bangkok", "Manila", "Singapore", "Kuala Lumpur"],
      correctAnswer: 2,
      difficulty: "medium",
      hint: "This wealthy city-state is famous for its cleanliness and green spaces",
      explanation: "Singapore is called the Garden City due to its extensive urban planning that incorporates greenery throughout the city.",
      category: "Modern Context"
    }
  ],
  'south-asia': [
    {
      question: "As an agent in South Asia, which mountain range contains the world's highest peak?",
      options: ["Andes", "Rocky Mountains", "Himalayas", "Alps"],
      correctAnswer: 2,
      difficulty: "easy",
      hint: "This mountain range separates the Indian subcontinent from the rest of Asia",
      explanation: "The Himalayas contain Mount Everest, the world's highest peak at 29,029 feet above sea level.",
      category: "Geography & Environment"
    }
  ],
  'central-west-asia': [
    {
      question: "Which body of water is known as the world's largest lake?",
      options: ["Lake Superior", "Lake Victoria", "Caspian Sea", "Aral Sea"],
      correctAnswer: 2,
      difficulty: "medium",
      hint: "Despite being called a 'sea', it's actually a lake bordered by several countries including Russia and Iran",
      explanation: "The Caspian Sea is technically a lake and is the world's largest body of inland water.",
      category: "Geography & Environment"
    }
  ],
  'africa': [
    {
      question: "As an agent investigating Africa, which is the longest river in the world?",
      options: ["Amazon River", "Nile River", "Congo River", "Niger River"],
      correctAnswer: 1,
      difficulty: "easy",
      hint: "This river flows through Egypt and is crucial to the country's agriculture",
      explanation: "The Nile River is approximately 4,135 miles long and flows through 11 countries in Africa.",
      category: "Geography & Environment"
    }
  ],
  'oceania': [
    {
      question: "As an agent in Oceania, which is the largest country in this region?",
      options: ["New Zealand", "Papua New Guinea", "Fiji", "Australia"],
      correctAnswer: 3,
      difficulty: "beginner",
      hint: "This country is both a continent and a country, known for unique animals like kangaroos",
      explanation: "Australia is by far the largest country in Oceania, taking up most of the continent.",
      category: "Geography & Environment"
    }
  ]
};

export const getRandomFallbackQuestion = (regionId, difficulty = 'easy') => {
  const questions = fallbackQuestions[regionId] || fallbackQuestions['western-europe'];
  const filteredQuestions = questions.filter(q => q.difficulty === difficulty);
  
  if (filteredQuestions.length === 0) {
    return questions[Math.floor(Math.random() * questions.length)];
  }
  
  return filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
};