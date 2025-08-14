# Atlas Agent - Claude Development Context

## Project Overview
Atlas Agent is a geography quiz game with a spy/detective theme. Players become secret agents investigating suspicious activities across the globe using their geography knowledge.

## Current Architecture & Deployment

### Production Stack
- **Frontend**: Deployed on Vercel 
  - URL: https://frontend-5n67zedyd-joshs-projects-37e0c8a8.vercel.app
  - Auto-deploys from git pushes
- **Backend**: Deployed on Railway
  - URL: https://atlas-agent-production-4cd2.up.railway.app
  - Health check: `/health` endpoint
  - Auto-deploys from git pushes

### Development Workflow
- **Local Frontend**: `npm run dev` in `/frontend` → http://127.0.0.1:3001
- **Backend**: Uses production Railway API (no local backend needed)
- **Configuration**: `/frontend/src/config.js` handles environment switching

### Deployment Commands
```bash
# Frontend to Vercel
cd frontend && vercel --prod

# Backend to Railway (auto-deploys on git push)
git push origin main
```

## Project Structure

### Frontend (/frontend)
- **React 18 + Vite** with hot reload development
- **Components**:
  - `WelcomeScreen.jsx` - Mission briefing & agent registration
  - `WorldMap.jsx` - Interactive world map with clickable regions
  - `QuizMode.jsx` - Timed geography questions (30-second timer)
  - `MissionBriefing.jsx` - Agent story elements
  - `MissionDebrief.jsx` - Results and progression
  - `UserProfile.jsx` - Agent progression system
  - `RegionalMultimedia.jsx` - Photos, audio, weather integration
  - `AIQuizMode.jsx` - AI-generated questions

### Backend (/backend)
- **Node.js + Express + Prisma ORM**
- **Database**: MySQL via Railway
- **Key Routes**:
  - `/questions` - Geography question management
  - `/auth` - User authentication 
  - `/game` - Game state and progress
  - `/multimedia` - Photos, audio, weather data
  - `/ai` - AI-generated question endpoints
  - `/leaderboard` - Scoring and rankings

## Game Features

### Core Gameplay
- Interactive world map with progressive region unlocking
- Timed multiple-choice geography questions
- Agent progression system (Trainee → Expert Agent)
- Mission briefings with immersive spy theme
- Responsive design for desktop and mobile

### Advanced Features
- **Multimedia Integration**: Regional photos, ambient audio, weather data
- **AI Question Generation**: Dynamic questions using OpenAI
- **Age-Appropriate Content**: Configurable age groups and content filtering
- **Comprehensive Question Database**: 1000+ curated geography questions

## Development Context

### Configuration Files
- `vercel.json` - Frontend deployment configuration
- `railway.toml` - Backend deployment configuration  
- `config.js` - Environment and API endpoint management
- `prisma/schema.prisma` - Database schema

### Key Development Commands
```bash
# Frontend development
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint

# Backend development  
cd backend
npm run dev        # Start with nodemon
npm run db:push    # Push schema changes
npm run db:seed    # Seed database
npm run db:studio  # Open Prisma Studio
```

### Environment Variables
Backend requires:
- `DATABASE_URL` - MySQL connection string (Railway provides)
- `OPENAI_API_KEY` - For AI question generation
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth authentication
- `JWT_SECRET` - Session management

## Current Status
✅ **Complete & Deployed**:
- Frontend React application with all core features
- Backend API with comprehensive endpoints
- Database with seeded geography questions
- Production deployment pipeline (Vercel + Railway)
- AI question generation system
- Multimedia integration (photos, audio, weather)

🔄 **Active Development Areas**:
- Game balance and difficulty progression
- Additional multimedia content
- Enhanced agent progression system
- Performance optimizations

## Development Best Practices
1. **Test locally first**: Use local Vite server against production API
2. **Deploy frequently**: Small, incremental changes to production
3. **Check health endpoints**: Verify backend is responding before debugging frontend
4. **Use browser dev tools**: Network tab for API debugging
5. **Monitor Railway logs**: For backend issues and performance

## Quick Start for New Sessions
```bash
# Navigate to project
cd /home/jtor014/dev/Liv-website/atlas-agent

# Start frontend development
cd frontend && npm run dev

# Check backend health
curl https://atlas-agent-production-4cd2.up.railway.app/health

# Access game at http://127.0.0.1:3001
```

This file should be updated whenever significant changes are made to architecture, deployment, or major features.