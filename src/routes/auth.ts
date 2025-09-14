import { Router, Request, Response } from 'express';

const router = Router();

router.get('/test', (req: Request, res: Response): void => {
  res.json({
    message: 'Auth routes working!',
    service: 'auth',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.get('/connect', (req: Request, res: Response): void => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    res.status(500).json({
      error: 'OAuth not configured',
      message: 'Missing Slack OAuth configuration'
    });
    return;
  }
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=chat:write,channels:read&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

router.get('/status/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  
  if (!userId) {
    res.status(400).json({
      error: 'Missing user ID',
      message: 'User ID is required'
    });
    return;
  }
  
  res.json({
    connected: false,
    userId: userId,
    message: 'Status check working - OAuth integration needed'
  });
});

export default router;
