import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(express.json());

// Simple test routes
app.get('/', (req, res) => {
  res.json({
    message: 'Minimal server is working!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test route working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/test', (req, res) => {
  res.json({
    message: 'Auth test route working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/slack/test', (req, res) => {
  res.json({
    message: 'Slack test route working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`íº€ Minimal server running on port ${PORT}`);
  console.log(`Test it: curl http://localhost:${PORT}/api/test`);
});

server.on('error', (error: any) => {
  console.error('Server startup error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill the process or use a different port.`);
  }
});

export default app;
