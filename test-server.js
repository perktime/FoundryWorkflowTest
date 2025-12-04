import express from 'express';

const app = express();
const port = 3000;

console.log('🚀 Starting minimal server test...');

app.use(express.json());

app.get('/health', (req, res) => {
    console.log('📊 Health check requested');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/test', (req, res) => {
    console.log('🧪 Test endpoint hit');
    res.json({ message: 'Test successful!' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Minimal server running on port ${port}`);
    console.log(`🔗 Test: http://localhost:${port}/test`);
    console.log(`💚 Health: http://localhost:${port}/health`);
});