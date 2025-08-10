# Atlas Agent Deployment Guide

Production deployment guide for the Atlas Agent geography game.

## 🚀 Architecture

- **Frontend**: React + Vite → Vercel
- **Backend**: Node.js + Express → Railway  
- **Database**: MySQL → PlanetScale

## 📋 Deployment Steps

### 1. Database Setup (PlanetScale)
1. Create account at [planetscale.com](https://planetscale.com)
2. Create database: `atlas-agent-prod`
3. Get connection string from dashboard
4. Update production environment variables

### 2. Backend Deployment (Railway)
1. Create account at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Set environment variables
4. Deploy backend service

### 3. Frontend Deployment (Vercel)
1. Create account at [vercel.com](https://vercel.com)
2. Connect GitHub repository
3. Configure build settings
4. Deploy frontend

## 🔧 Environment Variables

### Backend (Railway)
```bash
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/atlas-agent-prod?sslaccept=strict
NODE_ENV=production
PORT=3002
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://your-backend-domain.railway.app
VITE_APP_ENV=production
```

## 🌐 Production URLs

- **Frontend**: https://atlas-agent-frontend.vercel.app
- **Backend API**: https://atlas-agent-backend.railway.app
- **Database**: PlanetScale MySQL cluster

## 📊 Monitoring

- **Railway**: Built-in metrics and logs
- **Vercel**: Analytics and performance monitoring  
- **PlanetScale**: Database insights and query analytics

## 🚀 Deployment Commands

### Local Testing
```bash
# Frontend
cd frontend && npm run build && npm run preview

# Backend  
cd backend && npm start
```

### Production Deploy
```bash
# Automatic via GitHub integration:
git add . && git commit -m "Deploy updates" && git push
```

---

**Atlas Agent ready for global deployment!** 🌍