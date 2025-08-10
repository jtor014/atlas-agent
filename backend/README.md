# Atlas Agent Backend API

RESTful API server for the Atlas Agent geography game built with Express.js.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📊 API Endpoints

### Health Check
- `GET /health` - Server health status

### Game Management
- `POST /api/game/start` - Start new game session
- `GET /api/game/state/:sessionId` - Get game state
- `PUT /api/game/progress/:sessionId` - Update game progress
- `GET /api/game/sessions` - List active sessions (dev only)
- `DELETE /api/game/session/:sessionId` - Delete session

### Questions
- `GET /api/questions/region/:regionId` - Get questions for region
- `POST /api/questions/answer` - Submit answer and get result
- `GET /api/questions/stats` - Question database statistics
- `GET /api/questions/regions` - Available regions

### Leaderboard
- `POST /api/leaderboard/submit` - Submit score
- `GET /api/leaderboard/top` - Get top scores
- `GET /api/leaderboard/stats` - Leaderboard statistics
- `GET /api/leaderboard/agent/:agentName` - Agent-specific scores
- `DELETE /api/leaderboard/clear` - Clear leaderboard (dev only)

## 🏗️ Project Structure

```
backend/
├── routes/                  # API route handlers
│   ├── game.js             # Game session management
│   ├── questions.js        # Geography questions & answers
│   └── leaderboard.js      # Scoring & rankings
├── middleware/             # Custom middleware (future)
├── server.js              # Main application server
├── package.json           # Dependencies & scripts
├── .env                   # Environment variables
└── .env.example          # Environment template
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=3002                           # Server port
NODE_ENV=development                # Environment
FRONTEND_URL=http://127.0.0.1:3001 # Frontend CORS origin
```

## 📝 API Usage Examples

### Start Game Session
```bash
curl -X POST http://127.0.0.1:3002/api/game/start \
  -H "Content-Type: application/json" \
  -d '{"agentName": "Agent007"}'
```

### Get Questions
```bash
curl http://127.0.0.1:3002/api/questions/region/western-europe?count=3
```

### Submit Answer
```bash
curl -X POST http://127.0.0.1:3002/api/questions/answer \
  -H "Content-Type: application/json" \
  -d '{"questionId": "we1", "answer": "Norway", "sessionId": "123456"}'
```

### Submit Score
```bash
curl -X POST http://127.0.0.1:3002/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d '{"agentName": "Agent007", "score": 1500, "sessionId": "123456"}'
```

## 🎮 Game Features

- **Session Management** - Track individual game sessions
- **Question Bank** - 20+ geography questions across 4 regions
- **Scoring System** - Points based on question difficulty
- **Leaderboard** - Global and region-specific rankings
- **Real-time Stats** - Game and question statistics

## 🛡️ Security Features

- **Helmet.js** - HTTP security headers
- **CORS** - Cross-origin request protection
- **Input Validation** - Request parameter validation
- **Error Handling** - Comprehensive error responses

## 🔄 Development

The API uses in-memory storage for development. In production, this should be replaced with a proper database (PlanetScale recommended).

### Available Scripts
- `npm run dev` - Development server with hot reload
- `npm start` - Production server
- `npm test` - Run tests (not implemented yet)

### Adding Questions
Edit `routes/questions.js` to add new regions or questions to the `questionDatabase` object.

---

**Ready for database integration and production deployment!**