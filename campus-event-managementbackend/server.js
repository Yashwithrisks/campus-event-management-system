
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initTransporter } = require('./src/services/emailService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    initTransporter();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Campus Event Management API running on http://localhost:${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health\n`);
    });

    server.on('error', (error) => {
      console.error('❌ Server startup error:', error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exitCode = 1;
  }
}

startServer();
