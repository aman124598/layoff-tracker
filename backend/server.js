require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Import auto-sync
const { startAutoSync } = require('./services/newsService');

// CORS config for production
const corsOptions = {
    origin: [
        'https://layoff-tracker.vercel.app',
        'https://layoff-tracker-india.vercel.app',
        /\.vercel\.app$/,
        /localhost:\d+$/,
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Layoff Tracker API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

const layoffRoutes = require('./routes/layoffRoutes');
app.use('/api/layoffs', layoffRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    // Start auto-sync when server starts
    startAutoSync();
});
