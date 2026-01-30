# Layoff Tracker

A production-grade web application to track company layoffs using verified public news sources.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel (Frontend) + Render (Backend)

## Project Structure

```
layoff-tracker/
├── frontend/          # React frontend
├── backend/           # Express API
└── database/          # SQL schema
```

## Deployment Instructions

### 1. Database (Supabase)

Run `database/schema.sql` in your Supabase SQL Editor.

### 2. Backend (Render)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create **New Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `NEWS_API_KEY`: Your NewsAPI key
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `PORT`: 5000
   - `NODE_ENV`: production
7. Deploy

### 3. Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
4. Add Environment Variables:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://your-app.onrender.com/api`)
5. Deploy

### 4. Update CORS (After Deployment)

After deploying to Vercel, update `backend/server.js` CORS origin with your actual Vercel domain.

## Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/layoffs` - Get all layoffs
- `POST /api/layoffs/sync` - Trigger data sync from NewsAPI
- `POST /api/layoffs/cleanup` - Remove duplicate entries
- `POST /api/layoffs/cleanup-large` - Remove entries with 100k+ counts

## Features

- Real-time layoff tracking
- India and Worldwide sections
- Auto-sync every 30 minutes
- Duplicate detection
- Only confirmed layoffs (excludes "at-risk" jobs)
- Black and red theme UI
