import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(express.json());
app.use(cors());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Simplified backend is running!'
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Simplified backend API working!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Auth test endpoint
app.get('/api/auth/test', (req, res) => {
  res.json({
    message: 'Auth routes working!',
    service: 'auth',
    timestamp: new Date().toISOString()
  });
});

// Slack test endpoint
app.get('/api/slack/test', (req, res) => {
  res.json({
    message: 'Slack routes working!',
    service: 'slack',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`íº€ Simplified server running on port ${PORT}`);
  console.log(`í³Š Health: http://localhost:${PORT}/health`);
  console.log(`í·ª Test: http://localhost:${PORT}/api/test`);
  console.log('âœ… Ready for testing!');
});

export default app;
