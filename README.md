# 🕵️ Atlas Agent - Global Geography Game

A professional-grade geography quiz game built with modern React and Vite. Players take on the role of secret agents investigating suspicious activities across the globe using their geography knowledge.

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
# → Open http://127.0.0.1:3001
```

## 🎮 Game Features

- **Atlas Agent Story** - Immersive spy/detective theme with mission briefings
- **Interactive World Map** - Clickable regions with progressive unlocking
- **Timed Geography Questions** - Multiple choice questions with 30-second timer
- **Agent Progression System** - Advance from Trainee to Expert Agent
- **Responsive Design** - Works on desktop and mobile devices

## 🏗️ Architecture

```
atlas-agent/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # Game components
│   │   │   ├── WelcomeScreen.jsx    # Mission briefing & registration
│   │   │   ├── WorldMap.jsx         # Interactive world map
│   │   │   └── QuizMode.jsx         # Geography quiz interface
│   │   ├── App.jsx             # Main game state management
│   │   └── main.jsx            # React entry point
│   ├── package.json            # Dependencies & scripts
│   └── vite.config.js         # Development server config
├── backend/                    # API server (planned)
├── database/                   # Database setup (planned)
└── docs/                      # Documentation
```

## 🛠️ Development

### **Available Scripts:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### **Game Flow:**
1. **Mission Briefing** → Agent accepts Atlas Agency assignment
2. **Agent Registration** → Enter codename and deploy to field
3. **Global Operations** → Select regions on interactive world map
4. **Field Investigation** → Answer geography questions under time pressure
5. **Mission Progress** → Unlock new regions, advance agent rank

## 🎯 Technical Stack

- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool and dev server
- **CSS3** - Custom responsive styling with animations
- **Modern JavaScript** - ES6+ features and React hooks

## 📋 Current Status

✅ **Frontend Complete** - Full React application with all game features  
✅ **Development Workflow** - Hot reload development server  
✅ **Component Architecture** - Professional, scalable code structure  
🔄 **Backend API** - Ready for implementation  
🔄 **Database Integration** - Ready for PlanetScale setup  
🔄 **Production Deployment** - Ready for Vercel hosting  

## 🔄 Game State Management

The application uses React hooks for state management:
- **Game State** - Current screen, agent info, progress tracking
- **Region State** - Unlocked/completed regions, scoring
- **Quiz State** - Current questions, timer, answer tracking

## 🎨 Component Overview

- **App.jsx** - Main orchestrator, handles screen switching and global state
- **WelcomeScreen.jsx** - Mission briefing and agent registration
- **WorldMap.jsx** - Interactive map with region selection and progress
- **QuizMode.jsx** - Question interface with timer and scoring

---

**Ready for production scaling with backend API and database integration!**