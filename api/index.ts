import app from '../server.js';

// Add a simple health check directly in the entry point to verify it's working
app.get('/api/vercel-health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Vercel API entry point is working',
    timestamp: new Date().toISOString()
  });
});

export default app;
